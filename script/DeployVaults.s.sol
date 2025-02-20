// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC4626.sol";

// Simple ERC20 token with a mint function
contract BasicToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Simple ERC4626 vault with no modifications
contract BasicVault is ERC4626 {
    constructor(
        IERC20 asset,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) ERC4626(asset) {}
}

contract DeployVaults is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy basic tokens
        BasicToken weth = new BasicToken("Wrapped Ether", "WETH");
        BasicToken usdc = new BasicToken("USD Coin", "USDC");
        BasicToken dai = new BasicToken("Dai Stablecoin", "DAI");

        // Deploy basic vaults
        BasicVault ethVault = new BasicVault(
            IERC20(address(weth)),
            "WETH Yield Vault",
            "yvWETH"
        );

        BasicVault usdcVault = new BasicVault(
            IERC20(address(usdc)),
            "USDC Stable Vault",
            "yvUSDC"
        );

        BasicVault daiVault = new BasicVault(
            IERC20(address(dai)),
            "DAI Lend Vault",
            "yvDAI"
        );

        // Log deployed addresses
        console.log("Deployed addresses:");
        console.log("WETH:", address(weth));
        console.log("USDC:", address(usdc));
        console.log("DAI:", address(dai));
        console.log("WETH Vault:", address(ethVault));
        console.log("USDC Vault:", address(usdcVault));
        console.log("DAI Vault:", address(daiVault));

        vm.stopBroadcast();
    }
} 