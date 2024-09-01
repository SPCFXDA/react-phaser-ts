// GenericButton.ts
import { Scene, GameObjects } from 'phaser';

export class GenericButton extends GameObjects.Container {
    protected background: Phaser.GameObjects.Rectangle;
    protected text: Phaser.GameObjects.Text;
    private loadingText: Phaser.GameObjects.Text;
    protected isLoading: boolean;
    protected isDisabled: boolean;
    private onClickCallback: () => void;

    constructor(scene: Scene, x: number, y: number, label: string, callback: () => void) {
        super(scene, x, y);

        this.isLoading = false;
        this.isDisabled = false;
        this.onClickCallback = callback;

        // Background
        this.background = scene.add.rectangle(0, 0, 150, 40, 0x5cb85c, 1);
        this.add(this.background);

        // Label
        this.text = scene.add.text(0, 0, label, {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.add(this.text);

        // Loading Text
        this.loadingText = scene.add.text(0, 0, 'Loading...', {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.loadingText.setVisible(false);
        this.add(this.loadingText);

        // Set size and interaction
        this.setSize(150, 40);
        this.setInteractive();

        // Input events
        this.on('pointerdown', this.handlePointerDown, this);
        this.on('pointerup', this.handlePointerUp, this);
        this.on('pointerout', this.handlePointerOut, this);
    }

    protected handlePointerDown() {
        if (!this.isDisabled && !this.isLoading) {
            this.background.setFillStyle(0x4cae4c); // Darker shade
            this.text.setY(2); // Simulate button press effect
        }
    }

    protected handlePointerUp() {
        if (!this.isDisabled && !this.isLoading) {
            this.background.setFillStyle(0x5cb85c); // Original shade
            this.text.setY(0);
            this.onClickCallback();
        }
    }

    protected handlePointerOut() {
        if (!this.isDisabled && !this.isLoading) {
            this.background.setFillStyle(0x5cb85c); // Original shade
            this.text.setY(0);
        }
    }

    public showLoadingState() {
        this.isLoading = true;
        this.text.setVisible(false);
        this.loadingText.setVisible(true);
    }

    public resetState() {
        this.isLoading = false;
        this.text.setVisible(true);
        this.loadingText.setVisible(false);
    }

    public setPressedState(isPressed: boolean) {
        if (isPressed) {
            this.background.setFillStyle(0x4cae4c); // Darker shade to indicate pressed
            this.text.setY(2); // Simulate button press effect
        } else {
            this.background.setFillStyle(0x5cb85c); // Original shade
            this.text.setY(0);
        }
    }
}
