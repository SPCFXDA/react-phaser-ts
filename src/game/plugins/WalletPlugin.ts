import Phaser from 'phaser';
import { MetaMaskWalletManager } from '../managers/MetaMaskWalletManager';
import { FluentWalletManager } from '../managers/FluentWalletManager';
import { Address } from 'viem';

// Define a type union for wallet managers
type WalletManager = MetaMaskWalletManager | FluentWalletManager;

export class WalletPlugin extends Phaser.Plugins.BasePlugin {
    private metaMaskWalletManager: MetaMaskWalletManager;
    private fluentWalletManager: FluentWalletManager;
    private currentManager: WalletManager | null = null;
    currentAccount: Address | null;

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager);
        this.metaMaskWalletManager = new MetaMaskWalletManager(pluginManager);
        this.fluentWalletManager = new FluentWalletManager(pluginManager);
        this.currentAccount = null;
    }

    // Set the current manager (MetaMask or Fluent)
    setCurrentManager(manager: 'MetaMask' | 'Fluent'): void {
        if (manager === 'MetaMask') {
            this.currentManager = this.metaMaskWalletManager;
        } else if (manager === 'Fluent') {
            this.currentManager = this.fluentWalletManager;
        } else {
            this.currentManager = this.metaMaskWalletManager;
            // throw new Error('Invalid wallet manager type');
        }
    }

    getChainInfo() {
        this.ensureManagerSet();
        return this.currentManager?.getChainInfo();
    }

    isWalletInstalled(): boolean | undefined {
        this.ensureManagerSet();
        return this.currentManager?.isWalletInstalled();
    }

    // Helper method to ensure a manager is set
    private ensureManagerSet(): void {
        if (!this.currentManager) {
            throw new Error('No wallet manager is currently set');
        }
    }

    // Wrapper methods that delegate to the current manager

    async connect(): Promise<Address | null> {
        this.ensureManagerSet();
        this.currentAccount = await this.currentManager?.connect() as unknown as Address;
        return this.currentAccount;
    }

    async disconnectWallet(): Promise<void> {
        this.ensureManagerSet();
        this.currentAccount = null;
        return this.currentManager?.disconnectWallet();
    }

    async getAccount(): Promise<Address | undefined> {
        this.ensureManagerSet();
        return this.currentManager?.getAccount() || undefined;
    }

    async getBalance(): Promise<string | null> {
        this.ensureManagerSet();
        const balance = await this.currentManager?.getBalance();
        return balance || null;
    }

    async sendTransaction(toAddress: Address, amount: string): Promise<string> {
        this.ensureManagerSet();
        
        // Initiate the transaction
        const txHash = await this.currentManager?.sendTransaction(toAddress, amount);
        if (!txHash) {
            throw new Error('Transaction initiation failed');
        }
        
        // Wait for the transaction to be confirmed
        console.log(`Transaction initiated, waiting for confirmation. TxHash: ${txHash}`);
        const receipt = await this.waitForTransactionConfirmation(txHash);
        console.log(`Transaction confirmed! Receipt:`, receipt);
        
        return txHash;
    }

    async getBlockNumber(): Promise<number> {
        this.ensureManagerSet();
        return this.currentManager?.getBlockNumber();
    }

    // Method to wait for the transaction confirmation
    private async waitForTransactionConfirmation(txHash: string): Promise<any> {
        this.ensureManagerSet();

        // Simulating waiting for the transaction to be mined and confirmed
        while (true) {
            const receipt = await this.currentManager?.getTransactionReceipt(txHash);
            if (receipt && receipt.status) {
                return receipt;
            }

            // Sleep or wait for a while before checking again (to avoid busy-waiting)
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
        }
    }

    // Methods to get the specific wallet managers
    getMetaMaskWalletManager(): MetaMaskWalletManager {
        return this.metaMaskWalletManager;
    }

    getFluentWalletManager(): FluentWalletManager {
        return this.fluentWalletManager;
    }
}
