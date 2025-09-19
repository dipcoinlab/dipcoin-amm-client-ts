// Copyright (c) 2025 Dipcoin LLC
// SPDX-License-Identifier: Apache-2.0

import { SuiClient } from "@mysten/sui/client";
import { BCS, getSuiMoveConfig } from "@benfen/bcs";
import { RawData } from "@mysten/sui/client";
import { Pool, Global } from "../types";
import { Buffer } from "buffer";

const EQUAL = 0;
const LESS_THAN = 1;
const GREATER_THAN = 2;

/**
 * Fetches and deserializes a Pool object from the Sui blockchain
 * @param client SuiClient instance
 * @param poolObjectId The object ID of the pool to fetch
 * @returns Deserialized Pool object or null if not found/error
 */
export async function getPool(
  client: SuiClient,
  poolObjectId: string
): Promise<Pool | null> {
  try {
    const result = await client.getObject({
      id: poolObjectId,
      options: { showContent: true, showBcs: true, showType: true },
    });

    const data = result.data?.bcs as RawData;
    if (!data || data.dataType !== "moveObject") {
      return null;
    }

    const bcsBytes = (data as { bcsBytes: string }).bcsBytes;
    const bcs = new BCS(getSuiMoveConfig());

    // Register Pool structure with BCS fields mapping
    bcs.registerStructType("Pool", {
      id: BCS.ADDRESS,
      bal_x: BCS.U64,
      bal_y: BCS.U64,
      fee_bal_x: BCS.U64,
      fee_bal_y: BCS.U64,
      lp_supply: BCS.U64,
      fee_rate: BCS.U64,
      min_liquidity: BCS.U64,
      min_add_liquidity_lp_amount: BCS.U64,
    });

    // Deserialize BCS bytes to Pool object
    const bytes = Uint8Array.from(Buffer.from(bcsBytes || "", "base64"));
    let pool = bcs.de("Pool", bytes) as Pool;
    pool.id = normalizeAddress(pool.id);
    return pool;
  } catch (error) {
    console.error("Failed to get Pool data:", error);
    return null;
  }
}

/**
 * Fetches and deserializes a Global object from the Sui blockchain
 * @param client SuiClient instance
 * @param globalObjectId The object ID of the global config to fetch
 * @returns Deserialized Global object or null if not found/error
 */
export async function getGlobal(
  client: SuiClient,
  globalObjectId: string
): Promise<Global | null> {
  try {
    const result = await client.getObject({
      id: globalObjectId,
      options: { showContent: true, showBcs: true, showType: true },
    });

    const data = result.data?.bcs as RawData;
    if (!data || data.dataType !== "moveObject") {
      return null;
    }

    const bcsBytes = (data as { bcsBytes: string }).bcsBytes;
    const bcs = new BCS(getSuiMoveConfig());

    // Register Global structure with BCS fields mapping
    bcs.registerStructType("Global", {
      id: BCS.ADDRESS,
      has_paused: BCS.BOOL,
      is_open_protocol_fee: BCS.BOOL,
    });

    // Deserialize BCS bytes to Global object
    const bytes = Uint8Array.from(Buffer.from(bcsBytes || "", "base64"));
    let global = bcs.de("Global", bytes) as Global;
    global.id = normalizeAddress(global.id);
    return global;
  } catch (error) {
    console.error("Failed to get Global data:", error);
    return null;
  }
}

/**
 * Normalizes a Sui address by removing BFC prefix and ensuring 0x format
 * @param address Raw address string potentially with BFC prefix
 * @returns Normalized address in 0x format
 */
function normalizeAddress(address: string): string {
  // Remove potential "BF" prefix (if exists)
  const cleanAddress = address.startsWith("BFC") ? address.slice(3) : address;
  // Take first 64 characters (32 bytes), add "0x" prefix
  return "0x" + cleanAddress.slice(0, 64);
}

/**
 * Delays execution for specified seconds
 * @param ms Number of seconds to sleep
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
}

/**
 * Formats an error object into a string message
 * @param error Error object to format
 * @returns Formatted error message string
 */
export function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Compare two serialized byte arrays
 * @param bytesX First byte array
 * @param bytesY Second byte array
 * @returns Comparison result (EQUAL, LESS_THAN or GREATER_THAN)
 */
