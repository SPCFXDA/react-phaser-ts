import { createPublicClient, createWalletClient, custom } from 'viem';
import { Address } from 'viem';

export class ChainManager {
    private publicClient: any | null;
    private walletClient: any | null;

    constructor(publicClient: any | null, walletClient: any | null) {
        this.publicClient = publicClient;
        this.walletClient = walletClient;
    }

    async switchChain(chainId: string): Promise<void> {
        if (!this.walletClient) {
            console.error('Wallet client not initialized.');
            return;
        }

        try {
            await this.walletClient.switchChain({ id: chainId });
            console.log(`Network switched to: ${chainId}`);
        } catch (error) {
            console.error('Error switching network:', error);
        }
    }
}
