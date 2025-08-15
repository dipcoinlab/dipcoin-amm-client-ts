import * as dotenv from "dotenv";

import { initDipCoinSDK } from "../src/config";
import { config } from "dotenv";
import { fromExportedKeypair } from "./from-exported-keypair";
import BigNumber from "bignumber.js";
import { getLpName, isSortedTypes } from "../src/utils";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { SuiClient } from "@mysten/sui/client";

config({ path: "../.env" });

// init sdk
// use default config to init testnet;
const sdk = initDipCoinSDK({
  network: "testnet",
});
let DECIMALS = 10 ** 6;
let DECIMALS_SUI = 10 ** 9;

let keypair = fromExportedKeypair(process.env.PK1!);

async function main() {
  // console.log(coins);
  // console.log(sdk.optionsField);
  // console.log(sdk.optionsField);
  // console.log(keypair.getPublicKey().toSuiAddress());
  //await removeLiquidity();
  //await swapExactXToY(BigNumber(100000));
  // await swapXToExactY(BigNumber(100 * DECIMALS));
  // console.log(process.env.TYPE_USDC!);
  // console.log(
  //   await sdk.getPoolId(process.env.TYPE_WSOL!, process.env.TYPE_CETUS!)
  // );
  //  await getPoolId();
  // await addLiquidity();
  // await removeLiquidity();
  //await swapXToExactY(BigNumber(0.02 * DECIMALS));
  // await swapExactXToY(BigNumber(0.02 * DECIMALS_SUI));
  //await swapXToExactY(BigNumber(1000000));

  // transfer
  await transfer();
}

// only address with AdminCap can call
// async function createPoolByAdmin() {
//   const txResponse = await sdk.createPoolByAdmin(
//     keypair,
//     process.env.COIN_TYPE_PEPE!,
//     process.env.COIN_TYPE_WSOL!,
//     100
//   );
//   if (txResponse.status) {
//     console.log(
//       `create pool by admin success, poolId:${txResponse.createdPoolId}`
//     );
//   } else {
//     console.log("create pool by admin failed:", txResponse.error);
//   }
// }

async function getPoolId() {
  try {
    const poolId = await sdk.getPoolId(
      process.env.TYPE_CETUS!,
      process.env.TYPE_USDC!
    );
    //USDC WSOL 0xe717d2fcdb960bc81628271db3aaa9631d085eb9ad108251751f0b87b11da1b1
    console.log(`get poolId success, poolId:${poolId}`);
  } catch (error) {
    console.log("get poolId failed:", error);
  }
}

async function addLiquidity() {
  const txResponse = await sdk.addLiquidity(keypair, {
    pooId: process.env.POOL_OBJECT_SUI_USDC!,
    typeX: process.env.TYPE_SUI!,
    typeY: process.env.TYPE_USDC!,
    amountX: BigNumber(0.1 * DECIMALS_SUI),
    amountY: BigNumber(1.8 * DECIMALS),
    slippage: 0.03,
  });
  if (txResponse.status) {
    console.log(`add liquidity success, txId:${txResponse.txId}`);
  } else {
    console.log("add liquidity failed:", txResponse.error);
  }
}

async function removeLiquidity() {
  const txResponse = await sdk.removeLiquidity(keypair, {
    pooId: process.env.POOL_OBJECT_SUI_USDC!,
    typeX: process.env.TYPE_SUI!,
    typeY: process.env.TYPE_USDC!,
    removeLpAmount: BigNumber(56_596_032),
    slippage: 0.03,
  });
  if (txResponse.status) {
    console.log(`remove liquidity success, txId:${txResponse.txId}`);
  } else {
    console.log("remove liquidity failed:", txResponse.error);
  }
}

async function swapExactXToY(amountXIn: BigNumber) {
  // typeX: process.env.TYPE_SUI!,
  // typeY: process.env.TYPE_USDC!,

  // pooId: process.env.POOL_OBJECT_SUI_USDC!,
  // typeX: process.env.TYPE_SUI!,
  // typeY: process.env.TYPE_USDC!,

  const txResponse = await sdk.swapExactXToY(keypair, {
    pooId: process.env.POOL_OBJECT_SUI_USDC!,
    typeX: process.env.TYPE_SUI!, //10 WSOL-> ? USDC  ;  x:USDC y:WSOL
    typeY: process.env.TYPE_USDC!,
    amountIn: amountXIn,
    slippage: 0.03,
  });
  if (txResponse.status) {
    console.log(`swap exact x to y success, txId:${txResponse.txId}`);
  } else {
    console.log("swap exact x to y failed:", txResponse.error);
  }
}

async function swapXToExactY(amountYOut: BigNumber) {
  const txResponse = await sdk.swapXToExactY(keypair, {
    pooId: process.env.POOL_OBJECT_SUI_USDC!,
    typeX: process.env.TYPE_USDC!,
    typeY: process.env.TYPE_SUI!,
    amountOut: amountYOut,
    slippage: 0.03,
  });

  if (txResponse.status) {
    console.log(`swap x to exact y success, txId:${txResponse.txId}`);
  } else {
    console.log("swap x to exact y failed:", txResponse.error);
  }
}

async function transfer() {
  const txResponse = await sdk.transfer(keypair, {
    to: "0x20acd3cd5854cce474b9cd464334915b641354ff22396d66b4ca4adfb1b58c49",
    coinType: process.env.TYPE_SUI!,
    amount: new BigNumber(2000000000000000000),
  });

  if (txResponse.status) {
    console.log(`transfer success, txId:${txResponse.txId}`);
  } else {
    console.log("transfer failed:", txResponse.error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
