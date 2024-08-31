import { Scene, GameObjects } from 'phaser';

export class SubmenuButton extends GameObjects.Container {
    private normalImage: Phaser.GameObjects.Image;
    private pressedImage: Phaser.GameObjects.Image;
    private disabledImage: Phaser.GameObjects.Image;
    private loadingImage: Phaser.GameObjects.Image;
    private buttonText: Phaser.GameObjects.Text;

    constructor(scene: Scene, x: number, y: number, text: string, clickHandler: () => void) {
        super(scene, x, y);

        this.normalImage = scene.add.image(0, 0, 'buttonUP');
        this.pressedImage = scene.add.image(0, 0, 'buttonDOWN');
        this.disabledImage = scene.add.image(0, 0, 'buttonDISABLED');
        this.loadingImage = scene.add.image(0, 0, 'buttonLOADING');

        this.buttonText = scene.add.text(0, 0, text, {
            fontSize: '18px',
            color: '#fff',
            padding: { x: 8, y: 5 }
        }).setOrigin(0.5);

        this.add(this.normalImage);
        this.add(this.pressedImage);
        this.add(this.disabledImage);
        this.add(this.loadingImage);
        this.add(this.buttonText);

        // Set initial state
        this.setButtonState('normal');

        // Set interaction events
        this.setInteractive(new Phaser.Geom.Rectangle(-this.normalImage.width / 2, -this.normalImage.height / 2, this.normalImage.width, this.normalImage.height), Phaser.Geom.Rectangle.Contains);

        this.on('pointerdown', () => {
            this.setButtonState('pressed');
            clickHandler();
        });

        this.on('pointerup', () => {
            this.setButtonState('normal');
        });

        this.on('pointerout', () => {
            this.setButtonState('normal');
        });

        scene.add.existing(this);
    }

    setButtonState(state: 'normal' | 'pressed' | 'disabled' | 'loading') {
        this.normalImage.setVisible(state === 'normal');
        this.pressedImage.setVisible(state === 'pressed');
        this.disabledImage.setVisible(state === 'disabled');
        this.loadingImage.setVisible(state === 'loading');
    }

    setText(text: string) {
        this.buttonText.setText(text);
    }

    disable() {
        this.setButtonState('disabled');
        this.disableInteractive();
    }

    enable() {
        this.setButtonState('normal');
        this.setInteractive();
    }
}
