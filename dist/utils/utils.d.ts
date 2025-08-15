import { SuiClient } from "@mysten/sui/client";
import { Pool, Global } from "../types";
/**
 * Fetches and deserializes a Pool object from the Sui blockchain
 * @param client SuiClient instance
 * @param poolObjectId The object ID of the pool to fetch
 * @returns Deserialized Pool object or null if not found/error
 */
export declare function getPool(client: SuiClient, poolObjectId: string): Promise<Pool | null>;
/**
 * Fetches and deserializes a Global object from the Sui blockchain
 * @param client SuiClient instance
 * @param globalObjectId The object ID of the global config to fetch
 * @returns Deserialized Global object or null if not found/error
 */
export declare function getGlobal(client: SuiClient, globalObjectId: string): Promise<Global | null>;
/**
 * Delays execution for specified seconds
 * @param ms Number of seconds to sleep
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Formats an error object into a string message
 * @param error Error object to format
 * @returns Formatted error message string
 */
export declare function formatError(error: unknown): string;
/**
 * Check if two token types are in sorted order using BCS serialization
 * @param typeX First token type
 * @param typeY Second token type
 * @throws If token types are the same
 * @returns true if typeX < typeY, false otherwise
 */
export declare function isSortedTypes(typeX: string, typeY: string): boolean;
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
export declare function getLpType(packageId: string, typeX: string, typeY: string): [string, string, string];
/**
 * Orders two coin types based on their lexicographical comparison
 * @param typeX First coin type
 * @param typeY Second coin type
 * @returns Tuple of ordered coin types [smaller, larger]
 */
export declare function orderType(typeX: string, typeY: string): [string, string];
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
export declare function getLpName(typeX: string, typeY: string): string;
//# sourceMappingURL=utils.d.ts.map