import { Scene } from 'phaser';
import { Address } from 'viem';

export class WalletUI {
    private scene: Scene;
    private accountText: Phaser.GameObjects.Text;
    private balanceText: Phaser.GameObjects.Text;
    private connectText: Phaser.GameObjects.Text;
    private chainInfoText: Phaser.GameObjects.Text;
    private submenu: Phaser.GameObjects.Container;

    constructor(scene: Scene, connectHandler: () => void, subMenuActionHandler: (action: string) => void) {
        this.scene = scene;
        this.setupUI(connectHandler, subMenuActionHandler);
    }

    // Initialize UI components
    private setupUI(connectHandler: () => void, subMenuActionHandler: (action: string) => void) {
        // Initially only this is visible as a button, with the text "Connect Wallet" 
        this.connectText = this.scene.add.text(100, 100, 'Connect Wallet', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        }).setInteractive().on('pointerdown', connectHandler);

        // Account text, visible after successfully connected
        this.accountText = this.scene.add.text(100, 150, 'Account: Not connected', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        });

        // Balance text, moved to submenu
        this.balanceText = this.scene.add.text(100, 200, 'Balance: N/A', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        });

        // Chain info text, always visible
        this.chainInfoText = this.scene.add.text(100, 250, 'Chain: N/A', {
            fontSize: '18px',
            backgroundColor: '#444',
            color: '#fff',
            padding: { x: 10, y: 5 }
        });

        // Submenu for additional options
        this.submenu = this.scene.add.container(100, 350);
        this.createSubmenu(subMenuActionHandler);
        this.submenu.setVisible(false);
    }

    // Create submenu with additional wallet options
    private createSubmenu(subMenuActionHandler: (action: string) => void) {
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

            // Pass the event handling responsibility to WalletUIManager
            button.on('pointerdown', () => subMenuActionHandler(buttonConfig.event));
            this.submenu.add(button);
        });
    }

    // Update the displayed account information
    public updateAccountInfo(account: Address | null) {
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
    public updateBalance(balance: string | null) {
        this.balanceText.setText(balance ? `Balance: ${balance} CFX` : 'Balance: N/A');
    }

    // Update the displayed chain information
    public updateChainInfo(chainInfo: any) {
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
}
