import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { WalletPlugin } from '../plugins/WalletPlugin';
import { WalletUIManager } from './WalletUIManager.ts';

export class MainMenu extends Scene {
    private walletPlugin: WalletPlugin;
    private walletUIManager: WalletUIManager;
    constructor() {
        super('MainMenu');
    }

    preload() {
        this.load.plugin('WalletPlugin', WalletPlugin, true);
    }

    async create() {
        this.walletPlugin = this.plugins.get('WalletPlugin') as WalletPlugin;
        if (!this.walletPlugin) {
            console.error('WalletPlugin not found');
            return;
        }
        this.walletUIManager = new WalletUIManager(this, this.walletPlugin);
        console.log(this.walletUIManager)

        EventBus.emit('current-scene-ready', this);
    }

}
