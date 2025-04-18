// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IMorphoBlue
 * @dev Interface for Morpho Blue contracts
 */
interface IMorphoBlue {
    // Define the Market Params struct
    struct MarketParams {
        address loanToken;
        address collateralToken;
        address oracle;
        address irm;
        uint256 lltv;
    }

    /**
     * @notice Supplies assets to a market
     * @param marketParams The market parameters
     * @param assets The amount of assets to supply
     * @param shares The amount of shares to mint (use 0 to use assets instead)
     * @param onBehalf The address that will own the increased supply position
     * @param data Arbitrary data to pass to the callback
     * @return assetsSupplied The amount of assets supplied
     * @return sharesSupplied The amount of shares minted
     */
    function supply(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        bytes memory data
    ) external returns (uint256 assetsSupplied, uint256 sharesSupplied);

    /**
     * @notice Withdraws assets from a market
     * @param marketParams The market parameters
     * @param assets The amount of assets to withdraw
     * @param shares The amount of shares to burn (use 0 to use assets instead)
     * @param onBehalf The address of the owner of the supply position
     * @param receiver The address that will receive the withdrawn assets
     * @return assetsWithdrawn The amount of assets withdrawn
     * @return sharesWithdrawn The amount of shares burned
     */
    function withdraw(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        address receiver
    ) external returns (uint256 assetsWithdrawn, uint256 sharesWithdrawn);

    /**
     * @notice Supplies collateral to a market
     * @param marketParams The market parameters
     * @param assets The amount of collateral to supply
     * @param onBehalf The address that will own the increased collateral position
     * @param data Arbitrary data to pass to the callback
     */
    function supplyCollateral(
        MarketParams memory marketParams,
        uint256 assets,
        address onBehalf,
        bytes memory data
    ) external;

    /**
     * @notice Withdraws collateral from a market
     * @param marketParams The market parameters
     * @param assets The amount of collateral to withdraw
     * @param onBehalf The address of the owner of the collateral position
     * @param receiver The address that will receive the collateral assets
     */
    function withdrawCollateral(
        MarketParams memory marketParams,
        uint256 assets,
        address onBehalf,
        address receiver
    ) external;
}