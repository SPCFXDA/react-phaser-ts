import { Address, createPublicClient, createWalletClient, custom, formatEther, parseEther } from 'viem';
import { confluxESpace } from 'viem/chains';
import { BaseWalletManager } from './BaseWalletManager';

declare const window: any;

export class FluentWalletManagerCore extends BaseWalletManager {
    private fluent: any;

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager);
        this.fluent = window.fluent && window.fluent.isFluent ? window.fluent : null;
    }

    async getTransactionReceipt(txHash: string) {
        if (!this.publicClient || !this.currentAccount) {
            console.error('Public client is not initialized or no account found.');
            this.game.events.emit('fluentError', 'Public client not initialized or no account.');
            return null;
        }

        return await this.publicClient.getTransactionReceipt(txHash)
    }

    getChainInfo() {
        return confluxESpace
    }

    isWalletInstalled(): boolean {
        return !!this.fluent;
    }

    async connect(): Promise<Address | undefined> {
        if (!this.isWalletInstalled()) {
            console.error('Fluent is not installed.');
            this.game.events.emit('fluentError', 'Fluent is not installed.');
            return;
        }

        try {
            this.publicClient = createPublicClient({ transport: custom(this.fluent) });
            this.walletClient = createWalletClient({ chain: confluxESpace, transport: custom(this.fluent) });
            const accounts = await this.walletClient.requestAddresses();
            if (accounts.length === 0) {
                console.error('No accounts found');
                this.game.events.emit('fluentError', 'No accounts found.');
                return;
            }

            this.currentAccount = accounts[0];
            const chainId = await this.walletClient.getChainId();
            this.currentChainId = chainId.toString();

            console.log('Connected to Fluent:', this.currentAccount, this.currentChainId);
            this.setupListeners();
            await this.walletClient.switchChain({ id: confluxESpace.id });

            this.game.events.emit('walletConnected', this.currentAccount, this.currentChainId);
            return this.currentAccount as Address;
        } catch (error) {
            this.disconnectWallet();
            console.error('Error connecting to Fluent:', error);
            this.game.events.emit('fluentError', 'Error connecting to Fluent.');
        }
    }

    disconnectWallet(): void {
        this.currentAccount = null;
        this.currentChainId = null;
        console.log('Wallet disconnected');
        this.game.events.emit('walletDisconnected');
    }

    async getBalance(): Promise<string | null> {
        if (!this.publicClient || !this.currentAccount) {
            console.error('Public client is not initialized or no account found.');
            this.game.events.emit('fluentError', 'Public client not initialized or no account.');
            return null;
        }

        try {
            const balance = await this.publicClient.getBalance({ address: this.currentAccount });
            const formattedBalance = formatEther(balance);
            this.game.events.emit('balanceUpdated', formattedBalance);
            return formattedBalance;
        } catch (error) {
            console.error('Error fetching balance:', error);
            this.game.events.emit('fluentError', 'Error fetching balance.');
            return null;
        }
    }

    async sendTransaction(toAccount: Address, amount: string): Promise<string | undefined> {
        if (!this.walletClient || !this.currentAccount) {
            console.error('Wallet client is not initialized or no account found.');
            this.game.events.emit('fluentError', 'Wallet client not initialized or no account.');
            return;
        }

        try {
            const txnResponse = await this.walletClient.sendTransaction({
                account: this.currentAccount,
                to: toAccount,
                value: parseEther(amount.toString()),
            });

            this.game.events.emit('transactionSent', txnResponse.hash);
            return txnResponse.hash;
        } catch (error) {
            console.error('Error sending transaction with Fluent:', error);
            this.game.events.emit('fluentError', 'Error sending transaction.');
        }
    }

    async getBlockNumber(): Promise<number | undefined> {
        if (!this.publicClient) {
            console.error('Public client is not initialized.');
            this.game.events.emit('fluentError', 'Public client not initialized.');
            return;
        }

        try {
            const blockNumber = await this.publicClient.getBlockNumber();
            this.game.events.emit('blockNumberUpdated', blockNumber);
            return blockNumber;
        } catch (error) {
            console.error('Error fetching block number:', error);
            this.game.events.emit('fluentError', 'Error fetching block number.');
        }
    }

    setupListeners(): void {
        if (!this.fluent || !this.walletClient) return;

        this.fluent.on('accountsChanged', (accounts: Address[]) => {
            if (accounts.length === 0) {
                console.error('No accounts connected');
                this.disconnectWallet();
            } else {
                this.currentAccount = accounts[0];
                console.log('Account changed:', this.currentAccount);
                this.game.events.emit('accountChanged', this.currentAccount);
            }
        });

        this.fluent.on('chainChanged', async (chainId: string) => {
            this.currentChainId = chainId;
            console.log('Network changed:', this.currentChainId);

            await this.walletClient?.switchChain({ id: confluxESpace.id });

            this.game.events.emit('chainChanged', this.currentChainId);
        });
    }
}
