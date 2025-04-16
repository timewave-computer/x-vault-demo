import { type Abi, erc4626Abi } from "viem";

const _valenceVaultABI: Abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "netAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "DepositWithdrawNetting",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "strategistAccount",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "platformAccount",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "strategistShares",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "platformShares",
        type: "uint256",
      },
    ],
    name: "FeesDistributed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "platformFee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "performanceFee",
        type: "uint256",
      },
    ],
    name: "FeesUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "newRate",
        type: "uint256",
      },
    ],
    name: "MaxHistoricalRateUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bool",
        name: "paused",
        type: "bool",
      },
    ],
    name: "PausedStateChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "newRate",
        type: "uint256",
      },
    ],
    name: "RateUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "updateId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "withdrawRate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalAssetsToWithdraw",
        type: "uint256",
      },
    ],
    name: "UpdateProcessed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "updater",
        type: "address",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "contract BaseAccount",
                name: "depositAccount",
                type: "address",
              },
              {
                internalType: "contract BaseAccount",
                name: "withdrawAccount",
                type: "address",
              },
              {
                internalType: "address",
                name: "strategist",
                type: "address",
              },
              {
                components: [
                  {
                    internalType: "uint32",
                    name: "depositFeeBps",
                    type: "uint32",
                  },
                  {
                    internalType: "uint32",
                    name: "platformFeeBps",
                    type: "uint32",
                  },
                  {
                    internalType: "uint32",
                    name: "performanceFeeBps",
                    type: "uint32",
                  },
                  {
                    internalType: "uint64",
                    name: "solverCompletionFee",
                    type: "uint64",
                  },
                ],
                internalType: "struct ValenceVault.FeeConfig",
                name: "fees",
                type: "tuple",
              },
              {
                components: [
                  {
                    internalType: "address",
                    name: "strategistAccount",
                    type: "address",
                  },
                  {
                    internalType: "address",
                    name: "platformAccount",
                    type: "address",
                  },
                  {
                    internalType: "uint32",
                    name: "strategistRatioBps",
                    type: "uint32",
                  },
                ],
                internalType: "struct ValenceVault.FeeDistributionConfig",
                name: "feeDistribution",
                type: "tuple",
              },
              {
                internalType: "uint128",
                name: "depositCap",
                type: "uint128",
              },
              {
                internalType: "uint64",
                name: "withdrawLockupPeriod",
                type: "uint64",
              },
              {
                internalType: "uint32",
                name: "maxWithdrawFeeBps",
                type: "uint32",
              },
            ],
            internalType: "struct ValenceVault.VaultConfig",
            name: "newConfig",
            type: "tuple",
          },
        ],
        indexed: false,
        name: "ConfigUpdated",
        type: "event",
      },
    ],
    name: "ConfigUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxLossBps",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "solverEnabled",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "updateId",
        type: "uint64",
      },
    ],
    name: "WithdrawRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "executor",
        type: "address",
      },
    ],
    name: "WithdrawCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "currentLoss",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxAllowedLoss",
        type: "uint256",
      },
    ],
    name: "WithdrawCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "WithdrawCompletionSkipped",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "newFee",
        type: "uint256",
      },
    ],
    name: "WithdrawFeeUpdated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "asset",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
    ],
    name: "calculateDepositFee",
    outputs: [
      {
        internalType: "uint128",
        name: "",
        type: "uint128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "calculateMintFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint128",
        name: "",
        type: "uint128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "currentTotalAssets",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "currentTotalShares",
        type: "uint256",
      },
      {
        internalType: "uint32",
        name: "platformFeeBps",
        type: "uint32",
      },
      {
        internalType: "uint64",
        name: "_lastUpdateTimestamp",
        type: "uint64",
      },
    ],
    name: "calculatePlatformFees",
    outputs: [
      {
        internalType: "uint128",
        name: "",
        type: "uint128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "currentTotalShares",
        type: "uint256",
      },
      {
        internalType: "uint32",
        name: "performanceFeeBps",
        type: "uint32",
      },
    ],
    name: "calculatePerformanceFees",
    outputs: [
      {
        internalType: "uint128",
        name: "",
        type: "uint128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "completeWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "owners",
        type: "address[]",
      },
    ],
    name: "completeWithdraws",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "config",
    outputs: [
      {
        components: [
          {
            internalType: "contract BaseAccount",
            name: "depositAccount",
            type: "address",
          },
          {
            internalType: "contract BaseAccount",
            name: "withdrawAccount",
            type: "address",
          },
          {
            internalType: "address",
            name: "strategist",
            type: "address",
          },
          {
            components: [
              {
                internalType: "uint32",
                name: "depositFeeBps",
                type: "uint32",
              },
              {
                internalType: "uint32",
                name: "platformFeeBps",
                type: "uint32",
              },
              {
                internalType: "uint32",
                name: "performanceFeeBps",
                type: "uint32",
              },
              {
                internalType: "uint64",
                name: "solverCompletionFee",
                type: "uint64",
              },
            ],
            internalType: "struct ValenceVault.FeeConfig",
            name: "fees",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "address",
                name: "strategistAccount",
                type: "address",
              },
              {
                internalType: "address",
                name: "platformAccount",
                type: "address",
              },
              {
                internalType: "uint32",
                name: "strategistRatioBps",
                type: "uint32",
              },
            ],
            internalType: "struct ValenceVault.FeeDistributionConfig",
            name: "feeDistribution",
            type: "tuple",
          },
          {
            internalType: "uint128",
            name: "depositCap",
            type: "uint128",
          },
          {
            internalType: "uint64",
            name: "withdrawLockupPeriod",
            type: "uint64",
          },
          {
            internalType: "uint32",
            name: "maxWithdrawFeeBps",
            type: "uint32",
          },
        ],
        internalType: "struct ValenceVault.VaultConfig",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "deposit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "hasActiveWithdraw",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "_config",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "underlying",
        type: "address",
      },
      {
        internalType: "string",
        name: "vaultTokenName",
        type: "string",
      },
      {
        internalType: "string",
        name: "vaultTokenSymbol",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "startingRate",
        type: "uint256",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "lastUpdateTimestamp",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastUpdateTotalShares",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxHistoricalRate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "maxDeposit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "maxMint",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "maxRedeem",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "maxWithdraw",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "mint",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "packedValues",
    outputs: [
      {
        internalType: "uint32",
        name: "currentUpdateId",
        type: "uint32",
      },
      {
        internalType: "uint64",
        name: "nextWithdrawRequestId",
        type: "uint64",
      },
      {
        internalType: "bool",
        name: "pauser",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "paused",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
    ],
    name: "previewDeposit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "previewMint",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "previewRedeem",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
    ],
    name: "previewWithdraw",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "redemptionRate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "maxLossBps",
        type: "uint32",
      },
      {
        internalType: "bool",
        name: "allowSolverCompletion",
        type: "bool",
      },
    ],
    name: "redeem",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalAssets",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_config",
        type: "bytes",
      },
    ],
    name: "updateConfig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newRate",
        type: "uint256",
      },
      {
        internalType: "uint32",
        name: "withdrawFeeBps",
        type: "uint32",
      },
      {
        internalType: "uint256",
        name: "nettingAmount",
        type: "uint256",
      },
    ],
    name: "update",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64",
      },
    ],
    name: "updateInfos",
    outputs: [
      {
        internalType: "uint256",
        name: "withdrawRate",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "timestamp",
        type: "uint64",
      },
      {
        internalType: "uint32",
        name: "withdrawFee",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "userWithdrawRequest",
    outputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "claimTime",
        type: "uint64",
      },
      {
        internalType: "uint32",
        name: "maxLossBps",
        type: "uint32",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "updateId",
        type: "uint32",
      },
      {
        internalType: "uint64",
        name: "solverFee",
        type: "uint64",
      },
      {
        internalType: "uint256",
        name: "sharesAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "maxLossBps",
        type: "uint32",
      },
      {
        internalType: "bool",
        name: "allowSolverCompletion",
        type: "bool",
      },
    ],
    name: "withdraw",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
] as const;

export const valenceVaultABI = [..._valenceVaultABI, ...erc4626Abi] as const;
