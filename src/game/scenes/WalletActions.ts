import { WalletPlugin } from '../plugins/WalletPlugin';

export class WalletActions {
    private walletPlugin: WalletPlugin;
    private updateUIWithWalletStatus: () => void;

    constructor(walletPlugin: WalletPlugin, updateUIWithWalletStatus: () => void) {
        this.walletPlugin = walletPlugin;
        this.updateUIWithWalletStatus = updateUIWithWalletStatus;
    }

    // Handle wallet connection and update UI based on status
    public async handleWalletConnection() {
        const space = 'espace'; // or dynamically set based on user input
        this.walletPlugin.setCurrentSpace(space);
        const managers = this.walletPlugin.getAvailableManagers();
        
        if (managers.length === 0) {
            console.error("No available wallet managers for the selected space.");
            return;
        }
        
        this.walletPlugin.setCurrentManager(managers[1]);

        if (this.walletPlugin.isWalletInstalled()) {
            if (this.walletPlugin.currentAccount) {
                await this.executeWithLoading('disconnectWallet', 'Disconnecting...', async () => {
                    await this.walletPlugin.disconnectWallet();
                    this.updateUIWithWalletStatus();
                });
            } else {
                await this.executeWithLoading('connectWallet', 'Connecting...', async () => {
                    await this.walletPlugin.connect();
                    this.updateUIWithWalletStatus();
                });
            }
        } else {
            console.error("Wallet is not installed");
        }
    }

    // Method to update balance info
    public async updateBalanceInfo() {
        const balance = await this.walletPlugin.getBalance();
        this.updateUIWithWalletStatus();
    }

    // Wrap wallet operations with global loading status and button text updates
    private async executeWithLoading<T>(callName: string, buttonTextOnStart: string, callback: () => Promise<T>): Promise<T | undefined> {
        try {
            // Placeholder for loading handling, e.g., show loading spinner
            console.log(`${buttonTextOnStart}...`);

            const result = await callback();
            return result;
        } catch (error) {
            console.error(`${callName} failed:`, error);
            return undefined;
        } finally {
            // Placeholder for ending loading handling, e.g., hide loading spinner
            console.log('Loading complete');
        }
    }
}
