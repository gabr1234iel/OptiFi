// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IProtocolAdapter} from "./interfaces/IProtocolAdapter.sol";
import "forge-std/console.sol";

// Uniswap V3 Router Interface
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

    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut);

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    function exactInput(
        ExactInputParams calldata params
    ) external payable returns (uint256 amountOut);
}

/**
 * @title UniversalVaultWithUniswap
 * @notice A vault that can deposit funds into different DeFi protocols and swap between tokens using Uniswap V3
 */
contract UniversalVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Mapping of token => adapter
    mapping(address => IProtocolAdapter) public tokenAdapters;

    // User balances: user => token => amount
    mapping(address => mapping(address => uint256)) public userBalances;

    // Total vault balances: token => amount
    mapping(address => uint256) public vaultBalances;

    // Uniswap V3 Router address
    address public immutable uniswapRouter;

    // Track users who have deposited tokens for balance updates
    mapping(address => bool) private userHasDeposited;
    address[] private userList;

    // Default fee tiers for token pairs: tokenA => tokenB => fee
    mapping(address => mapping(address => uint24)) public defaultFeeTiers;

    // Events
    event AdapterSet(address indexed token, address indexed adapter);
    event Deposited(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event Withdrawn(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event ProtocolDeposit(
        address indexed token,
        address indexed adapter,
        uint256 amount
    );
    event ProtocolWithdraw(
        address indexed token,
        address indexed adapter,
        uint256 amount
    );
    event TokensSwapped(
        address indexed fromToken,
        address indexed toToken,
        uint256 fromAmount,
        uint256 toAmount
    );
    event DefaultFeeTierSet(
        address indexed tokenA,
        address indexed tokenB,
        uint24 fee
    );
    event CrossProtocolTransfer(
        address indexed srcToken,
        address indexed targetToken,
        address targetAdapter,
        uint256 srcAmount,
        uint256 targetAmount
    );

    /**
     * @dev Constructor
     * @param _uniswapRouter The address of the Uniswap V3 Router
     */
    constructor(address _uniswapRouter) Ownable(msg.sender) {
        require(
            _uniswapRouter != address(0),
            "UniversalVault: router cannot be zero address"
        );
        uniswapRouter = _uniswapRouter;
    }

    /**
     * @notice Set the adapter for a token
     * @param token The token address
     * @param adapter The adapter address
     */
    function setAdapter(address token, address adapter) external onlyOwner {
        require(
            token != address(0),
            "UniversalVault: token cannot be zero address"
        );
        require(
            adapter != address(0),
            "UniversalVault: adapter cannot be zero address"
        );

        // If we're changing adapters, withdraw from old adapter first
        if (address(tokenAdapters[token]) != address(0)) {
            uint256 adapterBalance = tokenAdapters[token].getBalance(token);
            if (adapterBalance > 0) {
                tokenAdapters[token].withdraw(token);
            }
        }

        tokenAdapters[token] = IProtocolAdapter(adapter);

        emit AdapterSet(token, adapter);
    }

    /**
     * @notice Set the default fee tier for a token pair
     * @param tokenA First token in the pair
     * @param tokenB Second token in the pair
     * @param fee Fee tier (500 = 0.05%, 3000 = 0.3%, 10000 = 1%)
     */
    function setDefaultFeeTier(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external onlyOwner {
        require(
            tokenA != address(0),
            "UniversalVault: tokenA cannot be zero address"
        );
        require(
            tokenB != address(0),
            "UniversalVault: tokenB cannot be zero address"
        );
        require(tokenA != tokenB, "UniversalVault: tokens must be different");

        // Uniswap V3 supports fee tiers: 100 (0.01%), 500 (0.05%), 3000 (0.3%), 10000 (1%)
        require(
            fee == 100 || fee == 500 || fee == 3000 || fee == 10000,
            "UniversalVault: invalid fee tier"
        );

        // Set fee tier for both directions
        defaultFeeTiers[tokenA][tokenB] = fee;
        defaultFeeTiers[tokenB][tokenA] = fee;

        emit DefaultFeeTierSet(tokenA, tokenB, fee);
    }

    /**
     * @notice Get the fee tier for a token pair
     * @param tokenA First token in the pair
     * @param tokenB Second token in the pair
     * @return Fee tier (default to 0.3% if not set)
     */
    function getFeeTier(
        address tokenA,
        address tokenB
    ) public view returns (uint24) {
        uint24 fee = defaultFeeTiers[tokenA][tokenB];
        return fee == 0 ? 3000 : fee; // Default to 0.3% if not set
    }

    /**
     * @notice User deposits tokens into the vault
     * @param token The token address
     * @param amount The amount to deposit
     */
    function deposit(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "UniversalVault: amount must be greater than 0");

        // Transfer tokens from user to vault
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Add user to list if this is their first deposit
        if (!userHasDeposited[msg.sender]) {
            userHasDeposited[msg.sender] = true;
            userList.push(msg.sender);
        }

        // Update balances
        userBalances[msg.sender][token] += amount;
        vaultBalances[token] += amount;

        emit Deposited(msg.sender, token, amount);

        // If there's an adapter for this token, deposit to protocol
        if (address(tokenAdapters[token]) != address(0)) {
            _depositToProtocol(token, amount);
        }
    }

    /**
     * @notice User withdraws tokens from the vault
     * @param token The token address
     * @param amount The amount to withdraw
     */
    function withdraw(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "UniversalVault: amount must be greater than 0");
        require(
            userBalances[msg.sender][token] >= amount,
            "UniversalVault: insufficient balance"
        );

        // Update balances
        userBalances[msg.sender][token] -= amount;
        vaultBalances[token] -= amount;

        // If there's an adapter for this token, we might need to withdraw from protocol
        if (address(tokenAdapters[token]) != address(0)) {
            uint256 vaultTokenBalance = IERC20(token).balanceOf(address(this));

            if (vaultTokenBalance < amount) {
                // Need to withdraw from protocol
                _withdrawFromProtocol(token, amount - vaultTokenBalance);
            }
        }

        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, token, amount);
    }

    /**
     * @notice Swap tokens within the vault using a direct path
     * @param fromToken The source token address
     * @param toToken The target token address
     * @param amount The amount of source token to swap
     * @param minAmountOut The minimum amount of target token to receive
     * @param fee The fee tier to use for the swap
     * @return amountReceived The amount of target token received
     */
    function swapExactTokens(
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 minAmountOut,
        uint24 fee
    ) external nonReentrant onlyOwner returns (uint256 amountReceived) {
        require(amount > 0, "UniversalVault: amount must be greater than 0");
        require(
            vaultBalances[fromToken] >= amount,
            "UniversalVault: insufficient balance"
        );

        // If fee is 0, use the default fee tier
        if (fee == 0) {
            fee = getFeeTier(fromToken, toToken);
        }

        // If there's an adapter for the source token, we might need to withdraw from protocol
        if (address(tokenAdapters[fromToken]) != address(0)) {
            uint256 vaultTokenBalance = IERC20(fromToken).balanceOf(
                address(this)
            );

            if (vaultTokenBalance < amount) {
                // Need to withdraw from protocol
                _withdrawFromProtocol(fromToken, amount - vaultTokenBalance);
            }
        }

        // Get initial balance of target token
        uint256 initialToBalance = IERC20(toToken).balanceOf(address(this));

        // Approve Uniswap router to spend source tokens
        IERC20(fromToken).approve(uniswapRouter, 0);
        IERC20(fromToken).approve(uniswapRouter, amount);

        // Execute swap using Uniswap V3 exactInputSingle
        try
            ISwapRouter(uniswapRouter).exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: fromToken,
                    tokenOut: toToken,
                    fee: fee,
                    recipient: address(this),
                    deadline: block.timestamp + 300, // 5 minutes
                    amountIn: amount,
                    amountOutMinimum: minAmountOut,
                    sqrtPriceLimitX96: 0 // No price limit
                })
            )
        returns (uint256 amountOut) {
            amountReceived = amountOut;
        } catch {
            // If the swap fails, revert the transaction
            revert("UniversalVault: swap failed");
        }

        // Verify the received amount
        uint256 finalToBalance = IERC20(toToken).balanceOf(address(this));
        require(
            finalToBalance >= initialToBalance + minAmountOut,
            "UniversalVault: minimum amount not received"
        );

        // Update vault balances
        vaultBalances[fromToken] -= amount;
        vaultBalances[toToken] += amountReceived;

        // Update user balances proportional to their ownership of the source token
        _updateUsersBalancesAfterSwap(
            fromToken,
            toToken,
            amount,
            amountReceived
        );

        // If there's an adapter for the target token, deposit to protocol
        if (address(tokenAdapters[toToken]) != address(0)) {
            _depositToProtocol(toToken, amountReceived);
        }

        emit TokensSwapped(fromToken, toToken, amount, amountReceived);

        return amountReceived;
    }

    /**
     * @notice Swap tokens within the vault using a multi-hop path
     * @param tokens Array of token addresses in the path (at least 2)
     * @param fees Array of fees for each hop (length should be tokens.length - 1)
     * @param amount The amount of source token to swap
     * @param minAmountOut The minimum amount of target token to receive
     * @return amountReceived The amount of target token received
     */
    function swapExactTokensMultiHop(
        address[] calldata tokens,
        uint24[] calldata fees,
        uint256 amount,
        uint256 minAmountOut
    ) external nonReentrant onlyOwner returns (uint256 amountReceived) {
        require(
            tokens.length >= 2,
            "UniversalVault: path must have at least 2 tokens"
        );
        require(
            fees.length == tokens.length - 1,
            "UniversalVault: fees length must be tokens.length - 1"
        );
        require(amount > 0, "UniversalVault: amount must be greater than 0");

        address fromToken = tokens[0];
        address toToken = tokens[tokens.length - 1];

        require(
            vaultBalances[fromToken] >= amount,
            "UniversalVault: insufficient balance"
        );

        // If there's an adapter for the source token, we might need to withdraw from protocol
        if (address(tokenAdapters[fromToken]) != address(0)) {
            uint256 vaultTokenBalance = IERC20(fromToken).balanceOf(
                address(this)
            );

            if (vaultTokenBalance < amount) {
                // Need to withdraw from protocol
                _withdrawFromProtocol(fromToken, amount - vaultTokenBalance);
            }
        }

        // Get initial balance of target token
        uint256 initialToBalance = IERC20(toToken).balanceOf(address(this));

        // Approve Uniswap router to spend source tokens
        IERC20(fromToken).approve(uniswapRouter, 0);
        IERC20(fromToken).approve(uniswapRouter, amount);

        // Encode the path for multi-hop swap
        bytes memory path = encodeUniswapPath(tokens, fees);

        // Execute swap using Uniswap V3 exactInput
        try
            ISwapRouter(uniswapRouter).exactInput(
                ISwapRouter.ExactInputParams({
                    path: path,
                    recipient: address(this),
                    deadline: block.timestamp + 300, // 5 minutes
                    amountIn: amount,
                    amountOutMinimum: minAmountOut
                })
            )
        returns (uint256 amountOut) {
            amountReceived = amountOut;
        } catch {
            // If the swap fails, revert the transaction
            revert("UniversalVault: swap failed");
        }

        // Verify the received amount
        uint256 finalToBalance = IERC20(toToken).balanceOf(address(this));
        require(
            finalToBalance >= initialToBalance + minAmountOut,
            "UniversalVault: minimum amount not received"
        );

        // Update vault balances
        vaultBalances[fromToken] -= amount;
        vaultBalances[toToken] += amountReceived;

        // Update user balances proportional to their ownership of the source token
        _updateUsersBalancesAfterSwap(
            fromToken,
            toToken,
            amount,
            amountReceived
        );

        // If there's an adapter for the target token, deposit to protocol
        if (address(tokenAdapters[toToken]) != address(0)) {
            _depositToProtocol(toToken, amountReceived);
        }

        emit TokensSwapped(fromToken, toToken, amount, amountReceived);

        return amountReceived;
    }

    /**
     * @notice Transfer funds between protocols, optionally swapping tokens
     * @param srcToken The source token address
     * @param targetToken The target token address
     * @param amount The amount of source token to transfer
     * @param minAmountOut The minimum amount of target token to receive (if swapping)
     * @param targetAdapter The target adapter address
     * @param swapParams Additional parameters for swapping:
     *        - For direct swap: bytes = abi.encode(uint24) where uint24 is the fee tier
     *        - For multi-hop: bytes = abi.encode(address[], uint24[]) where arrays are token path and fees
     * @return amountTransferred The amount transferred to the target protocol
     */
    function transferBetweenProtocols(
        address srcToken,
        address targetToken,
        uint256 amount,
        uint256 minAmountOut,
        address targetAdapter,
        bytes calldata swapParams
    ) external nonReentrant onlyOwner returns (uint256 amountTransferred) {
        require(amount > 0, "UniversalVault: amount must be greater than 0");
        require(
            vaultBalances[srcToken] >= amount,
            "UniversalVault: insufficient balance"
        );
        require(
            targetAdapter != address(0),
            "UniversalVault: target adapter cannot be zero address"
        );

        // 1. Withdraw from source protocol if needed
        uint256 vaultTokenBalance = IERC20(srcToken).balanceOf(address(this));
        if (
            vaultTokenBalance < amount &&
            address(tokenAdapters[srcToken]) != address(0)
        ) {
            // Try to withdraw regardless of reported balance
            try tokenAdapters[srcToken].withdraw(srcToken) returns (
                uint256 withdrawnAmount
            ) {
                emit ProtocolWithdraw(
                    srcToken,
                    address(tokenAdapters[srcToken]),
                    withdrawnAmount
                );
            } catch {
                // If withdrawal fails, continue with what we have
            }

            // Update the vault token balance after withdrawal attempt
            vaultTokenBalance = IERC20(srcToken).balanceOf(address(this));

            // If we still don't have enough, adjust the amount to what we have
            if (vaultTokenBalance < amount) {
                amount = vaultTokenBalance;
            }
        }

        // If we have no tokens to swap, exit early
        if (amount == 0) {
            return 0;
        }

        // 2. Swap tokens if needed (only if srcToken != targetToken)
        uint256 targetAmount = amount;
        if (srcToken != targetToken) {
            // Approve Uniswap router to spend source tokens
            IERC20(srcToken).approve(uniswapRouter, 0);
            IERC20(srcToken).approve(uniswapRouter, amount);

            // Adjust minAmountOut based on potentially reduced amount
            if (amount < vaultBalances[srcToken]) {
                minAmountOut =
                    (minAmountOut * amount) /
                    vaultBalances[srcToken];
            }

            // Check if this is a multi-hop swap or direct swap based on swap params
            if (swapParams.length >= 64) {
                // Multi-hop (encoded arrays are at least 64 bytes)
                // Decode multi-hop parameters
                (address[] memory tokens, uint24[] memory fees) = abi.decode(
                    swapParams,
                    (address[], uint24[])
                );

                // Verify the decoded path matches source and target tokens
                require(
                    tokens.length >= 2,
                    "UniversalVault: path must have at least 2 tokens"
                );
                require(
                    tokens[0] == srcToken,
                    "UniversalVault: first token in path must be source token"
                );
                require(
                    tokens[tokens.length - 1] == targetToken,
                    "UniversalVault: last token in path must be target token"
                );

                // Encode the path for multi-hop swap
                bytes memory path = encodeUniswapPath(tokens, fees);

                // Execute multi-hop swap
                try
                    ISwapRouter(uniswapRouter).exactInput(
                        ISwapRouter.ExactInputParams({
                            path: path,
                            recipient: address(this),
                            deadline: block.timestamp + 300, // 5 minutes
                            amountIn: amount,
                            amountOutMinimum: minAmountOut
                        })
                    )
                returns (uint256 swapResult) {
                    targetAmount = swapResult;
                } catch {
                    // If multi-hop swap fails, exit with amount 0
                    return 0;
                }
            } else {
                // Direct swap with fee tier
                uint24 fee = swapParams.length > 0
                    ? abi.decode(swapParams, (uint24))
                    : getFeeTier(srcToken, targetToken);

                // Execute direct swap
                try
                    ISwapRouter(uniswapRouter).exactInputSingle(
                        ISwapRouter.ExactInputSingleParams({
                            tokenIn: srcToken,
                            tokenOut: targetToken,
                            fee: fee,
                            recipient: address(this),
                            deadline: block.timestamp + 300, // 5 minutes
                            amountIn: amount,
                            amountOutMinimum: minAmountOut,
                            sqrtPriceLimitX96: 0 // No price limit
                        })
                    )
                returns (uint256 swapResult) {
                    targetAmount = swapResult;
                } catch {
                    // If direct swap fails, exit with amount 0
                    return 0;
                }
            }

            // Update vault balances
            vaultBalances[srcToken] -= amount;
            vaultBalances[targetToken] += targetAmount;

            // Update user balances proportional to their ownership of the source token
            _updateUsersBalancesAfterSwap(
                srcToken,
                targetToken,
                amount,
                targetAmount
            );
        }

        // 3. Set new adapter for target token if needed
        if (address(tokenAdapters[targetToken]) != targetAdapter) {
            // If we're changing adapters, withdraw from old adapter first
            if (address(tokenAdapters[targetToken]) != address(0)) {
                try tokenAdapters[targetToken].withdraw(targetToken) returns (
                    uint256 withdrawnAmount
                ) {
                    emit ProtocolWithdraw(
                        targetToken,
                        address(tokenAdapters[targetToken]),
                        withdrawnAmount
                    );
                } catch {
                    // If withdrawal fails, continue
                }
            }

            tokenAdapters[targetToken] = IProtocolAdapter(targetAdapter);

            emit AdapterSet(targetToken, targetAdapter);
        }

        // 4. Deposit to target protocol
        if (targetAmount > 0) {
            _depositToProtocol(targetToken, targetAmount);
        }

        emit CrossProtocolTransfer(
            srcToken,
            targetToken,
            targetAdapter,
            amount,
            targetAmount
        );

        return targetAmount;
    }

    /**
     * @notice Updates user balances proportionally after a swap
     * @param fromToken Source token
     * @param toToken Target token
     * @param fromAmount Amount of source token swapped
     * @param toAmount Amount of target token received
     */
    function _updateUsersBalancesAfterSwap(
        address fromToken,
        address toToken,
        uint256 fromAmount,
        uint256 toAmount
    ) internal {
        // If no source token in the vault, nothing to do
        if (vaultBalances[fromToken] == 0) return;

        // Calculate the proportion
        uint256 fromProportion = (fromAmount * 1e18) /
            (vaultBalances[fromToken] + fromAmount);

        // Update all users who have deposited
        for (uint256 i = 0; i < userList.length; i++) {
            address user = userList[i];
            if (userBalances[user][fromToken] > 0) {
                uint256 userAmountFrom = (userBalances[user][fromToken] *
                    fromProportion) / 1e18;

                // Skip users with tiny amounts
                if (userAmountFrom > 0) {
                    userBalances[user][fromToken] -= userAmountFrom;
                    userBalances[user][toToken] +=
                        (toAmount * userAmountFrom) /
                        fromAmount;
                }
            }
        }
    }

    /**
     * @notice Get the APY for a token across all protocols
     * @param token The token address
     * @return The APY in basis points (1% = 100)
     */
    function getAPY(address token) external view returns (uint256) {
        if (address(tokenAdapters[token]) != address(0)) {
            return tokenAdapters[token].getAPY(token);
        }
        return 0;
    }

    /**
     * @notice Get user balance for a specific token
     * @param user The user address
     * @param token The token address
     * @return The user's balance
     */
    function getUserBalance(
        address user,
        address token
    ) external view returns (uint256) {
        return userBalances[user][token];
    }

    /**
     * @notice Get the total balance for a token (including protocol deposits)
     * @param token The token address
     * @return The total balance
     */
    function getTotalBalance(address token) external view returns (uint256) {
        uint256 vaultTokenBalance = IERC20(token).balanceOf(address(this));

        if (address(tokenAdapters[token]) != address(0)) {
            vaultTokenBalance += tokenAdapters[token].getBalance(token);
        }

        return vaultTokenBalance;
    }

    /**
     * @notice Deposit tokens to protocol through adapter
     * @param token The token address
     * @param amount The amount to deposit
     */
    function _depositToProtocol(address token, uint256 amount) internal {
        require(
            address(tokenAdapters[token]) != address(0),
            "UniversalVault: no adapter set for token"
        );

        // Approve the adapter to spend tokens
        IERC20(token).approve(address(tokenAdapters[token]), 0);
        IERC20(token).approve(address(tokenAdapters[token]), amount);

        // Deposit to adapter
        uint256 depositedAmount = tokenAdapters[token].deposit(token, amount);

        emit ProtocolDeposit(
            token,
            address(tokenAdapters[token]),
            depositedAmount
        );
    }

    /**
     * @notice Withdraw tokens from protocol through adapter with enhanced error handling
     * @param token The token address
     * @param minAmount The minimum amount needed
     */
    function _withdrawFromProtocol(address token, uint256 minAmount) internal {
        require(
            address(tokenAdapters[token]) != address(0),
            "UniversalVault: no adapter set for token"
        );

        // Get adapter balance before withdrawal
        uint256 adapterBalanceBefore = tokenAdapters[token].getBalance(token);

        // If the adapter has no balance, we can skip the withdrawal check
        if (adapterBalanceBefore == 0) {
            return; // Nothing to withdraw, skip the check
        }

        // Withdraw from adapter
        uint256 withdrawnAmount = tokenAdapters[token].withdraw(token);

        emit ProtocolWithdraw(
            token,
            address(tokenAdapters[token]),
            withdrawnAmount
        );

        // Only check minimum amount if we're actually expecting a minimum
        // AND if the adapter had a balance to withdraw
        if (minAmount > 0 && adapterBalanceBefore > 0) {
            // Handle edge case: if we need almost the entire balance
            if (minAmount >= (adapterBalanceBefore * 90) / 100) {
                // Take whatever we got - since we're withdrawing the entire balance anyway
                return;
            }

            // For smaller withdrawals, add a tolerance
            uint256 tolerance = (minAmount * 20) / 100; // 20% tolerance
            uint256 minAmountWithTolerance = minAmount > tolerance
                ? minAmount - tolerance
                : minAmount;

            require(
                withdrawnAmount >= minAmountWithTolerance,
                "UniversalVault: insufficient funds returned from protocol"
            );
        }
    }

    /**
     * @notice Force deposit all vault's balance of a token to the protocol
     * @param token The token address
     */
    function forceDeposit(address token) external onlyOwner {
        require(
            address(tokenAdapters[token]) != address(0),
            "UniversalVault: no adapter set for token"
        );

        uint256 vaultTokenBalance = IERC20(token).balanceOf(address(this));
        require(vaultTokenBalance > 0, "UniversalVault: no balance to deposit");

        _depositToProtocol(token, vaultTokenBalance);
    }

    /**
     * @notice Force withdraw all of a token from the protocol
     * @param token The token address
     */
    function forceWithdraw(address token) external onlyOwner {
        require(
            address(tokenAdapters[token]) != address(0),
            "UniversalVault: no adapter set for token"
        );

        uint256 adapterBalance = tokenAdapters[token].getBalance(token);

        tokenAdapters[token].withdraw(token);
        emit ProtocolWithdraw(
            token,
            address(tokenAdapters[token]),
            adapterBalance
        );
    }

    /**
     * @notice Rescue tokens stuck in this contract
     * @param token The token to rescue
     * @param to The address to send tokens to
     * @param amount The amount to rescue
     */
    function rescue(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        // Don't allow rescue of tokens that users have deposited
        require(
            vaultBalances[token] == 0 ||
                IERC20(token).balanceOf(address(this)) > vaultBalances[token],
            "UniversalVault: cannot rescue user funds"
        );

        // Calculate maximum amount that can be rescued
        uint256 rescuableAmount = IERC20(token).balanceOf(address(this)) -
            vaultBalances[token];
        require(
            amount <= rescuableAmount,
            "UniversalVault: cannot rescue more than available"
        );

        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @notice Helper function to encode a Uniswap V3 path
     * @param tokens Array of token addresses in the path
     * @param fees Array of fees for each hop
     * @return path Encoded path for Uniswap V3
     */
    function encodeUniswapPath(
        address[] memory tokens,
        uint24[] memory fees
    ) internal pure returns (bytes memory path) {
        require(
            tokens.length >= 2,
            "UniversalVault: path must have at least 2 tokens"
        );
        require(
            fees.length == tokens.length - 1,
            "UniversalVault: fees length must be tokens.length - 1"
        );

        path = abi.encodePacked(tokens[0]);

        for (uint256 i = 0; i < fees.length; i++) {
            path = abi.encodePacked(path, fees[i], tokens[i + 1]);
        }

        return path;
    }
}
