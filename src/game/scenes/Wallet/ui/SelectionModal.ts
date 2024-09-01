import { Scene, GameObjects } from 'phaser';
import { WalletPlugin } from '../../../plugins/WalletPlugin'; // Adjust the path as needed

export class SelectionModal extends GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private spaceText: Phaser.GameObjects.Text;
    private managerText: Phaser.GameObjects.Text;
    private spaceOptions: Phaser.GameObjects.Text[];
    private managerOptions: Phaser.GameObjects.Text[];
    private confirmButton: Phaser.GameObjects.Text;
    private cancelButton: Phaser.GameObjects.Text;
    private selectedSpace: string | null = null;
    private selectedManager: string | null = null;
    private onConfirmCallback: (space: string, manager: string) => void;
    private onCancelCallback: () => void;
    private walletPlugin: WalletPlugin;

    constructor(scene: Scene, x: number, y: number, walletPlugin: WalletPlugin, onConfirm: (space: string, manager: string) => void, onCancel: () => void) {
        const centerX = scene.scale.width / 2;
        const centerY = scene.scale.height / 2;
        super(scene, centerX, centerY);

        this.walletPlugin = walletPlugin;
        this.onConfirmCallback = onConfirm;
        this.onCancelCallback = onCancel;

        // Background
        this.background = scene.add.rectangle(0, 0, 400, 300, 0x000000, 0.8);
        this.background.setOrigin(0.5, 0.5);
        this.background.setInteractive();
        this.add(this.background);

        // Text Labels
        this.spaceText = scene.add.text(-180, -100, 'Select Space:', {
            fontSize: '18px',
            color: '#ffffff'
        });
        this.managerText = scene.add.text(-180, 0, 'Select Manager:', {
            fontSize: '18px',
            color: '#ffffff'
        });
        this.add(this.spaceText);
        this.add(this.managerText);

        // Populate the modal with options
        this.populateSpaceOptions();

        // Confirm and Cancel Buttons
        this.confirmButton = scene.add.text(65, 100, 'Confirm', {
            fontSize: '18px',
            backgroundColor: '#5cb85c',
            color: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setInteractive();

        this.cancelButton = scene.add.text(-180, 100, 'Cancel', {
            fontSize: '18px',
            backgroundColor: '#d9534f',
            color: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setInteractive();

        this.confirmButton.on('pointerdown', () => this.confirmSelection());
        this.cancelButton.on('pointerdown', () => this.cancelSelection());

        this.add(this.cancelButton);
        this.add(this.confirmButton);

        // Initially hide modal
        this.setVisible(false);
        scene.add.existing(this);
    }

    private populateSpaceOptions() {
        const spaces = this.walletPlugin.getAvailableSpaces();
        this.spaceOptions = spaces.map((space, index) => {
            const option = this.scene.add.text(-180, -70 + (index * 30), space, {
                fontSize: '16px',
                backgroundColor: '#333',
                color: '#ffffff',
                padding: { x: 10, y: 5 }
            }).setInteractive();

            option.on('pointerdown', () => this.selectSpace(space));
            this.add(option);
            return option;
        });

        // Automatically select the first space
        if (spaces.length > 0) {
            this.selectSpace(spaces[0]);
        }
    }

    private populateManagerOptions() {
        if (!this.selectedSpace) {
            return;
        }
        const managers = this.walletPlugin.getAvailableManagers();
        this.managerOptions = managers.map((manager, index) => {
            const managerName = manager; // Assuming managers have distinct constructor names
            const option = this.scene.add.text(-180, 20 + (index * 30), managerName, {
                fontSize: '16px',
                backgroundColor: '#333',
                color: '#ffffff',
                padding: { x: 10, y: 5 }
            }).setInteractive();

            option.on('pointerdown', () => this.selectManager(managerName));
            this.add(option);
            return option;
        });

        // Automatically select the first manager
        if (managers.length > 0) {
            this.selectManager(managers[0]);
        }
    }

    private selectSpace(space: string) {
        this.selectedSpace = space;
        this.walletPlugin.setCurrentSpace(space as 'core' | 'espace');
        this.spaceOptions.forEach(option => {
            option.setBackgroundColor(option.text === space ? '#555' : '#333');
        });

        // Populate manager options based on selected space
        this.clearManagerOptions();
        this.populateManagerOptions();
    }

    private selectManager(managerName: string) {
        this.selectedManager = managerName;
        this.managerOptions.forEach(option => {
            option.setBackgroundColor(option.text === managerName ? '#555' : '#333');
        });
    }

    private clearManagerOptions() {
        if (this.managerOptions) {
            this.managerOptions.forEach(option => option.destroy());
        }
        this.managerOptions = [];
    }

    private confirmSelection() {
        if (this.selectedSpace && this.selectedManager) {
            this.onConfirmCallback(this.selectedSpace, this.selectedManager);
            this.setVisible(false);
        } else {
            console.warn('Space and manager must be selected');
        }
    }

    private cancelSelection() {
        this.setVisible(false);
        this.onCancelCallback();
    }

    public show() {
        this.setVisible(true);

        // Pre-select the first space and manager every time the modal is shown
        const spaces = this.walletPlugin.getAvailableSpaces();
        if (spaces.length > 0) {
            this.selectSpace(spaces[0]);
        }

        const managers = this.walletPlugin.getAvailableManagers();
        if (managers.length > 0) {
            this.selectManager(managers[0]);
        }
    }
}
