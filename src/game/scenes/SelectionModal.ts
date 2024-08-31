import { Scene, GameObjects } from 'phaser';

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

    constructor(scene: Scene, x: number, y: number, onConfirm: (space: string, manager: string) => void) {
        super(scene, x, y);

        this.onConfirmCallback = onConfirm;

        // Background
        this.background = scene.add.rectangle(0, 0, 400, 300, 0x000000, 0.8);
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

        // Options for Space and Manager
        this.spaceOptions = ['espace', 'core'].map((space, index) => {
            const option = scene.add.text(-180, -70 + (index * 30), space, {
                fontSize: '16px',
                backgroundColor: '#333',
                color: '#ffffff',
                padding: { x: 10, y: 5 }
            }).setInteractive();

            option.on('pointerdown', () => this.selectSpace(space));
            this.add(option);
            return option;
        });

        this.managerOptions = ['manager1', 'manager2'].map((manager, index) => {
            const option = scene.add.text(-180, 20 + (index * 30), manager, {
                fontSize: '16px',
                backgroundColor: '#333',
                color: '#ffffff',
                padding: { x: 10, y: 5 }
            }).setInteractive();

            option.on('pointerdown', () => this.selectManager(manager));
            this.add(option);
            return option;
        });

        // Confirm and Cancel Buttons
        this.confirmButton = scene.add.text(-180, 100, 'Confirm', {
            fontSize: '18px',
            backgroundColor: '#5cb85c',
            color: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setInteractive();

        this.cancelButton = scene.add.text(80, 100, 'Cancel', {
            fontSize: '18px',
            backgroundColor: '#d9534f',
            color: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setInteractive();

        this.confirmButton.on('pointerdown', () => this.confirmSelection());
        this.cancelButton.on('pointerdown', () => this.cancelSelection());

        this.add(this.confirmButton);
        this.add(this.cancelButton);

        // Initially hide modal
        this.setVisible(false);
        scene.add.existing(this);
    }

    private selectSpace(space: string) {
        this.selectedSpace = space;
        this.spaceOptions.forEach(option => {
            option.setBackgroundColor(option.text === space ? '#555' : '#333');
        });
    }

    private selectManager(manager: string) {
        this.selectedManager = manager;
        this.managerOptions.forEach(option => {
            option.setBackgroundColor(option.text === manager ? '#555' : '#333');
        });
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
    }

    public show() {
        this.setVisible(true);
    }
}
