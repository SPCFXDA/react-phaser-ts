import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { WalletPlugin } from '../plugins/WalletPlugin';
import { WalletHUD } from './Wallet/WalletHUD';

export class MainMenu extends Scene {
    private walletPlugin: WalletPlugin;
    private walletHUD: WalletHUD;
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
        this.walletHUD = new WalletHUD(this, this.walletPlugin);

        EventBus.emit('current-scene-ready', this);
    }

}
