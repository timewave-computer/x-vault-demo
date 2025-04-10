export interface BaseVaultData  {
    id: string
    name: string
    description: string
    tvl: string
    apr: string
    token: string
    tokenAddress: `0x${string}` // Contract address of the token
    vaultAddress: `0x${string}`
}

export const BASE_VAULTS: Record<number,BaseVaultData[]> = {
    1: [
        {
            id: 'usdc',
            name: 'USDC Mock Vault',
            description: 'Stable yield generation for USDC deposits.',
            token: 'USDC',
            vaultAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e", // contract does not exist
            tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",

           // TODO: these values should be fetched from the strategiest
           tvl: '0 USDC',
           apr: '3.8%',
        } 
    ],
    31337: [
      {
            id: 'usdc',
            name: 'USDC Stable Vault',
            description: 'Stable yield generation for USDC deposits.',
            token: 'USDC',
            vaultAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
            tokenAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e", // TODO replace with actual token address

           // TODO: these values should be fetched from the strategiest
           tvl: '0 USDC',
           apr: '3.8%',
        } 
    ]
}