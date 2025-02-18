// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/contracts/MockToken.sol";
import "../src/contracts/MockVault.sol";

contract VaultsTest is Test {
    MockToken public weth;
    MockToken public usdc;
    MockToken public dai;
    
    MockVault public ethVault;
    MockVault public usdcVault;
    MockVault public daiVault;
    
    address public strategist;
    address public user;

    function setUp() public {
        // Setup accounts
        strategist = makeAddr("strategist");
        user = makeAddr("user");
        vm.deal(user, 100 ether);

        // Deploy mock tokens
        weth = new MockToken("Wrapped Ether", "WETH", 18);
        usdc = new MockToken("USD Coin", "USDC", 6);
        dai = new MockToken("Dai Stablecoin", "DAI", 18);

        // Deploy vaults
        ethVault = new MockVault(
            IERC20(address(weth)),
            "ETH Yield Vault",
            "yvWETH",
            strategist,
            1000 ether, // 1000 ETH cap
            520 // 5.2% APR
        );

        usdcVault = new MockVault(
            IERC20(address(usdc)),
            "USDC Stable Vault",
            "yvUSDC",
            strategist,
            1000000 * 10**6, // 1M USDC cap
            380 // 3.8% APR
        );

        daiVault = new MockVault(
            IERC20(address(dai)),
            "DAI Lend Vault",
            "yvDAI",
            strategist,
            1000000 ether, // 1M DAI cap
            420 // 4.2% APR
        );

        // Setup initial token balances
        weth.mint(user, 100 ether);
        usdc.mint(user, 100000 * 10**6);
        dai.mint(user, 100000 ether);

        // Label addresses for better trace output
        vm.label(address(weth), "WETH");
        vm.label(address(usdc), "USDC");
        vm.label(address(dai), "DAI");
        vm.label(address(ethVault), "ETH Vault");
        vm.label(address(usdcVault), "USDC Vault");
        vm.label(address(daiVault), "DAI Vault");
    }

    function test_VaultDeployment() public {
        assertEq(address(ethVault.asset()), address(weth));
        assertEq(address(usdcVault.asset()), address(usdc));
        assertEq(address(daiVault.asset()), address(dai));
    }

    function test_VaultDeposit() public {
        vm.startPrank(user);

        // Approve and deposit into ETH vault
        weth.approve(address(ethVault), 10 ether);
        ethVault.deposit(10 ether, user);
        assertEq(ethVault.balanceOf(user), 10 ether);

        // Approve and deposit into USDC vault
        usdc.approve(address(usdcVault), 10000 * 10**6);
        usdcVault.deposit(10000 * 10**6, user);
        assertEq(usdcVault.balanceOf(user), 10000 * 10**6);

        // Approve and deposit into DAI vault
        dai.approve(address(daiVault), 10000 ether);
        daiVault.deposit(10000 ether, user);
        assertEq(daiVault.balanceOf(user), 10000 ether);

        vm.stopPrank();
    }

    function test_VaultYield() public {
        vm.startPrank(user);

        // Deposit into vaults
        weth.approve(address(ethVault), 10 ether);
        ethVault.deposit(10 ether, user);

        usdc.approve(address(usdcVault), 10000 * 10**6);
        usdcVault.deposit(10000 * 10**6, user);

        dai.approve(address(daiVault), 10000 ether);
        daiVault.deposit(10000 ether, user);

        vm.stopPrank();

        // Simulate time passing (1 month)
        vm.warp(block.timestamp + 30 days);

        // Check yield generation
        assertGt(ethVault.totalAssets(), 10 ether);
        assertGt(usdcVault.totalAssets(), 10000 * 10**6);
        assertGt(daiVault.totalAssets(), 10000 ether);
    }
} 