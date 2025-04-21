// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

contract UniswapDirectTest is Test {
    // Mainnet addresses
    address constant UNISWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    // Whale address
    address constant USDC_WHALE = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;
    
    uint24 constant FEE_MEDIUM = 3000; // 0.3%
    
    function setUp() public {
        // Fork mainnet
        vm.createSelectFork("http://localhost:8545");
    }
    
    function testDirectUniswapSwap() public {
        // Use USDC whale account
        vm.startPrank(USDC_WHALE);
        
        uint256 swapAmount = 5000 * 10**6; // 5,000 USDC
        
        // Initial balances
        uint256 initialUSDC = IERC20(USDC).balanceOf(USDC_WHALE);
        uint256 initialWETH = IERC20(WETH).balanceOf(USDC_WHALE);
        
        console.log("Initial USDC balance:", initialUSDC);
        console.log("Initial WETH balance:", initialWETH);
        
        // Check if we have enough USDC
        require(initialUSDC >= swapAmount, "Not enough USDC to swap");
        
        // Approve router
        IERC20(USDC).approve(UNISWAP_ROUTER, swapAmount);
        
        // Calculate minimum amount out with 5% slippage
        // At $1,600/ETH, 5,000 USDC ≈ 3.125 ETH
        // Being conservative with 10% slippage
        uint256 minAmountOut = 2.8 ether;
        
        // Log before swap
        console.log("Swapping", swapAmount);
        console.log("USDC for at least", minAmountOut, "WETH");
        
        // Perform swap
        try ISwapRouter(UNISWAP_ROUTER).exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: USDC,
                tokenOut: WETH,
                fee: FEE_MEDIUM,
                recipient: USDC_WHALE,
                deadline: block.timestamp + 300,
                amountIn: swapAmount,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0
            })
        ) returns (uint256 amountOut) {
            // Final balances
            uint256 finalUSDC = IERC20(USDC).balanceOf(USDC_WHALE);
            uint256 finalWETH = IERC20(WETH).balanceOf(USDC_WHALE);
            
            console.log("Final USDC balance:", finalUSDC);
            console.log("Final WETH balance:", finalWETH);
            console.log("WETH received:", amountOut);
            
            // Verify swap
            assertEq(initialUSDC - finalUSDC, swapAmount, "USDC amount not deducted correctly");
            assertEq(finalWETH - initialWETH, amountOut, "WETH amount not received correctly");
            assertGe(amountOut, minAmountOut, "Received less than minimum amount");
        } catch Error(string memory reason) {
            console.log("Swap failed with reason:", reason);
            console.log("Swap failed");
        } catch (bytes memory) {
            console.log("Swap failed with unknown error");
        }
        
        vm.stopPrank();
    }
}