import { SuiClient } from "@mysten/sui/client";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { Keypair } from "@mysten/sui/cryptography";

import BigNumber from "bignumber.js";
import {
  DipCoinSDKOptions,
  AddLiquidityParams,
  RemoveLiquidityParams,
  SwapParams,
  TransferParams,
  SDKResponse,
  TxResponse,
  Pool,
  Global,
} from "../types";

import {
  SwapMath,
  getPool,
  getGlobal,
  formatError,
  getLpType,
  orderType,
  getLpName,
} from "../utils";

import {
  COIN_TYPE_SUI,
  DEFAULT_SLIPPAGE,
  SWAP_EXACT_X_TO_Y,
  SWAP_EXACT_Y_TO_X,
  SWAP_X_TO_EXACT_Y,
  SWAP_Y_TO_EXACT_X,
} from "../constants";

export class DipCoinSDK {
  private client: SuiClient;
  private options: DipCoinSDKOptions;

  constructor(options: DipCoinSDKOptions) {
    // Initialize SDK configuration
    this.options = options;

    // Initialize SUI client
    this.client = new SuiClient({
      url: options.suiRpc,
    });
  }

  get optionsField(): DipCoinSDKOptions {
    return this.options;
  }

  /**
   * Build add liquidity transaction
   * @param suiWalletAddress The address of the wallet
   * @param params Parameters for adding liquidity
   * @returns {Promise<Transaction>} Transaction object
   */
  public async buildAddLiquidityTx(
    suiWalletAddress: string,
    params: AddLiquidityParams
  ): Promise<Transaction> {
    try {
      // Validate input parameters
      if (params.amountX.lte(0) || params.amountY.lte(0)) {
        throw new Error("Amount must be greater than 0");
      }
      // Calculate minimum acceptable amounts with slippage protection
      const slippage = params.slippage || DEFAULT_SLIPPAGE; // Default 5% slippage
      if (slippage >= 1) {
        throw new Error("Slippage must be less than 100%");
      }

      // Sort token types lexicographically to ensure consistent ordering
      let [newTypeX, newTypeY] = orderType(params.typeX, params.typeY);
      let isChange = newTypeX !== params.typeX;
      params.typeX = newTypeX;
      params.typeY = newTypeY;
      if (isChange) {
        // Swap amounts if token order changed
        const tempAmount = params.amountX;
        params.amountX = params.amountY;
        params.amountY = tempAmount;
      }

      // Fetch current pool state to calculate optimal amounts
      const poolResponse = await this.getPool(params.pooId);
      if (!poolResponse.status || !poolResponse.data) {
        throw new Error("Failed to get pool info");
      }
      const pool = poolResponse.data;

      // Calculate optimal token amounts based on current pool ratios
      const [coinXDesired, coinYDesired] = SwapMath.calcOptimalCoinValues(
        new BigNumber(params.amountX),
        new BigNumber(params.amountY),
        new BigNumber(pool.bal_x.toString()),
        new BigNumber(pool.bal_y.toString())
      );
      let expectedLp = SwapMath.getExpectedLiquidityAmount(
        coinXDesired,
        coinYDesired,
        new BigNumber(pool.bal_x.toString()),
        new BigNumber(pool.bal_y.toString()),
        new BigNumber(pool.lp_supply.toString())
      );

      let minAddLiquidityLpAmount = new BigNumber(
        pool.min_add_liquidity_lp_amount.toString()
      );
      if (expectedLp.lt(minAddLiquidityLpAmount)) {
        throw new Error(
          `add liquidity too little, expectedLp:${expectedLp} is less than min_add_liquidity_lp_amount:${minAddLiquidityLpAmount}`
        );
      }

      const coinXMin = coinXDesired
        .multipliedBy(1 - slippage)
        .integerValue(BigNumber.ROUND_DOWN)
        .toNumber();
      const coinYMin = coinYDesired
        .multipliedBy(1 - slippage)
        .integerValue(BigNumber.ROUND_DOWN)
        .toNumber();

      // Build transaction to split coins and add liquidity
      const tx = new Transaction();

      let splitCoinX;
      if (params.typeX === COIN_TYPE_SUI) {
        tx.setSender(suiWalletAddress);
        splitCoinX = coinWithBalance({
          balance: params.amountX.toNumber(),
          type: params.typeX,
          useGasCoin: true,
        });
      } else {
        splitCoinX = await this.splitCoin(
          suiWalletAddress,
          params.typeX,
          params.amountX,
          tx
        );
      }

      let splitCoinY;
      if (params.typeY === COIN_TYPE_SUI) {
        tx.setSender(suiWalletAddress);
        splitCoinY = coinWithBalance({
          balance: params.amountY.toNumber(),
          type: params.typeY,
          useGasCoin: true,
        });
      } else {
        splitCoinY = await this.splitCoin(
          suiWalletAddress,
          params.typeY,
          params.amountY,
          tx
        );
      }

      // Call DEX contract to add liquidity
      tx.moveCall({
        target: `${this.options.packageId}::router::add_liquidity`,
        arguments: [
          tx.object(this.options.globalId),
          tx.object(params.pooId),
          splitCoinX,
          tx.pure.u64(coinXMin),
          splitCoinY,
          tx.pure.u64(coinYMin),
        ],
        typeArguments: [params.typeX, params.typeY],
      });

      return tx;
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Add liquidity to a pool
   * @param signer The keypair for signing the transaction
   * @param params Parameters for adding liquidity
   */
  /**
   * Add liquidity to a pool
   * @param signer The keypair for signing the transaction
   * @param params Parameters for adding liquidity
   * @returns {Promise<TxResponse>} Transaction response containing status and txId
   */
  public async addLiquidity(
    signer: Keypair,
    params: AddLiquidityParams
  ): Promise<TxResponse> {
    try {
      const tx: Transaction = await this.buildAddLiquidityTx(
        signer.getPublicKey().toSuiAddress(),
        params
      );

      // Sign and execute transaction
      const result = await this.client.signAndExecuteTransaction({
        signer: signer,
        transaction: tx,
      });

      return {
        txId: result.digest,
        status: true,
      };
    } catch (error) {
      return {
        txId: "",
        status: false,
        error: formatError(error),
      };
    }
  }

  /**
   * Build remove liquidity transaction
   * @param suiWalletAddress The address of the wallet
   * @param params Parameters for removing liquidity
   * @returns {Promise<Transaction>} Transaction object
   */
  public async buildRemoveLiquidityTx(
    suiWalletAddress: string,
    params: RemoveLiquidityParams
  ): Promise<Transaction> {
    try {
      // Validate input amount
      if (params.removeLpAmount.lte(0)) {
        throw new Error("Amount must be greater than 0");
      }
      // Calculate minimum acceptable amounts with slippage protection
      const slippage = params.slippage || DEFAULT_SLIPPAGE; // Default 5% slippage
      if (slippage >= 1) {
        throw new Error("Slippage must be less than 100%");
      }

      // Get LP token type based on sorted token types
      let [newTypeX, newTypeY, lpType] = getLpType(
        this.options.packageId,
        params.typeX,
        params.typeY
      );
      params.typeX = newTypeX;
      params.typeY = newTypeY;

      // Fetch current pool state to calculate optimal amounts
      const poolResponse = await this.getPool(params.pooId);
      if (!poolResponse.status || !poolResponse.data) {
        throw new Error("Failed to get pool info");
      }
      const pool = poolResponse.data;

      let minRemoveLpAmount = BigNumber(
        pool.min_add_liquidity_lp_amount.toString()
      ).div(10);
      if (params.removeLpAmount.lt(minRemoveLpAmount)) {
        throw new Error(
          `removeLpAmount:${params.removeLpAmount} is less than min_remove_liquidity_lp_amount:${minRemoveLpAmount}`
        );
      }

      const tx = new Transaction();
      let mergedCoin = await this.getMergedCoin(
        this.client,
        suiWalletAddress,
        lpType,
        params.removeLpAmount,
        tx
      );

      let coinXOut = SwapMath.mulDiv(
        BigNumber(pool.bal_x.toString()),
        params.removeLpAmount,
        BigNumber(pool.lp_supply.toString())
      );
      let coinYOut = SwapMath.mulDiv(
        BigNumber(pool.bal_y.toString()),
        params.removeLpAmount,
        BigNumber(pool.lp_supply.toString())
      );
      let coinXMin = coinXOut
        .multipliedBy(1 - slippage)
        .integerValue(BigNumber.ROUND_DOWN)
        .toNumber();
      let coinYMin = coinYOut
        .multipliedBy(1 - slippage)
        .integerValue(BigNumber.ROUND_DOWN)
        .toNumber();

      // Build transaction to split LP tokens and remove liquidity

      tx.moveCall({
        target: `${this.options.packageId}::router::remove_liquidity`,
        arguments: [
          tx.object(this.options.globalId),
          tx.object(params.pooId),
          mergedCoin,
          tx.pure.u64(params.removeLpAmount.toNumber()),
          tx.pure.u64(coinXMin),
          tx.pure.u64(coinYMin),
        ],
        typeArguments: [params.typeX, params.typeY],
      });

      return tx;
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Remove liquidity from a pool
   * @param signer The keypair for signing the transaction
   * @param params Parameters for removing liquidity
   * @returns {Promise<TxResponse>} Transaction response containing status and txId
   */
  public async removeLiquidity(
    signer: Keypair,
    params: RemoveLiquidityParams
  ): Promise<TxResponse> {
    try {
      const tx: Transaction = await this.buildRemoveLiquidityTx(
        signer.getPublicKey().toSuiAddress(),
        params
      );

      // Sign and execute transaction
      const result = await this.client.signAndExecuteTransaction({
        signer: signer,
        transaction: tx,
      });

      return {
        txId: result.digest,
        status: true,
      };
    } catch (error) {
      return {
        txId: "",
        status: false,
        error: formatError(error),
      };
    }
  }

  /**
   * Build swap exact X to Y transaction
   * @param suiWalletAddress The address of the wallet
   * @param params Swap parameters including amountIn and optional slippage
   * @returns {Promise<Transaction>} Transaction object
   */
  public async buildSwapExactXToYTx(
    suiWalletAddress: string,
    params: SwapParams
  ): Promise<Transaction> {
    try {
      // Validate input parameters
      if (!params.amountIn || params.amountIn.lte(0)) {
        throw new Error("amountIn must be greater than 0");
      }
      const slippage = params.slippage || DEFAULT_SLIPPAGE; // Default 5% slippage
      if (slippage >= 1) {
        throw new Error("Slippage must be less than 100%");
      }

      // Fetch current pool and global state
      const poolResponse = await this.getPool(params.pooId);
      if (!poolResponse.status || !poolResponse.data) {
        throw new Error("Failed to get pool info");
      }
      const pool = poolResponse.data;

      // Sort token types and determine swap direction
      let [sortedTypeX, sortedTypeY] = orderType(params.typeX, params.typeY);
      let isSwap = sortedTypeX !== params.typeX;

      // Get pool balances based on swap direction
      let balanceX = isSwap ? pool.bal_y : pool.bal_x;
      let balanceY = isSwap ? pool.bal_x : pool.bal_y;

      // Calculate expected output amount and minimum with slippage
      const amountOut = SwapMath.getAmountOut(
        BigNumber(pool.fee_rate.toString()),
        params.amountIn,
        BigNumber(balanceX.toString()),
        BigNumber(balanceY.toString())
      );
      let amountOutMin = amountOut
        .multipliedBy(1 - slippage)
        .integerValue(BigNumber.ROUND_DOWN)
        .toNumber();

      // Select appropriate swap function based on direction
      let functionName = isSwap ? SWAP_EXACT_Y_TO_X : SWAP_EXACT_X_TO_Y;

      // Build transaction to split input coins and execute swap
      const tx = new Transaction();

      let splitCoinIn;
      if (params.typeX === COIN_TYPE_SUI) {
        tx.setSender(suiWalletAddress);
        splitCoinIn = coinWithBalance({
          balance: params.amountIn.toNumber(),
          type: params.typeX,
          useGasCoin: true,
        });
      } else {
        splitCoinIn = await this.splitCoin(
          suiWalletAddress,
          params.typeX,
          params.amountIn,
          tx
        );
      }

      tx.moveCall({
        target: `${this.options.packageId}::router::${functionName}`,
        arguments: [
          tx.object(this.options.globalId),
          tx.object(params.pooId),
          splitCoinIn,
          tx.pure.u64(amountOutMin),
        ],
        typeArguments: [sortedTypeX, sortedTypeY],
      });

      return tx;
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Swap an exact amount of token X for token Y
   * Supports flexible token ordering (e.g. USDC->WSOL or WSOL->USDC)
   * @param signer The keypair for signing the transaction
   * @param params Swap parameters including amountIn and optional slippage
   * @returns {Promise<TxResponse>} Transaction response containing status and txId
   */
  public async swapExactXToY(
    signer: Keypair,
    params: SwapParams
  ): Promise<TxResponse> {
    try {
      const tx: Transaction = await this.buildSwapExactXToYTx(
        signer.getPublicKey().toSuiAddress(),
        params
      );

      // Sign and execute transaction
      const result = await this.client.signAndExecuteTransaction({
        signer: signer,
        transaction: tx,
      });

      return {
        txId: result.digest,
        status: true,
      };
    } catch (error) {
      return {
        txId: "",
        status: false,
        error: formatError(error),
      };
    }
  }

  /**
   * Build swap X to exact Y transaction
   * @param suiWalletAddress The address of the wallet
   * @param params Swap parameters including amountOut and optional slippage
   * @returns {Promise<Transaction>} Transaction object
   */
  public async buildSwapXToExactYTx(
    suiWalletAddress: string,
    params: SwapParams
  ): Promise<Transaction> {
    try {
      // Validate input parameters
      if (!params.amountOut || params.amountOut.lte(0)) {
        throw new Error("amountOut must be greater than 0");
      }
      const slippage = params.slippage || DEFAULT_SLIPPAGE; // Default 5% slippage
      if (slippage >= 1) {
        throw new Error("Slippage must be less than 100%");
      }

      // Fetch current pool and global state
      const poolResponse = await this.getPool(params.pooId);
      if (!poolResponse.status || !poolResponse.data) {
        throw new Error("Failed to get pool info");
      }
      const pool = poolResponse.data;

      // Sort token types and determine swap direction
      let [sortedTypeX, sortedTypeY] = orderType(params.typeX, params.typeY);
      let isSwap = sortedTypeX !== params.typeX;
      let balanceX = isSwap ? pool.bal_y : pool.bal_x;
      let balanceY = isSwap ? pool.bal_x : pool.bal_y;

      // Calculate required input amount and maximum with slippage
      const amountIn = SwapMath.getAmountIn(
        BigNumber(pool.fee_rate.toString()),
        params.amountOut,
        BigNumber(balanceX.toString()),
        BigNumber(balanceY.toString())
      );

      let amountInMax = amountIn
        .dividedBy(1 - slippage)
        .integerValue(BigNumber.ROUND_DOWN);

      // Select appropriate swap function based on direction
      let functionName = isSwap ? SWAP_Y_TO_EXACT_X : SWAP_X_TO_EXACT_Y;

      // Build transaction to split input coins and execute swap
      const tx = new Transaction();

      let splitCoinIn;
      if (params.typeX === COIN_TYPE_SUI) {
        tx.setSender(suiWalletAddress);
        splitCoinIn = coinWithBalance({
          balance: amountInMax.toNumber(),
          type: params.typeX,
          useGasCoin: true,
        });
      } else {
        splitCoinIn = await this.splitCoin(
          suiWalletAddress,
          params.typeX,
          amountInMax,
          tx
        );
      }

      tx.moveCall({
        target: `${this.options.packageId}::router::${functionName}`,
        arguments: [
          tx.object(this.options.globalId),
          tx.object(params.pooId),
          splitCoinIn,
          tx.pure.u64(params.amountOut.toNumber()),
        ],
        typeArguments: [sortedTypeX, sortedTypeY],
      });

      return tx;
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Swap token X for an exact amount of token Y
   * @param signer The keypair for signing the transaction
   * @param params Swap parameters including amountOut and optional slippage
   * @returns {Promise<TxResponse>} Transaction response containing status and txId
   */
  public async swapXToExactY(
    signer: Keypair,
    params: SwapParams
  ): Promise<TxResponse> {
    try {
      const tx: Transaction = await this.buildSwapXToExactYTx(
        signer.getPublicKey().toSuiAddress(),
        params
      );

      // Sign and execute transaction
      const result = await this.client.signAndExecuteTransaction({
        signer: signer,
        transaction: tx,
      });

      return {
        txId: result.digest,
        status: true,
      };
    } catch (error) {
      return {
        txId: "",
        status: false,
        error: formatError(error),
      };
    }
  }

  /**
   * Get pool information
   * @param poolId The ID of the pool to query
   * @returns {Promise<SDKResponse<Pool>>} Pool information response
   */
  public async getPool(poolId: string): Promise<SDKResponse<Pool>> {
    try {
      const pool = await getPool(this.client, poolId);
      if (!pool) {
        throw new Error("Pool not found");
      }

      return {
        status: true,
        data: pool,
      };
    } catch (error) {
      return {
        status: false,
        error: formatError(error),
      };
    }
  }

  /**
   * Get global configuration information
   * @returns {Promise<SDKResponse<Global>>} Global configuration response
   */
  public async getGlobal(): Promise<SDKResponse<Global>> {
    try {
      const global = await getGlobal(this.client, this.options.globalId);
      if (!global) {
        throw new Error("Global config not found");
      }

      return {
        status: true,
        data: global,
      };
    } catch (error) {
      return {
        status: false,
        error: formatError(error),
      };
    }
  }

  /**
   * Get pool ID for a given token pair
   * @param typeX First token type
   * @param typeY Second token type
   * @returns {Promise<string>} Pool ID if found
   */
  public async getPoolId(typeX: string, typeY: string): Promise<string> {
    try {
      // Generate LP name from token types
      let lpName = getLpName(typeX, typeY);

      // Query dynamic field object to get pool ID
      const response = await this.client.getDynamicFieldObject({
        parentId: this.options.registedPoolsId,
        name: {
          type: "0x1::string::String", // key type
          value: lpName,
        },
      });

      if (response.data?.content) {
        // Check if it is a moveObject type
        if (response.data.content.dataType === "moveObject") {
          const keyValue = response.data.content.fields as {
            name: string;
            value: string;
          };

          if (keyValue.name === lpName) {
            return keyValue.value;
          }
        }
      }
      throw new Error("Pool not found");
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Split a specified amount of coins from the owner's balance
   * @param ownerAddress The address of the coin owner
   * @param type The coin type (format: packageId::module::struct)
   * @param amount The amount to split
   * @param tx The transaction object to add the split operation to
   * @returns {Promise<{ $kind: "NestedResult"; NestedResult: [number, number] }>} Split coin result
   */
  public async splitCoin(
    ownerAddress: string,
    type: string,
    amount: BigNumber,
    tx: Transaction
  ): Promise<{ $kind: "NestedResult"; NestedResult: [number, number] }> {
    try {
      // Query available coins of specified type
      const coins = await this.client.getCoins({
        owner: ownerAddress,
        coinType: type,
      });
      if (!coins || coins.data.length === 0) {
        throw new Error(`no ${type} coins available`);
      }

      // Select and accumulate coins until target amount is reached
      let selectedCoins: string[] = [];
      let totalAmount = BigNumber(0);
      for (const coin of coins.data) {
        selectedCoins.push(coin.coinObjectId);
        totalAmount = totalAmount.plus(BigNumber(coin.balance));
        if (totalAmount.gte(amount)) {
          break;
        }
      }

      if (selectedCoins.length === 0 || totalAmount.lt(amount)) {
        throw new Error(
          `${type} balance is not enough, current total balance:${totalAmount}`
        );
      }

      // Merge multiple coins if necessary
      if (selectedCoins.length > 1) {
        tx.mergeCoins(
          tx.object(selectedCoins[0]), // Target coin (merge into first coin)
          selectedCoins.slice(1).map((id) => tx.object(id)) // Other coins to merge
        );
      }

      // Split requested amount from merged coin
      const [newCoin] = tx.splitCoins(tx.object(selectedCoins[0]), [
        tx.pure.u64(amount.toNumber()),
      ]);

      return newCoin;
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Get coins which amount is greater than or equal to the specified amount
   * @param client The Sui client
   * @param ownerAddress The address of the coin owner
   * @param type The coin type (format: packageId::module::struct)
   * @param amount The amount to get
   * @param tx The transaction object to add the split operation to
   * @returns {Promise<{ $kind: "NestedResult"; NestedResult: [number, number] }>}
   */
  public async getMergedCoin(
    client: SuiClient,
    ownerAddress: string,
    type: string,
    amount: BigNumber,
    tx: Transaction
  ): Promise<{
    $kind: "Input";
    Input: number;
    type?: "object";
  }> {
    try {
      // Query available coins of specified type
      const coins = await client.getCoins({
        owner: ownerAddress,
        coinType: type,
      });
      if (!coins || coins.data.length === 0) {
        throw new Error(`no ${type} coins available`);
      }

      // Select and accumulate coins until target amount is reached
      let selectedCoins: string[] = [];
      let totalAmount = BigNumber(0);
      for (const coin of coins.data) {
        selectedCoins.push(coin.coinObjectId);
        totalAmount = totalAmount.plus(BigNumber(coin.balance));
        if (totalAmount.gte(amount)) {
          break;
        }
      }

      if (selectedCoins.length === 0 || totalAmount.lt(amount)) {
        throw new Error(
          `${type} balance is not enough, current total balance:${totalAmount}`
        );
      }

      // Merge multiple coins if necessary
      if (selectedCoins.length > 1) {
        tx.mergeCoins(
          tx.object(selectedCoins[0]), // Target coin (merge into first coin)
          selectedCoins.slice(1).map((id) => tx.object(id)) // Other coins to merge
        );
      }

      return tx.object(selectedCoins[0]);
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Build transfer transaction
   * @param suiWalletAddress The address of the wallet
   * @param params Transfer parameters including recipient, coin type and amount
   * @returns {Promise<Transaction>} Transaction object
   */
  public async buildTransferTx(
    suiWalletAddress: string,
    params: TransferParams
  ): Promise<Transaction> {
    try {
      // Validate input parameters
      if (!params.to || !params.coinType || !params.amount) {
        throw new Error("Recipient address, coin type and amount are required");
      }
      if (params.amount.lte(0)) {
        throw new Error("Transfer amount must be greater than 0");
      }

      // Build transaction
      const tx = new Transaction();

      tx.setSender(suiWalletAddress);
      const splitCoin = coinWithBalance({
        balance: params.amount.toNumber(),
        type: params.coinType,
        useGasCoin: true,
      });

      // Transfer the coin to recipient
      tx.transferObjects([splitCoin], tx.pure.address(params.to));

      return tx;
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Transfer coins to another address
   * @param signer The keypair for signing the transaction
   * @param params Transfer parameters including recipient, coin type and amount
   * @returns {Promise<TxResponse>} Transaction response containing status and txId
   */
  public async transfer(
    signer: Keypair,
    params: TransferParams
  ): Promise<TxResponse> {
    try {
      const tx: Transaction = await this.buildTransferTx(
        signer.getPublicKey().toSuiAddress(),
        params
      );

      // Sign and execute transaction
      const result = await this.client.signAndExecuteTransaction({
        signer: signer,
        transaction: tx,
      });

      return {
        txId: result.digest,
        status: true,
      };
    } catch (error) {
      return {
        txId: "",
        status: false,
        error: formatError(error),
      };
    }
  }
}
