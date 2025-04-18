// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAaveV2Pool.sol";
import "./interfaces/IAaveV3Pool.sol";
import "./interfaces/IMorphoBlue.sol";
import "./interfaces/ISwapRouter.sol";
import "./AaveVault.sol";

/**
 * @title UniversalVault
 * @notice A vault that can deposit into different protocols (Aave, Morpho Blue) with token swapping capability
 */
contract UniversalVault is Ownable {
    using SafeERC20 for IERC20;

    // Uniswap Universal Router
    address public immutable swapRouter;
    
    // Aave Vault v2 and v3 contracts
    AaveVault public immutable aaveVaultV2;
    AaveVault public immutable aaveVaultV3;
    
    // Morpho Blue main contract
    address public immutable morphoBlue;
    
    // Protocol identifiers
    enum Protocol { AAVE_V2, AAVE_V3, MORPHO_BLUE }
    
    // Pool information mapping
    struct PoolInfo {
        address poolAddress;
        address underlyingToken;
        bytes4 depositFunction;
        bytes4 withdrawFunction;
        Protocol protocol;
        // Morpho specific parameters
        address loanToken;
        address collateralToken;
        address oracle;
        address irm;
        uint256 lltv;
    }
    
    // Mapping from pool name to pool info
    mapping(string => PoolInfo) public pools;
    
    // Array of supported pool names
    string[] public poolNames;
    
    // Events
    event PoolAdded(string name, address poolAddress, address underlyingToken, Protocol protocol);
    event Deposited(string poolName, address token, uint256 amount, address user);
    event Withdrawn(string poolName, address token, uint256 amount, address user);
    event TokenSwapped(address fromToken, address toToken, uint256 amountIn, uint256 amountOut);
    event DebugInfo(string poolName, address poolAddress, address token, uint256 amount);

     /**
     * @dev Constructor
     * @param _swapRouter Address of the Uniswap Universal Router
     * @param _aaveVaultV2 Address of the AaveVault V2 contract
     * @param _aaveVaultV3 Address of the AaveVault V3 contract
     * @param _morphoBlue Address of the Morpho Blue contract
     */
    constructor(
        address _swapRouter, 
        address _aaveVaultV2,
        address _aaveVaultV3,
        address _morphoBlue
    ) Ownable(msg.sender) {
        require(_swapRouter != address(0), "Invalid swap router address");
        require(_aaveVaultV2 != address(0), "Invalid Aave V2 vault address");
        require(_aaveVaultV3 != address(0), "Invalid Aave V3 vault address");
        require(_morphoBlue != address(0), "Invalid Morpho Blue address");
        
        swapRouter = _swapRouter;
        aaveVaultV2 = AaveVault(_aaveVaultV2);
        aaveVaultV3 = AaveVault(_aaveVaultV3);
        morphoBlue = _morphoBlue;
    }

    /**
     * @dev Add a new pool for Aave
     * @param name Name of the pool
     * @param poolAddress Address of the pool contract
     * @param underlyingToken Address of the underlying token
     * @param depositFunctionSig Deposit function signature
     * @param withdrawFunctionSig Withdraw function signature
     * @param protocol Protocol identifier (AAVE_V2 or AAVE_V3)
     */
    function addAavePool(
        string memory name,
        address poolAddress,
        address underlyingToken,
        bytes4 depositFunctionSig,
        bytes4 withdrawFunctionSig,
        Protocol protocol
    ) external onlyOwner {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(poolAddress != address(0), "Invalid pool address");
        require(underlyingToken != address(0), "Invalid token address");
        require(protocol == Protocol.AAVE_V2 || protocol == Protocol.AAVE_V3, "Invalid protocol for Aave");
        
        pools[name] = PoolInfo({
            poolAddress: poolAddress,
            underlyingToken: underlyingToken,
            depositFunction: depositFunctionSig,
            withdrawFunction: withdrawFunctionSig,
            protocol: protocol,
            loanToken: address(0),    // Not used for Aave
            collateralToken: address(0),
            oracle: address(0),
            irm: address(0),
            lltv: 0
        });
        
        poolNames.push(name);
        
        emit PoolAdded(name, poolAddress, underlyingToken, protocol);
    }

    /**
     * @dev Add a new pool for Morpho Blue
     * @param name Name of the pool
     * @param morphoMarketParams Morpho Blue market parameters
     * @param underlyingToken Address of the underlying token
     */
    function addMorphoBluePool(
        string memory name,
        IMorphoBlue.MarketParams memory morphoMarketParams,
        address underlyingToken
    ) external onlyOwner {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(morphoMarketParams.loanToken != address(0), "Invalid loan token");
        require(underlyingToken != address(0), "Invalid token address");
        
        pools[name] = PoolInfo({
            poolAddress: morphoBlue,  // Morpho Blue contract is always the same
            underlyingToken: underlyingToken,
            depositFunction: bytes4(0),  // Not used for Morpho
            withdrawFunction: bytes4(0), // Not used for Morpho
            protocol: Protocol.MORPHO_BLUE,
            loanToken: morphoMarketParams.loanToken,
            collateralToken: morphoMarketParams.collateralToken,
            oracle: morphoMarketParams.oracle,
            irm: morphoMarketParams.irm,
            lltv: morphoMarketParams.lltv
        });
        
        poolNames.push(name);
        
        emit PoolAdded(name, morphoBlue, underlyingToken, Protocol.MORPHO_BLUE);
    }

    /**
     * @dev Get all pool names
     * @return Array of pool names
     */
    function getAllPoolNames() external view returns (string[] memory) {
        return poolNames;
    }

    /**
     * @dev Get Morpho Blue market params for a pool
     * @param poolName Name of the pool
     * @return Market parameters for Morpho Blue
     */
    function getMorphoMarketParams(string memory poolName) public view returns (IMorphoBlue.MarketParams memory) {
        PoolInfo memory poolInfo = pools[poolName];
        require(poolInfo.protocol == Protocol.MORPHO_BLUE, "Not a Morpho Blue pool");
        
        return IMorphoBlue.MarketParams({
            loanToken: poolInfo.loanToken,
            collateralToken: poolInfo.collateralToken,
            oracle: poolInfo.oracle,
            irm: poolInfo.irm,
            lltv: poolInfo.lltv
        });
    }

    /**
     * @dev Swap tokens using Uniswap Universal Router
     * @param fromToken Source token address
     * @param toToken Destination token address
     * @param amountIn Amount of source tokens to swap
     * @param minAmountOut Minimum amount of destination tokens to receive
     * @param deadline Swap deadline timestamp
     * @return amountOut Amount of destination tokens received
     */
    function swapTokens(
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) public returns (uint256 amountOut) {
        require(fromToken != address(0), "Invalid source token");
        require(toToken != address(0), "Invalid destination token");
        require(amountIn > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Approve the router to use the tokens
        IERC20(fromToken).approve(swapRouter, amountIn);
        
        // Prepare the swap params
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: fromToken,
            tokenOut: toToken,
            fee: 3000, // 0.3% fee tier
            recipient: address(this),
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });
        
        // Execute the swap
        amountOut = ISwapRouter(swapRouter).exactInputSingle(params);
        
        emit TokenSwapped(fromToken, toToken, amountIn, amountOut);
        
        return amountOut;
    }

    /**
     * @dev Swap tokens via multiple pools using Uniswap Universal Router
     * @param path Encoded swap path
     * @param amountIn Amount of source tokens to swap
     * @param minAmountOut Minimum amount of destination tokens to receive
     * @param deadline Swap deadline timestamp
     * @return amountOut Amount of destination tokens received
     */
    function swapTokensMultihop(
        bytes memory path,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) public returns (uint256 amountOut) {
        require(path.length >= 40, "Invalid path"); // At least one hop (20 bytes + 20 bytes + fee)
        
        // Extract the first token from the path
        address fromToken;
        assembly {
            fromToken := mload(add(path, 20))
        }
        
        require(fromToken != address(0), "Invalid source token");
        require(amountIn > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Approve the router to use the tokens
        IERC20(fromToken).approve(swapRouter, amountIn);
        
        // Prepare the swap params
        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path: path,
            recipient: address(this),
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: minAmountOut
        });
        
        // Execute the swap
        amountOut = ISwapRouter(swapRouter).exactInput(params);
        
        // Extract the last token from the path
        address toToken;
        assembly {
            toToken := mload(add(path, sub(mload(path), 20)))
        }
        
        emit TokenSwapped(fromToken, toToken, amountIn, amountOut);
        
        return amountOut;
    }

    /**
     * @dev Deposit into an Aave pool
     * @param token Token address
     * @param amount Amount to deposit
     * @param aaveVersion Aave version (0 for V2, 1 for V3)
     */
    function depositToAave(address token, uint256 amount, uint8 aaveVersion) external {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Select the appropriate AaveVault
        AaveVault aaveVault = aaveVersion == 0 ? aaveVaultV2 : aaveVaultV3;
        
        // Check if token is supported in the selected AaveVault
        address aToken = aaveVault.aTokens(token);
        require(aToken != address(0), "Token not supported in AaveVault");
        
        // Transfer tokens from user to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve AaveVault to use the tokens
        IERC20(token).approve(address(aaveVault), amount);
        
        // Deposit to AaveVault
        try aaveVault.deposit(token, amount) {
            emit Deposited(aaveVersion == 0 ? "aave_v2" : "aave_v3", token, amount, msg.sender);
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("AaveVault deposit failed: ", reason)));
        }
    }

    /**
     * @dev Withdraw from an Aave pool
     * @param token Token address
     * @param amount Amount to withdraw
     * @param aaveVersion Aave version (0 for V2, 1 for V3)
     */
    function withdrawFromAave(address token, uint256 amount, uint8 aaveVersion) external {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Select the appropriate AaveVault
        AaveVault aaveVault = aaveVersion == 0 ? aaveVaultV2 : aaveVaultV3;
        
        // Withdraw from AaveVault
        aaveVault.withdraw(token, amount);
        
        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Withdrawn(aaveVersion == 0 ? "aave_v2" : "aave_v3", token, amount, msg.sender);
    }

    /**
     * @dev Deposit into a specific pool by name
     * @param poolName Name of the pool
     * @param amount Amount to deposit
     */
    function depositToPool(string memory poolName, uint256 amount) external {
        PoolInfo memory poolInfo = pools[poolName];
        require(poolInfo.poolAddress != address(0), "Pool not found");
        require(amount > 0, "Amount must be greater than 0");
        
        address token = poolInfo.underlyingToken;
        
        // Transfer tokens from user to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Route the deposit based on protocol
        if (poolInfo.protocol == Protocol.AAVE_V2) {
            // Deposit to Aave V2
            IERC20(token).approve(address(aaveVaultV2), amount);
            try aaveVaultV2.deposit(token, amount) {
                emit Deposited(poolName, token, amount, msg.sender);
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("AaveV2 deposit failed: ", reason)));
            }
        } else if (poolInfo.protocol == Protocol.AAVE_V3) {
            // Deposit to Aave V3
            IERC20(token).approve(address(aaveVaultV3), amount);
            try aaveVaultV3.deposit(token, amount) {
                emit Deposited(poolName, token, amount, msg.sender);
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("AaveV3 deposit failed: ", reason)));
            }
        } else if (poolInfo.protocol == Protocol.MORPHO_BLUE) {
            // Deposit to Morpho Blue
            depositToMorphoBlue(poolName, amount);
        }
    }

    /**
     * @dev Deposit into a Morpho Blue pool
     * @param poolName Name of the pool
     * @param amount Amount to deposit
     */
    function depositToMorphoBlue(string memory poolName, uint256 amount) public {
        PoolInfo memory poolInfo = pools[poolName];
        require(poolInfo.poolAddress != address(0), "Pool not found");
        require(poolInfo.protocol == Protocol.MORPHO_BLUE, "Not a Morpho Blue pool");
        require(amount > 0, "Amount must be greater than 0");
        
        address token = poolInfo.underlyingToken;
        
        // Add debug info
        emit DebugInfo(poolName, poolInfo.poolAddress, token, amount);
        
        // If called directly from external, transfer tokens
        if (msg.sender != address(this)) {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        // Approve Morpho Blue to use the tokens
        IERC20(token).approve(morphoBlue, amount);
        
        // Get the market params for Morpho Blue
        IMorphoBlue.MarketParams memory marketParams = getMorphoMarketParams(poolName);
        
        // Call the deposit function based on token type
        if (token == marketParams.loanToken) {
            // Loan token deposit (supply)
            try IMorphoBlue(morphoBlue).supply(
                marketParams,
                amount,    // assets
                0,         // shares (0 means use assets)
                address(this),  // onBehalf
                ""         // data
            ) returns (uint256 assetsSupplied, uint256 sharesSupplied) {
                emit Deposited(poolName, token, assetsSupplied, msg.sender != address(this) ? msg.sender : address(this));
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("Morpho supply failed: ", reason)));
            } catch {
                revert("Morpho supply failed");
            }
        } else if (token == marketParams.collateralToken) {
            // Collateral token deposit
            try IMorphoBlue(morphoBlue).supplyCollateral(
                marketParams,
                amount,    // assets
                address(this),  // onBehalf
                ""         // data
            ) {
                emit Deposited(poolName, token, amount, msg.sender != address(this) ? msg.sender : address(this));
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("Morpho supplyCollateral failed: ", reason)));
            } catch {
                revert("Morpho supplyCollateral failed");
            }
        } else {
            revert("Token not matching loan or collateral token");
        }
    }

    /**
     * @dev Withdraw from a specific pool by name
     * @param poolName Name of the pool
     * @param amount Amount to withdraw
     */
    function withdrawFromPool(string memory poolName, uint256 amount) external {
        PoolInfo memory poolInfo = pools[poolName];
        require(poolInfo.poolAddress != address(0), "Pool not found");
        require(amount > 0, "Amount must be greater than 0");
        
        // Route the withdrawal based on protocol
        if (poolInfo.protocol == Protocol.AAVE_V2) {
            // Withdraw from Aave V2
            aaveVaultV2.withdraw(poolInfo.underlyingToken, amount);
            IERC20(poolInfo.underlyingToken).safeTransfer(msg.sender, amount);
            emit Withdrawn(poolName, poolInfo.underlyingToken, amount, msg.sender);
        } else if (poolInfo.protocol == Protocol.AAVE_V3) {
            // Withdraw from Aave V3
            aaveVaultV3.withdraw(poolInfo.underlyingToken, amount);
            IERC20(poolInfo.underlyingToken).safeTransfer(msg.sender, amount);
            emit Withdrawn(poolName, poolInfo.underlyingToken, amount, msg.sender);
        } else if (poolInfo.protocol == Protocol.MORPHO_BLUE) {
            // Withdraw from Morpho Blue
            withdrawFromMorphoBlue(poolName, amount);
        }
    }

    /**
     * @dev Withdraw from a Morpho Blue pool
     * @param poolName Name of the pool
     * @param amount Amount to withdraw
     */
    function withdrawFromMorphoBlue(string memory poolName, uint256 amount) public {
        PoolInfo memory poolInfo = pools[poolName];
        require(poolInfo.poolAddress != address(0), "Pool not found");
        require(poolInfo.protocol == Protocol.MORPHO_BLUE, "Not a Morpho Blue pool");
        require(amount > 0, "Amount must be greater than 0");
        
        address token = poolInfo.underlyingToken;
        
        // Get the market params for Morpho Blue
        IMorphoBlue.MarketParams memory marketParams = getMorphoMarketParams(poolName);
        
        // Call the withdraw function based on token type
        if (token == marketParams.loanToken) {
            // Loan token withdrawal
            try IMorphoBlue(morphoBlue).withdraw(
                marketParams,
                amount,    // assets
                0,         // shares (0 means use assets)
                address(this),  // onBehalf
                msg.sender      // receiver
            ) returns (uint256 assetsWithdrawn, uint256 sharesWithdrawn) {
                emit Withdrawn(poolName, token, assetsWithdrawn, msg.sender);
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("Morpho withdraw failed: ", reason)));
            } catch {
                revert("Morpho withdraw failed");
            }
        } else if (token == marketParams.collateralToken) {
            // Collateral token withdrawal
            try IMorphoBlue(morphoBlue).withdrawCollateral(
                marketParams,
                amount,    // assets
                address(this),  // onBehalf
                msg.sender      // receiver
            ) {
                emit Withdrawn(poolName, token, amount, msg.sender);
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("Morpho withdrawCollateral failed: ", reason)));
            } catch {
                revert("Morpho withdrawCollateral failed");
            }
        } else {
            revert("Token not matching loan or collateral token");
        }
    }

    /**
     * @dev Swap tokens and deposit into a pool in one transaction
     * @param fromToken Source token address
     * @param poolName Target pool name
     * @param amountIn Amount of source tokens to swap
     * @param minAmountOut Minimum amount of destination tokens to receive
     * @param deadline Swap deadline timestamp
     */
    function swapAndDeposit(
        address fromToken,
        string memory poolName,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) external {
        PoolInfo memory poolInfo = pools[poolName];
        require(poolInfo.poolAddress != address(0), "Pool not found");
        
        // Perform the swap
        address toToken = poolInfo.underlyingToken;
        uint256 amountOut = swapTokens(fromToken, toToken, amountIn, minAmountOut, deadline);
        
        // Deposit based on the protocol
        if (poolInfo.protocol == Protocol.AAVE_V2) {
            // Deposit to Aave V2
            IERC20(toToken).approve(address(aaveVaultV2), amountOut);
            try aaveVaultV2.deposit(toToken, amountOut) {
                emit Deposited(poolName, toToken, amountOut, msg.sender);
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("AaveV2 deposit failed: ", reason)));
            }
        } else if (poolInfo.protocol == Protocol.AAVE_V3) {
            // Deposit to Aave V3
            IERC20(toToken).approve(address(aaveVaultV3), amountOut);
            try aaveVaultV3.deposit(toToken, amountOut) {
                emit Deposited(poolName, toToken, amountOut, msg.sender);
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("AaveV3 deposit failed: ", reason)));
            }
        } else if (poolInfo.protocol == Protocol.MORPHO_BLUE) {
            // Already in this contract, so use internal deposit
            depositToMorphoBlue(poolName, amountOut);
        }
    }

    /**
     * @dev Multi-hop swap tokens and deposit into a pool in one transaction
     * @param path Encoded swap path
     * @param poolName Target pool name
     * @param amountIn Amount of source tokens to swap
     * @param minAmountOut Minimum amount of destination tokens to receive
     * @param deadline Swap deadline timestamp
     */
    function swapMultihopAndDeposit(
        bytes memory path,
        string memory poolName,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) external {
        PoolInfo memory poolInfo = pools[poolName];
        require(poolInfo.poolAddress != address(0), "Pool not found");
        
        // Perform the multi-hop swap
        uint256 amountOut = swapTokensMultihop(path, amountIn, minAmountOut, deadline);
        
        address toToken = poolInfo.underlyingToken;
        
        // Deposit based on the protocol
        if (poolInfo.protocol == Protocol.AAVE_V2) {
            // Deposit to Aave V2
            IERC20(toToken).approve(address(aaveVaultV2), amountOut);
            try aaveVaultV2.deposit(toToken, amountOut) {
                emit Deposited(poolName, toToken, amountOut, msg.sender);
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("AaveV2 deposit failed: ", reason)));
            }
        } else if (poolInfo.protocol == Protocol.AAVE_V3) {
            // Deposit to Aave V3
            IERC20(toToken).approve(address(aaveVaultV3), amountOut);
            try aaveVaultV3.deposit(toToken, amountOut) {
                emit Deposited(poolName, toToken, amountOut, msg.sender);
            } catch Error(string memory reason) {
                revert(string(abi.encodePacked("AaveV3 deposit failed: ", reason)));
            }
        } else if (poolInfo.protocol == Protocol.MORPHO_BLUE) {
            // Already in this contract, so use internal deposit
            depositToMorphoBlue(poolName, amountOut);
        }
    }
}