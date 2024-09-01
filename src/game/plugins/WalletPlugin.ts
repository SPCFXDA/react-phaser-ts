import Phaser from 'phaser';
import { MetaMaskWalletManager } from '../managers/MetaMaskWalletManager_espace';
import { FluentWalletManager } from '../managers/FluentWalletManager_espace';
import { FluentWalletManagerCore } from '../managers/FluentWalletManager_core';
import { Address } from 'viem';
import { Address as CoreAddress} from 'cive';

// Define a type union for wallet managers
type WalletManager = MetaMaskWalletManager | FluentWalletManager | FluentWalletManagerCore;

export class WalletPlugin extends Phaser.Plugins.BasePlugin {
    private currentManager: WalletManager | null = null;
    private currentSpace: 'core' | 'espace' | null = null;
    currentAccount: Address | CoreAddress | null = null;

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager);
    }

    // Get available spaces
    getAvailableSpaces(): string[] {
        return ['espace', 'core'];
    }

    getAvailableManagers(): string[] {
        if (!this.currentSpace) {
            throw new Error('No space selected. Please set the current space first.');
        }
        const managers = { core: ['Fluent'], espace: ['MetaMask', 'Fluent']}
        return managers[this.currentSpace];
    }

    // Set the current space
    setCurrentSpace(space: 'core' | 'espace'): void {
        if (space !== 'core' && space !== 'espace') {
            throw new Error('Invalid space type');
        }
        this.currentSpace = space;
        this.currentManager = null; // Reset current manager when space changes
        console.log(`Current space set to: ${this.currentSpace}`);
    }

    // Set the current manager, instantiate it if necessary
    setCurrentManager(managerType: 'MetaMask' | 'Fluent'): void {
        if (!this.currentSpace) {
            throw new Error('No space selected. Please set the current space first.');
        }

        // Clean up the previous manager if there is one
        this.cleanupCurrentManager();

        // Instantiate the new manager based on the type and space
        if (managerType === 'MetaMask' && this.currentSpace === 'espace') {
            this.currentManager = new MetaMaskWalletManager(this.pluginManager);
        } else if (managerType === 'Fluent') {
            if (this.currentSpace === 'espace') {
                this.currentManager = new FluentWalletManager(this.pluginManager);
            } else if (this.currentSpace === 'core') {
                this.currentManager = new FluentWalletManagerCore(this.pluginManager);
            }
        } else {
            throw new Error('Invalid or unavailable wallet manager type');
        }

        console.log(`Current manager set to: ${this.currentManager.constructor.name}`);
    }

    // Clean up the current manager
    private cleanupCurrentManager(): void {
        if (this.currentManager) {
            this.currentManager.disconnectWallet(); // Or other specific cleanup needed
            this.currentManager = null;
            this.currentAccount = null;
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

    async connect(): Promise<Address | CoreAddress | null> {
        this.ensureManagerSet();
        this.currentAccount = await this.currentManager?.connect() as Address | CoreAddress | null;
        return this.currentAccount;
    }

    async disconnectWallet(): Promise<void> {
        this.ensureManagerSet();
        await this.currentManager?.disconnectWallet();
        this.cleanupCurrentManager(); // Cleanup after disconnecting
    }

    async getAccount(): Promise<Address | CoreAddress | undefined> {
        this.ensureManagerSet();
        return this.currentManager?.getAccount();
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
}
