import Phaser from 'phaser';
import { MetaMaskWalletManager } from '../managers/MetaMaskWalletManager_espace';
import { FluentWalletManager } from '../managers/FluentWalletManager_espace';
import { FluentWalletManagerCore } from '../managers/FluentWalletManager_core';
import { Address } from 'viem';

// Define a type union for wallet managers
type WalletManager = MetaMaskWalletManager | FluentWalletManager | FluentWalletManagerCore;

export class WalletPlugin extends Phaser.Plugins.BasePlugin {
    private metaMaskWalletManager: MetaMaskWalletManager;
    private fluentWalletManager: FluentWalletManager;
    private fluentWalletManagerCore: FluentWalletManagerCore;
    private currentManager: WalletManager | null = null;
    private currentSpace: 'core' | 'espace' | null;
    currentAccount: Address | null;
    private spaceManagers: { [key: string]: WalletManager[] };

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager);
        this.metaMaskWalletManager = new MetaMaskWalletManager(pluginManager);
        this.fluentWalletManager = new FluentWalletManager(pluginManager);
        this.fluentWalletManagerCore = new FluentWalletManagerCore(pluginManager);
        this.currentAccount = null;
        this.currentSpace = null;

        this.spaceManagers = {
            espace: [this.metaMaskWalletManager, this.fluentWalletManager],
            core: [this.fluentWalletManagerCore]
        };
    }

    // Get available spaces
    getAvailableSpaces(): string[] {
        return Object.keys(this.spaceManagers);
    }

    // Set the current space and update the currentManager based on it
    setCurrentSpace(space: 'core' | 'espace'): void {
        if (space in this.spaceManagers) {
            this.currentSpace = space;
        } else {
            throw new Error('Invalid space type');
        }
        console.log(`Current space set to: ${this.currentSpace}`);
    }

    // Get available managers for the selected space
    getAvailableManagers(): WalletManager[] {
        if (!this.currentSpace) {
            throw new Error('No space selected. Please set the current space first.');
        }
        return this.spaceManagers[this.currentSpace];
    }

    // Set the current manager (MetaMask or Fluent)
    setCurrentManager(manager: WalletManager): void {
        if (!this.currentSpace || !this.spaceManagers[this.currentSpace].includes(manager)) {
            throw new Error('Invalid or unavailable wallet manager type');
        }
        this.currentManager = manager;
        console.log(`Current manager set to: ${manager.constructor.name}`);
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

    getFluentWalletManagerCore(): FluentWalletManagerCore {
        return this.fluentWalletManagerCore;
    }
}
