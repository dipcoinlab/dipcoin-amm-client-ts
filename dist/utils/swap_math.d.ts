import BigNumber from "bignumber.js";
/**
 * Utility class for performing swap-related mathematical calculations
 */
export declare class SwapMath {
    private static readonly MAX_FEE_RATE;
    private static readonly FEE_SCALE;
    private static readonly U64_MAX;
    /**
     * Multiply two numbers and return the result
     * @param x First number to multiply
     * @param y Second number to multiply
     * @returns Product of x and y
     */
    static mulToU128(x: BigNumber, y: BigNumber): BigNumber;
    /**
     * Calculate square root of a number
     * @param y Number to calculate square root of
     * @returns Square root of y
     */
    static square(y: BigNumber): BigNumber;
    /**
     * Performs multiplication then division: (x * y) / z
     * @param x First number to multiply
     * @param y Second number to multiply
     * @param z Number to divide by
     * @returns Result of (x * y) / z
     * @throws If division by zero or U64 overflow
     */
    static mulDiv(x: BigNumber, y: BigNumber, z: BigNumber): BigNumber;
    /**
     * Calculate optimal token amounts for adding liquidity to maintain price ratio
     * @param coinXDesired Desired amount of token X to add
     * @param coinYDesired Desired amount of token Y to add
     * @param coinXReserve Current reserve of token X in pool
     * @param coinYReserve Current reserve of token Y in pool
     * @returns Tuple of [optimal X amount, optimal Y amount]
     * @throws If calculated amounts exceed limits
     */
    static calcOptimalCoinValues(coinXDesired: BigNumber, coinYDesired: BigNumber, coinXReserve: BigNumber, coinYReserve: BigNumber): [BigNumber, BigNumber];
    /**
     * Calculate protocol team fee amount
     * @param feeRate Fee rate to apply
     * @param coinIn Input token amount
     * @returns Fee amount to be sent to team
     */
    static getFeeToTeam(feeRate: BigNumber, coinIn: BigNumber): BigNumber;
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
    static getExpectedLiquidityAmount(optimalCoinX: BigNumber, optimalCoinY: BigNumber, coinXReserve: BigNumber, coinYReserve: BigNumber, lpSupply: BigNumber): BigNumber;
    /**
     * Calculate output amount for a swap given input amount and reserves
     * @param feeRate Fee rate to apply to swap
     * @param amountIn Input token amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @returns Expected output amount after fees
     * @throws For invalid parameters or U64 overflow
     */
    static getAmountOut(feeRate: BigNumber, amountIn: BigNumber, reserveIn: BigNumber, reserveOut: BigNumber): BigNumber;
    /**
     * Calculate required input amount for desired output amount
     * @param feeRate Fee rate to apply to swap
     * @param amountOut Desired output token amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @returns Required input amount including fees
     * @throws For invalid parameters or U64 overflow
     */
    static getAmountIn(feeRate: BigNumber, amountOut: BigNumber, reserveIn: BigNumber, reserveOut: BigNumber): BigNumber;
    /**
     * Verify that LP token value (k = x*y) has not decreased after operation
     * @param oldReserveX Previous reserve of token X
     * @param oldReserveY Previous reserve of token Y
     * @param newReserveX New reserve of token X
     * @param newReserveY New reserve of token Y
     * @throws If new k value is less than old k value
     */
    static assertLpValueIsIncreased(oldReserveX: BigNumber, oldReserveY: BigNumber, newReserveX: BigNumber, newReserveY: BigNumber): void;
}
//# sourceMappingURL=swap_math.d.ts.map