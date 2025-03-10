// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC4626.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

// Mock ERC20 with mint and burn functionality for testing
contract MockToken is ERC20 {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimalsValue) ERC20(name, symbol) {
        _decimals = decimalsValue;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}

// Simple ERC4626 vault implementation
contract SimpleVault is ERC4626 {
    constructor(IERC20 asset, string memory name, string memory symbol) ERC4626(asset) ERC20(name, symbol) {}

    // Optional: Override to add management fees, etc.
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }
}

contract DeployVaults is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock tokens
        MockToken weth = new MockToken("Wrapped Ether", "WETH", 18);
        MockToken usdc = new MockToken("USD Coin", "USDC", 6);
        MockToken dai = new MockToken("Dai Stablecoin", "DAI", 18);

        // Deploy vaults for each token
        SimpleVault ethVault = new SimpleVault(weth, "WETH Vault", "vWETH");
        SimpleVault usdcVault = new SimpleVault(usdc, "USDC Vault", "vUSDC");
        SimpleVault daiVault = new SimpleVault(dai, "DAI Vault", "vDAI");

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("Deployed addresses:");
        console.log("WETH:", address(weth));
        console.log("USDC:", address(usdc));
        console.log("DAI:", address(dai));
        console.log("ETH Vault:", address(ethVault));
        console.log("USDC Vault:", address(usdcVault));
        console.log("DAI Vault:", address(daiVault));
    }
} 