// script/GetTokens.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWETH {
    function deposit() external payable;
    function withdraw(uint) external;
}

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

contract GetTokensScript is Script {
    // Token addresses
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    // Uniswap V3 Router
    address constant SWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    
    function run() external {
        // Use private key from environment or default anvil key
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address userAddress = vm.addr(privateKey);
        
        console.log("Using account:", userAddress);
        
        vm.startBroadcast(privateKey);
        
        // 1. Get ETH balance
        uint256 ethBalance = userAddress.balance;
        console.log("Initial ETH balance:", ethBalance / 1e18, "ETH");
        
        // 2. Wrap 5 ETH to WETH
        uint256 wethAmount = 5 ether;
        IWETH(WETH).deposit{value: wethAmount}();
        console.log("Wrapped", wethAmount / 1e18, "ETH to WETH");
        
        // 3. Approve Uniswap to spend our WETH
        IERC20(WETH).approve(SWAP_ROUTER, 2 ether);
        
        // 4. Swap 2 WETH for USDC using Uniswap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH,
            tokenOut: USDC,
            fee: 500, // 0.05% fee tier
            recipient: userAddress,
            deadline: block.timestamp + 1800, // 30 minutes
            amountIn: 2 ether,
            amountOutMinimum: 0, // No min output - we're in a test environment
            sqrtPriceLimitX96: 0
        });
        
        // Perform the swap
        uint256 amountOut = ISwapRouter(SWAP_ROUTER).exactInputSingle(params);
        
        // 5. Log final balances
        console.log("Final ETH balance:", userAddress.balance / 1e18, "ETH");
        console.log("Final WETH balance:", IERC20(WETH).balanceOf(userAddress) / 1e18, "WETH");
        console.log("Final USDC balance:", IERC20(USDC).balanceOf(userAddress) / 1e6, "USDC");
        console.log("Received USDC:", amountOut / 1e6, "USDC");
        
        vm.stopBroadcast();
    }
}