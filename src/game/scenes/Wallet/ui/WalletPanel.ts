import { Scene, GameObjects } from 'phaser';
import { GenericButton } from './GenericButton'; // Adjust path as needed
import { WalletPlugin } from '../../../plugins/WalletPlugin';

export class WalletPanel extends GameObjects.Container {
    private mainRect: Phaser.GameObjects.Rectangle;
    private chainLabel: Phaser.GameObjects.Text;
    private accountLabel: Phaser.GameObjects.Text;
    private menuButton: GenericButton;
    private submenuRect: Phaser.GameObjects.Rectangle;
    private submenuVisible: boolean;
    private walletPlugin: WalletPlugin; // Store a reference to WalletPlugin
    private submenuButtons: GenericButton[]; // Array to hold submenu buttons
    private updateUIWithWalletStatus: () => void;

    constructor(scene: Scene, x: number, y: number, walletPlugin: WalletPlugin, updateUIWithWalletStatus: () => void) {
        super(scene, x, y);
        this.updateUIWithWalletStatus = updateUIWithWalletStatus;
        this.walletPlugin = walletPlugin;
        this.submenuVisible = false;
        this.submenuButtons = []; // Initialize the array for submenu buttons

        // Create the main rectangle
        this.mainRect = scene.add.rectangle(0, 0, 400, 100, 0x333333).setOrigin(0.5);
        this.add(this.mainRect);

        // Create the chain label
        this.chainLabel = scene.add.text(-150, -20, 'Chain Info:', { fontSize: '16px', color: '#ffffff' }).setOrigin(0, 0.5);
        this.add(this.chainLabel);

        // Create the account label
        this.accountLabel = scene.add.text(-150, 20, 'Account Info:', { fontSize: '16px', color: '#ffffff' }).setOrigin(0, 0.5);
        this.add(this.accountLabel);

        // Create the menu button
        this.menuButton = new GenericButton(scene, 150, 0, 'Menu', () => this.toggleSubmenu());
        this.add(this.menuButton);

        // Create the submenu rectangle
        this.submenuRect = scene.add.rectangle(0, 150, 400, 200, 0x444444).setOrigin(0.5).setVisible(false);
        this.add(this.submenuRect);

        // Create submenu buttons
        this.createSubmenuButtons(scene);

        // Add container to the scene
        scene.add.existing(this);
    }

    private toggleSubmenu() {
        this.submenuVisible = !this.submenuVisible;
        this.submenuRect.setVisible(this.submenuVisible);

        // Set visibility of all submenu buttons to match the submenu
        this.submenuButtons.forEach(button => button.setVisible(this.submenuVisible));
        
        // Update the menuButton appearance to indicate it is "pressed" or "not pressed"
        this.menuButton.setPressedState(this.submenuVisible); // Custom method to set the button state based on submenu visibility
    }

    private createSubmenuButtons(scene: Scene) {
        // Create and position the buttons vertically under each other
        const buttonData = [
            { label: 'View Balance', action: async (button: GenericButton) => {
                button.showLoadingState(); // Set to loading state
                try {
                    const balance = await this.walletPlugin.getBalance();
                    console.log('Balance:', balance);
                } finally {
                    button.resetState(); // Reset state after completion
                }
            }},
            { label: 'Send Transaction', action: async (button: GenericButton) => {
                button.showLoadingState();
                try {
                    const account = this.walletPlugin.currentAccount;
                    if (account) {
                        await this.walletPlugin.sendTransaction(account, '0.1');
                        console.log('Transaction sent');
                    }
                } finally {
                    button.resetState();
                }
            }},
            { label: 'Get Block Number', action: async (button: GenericButton) => {
                button.showLoadingState();
                try {
                    const blockNumber = await this.walletPlugin.getBlockNumber();
                    console.log('Block Number:', blockNumber);
                } finally {
                    button.resetState();
                }
            }},
            { label: 'Disconnect', action: async (button: GenericButton) => {
                button.showLoadingState();
                try {
                    await this.walletPlugin.disconnectWallet();
                    this.updateUIWithWalletStatus();
                    console.log('Wallet disconnected');
                } finally {
                    button.resetState();
                }
            }},
        ];

        let yOffset = 80; // Initial Y offset for the first button
        const buttonSpacing = 40; // Space between buttons

        buttonData.forEach(({ label, action }) => {
            const button = new GenericButton(scene, 0, yOffset, label, () => action(button));
            button.setVisible(false); // Initially hidden, controlled by the submenu visibility
            this.add(button);
            this.submenuButtons.push(button); // Add to the array of submenu buttons
            yOffset += buttonSpacing; // Update Y offset for the next button
        });
    }

    public updateChainInfo(chainInfo: string) {
        this.chainLabel.setText(`${chainInfo}`);
    }

    public updateAccountInfo(accountInfo: string) {
        this.accountLabel.setText(`${accountInfo}`);
    }

    // Expose menu button for WalletControls
    public getMenuButton(): GenericButton {
        return this.menuButton;
    }

    // Expose submenu rectangle for WalletControls
    public getSubmenuRect(): Phaser.GameObjects.Rectangle {
        return this.submenuRect;
    }
}