function compareByteArrays(bytesX: Uint8Array, bytesY: Uint8Array) {
  const lenX = bytesX.length;
  const lenY = bytesY.length;
  const minLen = Math.min(lenX, lenY);

  // Compare byte by byte
  for (let i = 0; i < minLen; i++) {
    if (bytesX[i] < bytesY[i]) return LESS_THAN;
    if (bytesX[i] > bytesY[i]) return GREATER_THAN;
  }

  // If all bytes up to minLen are equal, shorter array comes first
  if (lenX < lenY) return LESS_THAN;
  if (lenX > lenY) return GREATER_THAN;
  return EQUAL;
}

/**
 * BCS serialize Move type name for comparison
 * @param typeName Full type name
 * @returns Serialized bytes
 */
function serializeTypeName(typeName: string): Uint8Array {
  // Convert string to byte array
  const bytes = new TextEncoder().encode(typeName);

  // Create BCS instance
  const bcs = new BCS(getSuiMoveConfig());

  // Serialize byte array
  return bcs.ser("vector<u8>", Array.from(bytes)).toBytes();
}

/**
 * Check if two token types are in sorted order using BCS serialization
 * @param typeX First token type
 * @param typeY Second token type
 * @throws If token types are the same
 * @returns true if typeX < typeY, false otherwise
 */
export function isSortedTypes(typeX: string, typeY: string) {
  if (typeX === typeY) {
    throw new Error("Type X and Type Y cannot be the same");
  }

  // BCS serialize both type names
  const serializedX = serializeTypeName(typeX);
  const serializedY = serializeTypeName(typeY);

  // Compare serialized bytes
  return compareByteArrays(serializedX, serializedY) === LESS_THAN;
}

/**
 * Generates LP token type string based on coin types
 * This method generates a complete type identifier for LP tokens. It orders the coin types
 * based on their BCS serialized byte array comparison to ensure consistent LP type identifiers.
 *
 * @param packageId Contract ID
 * @param typeX First coin type
 * @param typeY Second coin type
 * @returns Tuple containing [sortedTypeX, sortedTypeY, lpType] where lpType follows format:
 *          `${packageId}::manage::LP<${coinType1}, ${coinType2}>`
 *
 * @example
 * getLPType(
 *   "0x123",
 *   "0x456::coin::USDC",
 *   "0x789::coin::BTC"
 * )
 * // Returns: ["0x456::coin::USDC", "0x789::coin::BTC", "0x123::manage::LP<0x456::coin::USDC, 0x789::coin::BTC>"]
 */
export function getLpType(
  packageId: string,
  typeX: string,
  typeY: string
): [string, string, string] {
  // Sort coin types to ensure consistent ordering
  const [newTypeX, newTypeY] = orderType(typeX, typeY);
  let lpType = `${packageId}::manage::LP<${newTypeX}, ${newTypeY}>`;
  return [newTypeX, newTypeY, lpType];
}

/**
 * Orders two coin types based on their lexicographical comparison
 * @param typeX First coin type
 * @param typeY Second coin type
 * @returns Tuple of ordered coin types [smaller, larger]
 */
export function orderType(typeX: string, typeY: string): [string, string] {
  return isSortedTypes(typeX, typeY) ? [typeX, typeY] : [typeY, typeX];
}

/**
 * Generates LP token name based on coin types
 * This method generates a name for LP tokens by ordering the coin types lexicographically
 * and removing any '0x' prefixes to ensure consistent naming.
 *
 * @param typeX First coin type
 * @param typeY Second coin type
 * @returns LP token name in format `LP-${coinType1}-${coinType2}`
 *
 * @example
 * getLpName(
 *   "0x456::coin::USDC",
 *   "0x789::coin::WSOL"
 * )
 * // Returns: "LP-456::coin::USDC-789::coin::WSOL"
 */
export function getLpName(typeX: string, typeY: string): string {
  // Sort coin types for consistent ordering
  const [sortedTypeX, sortedTypeY] = orderType(typeX, typeY);
  // Remove 0x prefix if present
  const normalizedTypeX = sortedTypeX.startsWith("0x")
    ? sortedTypeX.slice(2)
    : sortedTypeX;
  const normalizedTypeY = sortedTypeY.startsWith("0x")
    ? sortedTypeY.slice(2)
    : sortedTypeY;

  // Construct LP token name
  return `LP-${normalizedTypeX}-${normalizedTypeY}`;
}
