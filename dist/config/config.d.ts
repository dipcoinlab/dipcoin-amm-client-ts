import { DipCoinSDK } from "../sdk";
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
export declare function initDipCoinSDK(options: InitDipCoinSDKOptions): DipCoinSDK;
//# sourceMappingURL=config.d.ts.map