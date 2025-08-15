import { DipCoinSDK } from "../sdk";
import { DipCoinSDKOptions } from "../types";
export declare const dipCoinTestnet: DipCoinSDKOptions;
/**
 * Initialize a new DipCoin SDK instance configured for testnet
 * @param customRpc Optional - Custom RPC endpoint URL for connecting to the Sui testnet.
 *                  If not provided, will use the default public testnet endpoint
 * @returns A configured DipCoinSDK instance ready to interact with the testnet
 */
export declare function initTestnetSDK(customRpc?: string): DipCoinSDK;
//# sourceMappingURL=testnet.d.ts.map