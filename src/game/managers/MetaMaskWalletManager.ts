import { Address, createPublicClient, createWalletClient, custom, formatEther, parseEther } from 'viem';
import { confluxESpace } from 'viem/chains';
import { BaseWalletManager } from './BaseWalletManager';

declare const window: any;

export class MetaMaskWalletManager extends BaseWalletManager {
    private metamask: any;

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager);
        this.metamask = window.ethereum && window.ethereum.isMetaMask ? window.ethereum : null;
    }

    isWalletInstalled(): boolean {
        return !!this.metamask;
    }

    async connect(): Promise<Address | undefined> {
        if (!this.isWalletInstalled()) {
            console.error('MetaMask is not installed.');
            this.game.events.emit('metaMaskError', 'MetaMask is not installed.');
            return;
        }

        try {
            this.publicClient = createPublicClient({ transport: custom(this.metamask) });
            this.walletClient = createWalletClient({ chain: confluxESpace, transport: custom(this.metamask) });
            const accounts = await this.walletClient.requestAddresses();
            if (accounts.length === 0) {
                console.error('No accounts found');
                this.game.events.emit('metaMaskError', 'No accounts found.');
                return;
            }

            this.currentAccount = accounts[0];
            const chainId = await this.walletClient.getChainId();
            this.currentChainId = chainId.toString();

            console.log('Connected to MetaMask:', this.currentAccount, this.currentChainId);
            this.setupListeners();
            await this.walletClient.switchChain({ id: confluxESpace.id });

            this.game.events.emit('walletConnected', this.currentAccount, this.currentChainId);
            return this.currentAccount as Address;
        } catch (error) {
            this.disconnectWallet();
            console.error('Error connecting to MetaMask:', error);
            this.game.events.emit('metaMaskError', 'Error connecting to MetaMask.');
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
            this.game.events.emit('metaMaskError', 'Public client not initialized or no account.');
            return null;
        }

        try {
            const balance = await this.publicClient.getBalance({ address: this.currentAccount });
            const formattedBalance = formatEther(balance);
            this.game.events.emit('balanceUpdated', formattedBalance);
            return formattedBalance;
        } catch (error) {
            console.error('Error fetching balance:', error);
            this.game.events.emit('metaMaskError', 'Error fetching balance.');
            return null;
        }
    }

    async sendTransaction(toAccount: Address, amount: string): Promise<string | undefined> {
        if (!this.walletClient || !this.currentAccount) {
            console.error('Wallet client is not initialized or no account found.');
            this.game.events.emit('metaMaskError', 'Wallet client not initialized or no account.');
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
            console.error('Error sending transaction with MetaMask:', error);
            this.game.events.emit('metaMaskError', 'Error sending transaction.');
        }
    }

    async getBlockNumber(): Promise<number | undefined> {
        if (!this.publicClient) {
            console.error('Public client is not initialized.');
            this.game.events.emit('metaMaskError', 'Public client not initialized.');
            return;
        }

        try {
            const blockNumber = await this.publicClient.getBlockNumber();
            this.game.events.emit('blockNumberUpdated', blockNumber);
            return blockNumber;
        } catch (error) {
            console.error('Error fetching block number:', error);
            this.game.events.emit('metaMaskError', 'Error fetching block number.');
        }
    }

    setupListeners(): void {
        if (!this.metamask || !this.walletClient) return;

        this.metamask.on('accountsChanged', (accounts: Address[]) => {
            if (accounts.length === 0) {
                console.error('No accounts connected');
                this.disconnectWallet();
            } else {
                this.currentAccount = accounts[0];
                console.log('Account changed:', this.currentAccount);
                this.game.events.emit('accountChanged', this.currentAccount);
            }
        });

        this.metamask.on('chainChanged', async (chainId: string) => {
            this.currentChainId = chainId;
            console.log('Network changed:', this.currentChainId);

            await this.walletClient?.switchChain({ id: confluxESpace.id });

            this.game.events.emit('chainChanged', this.currentChainId);
        });
    }
}
