import { Address, createPublicClient, createWalletClient, custom, formatCFX, parseCFX } from 'cive';
import { mainnet} from 'cive/chains'

import { BaseWalletManager } from './BaseWalletManager';

declare const window: any;

export class FluentWalletManagerCore extends BaseWalletManager {
    private fluentCore: any;

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager);
        this.fluentCore = window.conflux && window.conflux.isFluent ? window.conflux : null;
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
        return mainnet
    }

    isWalletInstalled(): boolean {
        return !!this.fluentCore;
    }

    async connect(): Promise<Address | undefined> {
        if (!this.isWalletInstalled()) {
            console.error('Fluent is not installed.');
            this.game.events.emit('fluentError', 'Fluent is not installed.');
            return;
        }

        try {
            const accounts = await this.fluentCore.request({ method: 'cfx_requestAccounts' });
            this.publicClient = createPublicClient({ transport: custom(this.fluentCore) });
            this.walletClient = createWalletClient({ account: accounts[0], chain: mainnet, transport: custom(this.fluentCore) });
            // await this.walletClient.switchChain({ id: mainnet.id }) 
            // const accounts = await this.walletClient.requestAddresses();
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
            // await this.walletClient.switchChain({ id: mainnet.id });
            if(chainId !== mainnet.id) {
                await this.walletClient?.switchChain({ id: mainnet.id });
            }
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
            const formattedBalance = formatCFX(balance);
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
                value: parseCFX(amount.toString()),
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
            const block = await this.publicClient.getBlock();
            this.game.events.emit('blockNumberUpdated', block.blockNumber);
            return block.blockNumber;
        } catch (error) {
            console.error('Error fetching block number:', error);
            this.game.events.emit('fluentError', 'Error fetching block number.');
        }
    }

    setupListeners(): void {
        if (!this.fluentCore || !this.walletClient) return;

        this.fluentCore.on('accountsChanged', (accounts: Address[]) => {
            if (accounts.length === 0) {
                console.error('No accounts connected');
                this.disconnectWallet();
            } else {
                const account = accounts[0] as Address
                this.currentAccount = account;
                console.log('Account changed:', this.currentAccount);
                this.game.events.emit('accountChanged', this.currentAccount);
            }
        });

        this.fluentCore.on('chainChanged', async (chainId: string) => {
            this.currentChainId = chainId;
            console.log('Network changed:', this.currentChainId);

            await this.walletClient?.switchChain({ id: mainnet.id });

            this.game.events.emit('chainChanged', this.currentChainId);
        });
    }
}
