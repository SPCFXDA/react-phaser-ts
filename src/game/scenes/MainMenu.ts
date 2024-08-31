import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Address } from 'viem';
import { WalletPlugin } from '../plugins/WalletPlugin';

export class MainMenu extends Scene {
    private walletPlugin: WalletPlugin;
    private accountText: Phaser.GameObjects.Text;
    private balanceText: Phaser.GameObjects.Text;
    private connectText: Phaser.GameObjects.Text;
    private chainInfoText: Phaser.GameObjects.Text;
    private submenu: Phaser.GameObjects.Container;
    private isLoading: boolean;
    private activeCalls: Record<string, boolean>;

    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor() {
        super('MainMenu');
        this.isLoading = false;
        this.activeCalls = {};
    }

    preload ()
    {
        this.load.plugin('WalletPlugin', WalletPlugin, true);
    }

    async create() {
        this.walletPlugin = this.plugins.get('WalletPlugin') as WalletPlugin;
        console.log(this.walletPlugin)
        if (!this.walletPlugin) {
            console.error('WalletPlugin not found');
            return;
        }

        this.setupUI();
        this.setupEventListeners();

        EventBus.emit('current-scene-ready', this);
    }

    // Set up all UI elements
    private setupUI() {
        this.background = this.add.image(512, 384, 'background');

        this.connectText = this.add.text(100, 100, 'Connect Wallet', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        this.accountText = this.add.text(100, 150, 'Account: Not connected', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        });

        this.balanceText = this.add.text(100, 200, 'Balance: N/A', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        });

        this.chainInfoText = this.add.text(100, 250, 'Chain: N/A', {
            fontSize: '18px',
            backgroundColor: '#444',
            color: '#fff',
            padding: { x: 10, y: 5 }
        });

        this.submenu = this.add.container(100, 350);
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
        this.walletPlugin.setCurrentManager('Fluent')
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
    private updateUIWithWalletStatus() {
        const account = this.walletPlugin.currentAccount;
        this.updateAccountInfo(account);
        if (account) {
            this.updateBalanceInfo();
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
    async executeWithLoading<T>(callName: string, buttonTextOnStart: string, callback: () => Promise<T>): Promise<T | undefined> {
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
    updateGlobalLoadingStatus() {
        if (this.isLoading) {
            console.log('Loading...');
        } else {
            console.log('Loading complete');
        }
    }

    // Update button text based on the call name
    updateButtonText(callName: string, text: string) {
        const button = this.getButtonByName(callName);
        if (button) button.setText(text);
    }

    // Retrieve a button by its associated name
    getButtonByName(name: string): Phaser.GameObjects.Text | null {
        const buttons = {
            viewBalance: this.submenu.getAt(0),
            sendTransaction: this.submenu.getAt(1),
            getBlockNumber: this.submenu.getAt(2),
            switchNetwork: this.submenu.getAt(3),
            connectWallet: this.connectText,
            disconnectWallet: this.connectText
        };
        return buttons[name] as Phaser.GameObjects.Text || null;
    }

    // Get default text for each button
    getButtonDefaultText(name: string): string {
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
    updateAccountInfo(account: Address | null) {
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
    updateBalance(balance: string | null) {
        this.balanceText.setText(balance ? `Balance: ${balance} CFX` : 'Balance: N/A');
    }

    // Update the displayed chain information
    updateChainInfo(chainInfo: any) {
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
    createSubmenu() {
        const buttons = [
            { text: 'View Balance', event: 'viewBalance' },
            { text: 'Send Transaction', event: 'sendTransaction' },
            { text: 'Get Block Number', event: 'getBlockNumber' },
            { text: 'Switch Network', event: 'switchNetwork' }
        ];

        buttons.forEach((buttonConfig, index) => {
            const button = this.add.text(0, index * 40, buttonConfig.text, {
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
                await this.executeWithLoading('viewBalance', 'Loading...', () => this.walletPlugin.getBalance().then(balance => {
                    this.updateBalance(balance);
                }));
                break;
            case 'sendTransaction':
                const account = await this.walletPlugin.getAccount();
                if (account) {
                    await this.executeWithLoading('sendTransaction', 'Sending...', () => this.walletPlugin.sendTransaction(account, "1"));
                }
                break;
            case 'getBlockNumber':
                await this.executeWithLoading('getBlockNumber', 'Fetching...', async () => {
                    const blockNumber = await this.walletPlugin.getBlockNumber();
                    console.log(`Current Block Number: ${blockNumber}`);
                });
                break;
            case 'switchNetwork':
                await this.executeWithLoading('switchNetwork', 'Switching...', () => this.walletPlugin.switchChain());
                break;
            default:
                console.error(`Unknown action: ${action}`);
        }
    }
}

export default MainMenu;
