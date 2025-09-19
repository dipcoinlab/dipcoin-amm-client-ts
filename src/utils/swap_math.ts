// Copyright (c) 2025 Dipcoin LLC
// SPDX-License-Identifier: Apache-2.0

import BigNumber from "bignumber.js";

/**
 * Utility class for performing swap-related mathematical calculations
 */
export class SwapMath {
  private static readonly MAX_FEE_RATE = new BigNumber(2000); // Maximum transaction fee rate 1%
  private static readonly FEE_SCALE = new BigNumber(10000);
  private static readonly U64_MAX = new BigNumber("18446744073709551615");

  /**
   * Multiply two numbers and return the result
   * @param x First number to multiply
   * @param y Second number to multiply
   * @returns Product of x and y
   */
  public static mulToU128(x: BigNumber, y: BigNumber): BigNumber {
    return x.multipliedBy(y);
  }

  /**
   * Calculate square root of a number
   * @param y Number to calculate square root of
   * @returns Square root of y
   */
  public static square(y: BigNumber): BigNumber {
    return y.sqrt();
  }

  /**
   * Performs multiplication then division: (x * y) / z
   * @param x First number to multiply
   * @param y Second number to multiply
   * @param z Number to divide by
   * @returns Result of (x * y) / z
   * @throws If division by zero or U64 overflow
   */
  public static mulDiv(x: BigNumber, y: BigNumber, z: BigNumber): BigNumber {
    if (z.isZero()) {
      throw new Error("Division by zero");
    }
    const result = x
      .multipliedBy(y)
      .dividedBy(z)
      .integerValue(BigNumber.ROUND_DOWN);
    if (result.isGreaterThan(SwapMath.U64_MAX)) {
      throw new Error("U64 overflow");
    }
    return result;
  }

  /**
   * Calculate optimal token amounts for adding liquidity to maintain price ratio
   * @param coinXDesired Desired amount of token X to add
   * @param coinYDesired Desired amount of token Y to add
   * @param coinXReserve Current reserve of token X in pool
   * @param coinYReserve Current reserve of token Y in pool
   * @returns Tuple of [optimal X amount, optimal Y amount]
   * @throws If calculated amounts exceed limits
   */
  public static calcOptimalCoinValues(
    coinXDesired: BigNumber,
    coinYDesired: BigNumber,
    coinXReserve: BigNumber,
    coinYReserve: BigNumber
  ): [BigNumber, BigNumber] {
    if (coinXReserve.isZero() && coinYReserve.isZero()) {
      return [coinXDesired, coinYDesired];
    }

    const coinYReturned = this.mulDiv(coinXDesired, coinYReserve, coinXReserve);
    if (coinYReturned.isLessThanOrEqualTo(coinYDesired)) {
      return [coinXDesired, coinYReturned];
    } else {
      const coinXReturned = this.mulDiv(
        coinYDesired,
        coinXReserve,
        coinYReserve
      );
      if (coinXReturned.isGreaterThan(coinXDesired)) {
        throw new Error("Over limit");
      }
      return [coinXReturned, coinYDesired];
    }
  }

  /**
   * Calculate protocol team fee amount
   * @param feeRate Fee rate to apply
   * @param coinIn Input token amount
   * @returns Fee amount to be sent to team
   */
  public static getFeeToTeam(feeRate: BigNumber, coinIn: BigNumber): BigNumber {
    return this.mulDiv(coinIn, feeRate, this.FEE_SCALE)
      .dividedBy(5)
      .integerValue(BigNumber.ROUND_DOWN);
  }

  /**
   * Calculate LP token amount to mint for provided liquidity
   * @param optimalCoinX Optimal amount of token X being added
   * @param optimalCoinY Optimal amount of token Y being added
   * @param coinXReserve Current reserve of token X in pool
   * @param coinYReserve Current reserve of token Y in pool
   * @param lpSupply Current total supply of LP tokens
   * @returns Amount of LP tokens to mint
   * @throws If result exceeds U64 max value
   */
  public static getExpectedLiquidityAmount(
    optimalCoinX: BigNumber,
    optimalCoinY: BigNumber,
    coinXReserve: BigNumber,
    coinYReserve: BigNumber,
    lpSupply: BigNumber
  ): BigNumber {
    // First time adding liquidity - use geometric mean
    if (coinXReserve.isZero() && coinYReserve.isZero() && lpSupply.isZero()) {
      const liquidityAmount = optimalCoinX
        .multipliedBy(optimalCoinY)
        .sqrt()
        .integerValue(BigNumber.ROUND_DOWN)
        .minus(1000);

      if (liquidityAmount.isGreaterThan(this.U64_MAX)) {
        throw new Error("U64 overflow");
      }
      return liquidityAmount;
    }

    // Calculate proportional LP tokens based on contribution ratio
    const xLiq = lpSupply
      .multipliedBy(optimalCoinX)
      .dividedBy(coinXReserve)
      .integerValue(BigNumber.ROUND_DOWN);
    const yLiq = lpSupply
      .multipliedBy(optimalCoinY)
      .dividedBy(coinYReserve)
      .integerValue(BigNumber.ROUND_DOWN);

    // Return the smaller value to maintain ratio
    if (xLiq.isLessThan(yLiq)) {
      if (xLiq.isGreaterThan(this.U64_MAX)) {
        throw new Error("U64 overflow");
      }
      return xLiq;
    } else {
      if (yLiq.isGreaterThan(this.U64_MAX)) {
        throw new Error("U64 overflow");
      }
      return yLiq;
    }
  }

