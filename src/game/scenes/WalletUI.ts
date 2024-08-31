import { Scene } from 'phaser';
import { Address } from 'viem';
import { SubmenuButton } from './SubmenuButton.ts'; // Import SubmenuButton
import { ConnectButton } from './ConnectButton.ts'; // Import SubmenuButton

export class WalletUI {
    private scene: Scene;
    private connectButton: Phaser.GameObjects.Container;
    private balanceText: Phaser.GameObjects.Text;
    private connectText: Phaser.GameObjects.Text;
    private submenu: Phaser.GameObjects.Container;
    private menu: Phaser.GameObjects.Container;

    private submenuButtons: Record<string, SubmenuButton> = {}; // Store SubmenuButton instances
    private chainInfo: any;

    constructor(scene: Scene, connectHandler: () => void, subMenuActionHandler: (action: string) => void) {
        this.scene = scene;
        this.setupUI(connectHandler, subMenuActionHandler);
        this.chainInfo = { name: null, nativeCurrency: null, rpcUrls: null, blockExplorers: null }
    }

    // Initialize UI components
    private setupUI(connectHandler: () => void, subMenuActionHandler: (action: string) => void) {
        this.connectButton =  this.scene.add.container(350, 350);
        this.connectButton.add(new ConnectButton(this.scene, 0, 0, "C", connectHandler));

        this.menu = this.scene.add.container(980, 45);
        this.createMenu(connectHandler);
        this.menu.setVisible(true);

        this.submenu = this.scene.add.container(300, 350);
        this.createSubmenu(subMenuActionHandler);
        this.submenu.setVisible(false);
    }

    private createMenu(connectHandler: (action: string) => void) {
        // this.accountText = this.scene.add.text(100, 150, 'Account: Not connected', {
        //     fontSize: '20px',
        //     backgroundColor: '#333',
        //     color: '#000',
        //     padding: { x: 10, y: 5 }
        // });

        this.balanceText = this.scene.add.text(100, 200, 'Balance: N/A', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        });
    }

    // Create submenu with additional wallet options using SubmenuButton
    private createSubmenu(subMenuActionHandler: (action: string) => void) {
        const buttons = [
            { text: 'View Balance', event: 'viewBalance' },
            { text: 'Send Transaction', event: 'sendTransaction' },
            { text: 'Get Block Number', event: 'getBlockNumber' },
            { text: 'Disconnect Wallet', event: 'disconnect' }
        ];
        buttons.forEach((buttonConfig, index) => {
            const button = new SubmenuButton(this.scene, 0, index * 70, buttonConfig.text, () => subMenuActionHandler(buttonConfig.event));
            this.submenu.add(button);

            // Store reference to button for updating text
            this.submenuButtons[buttonConfig.event] = button;
        });
    }

    // Method to update the text of a specific submenu button
    public updateButtonText(action: string, text: string) {
        const button = this.submenuButtons[action];
        if (button) {
            button.setText(text);
        }
    }

    // Update the displayed account information
    public updateAccountInfo(account: Address | null) {
        if (account) {
            // this.accountText.setText(`Account: ${account}`);
            // this.connectText.setText('Disconnect Wallet');
            this.submenu.setVisible(true);
        } else {
            // this.accountText.setText('Account: Not connected');
            // this.connectText.setText('Connect Wallet');
            this.submenu.setVisible(false);
        }
    }

    // Update the displayed balance
    public updateBalance(balance: string | null) {
        // this.balanceText.setText(balance ? `Balance: ${balance} CFX` : 'Balance: N/A');
    }

    // Update the displayed chain information
    public updateChainInfo(chainInfo: any) {
        if (chainInfo) {
            this.chainInfo = chainInfo;
        } else {
            // 
        }
    }
}
