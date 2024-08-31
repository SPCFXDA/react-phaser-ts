import { WalletPlugin } from '../plugins/WalletPlugin';
import { WalletUI } from './WalletUI';

export class WalletActions {
    private walletPlugin: WalletPlugin;
    private updateUIWithWalletStatus: () => void;
    private walletUI: WalletUI;

    constructor(walletPlugin: WalletPlugin, updateUIWithWalletStatus: () => void) {
        this.walletPlugin = walletPlugin;
        this.updateUIWithWalletStatus = updateUIWithWalletStatus;
    }

    public setWalletUI(walletUI: WalletUI) {
        this.walletUI = walletUI;
    }

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
            await this.connect()
        } else {
            console.error("Wallet is not installed");
        }
    }
    public async connect() {
        await this.executeWithLoading('connectWallet', 'Connecting...', async () => {
            await this.walletPlugin.connect();
            this.updateUIWithWalletStatus();
        });
    }

    public async disconnect() {
        await this.executeWithLoading('disconnectWallet', 'Disconnecting...', async () => {
            await this.walletPlugin.disconnectWallet();
            this.updateUIWithWalletStatus();
        });
    }

    public async updateBalanceInfo() {
        const balance = await this.walletPlugin.getBalance();
        this.walletUI.updateBalance(balance);
    }

    public async executeWithLoading<T>(callName: string, buttonTextOnStart: string, callback: () => Promise<T>): Promise<T | undefined> {
        try {
            this.walletUI.updateButtonText(callName, buttonTextOnStart);
            const result = await callback();
            return result;
        } catch (error) {
            console.error(`${callName} failed:`, error);
            return undefined;
        } finally {
            this.walletUI.updateButtonText(callName, this.getButtonDefaultText(callName));
        }
    }

    // Get default text for each button
    private getButtonDefaultText(name: string): string {
        const defaultTexts = {
            viewBalance: 'View Balance',
            sendTransaction: 'Send Transaction',
            getBlockNumber: 'Get Block Number',
            switchNetwork: 'Switch Network',
            connectWallet: 'Connect Wallet',
            disconnectWallet: 'Disconnect Wallet'
        };
        return defaultTexts[name] || '';
    }
}