  /**
   * Calculate output amount for a swap given input amount and reserves
   * @param feeRate Fee rate to apply to swap
   * @param amountIn Input token amount
   * @param reserveIn Reserve of input token
   * @param reserveOut Reserve of output token
   * @returns Expected output amount after fees
   * @throws For invalid parameters or U64 overflow
   */
  public static getAmountOut(
    feeRate: BigNumber,
    amountIn: BigNumber,
    reserveIn: BigNumber,
    reserveOut: BigNumber
  ): BigNumber {
    // Special case: if fee_rate = 0, amount_out = y*amount_in/(x + amount_in)
    if (feeRate.isZero()) {
      console.log(
        "getAmountOut result:",
        reserveOut
          .multipliedBy(amountIn)
          .dividedBy(reserveIn.plus(amountIn))
          .integerValue(BigNumber.ROUND_DOWN)
          .toString()
      );
    }
    if (feeRate.isGreaterThan(this.MAX_FEE_RATE)) {
      throw new Error("Invalid fee rate");
    }
    if (amountIn.isZero()) {
      throw new Error("Zero amount");
    }
    if (reserveIn.isZero() || reserveOut.isZero()) {
      throw new Error("Reserves empty");
    }

    // Calculate output considering fees
    const feeMultiplier = this.FEE_SCALE.minus(feeRate);
    const coinInValAfterFees = amountIn.multipliedBy(feeMultiplier);
    const newReserveIn = reserveIn
      .multipliedBy(this.FEE_SCALE)
      .plus(coinInValAfterFees);

    const numerator = coinInValAfterFees.multipliedBy(reserveOut);
    const amountOut = numerator
      .dividedBy(newReserveIn)
      .integerValue(BigNumber.ROUND_DOWN);

    if (amountOut.isGreaterThan(this.U64_MAX)) {
      throw new Error("U64 overflow");
    }
    return amountOut;
  }

  /**
   * Calculate required input amount for desired output amount
   * @param feeRate Fee rate to apply to swap
   * @param amountOut Desired output token amount
   * @param reserveIn Reserve of input token
   * @param reserveOut Reserve of output token
   * @returns Required input amount including fees
   * @throws For invalid parameters or U64 overflow
   */
  public static getAmountIn(
    feeRate: BigNumber,
    amountOut: BigNumber,
    reserveIn: BigNumber,
    reserveOut: BigNumber
  ): BigNumber {
    if (feeRate.isGreaterThan(this.MAX_FEE_RATE)) {
      throw new Error("Invalid fee rate");
    }
    if (amountOut.isZero()) {
      throw new Error("Zero amount");
    }
    if (reserveIn.isZero() || reserveOut.isZero()) {
      throw new Error("Reserves empty");
    }

    // Calculate input required considering fees
    const feeMultiplier = this.FEE_SCALE.minus(feeRate);
    const numerator = reserveIn
      .multipliedBy(amountOut)
      .multipliedBy(this.FEE_SCALE);
    const denominator = reserveOut.minus(amountOut).multipliedBy(feeMultiplier);
    const amountIn = numerator
      .dividedBy(denominator)
      .integerValue(BigNumber.ROUND_DOWN)
      .plus(1);

    if (amountIn.isGreaterThan(this.U64_MAX)) {
      throw new Error("U64 overflow");
    }
    return amountIn;
  }

  /**
   * Verify that LP token value (k = x*y) has not decreased after operation
   * @param oldReserveX Previous reserve of token X
   * @param oldReserveY Previous reserve of token Y
   * @param newReserveX New reserve of token X
   * @param newReserveY New reserve of token Y
   * @throws If new k value is less than old k value
   */
  public static assertLpValueIsIncreased(
    oldReserveX: BigNumber,
    oldReserveY: BigNumber,
    newReserveX: BigNumber,
    newReserveY: BigNumber
  ): void {
    if (
      oldReserveX
        .multipliedBy(oldReserveY)
        .isGreaterThan(newReserveX.multipliedBy(newReserveY))
    ) {
      throw new Error("Incorrect swap");
    }
  }
}
