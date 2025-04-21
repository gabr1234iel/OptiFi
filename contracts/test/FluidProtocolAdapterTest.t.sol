// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/adapters/FluidProtocolAdapter.sol";
import "../src/interfaces/IProtocolAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FluidProtocolAdapterTest is Test {
    FluidProtocolAdapter adapter;
    
    // Known token addresses on mainnet
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address constant WSTETH = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;
    
    // Fluid Protocol fToken addresses
    address constant FUSDC = 0x9Fb7b4477576Fe5B32be4C1843aFB1e55F251B33;
    address constant FUSDT = 0x5C20B550819128074FD538Edf79791733ccEdd18; 
    address constant FWSTETH = 0x2411802D8BEA09be0aF8fD8D08314a63e706b29C;
    
    // Whale addresses with lots of tokens for testing
    address constant USDC_WHALE = 0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341;
    address constant USDT_WHALE = 0x5754284f345afc66a98fbB0a0Afe71e0F007B949;
    address constant WSTETH_WHALE = 0x5fEC2f34D80ED82370F733043B6A536d7e9D7f8d;
    
    
    function setUp() public {
        // Create a fork of mainnet
        vm.createSelectFork("http://localhost:8545");
        
        // Deploy the adapter
        adapter = new FluidProtocolAdapter();
        
        // Make sure the tokens are set up correctly
        assertEq(adapter.fTokens(USDC), FUSDC, "USDC -> fUSDC mapping incorrect");
        assertEq(adapter.fTokens(USDT), FUSDT, "USDT -> fUSDT mapping incorrect");
        assertEq(adapter.fTokens(WSTETH), FWSTETH, "WSTETH -> fWSTETH mapping incorrect");
    }
    
    function test_AddSupportedToken() public {
        // Add a new token mapping
        address mockToken = makeAddr("mockToken");
        address mockFToken = makeAddr("mockFToken");
        
        // Mock the fToken.asset() call
        vm.mockCall(
            mockFToken,
            abi.encodeWithSelector(IFToken.asset.selector),
            abi.encode(mockToken)
        );
        
        adapter.addSupportedToken(mockToken, mockFToken);
        assertEq(adapter.fTokens(mockToken), mockFToken, "Token mapping not added correctly");
    }
    
    function test_RemoveSupportedToken() public {
        // Remove an existing token mapping
        adapter.removeSupportedToken(USDC);
        assertEq(adapter.fTokens(USDC), address(0), "Token mapping not removed correctly");
    }
    
    function test_Deposit_USDC() public {
        uint256 depositAmount = 1000 * 10**6; // 1000 USDC
        
        // Get some USDC from a whale
        deal(USDC, address(this), depositAmount);
        
        // Approve the adapter to spend our USDC
        IERC20(USDC).approve(address(adapter), depositAmount);
        
        // Initial balances
        uint256 initialAdapterBalance = adapter.getBalance(USDC);
        uint256 initialTokenBalance = IERC20(USDC).balanceOf(address(this));
        
        // Deposit into Fluid Protocol
        adapter.deposit(USDC, depositAmount);
        
        // Check final balances
        uint256 finalAdapterBalance = adapter.getBalance(USDC);
        uint256 finalTokenBalance = IERC20(USDC).balanceOf(address(this));
        
        // Verify the deposit
        assertEq(finalTokenBalance, initialTokenBalance - depositAmount, "USDC not transferred from user");
        assertGe(finalAdapterBalance, initialAdapterBalance, "Adapter balance did not increase");
        
        // The exact amount might differ slightly due to rounding in the protocol
        uint256 balanceDifference = finalAdapterBalance - initialAdapterBalance;
        assertApproxEqRel(balanceDifference, depositAmount, 0.01e18, "Deposit amount not reflected in balance");
    }
    
    function test_Withdraw_USDC() public {
        uint256 depositAmount = 1000 * 10**6; // 1000 USDC
        
        // First deposit some USDC
        deal(USDC, address(this), depositAmount);
        IERC20(USDC).approve(address(adapter), depositAmount);
        adapter.deposit(USDC, depositAmount);
        
        // Initial balances before withdrawal
        uint256 initialAdapterBalance = adapter.getBalance(USDC);
        uint256 initialTokenBalance = IERC20(USDC).balanceOf(address(this));
        
        // Withdraw from Fluid Protocol
        uint256 withdrawnAmount = adapter.withdraw(USDC);
        
        // Check final balances
        uint256 finalAdapterBalance = adapter.getBalance(USDC);
        uint256 finalTokenBalance = IERC20(USDC).balanceOf(address(this));
        
        // Verify the withdrawal
        assertEq(finalTokenBalance, initialTokenBalance + withdrawnAmount, "Withdrawn USDC not received");
        assertLe(finalAdapterBalance, initialAdapterBalance, "Adapter balance did not decrease");
        
        // The exact amount might differ slightly due to rounding or fees in the protocol
        assertGt(withdrawnAmount, 0, "No tokens were withdrawn");
        assertApproxEqRel(withdrawnAmount, initialAdapterBalance, 0.01e18, "Didn't withdraw approximately the full balance");
    }
    
    function test_GetAPY_USDC() public {
        // Check if the APY function returns a reasonable value
        uint256 apy = adapter.getAPY(USDC);
        
        // APY should be non-negative and reasonable for a stablecoin (likely in the range of 0-10%)
        assertGe(apy, 0, "APY should not be negative");
        assertLe(apy, 1000, "APY is unreasonably high (>10%)");
    }
    
    function test_GetBalance() public {
        // Initially balance should be 0
        assertEq(adapter.getBalance(USDC), 0, "Initial balance should be 0");
        
        // Deposit some tokens
        uint256 depositAmount = 1000 * 10**6; // 1000 USDC
        deal(USDC, address(this), depositAmount);
        IERC20(USDC).approve(address(adapter), depositAmount);
        adapter.deposit(USDC, depositAmount);
        
        // Check balance after deposit
        uint256 balance = adapter.getBalance(USDC);
        assertGt(balance, 0, "Balance should be positive after deposit");
        assertApproxEqRel(balance, depositAmount, 0.01e18, "Balance should be approximately equal to deposit amount");
    }
    
    function test_Rescue() public {
        // Send some tokens directly to the adapter without using the deposit function
        uint256 rescueAmount = 500 * 10**6; // 500 USDC
        deal(USDC, address(adapter), rescueAmount);
        
        // Initial balance of the recipient
        address recipient = makeAddr("recipient");
        uint256 initialRecipientBalance = IERC20(USDC).balanceOf(recipient);
        
        // Rescue the tokens
        adapter.rescue(USDC, recipient, rescueAmount);
        
        // Check final balance
        uint256 finalRecipientBalance = IERC20(USDC).balanceOf(recipient);
        assertEq(finalRecipientBalance, initialRecipientBalance + rescueAmount, "Tokens not rescued correctly");
    }
    
    
    // Receive function to handle ETH transfers
    receive() external payable {}
}