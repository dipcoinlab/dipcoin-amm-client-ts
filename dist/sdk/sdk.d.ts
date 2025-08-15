import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Keypair } from "@mysten/sui/cryptography";
import BigNumber from "bignumber.js";
import { DipCoinSDKOptions, AddLiquidityParams, RemoveLiquidityParams, SwapParams, TransferParams, SDKResponse, TxResponse, Pool, Global } from "../types";
export declare class DipCoinSDK {
    private client;
    private options;
    constructor(options: DipCoinSDKOptions);
    get optionsField(): DipCoinSDKOptions;
    /**
     * Build add liquidity transaction
     * @param suiWalletAddress The address of the wallet
     * @param params Parameters for adding liquidity
     * @returns {Promise<Transaction>} Transaction object
     */
    buildAddLiquidityTx(suiWalletAddress: string, params: AddLiquidityParams): Promise<Transaction>;
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
    addLiquidity(signer: Keypair, params: AddLiquidityParams): Promise<TxResponse>;
    /**
     * Build remove liquidity transaction
     * @param suiWalletAddress The address of the wallet
     * @param params Parameters for removing liquidity
     * @returns {Promise<Transaction>} Transaction object
     */
    buildRemoveLiquidityTx(suiWalletAddress: string, params: RemoveLiquidityParams): Promise<Transaction>;
    /**
     * Remove liquidity from a pool
     * @param signer The keypair for signing the transaction
     * @param params Parameters for removing liquidity
     * @returns {Promise<TxResponse>} Transaction response containing status and txId
     */
    removeLiquidity(signer: Keypair, params: RemoveLiquidityParams): Promise<TxResponse>;
    /**
     * Build swap exact X to Y transaction
     * @param suiWalletAddress The address of the wallet
     * @param params Swap parameters including amountIn and optional slippage
     * @returns {Promise<Transaction>} Transaction object
     */
    buildSwapExactXToYTx(suiWalletAddress: string, params: SwapParams): Promise<Transaction>;
    /**
     * Swap an exact amount of token X for token Y
     * Supports flexible token ordering (e.g. USDC->WSOL or WSOL->USDC)
     * @param signer The keypair for signing the transaction
     * @param params Swap parameters including amountIn and optional slippage
     * @returns {Promise<TxResponse>} Transaction response containing status and txId
     */
    swapExactXToY(signer: Keypair, params: SwapParams): Promise<TxResponse>;
    /**
     * Build swap X to exact Y transaction
     * @param suiWalletAddress The address of the wallet
     * @param params Swap parameters including amountOut and optional slippage
     * @returns {Promise<Transaction>} Transaction object
     */
    buildSwapXToExactYTx(suiWalletAddress: string, params: SwapParams): Promise<Transaction>;
    /**
     * Swap token X for an exact amount of token Y
     * @param signer The keypair for signing the transaction
     * @param params Swap parameters including amountOut and optional slippage
     * @returns {Promise<TxResponse>} Transaction response containing status and txId
     */
    swapXToExactY(signer: Keypair, params: SwapParams): Promise<TxResponse>;
    /**
     * Get pool information
     * @param poolId The ID of the pool to query
     * @returns {Promise<SDKResponse<Pool>>} Pool information response
     */
    getPool(poolId: string): Promise<SDKResponse<Pool>>;
    /**
     * Get global configuration information
     * @returns {Promise<SDKResponse<Global>>} Global configuration response
     */
    getGlobal(): Promise<SDKResponse<Global>>;
    /**
     * Get pool ID for a given token pair
     * @param typeX First token type
     * @param typeY Second token type
     * @returns {Promise<string>} Pool ID if found
     */
    getPoolId(typeX: string, typeY: string): Promise<string>;
    /**
     * Split a specified amount of coins from the owner's balance
     * @param ownerAddress The address of the coin owner
     * @param type The coin type (format: packageId::module::struct)
     * @param amount The amount to split
     * @param tx The transaction object to add the split operation to
     * @returns {Promise<{ $kind: "NestedResult"; NestedResult: [number, number] }>} Split coin result
     */
    splitCoin(ownerAddress: string, type: string, amount: BigNumber, tx: Transaction): Promise<{
        $kind: "NestedResult";
        NestedResult: [number, number];
    }>;
    /**
     * Get coins which amount is greater than or equal to the specified amount
     * @param client The Sui client
     * @param ownerAddress The address of the coin owner
     * @param type The coin type (format: packageId::module::struct)
     * @param amount The amount to get
     * @param tx The transaction object to add the split operation to
     * @returns {Promise<{ $kind: "NestedResult"; NestedResult: [number, number] }>}
     */
    getMergedCoin(client: SuiClient, ownerAddress: string, type: string, amount: BigNumber, tx: Transaction): Promise<{
        $kind: "Input";
        Input: number;
        type?: "object";
    }>;
    /**
     * Build transfer transaction
     * @param suiWalletAddress The address of the wallet
     * @param params Transfer parameters including recipient, coin type and amount
     * @returns {Promise<Transaction>} Transaction object
     */
    buildTransferTx(suiWalletAddress: string, params: TransferParams): Promise<Transaction>;
    /**
     * Transfer coins to another address
     * @param signer The keypair for signing the transaction
     * @param params Transfer parameters including recipient, coin type and amount
     * @returns {Promise<TxResponse>} Transaction response containing status and txId
     */
    transfer(signer: Keypair, params: TransferParams): Promise<TxResponse>;
}
//# sourceMappingURL=sdk.d.ts.map