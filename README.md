## DipCoin-Sui-SDK

TypeScript SDK for DipCoin DEX on Sui blockchain.

## Quick Start

### Initialize SDK

```typescript
import { initDipCoinSDK } from "@dipcoinlab/dex-sui-sdk";

// Initialize for mainnet
const sdk = initDipCoinSDK({
  network: "mainnet",
  customRpc: "https://fullnode.mainnet.sui.io", // Optional custom RPC
});

// Initialize for testnet
const sdk = initDipCoinSDK({
  network: "testnet",
});
```

## Core Features

### Liquidity Operations

#### Add Liquidity

Add liquidity to an existing pool with slippage protection:

```typescript
const txResponse = await sdk.addLiquidity(keypair, {
  pooId: "YOUR_POOL_ID",
  typeX: "0x...::usdc::USDC", // First token type
  typeY: "0x...::wsol::WSOL", // Second token type
  amountX: new BigNumber(2000000000), // 2000 USDC (with 6 decimals)
  amountY: new BigNumber(10000000), // 10 WSOL (with 6 decimals)
  slippage: 0.03, // 3% slippage tolerance,if not specified,default is 0.05
});

if (txResponse.status) {
  console.log(`Add liquidity success, txId: ${txResponse.txId}`);
} else {
  console.log("Add liquidity failed:", txResponse.error);
}
```

#### Remove Liquidity

Remove liquidity from a pool:

```typescript
const txResponse = await sdk.removeLiquidity(keypair, {
  pooId: "YOUR_POOL_ID",
  typeX: "0x...::usdc::USDC",
  typeY: "0x...::wsol::WSOL",
  removeLpAmount: new BigNumber(300000000), // Amount of LP tokens to remove
  slippage: 0.03, // 3% slippage tolerance,if not specified,default is 0.05
});

if (txResponse.status) {
  console.log(`Remove liquidity success, txId: ${txResponse.txId}`);
} else {
  console.log("Remove liquidity failed:", txResponse.error);
}
```

### Swap Operations

#### Swap Exact Input

Swap an exact amount of input tokens for output tokens:

```typescript
const txResponse = await sdk.swapExactXToY(keypair, {
  pooId: "YOUR_POOL_ID",
  typeX: "0x...::wsol::WSOL", // Input token
  typeY: "0x...::usdc::USDC", // Output token
  amountIn: new BigNumber(1000000000), // 1000 WSOL
  slippage: 0.03, // 3% slippage tolerance
});

if (txResponse.status) {
  console.log(`Swap exact X to Y success, txId: ${txResponse.txId}`);
} else {
  console.log("Swap failed:", txResponse.error);
}
```

#### Swap Exact Output

Swap tokens for an exact amount of output tokens:

```typescript
const txResponse = await sdk.swapXToExactY(keypair, {
  pooId: "YOUR_POOL_ID",
  typeX: "0x...::usdc::USDC", // Input token
  typeY: "0x...::wsol::WSOL", // Output token
  amountOut: new BigNumber(1000000000), // Desired output amount
  slippage: 0.03, // 3% slippage tolerance
});

if (txResponse.status) {
  console.log(`Swap X to exact Y success, txId: ${txResponse.txId}`);
} else {
  console.log("Swap failed:", txResponse.error);
}
```

### Query Functions

#### Get Pool Information

```typescript
const poolResponse = await sdk.getPool("YOUR_POOL_ID");
if (poolResponse.status && poolResponse.data) {
  console.log("Pool info:", poolResponse.data);
}
```

#### Get Pool ID

Get pool ID for a token pair:

```typescript
const poolId = await sdk.getPoolId("0x...::usdc::USDC", "0x...::wsol::WSOL");
console.log("Pool ID:", poolId);
```

#### Get Global Configuration

```typescript
const globalResponse = await sdk.getGlobal();
if (globalResponse.status && globalResponse.data) {
  console.log("Global config:", globalResponse.data);
}
```

### Split Coins

Split a specified amount from available coins. This is typically used internally by the SDK but can also be used directly if needed:

```typescript
import { Transaction } from "@mysten/sui/transactions";

// Create a new transaction
const tx = new Transaction();

// Split coins
const splitCoinResult = await sdk.splitCoin(
  ownerAddress, // The address of the coin owner
  coinType, // The coin type (e.g. "0x...::usdc::USDC")
  amount, // Amount to split (BigNumber)
  tx // Transaction object
);
```

The method will:

1. Query available coins of the specified type
2. Merge multiple coins if necessary
3. Split the requested amount
4. Return the split coin reference

Example usage within a custom transaction:

```typescript
const tx = new Transaction();

try {
  // Split 1000 USDC
  const splitUSDC = await sdk.splitCoin(
    signer.getPublicKey().toSuiAddress(),
    "0x...::usdc::USDC",
    new BigNumber(1000000000), // 1000 USDC with 6 decimals
    tx
  );

  // Use the split coin in your transaction
  tx.moveCall({
    target: "your_package::module::function",
    arguments: [
      splitUSDC,
      // other arguments...
    ],
    typeArguments: [
      /* type arguments */
    ],
  });

  // Sign and execute the transaction
  const result = await sdk.client.signAndExecuteTransaction({
    signer: signer,
    transaction: tx,
  });
} catch (error) {
  console.error("Split coin failed:", error);
}
```

Error handling:

- Throws if no coins are available
- Throws if total balance is insufficient
- Throws if coin operations fail

## Types

### Pool Interface

```typescript
interface Pool {
  id: string; // Pool ID
  bal_x: bigint; // Token X balance
  bal_y: bigint; // Token Y balance
  fee_bal_x: bigint; // Accumulated fee balance for token X
  fee_bal_y: bigint; // Accumulated fee balance for token Y
  lp_supply: bigint; // Total LP token supply
  fee_rate: bigint; // Pool fee rate
}
```

### Transaction Response

```typescript
interface TxResponse {
  txId: string; // Transaction hash
  status: boolean; // Transaction success status
  error?: string; // Error message if failed
}
```

## Error Handling

All SDK methods return a response object with status and error information:

```typescript
interface SDKResponse<T = any> {
  status: boolean; // Operation success status
  data?: T; // Response data if successful
  error?: string; // Error message if failed
}
```

## Constants

### Default Values

- Default slippage tolerance: 5% (0.05)
- Maximum fee rate: 1% (0.01)

## License

Apache License 2.0
