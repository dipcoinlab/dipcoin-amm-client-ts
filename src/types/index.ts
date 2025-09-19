// Copyright (c) 2025 Dipcoin LLC
// SPDX-License-Identifier: Apache-2.0

import BigNumber from "bignumber.js";

/**
 * SDK Configuration Interface
 */
export interface DipCoinSDKOptions {
  /** SUI RPC endpoint URL */
  suiRpc: string;
  /** Current DEX contract address after upgrade */
  packageId: string;
  /** Global config object ID */
  globalId: string;
  /** Global registered pools table ID (Table<String, address> type) */
  registedPoolsId: string;
}

/**
 * Parameters for adding liquidity to a pool
 */
export interface AddLiquidityParams {
  /** Pool ID to add liquidity to (e.g. 0x1234...abcdef) */
  pooId: string;
  /** Token X type in package::module::struct format (e.g. 0xdba...::usdc::USDC) */
  typeX: string;
  /** Token Y type in package::module::struct format (e.g. 0xdba...::wsol::WSOL) */
  typeY: string;
  /** Amount of token X to add */
  amountX: BigNumber;
  /** Amount of token Y to add */
  amountY: BigNumber;
  /** Slippage tolerance, defaults to 0.05 (5%) if not specified */
  slippage?: number;
}

/**
 * Parameters for removing liquidity from a pool
 */
export interface RemoveLiquidityParams {
  /** Pool ID to remove liquidity from */
  pooId: string;
  /** Token X type in package::module::struct format */
  typeX: string;
  /** Token Y type in package::module::struct format */
  typeY: string;
  /** Amount of LP tokens (Coin<LP<X,Y>> type) to remove */
  removeLpAmount: BigNumber;
  /** Slippage tolerance, defaults to 0.05 (5%) if not specified */
  slippage?: number;
}

/**
 * Parameters for swap operations
 */
export interface SwapParams {
  /** Pool ID to perform swap in */
  pooId: string;
  /** Token X type in package::module::struct format */
  typeX: string;
  /** Token Y type in package::module::struct format */
  typeY: string;
  /** Input token amount for exact input swaps */
  amountIn?: BigNumber;
  /** Output token amount for exact output swaps */
  amountOut?: BigNumber;
  /** Slippage tolerance, defaults to 0.05 (5%) if not specified */
  slippage?: number;
}

/**
 * Extended pool information including address and LP token name
 */
export interface PoolInfo extends Pool {
  /** Pool contract address */
  poolAddress: string;
  /** LP token name */
  lpName: string;
}

/**
 * Core pool data structure
 */
export interface Pool {
  /** Pool ID */
  id: string;
  /** Token X balance */
  bal_x: bigint;
  /** Token Y balance */
  bal_y: bigint;
  /** Accumulated fee balance for token X */
  fee_bal_x: bigint;
  /** Accumulated fee balance for token Y */
  fee_bal_y: bigint;
  /** Total LP token supply */
  lp_supply: bigint;
  /** Pool fee rate */
  fee_rate: bigint;
  /** Minimum liquidity required when first adding liquidity,will leave 1000 */
  min_liquidity: bigint;
  /** Minimum LP amount required for adding liquidity */
  min_add_liquidity_lp_amount: bigint;
}

/**
 * Global protocol configuration
 */
export interface Global {
  /** Global config ID */
  id: string;
  /** Whether protocol is paused */
  has_paused: boolean;
  /** Whether protocol fee is enabled */
  is_open_protocol_fee: boolean;
}

/**
 * Generic SDK response wrapper
 */
export interface SDKResponse<T = any> {
  /** Operation success status */
  status: boolean;
  /** Response data if successful */
  data?: T;
  /** Error message if failed */
  error?: string;
}

/**
 * Parameters for transfer operations
 */
export interface TransferParams {
  /** Recipient address */
  to: string;
  /** Coin type in package::module::struct format (e.g. 0x2::sui::SUI) */
  coinType: string;
  /** Amount to transfer */
  amount: BigNumber;
}

/**
 * Transaction response
 */
export interface TxResponse {
  /** Transaction hash/digest */
  txId: string;
  /** Transaction success status */
  status: boolean;
  /** Error message if failed */
  error?: string;
  /** Created pool ID for pool creation transactions */
  createdPoolId?: string;
}
