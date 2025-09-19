// Copyright (c) 2025 Dipcoin LLC
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl } from "@mysten/sui/client";
import { DipCoinSDKOptions } from "../types";
import { DipCoinSDK } from "../sdk";

export const dipCoinMainnet: DipCoinSDKOptions = {
  suiRpc: getFullnodeUrl("mainnet"), // Default Sui mainnet public fullnode URL
  // TODO: Using testnet config temporarily since mainnet contracts are not deployed yet.
  // Will update to mainnet configuration once deployed.
  packageId:
    "0xdae28ab9ab072c647c4e8f2057a8f17dcc4847e42d6a8258df4b376ae183c872",
  globalId:
    "0x935229a3c32399e9fb207ec8461a54f56c6af5744c64442435ac217ab28f0d59",
  registedPoolsId:
    "0x55c65b7b67b0ccdf28e13b3b6d204e859dd19556603e3b94137a19306a7254d8",
};

/**
 * Initialize DipCoin SDK for mainnet
 * @param customRpc Optional custom RPC endpoint URL to override default mainnet URL
 * @returns Initialized DipCoin SDK instance configured for mainnet
 */
export function initMainnetSDK(customRpc?: string): DipCoinSDK {
  if (customRpc) {
    dipCoinMainnet.suiRpc = customRpc;
  }
  const sdk = new DipCoinSDK(dipCoinMainnet);
  return sdk;
}
