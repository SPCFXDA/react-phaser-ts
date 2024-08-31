import { Scene } from 'phaser';
import { WalletPlugin } from '../plugins/WalletPlugin';
import { EventBus } from '../EventBus';
import { Address } from 'viem';

export class WalletUIManager {
    private scene: Scene;
    private walletPlugin: WalletPlugin;

    private accountText: Phaser.GameObjects.Text;
    private balanceText: Phaser.GameObjects.Text;
    private connectText: Phaser.GameObjects.Text;
    private chainInfoText: Phaser.GameObjects.Text;
    private submenu: Phaser.GameObjects.Container;
    private isLoading: boolean;
    private activeCalls: Record<string, boolean>;

    constructor(scene: Scene, walletPlugin: WalletPlugin) {
        this.scene = scene;
        this.walletPlugin = walletPlugin;
        this.isLoading = false;
        this.activeCalls = {};

        this.setupUI();
        this.setupEventListeners();
    }

    // Initialize UI components
    private setupUI() {
        this.accountText = this.scene.add.text(100, 150, 'Account: Not connected', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        });

        this.balanceText = this.scene.add.text(100, 200, 'Balance: N/A', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        });

        this.connectText = this.scene.add.text(100, 100, 'Connect Wallet', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        this.chainInfoText = this.scene.add.text(100, 250, 'Chain: N/A', {
            fontSize: '18px',
            backgroundColor: '#444',
            color: '#fff',
            padding: { x: 10, y: 5 }
        });

        this.submenu = this.scene.add.container(100, 350);
        this.createSubmenu();
        this.submenu.setVisible(false);
    }

    // Set up event listeners for UI interactions
    private setupEventListeners() {
        this.connectText.on('pointerdown', () => this.handleWalletConnection());
        EventBus.on('wallet-connection-changed', () => this.updateUIWithWalletStatus());
    }

    // Handle wallet connection and update UI based on status
    private async handleWalletConnection() {
        const space = 'espace'; // or dynamically set based on user input
        this.walletPlugin.setCurrentSpace(space);
        const managers = this.walletPlugin.getAvailableManagers();
        
        if (managers.length === 0) {
            console.error("No available wallet managers for the selected space.");
            return;
        }
        
        this.walletPlugin.setCurrentManager(managers[0]);

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

    // Update the UI to reflect the current wallet status
    private async updateUIWithWalletStatus() {
        const account = this.walletPlugin.currentAccount;
        this.updateAccountInfo(account);
        if (account) {
            await this.updateBalanceInfo();
            this.updateChainInfo(this.walletPlugin.getChainInfo());
        } else {
            this.updateBalance(null);
            this.updateChainInfo(null);
        }
    }

    // Method to update balance info
    private async updateBalanceInfo() {
        const balance = await this.walletPlugin.getBalance();
        this.updateBalance(balance);
    }

    // Wrap wallet operations with global loading status and button text updates
    private async executeWithLoading<T>(callName: string, buttonTextOnStart: string, callback: () => Promise<T>): Promise<T | undefined> {
        try {
            this.isLoading = true;
            this.activeCalls[callName] = true;
            this.updateGlobalLoadingStatus();
            this.updateButtonText(callName, buttonTextOnStart);

            const result = await callback();
            return result;
        } catch (error) {
            console.error(`${callName} failed:`, error);
            return undefined;
        } finally {
            this.activeCalls[callName] = false;
            this.isLoading = Object.values(this.activeCalls).some(call => call === true);
            this.updateGlobalLoadingStatus();
            this.updateButtonText(callName, this.getButtonDefaultText(callName));
        }
    }

    // Update the global loading status display
    private updateGlobalLoadingStatus() {
        if (this.isLoading) {
            console.log('Loading...');
            // Optionally update global loading indicator here
            // For example, you could have a global loading text or spinner
        } else {
            console.log('Loading complete');
            // Optionally hide global loading indicator here
        }
    }

    // Update button text based on the call name
    private updateButtonText(callName: string, text: string) {
        const button = this.getButtonByName(callName);
        if (button) {
            button.setText(text);
        }
    }

    // Retrieve a button by its associated name
    private getButtonByName(name: string): Phaser.GameObjects.Text | null {
        const buttons = {
            viewBalance: this.submenu.getAt(0) as Phaser.GameObjects.Text,
            sendTransaction: this.submenu.getAt(1) as Phaser.GameObjects.Text,
            getBlockNumber: this.submenu.getAt(2) as Phaser.GameObjects.Text,
            switchNetwork: this.submenu.getAt(3) as Phaser.GameObjects.Text,
            connectWallet: this.connectText,
            disconnectWallet: this.connectText
        };
        return buttons[name] || null;
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

    // Update the displayed account information
    private updateAccountInfo(account: Address | null) {
        if (account) {
            this.accountText.setText(`Account: ${account}`);
            this.connectText.setText('Disconnect Wallet');
            this.submenu.setVisible(true);
        } else {
            this.accountText.setText('Account: Not connected');
            this.connectText.setText('Connect Wallet');
            this.submenu.setVisible(false);
        }
    }

    // Update the displayed balance
    private updateBalance(balance: string | null) {
        this.balanceText.setText(balance ? `Balance: ${balance} CFX` : 'Balance: N/A');
    }

    // Update the displayed chain information
    private updateChainInfo(chainInfo: any) {
        if (chainInfo) {
            const { name, nativeCurrency, rpcUrls, blockExplorers } = chainInfo;
            this.chainInfoText.setText(
                `Chain: ${name}\n` +
                `Native Currency: ${nativeCurrency.name} (${nativeCurrency.symbol})\n` +
                `RPC URL: ${rpcUrls.default.http[0]}\n` +
                `Block Explorer: ${blockExplorers.default.url}`
            );
        } else {
            this.chainInfoText.setText('Chain: N/A');
        }
    }

    // Create submenu with additional wallet options
    private createSubmenu() {
        const buttons = [
            { text: 'View Balance', event: 'viewBalance' },
            { text: 'Send Transaction', event: 'sendTransaction' },
            { text: 'Get Block Number', event: 'getBlockNumber' },
            { text: 'Switch Network', event: 'switchNetwork' }
        ];

        buttons.forEach((buttonConfig, index) => {
            const button = this.scene.add.text(0, index * 40, buttonConfig.text, {
                fontSize: '18px',
                backgroundColor: '#444',
                color: '#fff',
                padding: { x: 8, y: 5 }
            }).setInteractive();

            button.on('pointerdown', () => this.handleSubMenuAction(buttonConfig.event));
            this.submenu.add(button);
        });
    }

    // Handle submenu actions based on button text
    private async handleSubMenuAction(action: string) {
        switch (action) {
            case 'viewBalance':
                await this.executeWithLoading('viewBalance', 'Fetching Balance...', async () => {
                    const balance = await this.walletPlugin.getBalance();
                    this.updateBalance(balance);
                });
                break;
            case 'sendTransaction':
                await this.executeWithLoading('sendTransaction', 'Sending Transaction...', async () => {
                    const txHash = await this.walletPlugin.sendTransaction(this.walletPlugin.currentAccount!, '0.1');
                    console.log(`Transaction Hash: ${txHash}`);
                });
                break;
            case 'getBlockNumber':
                await this.executeWithLoading('getBlockNumber', 'Fetching Block Number...', async () => {
                    const blockNumber = await this.walletPlugin.getBlockNumber();
                    console.log(`Block Number: ${blockNumber}`);
                });
                break;
            case 'switchNetwork':
                // Example: Switch network (implementation not shown)
                break;
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }
}
