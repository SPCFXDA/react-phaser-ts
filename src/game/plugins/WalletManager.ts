  import Phaser from 'phaser';
  import { Address, createPublicClient, createWalletClient, custom, formatEther, parseEther } from 'viem'; // Added parseEther import
  import { confluxESpace } from 'viem/chains';

  export default class WalletManager extends Phaser.Plugins.BasePlugin {
    private publicClient: ReturnType<typeof createPublicClient> | null;
    private walletClient: ReturnType<typeof createWalletClient> | null;
    private currentAccount: Address | null;
    private currentChainId: string | null;
    targetChain: any;

    private metamask: any;

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
      super(pluginManager); 
      this.metamask = window.ethereum && window.ethereum.isMetaMask ? window.ethereum : null;
      this.publicClient = null;
      this.walletClient = null;
      this.currentAccount = null;
      this.currentChainId = null;
      this.targetChain = confluxESpace;
    }

    // Check if MetaMask is installed
    isMetaMaskInstalled(): boolean {
      return !!this.metamask;
    }

    // Connect the wallet using viem's walletClient
    async connect(): Promise<Address | undefined> {
      if (!this.isMetaMaskInstalled()) {
        console.error('MetaMask is not installed.');
        // Trigger an update in MainMenu to show error message
        this.game.events.emit('metaMaskError', 'MetaMask is not installed.');
        return;
      }

      try {
        // Create the public and wallet clients using the MetaMask provider
        this.publicClient = createPublicClient({
          transport: custom(this.metamask),
        });
        this.walletClient = createWalletClient({
          chain: this.targetChain,
          transport: custom(this.metamask),
        });
        // Request account connection
        const accounts = await this.walletClient.requestAddresses();
        if (accounts.length === 0) {
          console.error('No accounts found');
          this.game.events.emit('metaMaskError', 'No accounts found.');
          return;
        }

        this.currentAccount = accounts[0];

        // Fetch the chainId using viem
        const chainId = await this.walletClient.getChainId();
        this.currentChainId = chainId.toString();

        console.log('Connected to MetaMask:', this.currentAccount, this.currentChainId);
        this.setupListeners();
        await this.walletClient?.switchChain({
          id: this.targetChain.id,
        });

        // Emit event to update the MainMenu UI
        this.game.events.emit('walletConnected', this.currentAccount, this.currentChainId);
        return this.currentAccount as Address;
      } catch (error) {
        this.disconnectWallet();
        console.error('Error connecting to MetaMask:', error);
        this.game.events.emit('metaMaskError', 'Error connecting to MetaMask.');
      }
    }

    // Disconnect the wallet (clear account info)
    disconnectWallet(): void {
      this.currentAccount = null;
      this.currentChainId = null;
      console.log('Wallet disconnected');
      this.game.events.emit('walletDisconnected');
    }

    // Method to get the balance of the connected account
    async getBalance(): Promise<string | null> {
      if (!this.publicClient || !this.currentAccount) {
        console.error('Public client is not initialized or no account found.');
        this.game.events.emit('metaMaskError', 'Public client not initialized or no account.');
        return null;
      }

      try {
        const balance = await this.publicClient.getBalance({
          address: this.currentAccount as Address,
        });
        const formattedBalance = formatEther(balance);
        this.game.events.emit('balanceUpdated', formattedBalance);
        return formattedBalance;
      } catch (error) {
        console.error('Error fetching balance:', error);
        this.game.events.emit('metaMaskError', 'Error fetching balance.');
        return null;
      }
    }

    async sendTransaction(toAccount: Address, amount: string) {
      if (!this.walletClient || !this.currentAccount) {
          console.error('Wallet client is not initialized or no account found.');
          this.game.events.emit('metaMaskError', 'Wallet client not initialized or no account.');
          return;
      }

      try {
          const txnResponse = await this.walletClient.sendTransaction({
              account: this.currentAccount,
              to: toAccount,
              value: parseEther(amount.toString()), // Using parseEther here
          });

          this.game.events.emit('transactionSent', txnResponse.hash);
          return txnResponse.hash;
      } catch (error) {
          console.error('Error sending transaction with MetaMask using viem:', error);
          this.game.events.emit('metaMaskError', 'Error sending transaction.');
      }
    }

    async getBlockNumber() {
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
          console.error('Error fetching block number from MetaMask using viem:', error);
          this.game.events.emit('metaMaskError', 'Error fetching block number.');
      }
    }

    // Setup listeners for account and network change events
    setupListeners(): void {
      if (!this.metamask || !this.walletClient) return;

      // Watch for account changes using viem's walletClient
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

      // Watch for network changes using viem's walletClient
      this.metamask.on('chainChanged', async (chainId: string) => {
        this.currentChainId = chainId;
        console.log('Network changed:', this.currentChainId);

        await this.walletClient?.switchChain({
          id: this.targetChain.id,
        });

        this.game.events.emit('chainChanged', this.currentChainId);
      });
    }

    // Get the connected account address
    getAccount(): Address | null {
      return this.currentAccount;
    }

    // Get the current chain ID (network)
    getChainId(): string | null {
      return this.currentChainId;
    }

    // Check if MetaMask is connected
    isConnected(): boolean {
      return this.currentAccount !== null;
    }

    // Switch networks using viem's walletClient
    async switchNetwork(_chainId: string): Promise<void> {
      if (!this.walletClient) {
        console.error('Viem wallet client not found');
        this.game.events.emit('metaMaskError', 'Wallet client not found.');
        return;
      }

      try {
        await this.walletClient.switchChain({
          id: this.targetChain.id,
        });

        console.log(`Network switched to: ${this.targetChain.name}`);
        this.game.events.emit('networkSwitched', this.targetChain.name);
      } catch (error) {
        if (error.code === 4902) {
          console.error('Network not added to MetaMask');
          this.game.events.emit('metaMaskError', 'Network not added to MetaMask.');
        } else {
          console.error('Error switching network:', error);
          this.game.events.emit('metaMaskError', 'Error switching network.');
        }
      }
    }
  }
