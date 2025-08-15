import { DipCoinSDK } from "../sdk";
import { initMainnetSDK } from "./mainnet";
import { initTestnetSDK } from "./testnet";

/**
 * Options for initializing DipCoin SDK
 */
export interface InitDipCoinSDKOptions {
  /** Network type, either mainnet or testnet */
  network: "mainnet" | "testnet";
  /** Optional custom RPC endpoint */
  customRpc?: string;
}

/**
 * Initialize DipCoin SDK
 * @param options Configuration options
 */
export function initDipCoinSDK(options: InitDipCoinSDKOptions): DipCoinSDK {
  const { network, customRpc } = options;
  return network === "mainnet"
    ? initMainnetSDK(customRpc)
    : initTestnetSDK(customRpc);
}
