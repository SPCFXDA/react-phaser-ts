import { Scene } from 'phaser';
import { WalletPlugin } from '../plugins/WalletPlugin';
import { EventBus } from '../EventBus';
import { WalletUI } from './WalletUI';
import { WalletActions } from './WalletActions';

export class WalletUIManager {
    private scene: Scene;
    private walletPlugin: WalletPlugin;
    private walletUI: WalletUI;
    private walletActions: WalletActions;

    constructor(scene: Scene, walletPlugin: WalletPlugin) {
        this.scene = scene;
        this.walletPlugin = walletPlugin;

        this.walletUI = new WalletUI(scene, this.handleWalletConnection.bind(this), this.handleSubMenuAction.bind(this));
        this.walletActions = new WalletActions(walletPlugin, this.updateUIWithWalletStatus.bind(this));

        // Link WalletUI with WalletActions to allow text updates
        this.walletActions.setWalletUI(this.walletUI); // Add this line

        this.setupEventListeners();
    }

    private setupEventListeners() {
        EventBus.on('wallet-connection-changed', () => this.updateUIWithWalletStatus());
    }

    private async handleWalletConnection() {
        await this.walletActions.handleWalletConnection();
    }

    private async updateUIWithWalletStatus() {
        const account = this.walletPlugin.currentAccount;
        this.walletUI.updateAccountInfo(account);
        if (account) {
            await this.walletActions.updateBalanceInfo();
            this.walletUI.updateChainInfo(this.walletPlugin.getChainInfo());
        } else {
            this.walletUI.updateBalance(null);
            this.walletUI.updateChainInfo(null);
        }
    }

    private async handleSubMenuAction(action: string) {
        switch (action) {
            case 'viewBalance':
                await this.walletActions.executeWithLoading('viewBalance', 'Fetching Balance...', async () => {
                    const balance = await this.walletPlugin.getBalance();
                    this.walletUI.updateBalance(balance);
                });
                break;
            case 'sendTransaction':
                await this.walletActions.executeWithLoading('sendTransaction', 'Sending Transaction...', async () => {
                    const txHash = await this.walletPlugin.sendTransaction(this.walletPlugin.currentAccount!, '0.1');
                    console.log(`Transaction Hash: ${txHash}`);
                });
                break;
            case 'getBlockNumber':
                await this.walletActions.executeWithLoading('getBlockNumber', 'Fetching Block Number...', async () => {
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
