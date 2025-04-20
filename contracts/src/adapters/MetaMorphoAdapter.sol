// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

/**
 * @title MetaMorphoAdapter
 * @notice Adapter for MetaMorpho vaults (which are ERC4626 compliant)
 * @dev Supports multiple vaults per token and allows selecting which vault to use
 */
contract MetaMorphoAdapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    struct VaultInfo {
        address vaultAddress;
        string name;
        bool active;
    }
    
    // Mapping of token => vault ID => vault info
    mapping(address => mapping(uint256 => VaultInfo)) public vaults;
    
    // Mapping of token => number of vaults
    mapping(address => uint256) public vaultCount;
    
    // Mapping of token => currently selected vault ID
    mapping(address => uint256) public selectedVault;
    
    // Events
    event VaultAdded(address indexed token, uint256 vaultId, address vault, string name);
    event VaultDeactivated(address indexed token, uint256 vaultId);
    event VaultSelected(address indexed token, uint256 vaultId);
    event Deposited(address indexed token, address indexed vault, uint256 amount);
    event Withdrawn(address indexed token, address indexed vault, uint256 amount);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Add a vault for a specific token
     * @param token The underlying token address
     * @param vault The vault address
     * @param name A descriptive name for the vault
     * @return vaultId The ID assigned to this vault
     */
    function addVault(address token, address vault, string calldata name) external onlyOwner returns (uint256 vaultId) {
        require(token != address(0), "MetaMorphoAdapter: token cannot be zero address");
        require(vault != address(0), "MetaMorphoAdapter: vault cannot be zero address");
        
        // Verify that the vault uses this token as underlying
        try IERC4626(vault).asset() returns (address underlying) {
            require(underlying == token, "MetaMorphoAdapter: token mismatch with vault");
        } catch {
            revert("MetaMorphoAdapter: vault is not ERC4626 compliant");
        }
        
        // Assign next vault ID
        vaultId = vaultCount[token] + 1;
        vaults[token][vaultId] = VaultInfo({
            vaultAddress: vault,
            name: name,
            active: true
        });
        vaultCount[token] = vaultId;
        
        // If this is the first vault for this token, select it
        if (vaultId == 1) {
            selectedVault[token] = vaultId;
            emit VaultSelected(token, vaultId);
        }
        
        emit VaultAdded(token, vaultId, vault, name);
    }
    
    /**
     * @notice Deactivate a vault for a specific token
     * @param token The underlying token address
     * @param vaultId The ID of the vault to deactivate
     */
    function deactivateVault(address token, uint256 vaultId) external onlyOwner {
        require(vaultId > 0 && vaultId <= vaultCount[token], "MetaMorphoAdapter: invalid vault ID");
        require(vaults[token][vaultId].active, "MetaMorphoAdapter: vault already inactive");
        
        vaults[token][vaultId].active = false;
        
        // If the deactivated vault was selected, select another active vault if available
        if (selectedVault[token] == vaultId) {
            bool foundActive = false;
            for (uint256 i = 1; i <= vaultCount[token]; i++) {
                if (vaults[token][i].active) {
                    selectedVault[token] = i;
                    foundActive = true;
                    emit VaultSelected(token, i);
                    break;
                }
            }
            
            // If no active vault found, clear the selection
            if (!foundActive) {
                selectedVault[token] = 0;
            }
        }
        
        emit VaultDeactivated(token, vaultId);
    }
    
    /**
     * @notice Select a vault to use for a specific token
     * @param token The underlying token address
     * @param vaultId The ID of the vault to select
     */
    function selectVault(address token, uint256 vaultId) external onlyOwner {
        require(vaultId > 0 && vaultId <= vaultCount[token], "MetaMorphoAdapter: invalid vault ID");
        require(vaults[token][vaultId].active, "MetaMorphoAdapter: vault is inactive");
        
        selectedVault[token] = vaultId;
        
        emit VaultSelected(token, vaultId);
    }
    
    /**
     * @notice Get the number of active vaults for a token
     * @param token The underlying token address
     * @return count The number of active vaults
     */
    function getActiveVaultCount(address token) external view returns (uint256 count) {
        for (uint256 i = 1; i <= vaultCount[token]; i++) {
            if (vaults[token][i].active) {
                count++;
            }
        }
    }
    
    /**
     * @notice Get information about a specific vault
     * @param token The underlying token address
     * @param vaultId The ID of the vault
     * @return vaultAddress The address of the vault
     * @return name The name of the vault
     * @return active Whether the vault is active
     * @return isSelected Whether this vault is currently selected
     * @return estimatedApy The estimated APY of the vault (in basis points)
     */
    function getVaultInfo(address token, uint256 vaultId) external view returns (
        address vaultAddress,
        string memory name,
        bool active,
        bool isSelected,
        uint256 estimatedApy
    ) {
        require(vaultId > 0 && vaultId <= vaultCount[token], "MetaMorphoAdapter: invalid vault ID");
        
        VaultInfo storage info = vaults[token][vaultId];
        vaultAddress = info.vaultAddress;
        name = info.name;
        active = info.active;
        isSelected = (selectedVault[token] == vaultId);
        
        // Calculate estimated APY if vault is active
        if (active) {
            estimatedApy = _estimateVaultApy(info.vaultAddress);
        }
    }
    
    /**
     * @notice Deposit assets into the selected MetaMorpho vault
     * @param underlyingToken The address of the underlying token to deposit
     * @param amount The amount to deposit
     * @return The amount actually deposited
     */
    function deposit(address underlyingToken, uint256 amount) external override returns (uint256) {
        require(amount > 0, "MetaMorphoAdapter: amount must be greater than 0");
        
        uint256 vaultId = selectedVault[underlyingToken];
        require(vaultId > 0, "MetaMorphoAdapter: no vault selected for token");
        
        VaultInfo storage info = vaults[underlyingToken][vaultId];
        require(info.active, "MetaMorphoAdapter: selected vault is inactive");
        
        address vault = info.vaultAddress;
        
        // Transfer tokens from sender to this contract
        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve vault to spend tokens
        IERC20(underlyingToken).approve(vault, 0);
        IERC20(underlyingToken).approve(vault, amount);
        
        // Deposit to vault
        uint256 sharesBefore = IERC4626(vault).balanceOf(address(this));
        IERC4626(vault).deposit(amount, address(this));
        uint256 sharesAfter = IERC4626(vault).balanceOf(address(this));
        
        emit Deposited(underlyingToken, vault, amount);
        
        return amount;
    }
    
    /**
     * @notice Withdraw assets from all vaults for a specific token
     * @param underlyingToken The address of the underlying token to withdraw
     * @return The total amount withdrawn
     */
    function withdraw(address underlyingToken) external override returns (uint256) {
        uint256 totalWithdrawn = 0;
        
        // Withdraw from all active vaults for this token
        for (uint256 i = 1; i <= vaultCount[underlyingToken]; i++) {
            VaultInfo storage info = vaults[underlyingToken][i];
            if (info.active) {
                address vault = info.vaultAddress;
                
                // Get current shares
                uint256 shares = IERC4626(vault).balanceOf(address(this));
                
                if (shares > 0) {
                    // Redeem all shares
                    uint256 assets = IERC4626(vault).redeem(shares, address(this), address(this));
                    totalWithdrawn += assets;
                    
                    emit Withdrawn(underlyingToken, vault, assets);
                }
            }
        }
        
        if (totalWithdrawn > 0) {
            // Transfer tokens back to sender
            IERC20(underlyingToken).safeTransfer(msg.sender, totalWithdrawn);
        }
        
        return totalWithdrawn;
    }
    
    /**
     * @notice Get the current APY for a specific asset
     * @param underlyingToken The address of the underlying token
     * @return The current APY in basis points (1% = 100)
     */
    function getAPY(address underlyingToken) external view override returns (uint256) {
        uint256 vaultId = selectedVault[underlyingToken];
        if (vaultId == 0) {
            return 0;
        }
        
        VaultInfo storage info = vaults[underlyingToken][vaultId];
        if (!info.active) {
            return 0;
        }
        
        return _estimateVaultApy(info.vaultAddress);
    }
    
    /**
     * @notice Get the current balance in the protocol
     * @param underlyingToken The address of the underlying token
     * @return The current balance in underlying token units across all vaults
     */
    function getBalance(address underlyingToken) public view override returns (uint256) {
        uint256 totalBalance = 0;
        
        // Sum balances from all active vaults for this token
        for (uint256 i = 1; i <= vaultCount[underlyingToken]; i++) {
            VaultInfo storage info = vaults[underlyingToken][i];
            if (info.active) {
                address vault = info.vaultAddress;
                
                // Get shares
                uint256 shares = IERC4626(vault).balanceOf(address(this));
                
                if (shares > 0) {
                    // Convert shares to assets
                    totalBalance += IERC4626(vault).convertToAssets(shares);
                }
            }
        }
        
        return totalBalance;
    }
    
    /**
     * @notice Get the balance in a specific vault
     * @param token The underlying token address
     * @param vaultId The ID of the vault
     * @return The balance in the specified vault
     */
    function getVaultBalance(address token, uint256 vaultId) external view returns (uint256) {
        require(vaultId > 0 && vaultId <= vaultCount[token], "MetaMorphoAdapter: invalid vault ID");
        
        VaultInfo storage info = vaults[token][vaultId];
        if (!info.active) {
            return 0;
        }
        
        address vault = info.vaultAddress;
        uint256 shares = IERC4626(vault).balanceOf(address(this));
        
        if (shares == 0) {
            return 0;
        }
        
        return IERC4626(vault).convertToAssets(shares);
    }
    
    /**
     * @notice Rescue tokens stuck in this contract
     * @param token The token to rescue
     * @param to The address to send tokens to
     * @param amount The amount to rescue
     */
    function rescue(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }
    
    /**
     * @dev Estimate the APY for a vault
     * @param vault The vault address
     * @return The estimated APY in basis points
     */
    function _estimateVaultApy(address vault) internal view returns (uint256) {
        // This is a simplified APY approximation
        // A more accurate implementation would track historical share prices over time
        
        // For now, we'll either:
        // 1. Calculate approximate APY based on current exchange rate if possible
        // 2. Return a conservative estimate
        
        try IERC4626(vault).totalAssets() returns (uint256 totalAssets) {
            try IERC4626(vault).totalSupply() returns (uint256 totalSupply) {
                if (totalSupply > 0) {
                    // We could implement a more sophisticated calculation here
                    // But for simplicity, we'll return a conservative estimate
                    return 300; // 3% APY in basis points
                }
            } catch {}
        } catch {}
        
        // Default fallback
        return 200; // 2% as a default value in basis points
    }
}