import { getFullnodeUrl } from "@mysten/sui/client";
import { DipCoinSDK } from "../sdk";
import { DipCoinSDKOptions } from "../types";

export const dipCoinTestnet: DipCoinSDKOptions = {
  suiRpc: getFullnodeUrl("testnet"), //default is sui public fullnode url
  packageId:
    "0x3f52d00499d65dd41602c1cd190cf6771b401ae328d46a172473a7f47be6f83f",
  globalId:
    "0xe3d52d484e158f164a8650cfd5c8406b545f7e724f70ad40f3747dd6dc39b3c5",
  registedPoolsId:
    "0x52523bbaac35485a1e79c9b46f6b8f53e98ebc17b317695622cb37dbbab46b67",
};

/**
 * Initialize a new DipCoin SDK instance configured for testnet
 * @param customRpc Optional - Custom RPC endpoint URL for connecting to the Sui testnet.
 *                  If not provided, will use the default public testnet endpoint
 * @returns A configured DipCoinSDK instance ready to interact with the testnet
 */
export function initTestnetSDK(customRpc?: string): DipCoinSDK {
  if (customRpc) {
    dipCoinTestnet.suiRpc = customRpc;
  }
  const sdk = new DipCoinSDK(dipCoinTestnet);
  return sdk;
}
