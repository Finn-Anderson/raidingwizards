import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AI } from '../ai/ai';

export class Game extends Scene {
	camera: Phaser.Cameras.Scene2D.Camera;
	background: Phaser.GameObjects.Image;
	msg_text: Phaser.GameObjects.Text;
	damageText: Phaser.GameObjects.Text;
	incButton: Phaser.GameObjects.Text;
	decButton: Phaser.GameObjects.Text;
	goButton: Phaser.GameObjects.Text;

	wizards: AI[];
	enemy: AI;

	constructor() {
		super('Game');
	}

  	create() {
		this.camera = this.cameras.main;

		this.background = this.add.image(0, 0, 'background').setOrigin(0);

		this.registry.set('damage', 0);

		/* -------------------------------------------
		*  UI Elements
		* ------------------------------------------- */

		this.damageText = this.add
			.text(4, 4, `Damage: ${this.registry.get('damage')}`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ff0029',
				stroke: '#e60025',
				strokeThickness: 2,
			});

		const createButton = (y: number, label: string, color: string, onClick: () => void) => {
			const button = this.add
				.text(512, y, label, {
				fontFamily: 'Arial Black',
				fontSize: 36,
				color: color,
				backgroundColor: '#444444',
				padding: {
					x: 25,
					y: 12,
				} as Phaser.Types.GameObjects.Text.TextPadding,
				})
				.setOrigin(0.5)
				.setInteractive({ useHandCursor: true })
				.on('pointerover', () => button.setStyle({ backgroundColor: '#555555' }))
				.on('pointerout', () => button.setStyle({ backgroundColor: '#444444' }))
				.on('pointerdown', onClick);
			return button;
		};

		// Increment button
		this.incButton = createButton(this.scale.height * 0.55, 'Increment', '#00ff00', async () => {
			this.registry.set('damage', this.registry.get('damage') + 100);
			this.updateDamageText();
		});

		// Game Over button – navigates to the GameOver scene
		this.goButton = createButton(this.scale.height * 0.75, 'Game Over', '#ffffff', () => {
			this.scene.start('GameOver');
		});

		// Setup responsive layout
		this.updateLayout(this.scale.width, this.scale.height);
		this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
			const { width, height } = gameSize;
			this.updateLayout(width, height);
		});
  	}

  	updateLayout(width: number, height: number) {
		this.cameras.resize(width, height);

    	if (this.background)
      		this.background.setDisplaySize(width, height);

		const scaleFactor = Math.min(Math.min(width / 1024, height / 768), 1);

		if (this.damageText) {
			this.damageText.setPosition(8, 8);
			this.damageText.setScale(scaleFactor);
		}

		if (this.incButton) {
			this.incButton.setPosition(width / 2, height * 0.55);
			this.incButton.setScale(scaleFactor);
		}

		if (this.decButton) {
			this.decButton.setPosition(width / 2, height * 0.65);
			this.decButton.setScale(scaleFactor);
		}

		if (this.goButton) {
			this.goButton.setPosition(width / 2, height * 0.75);
			this.goButton.setScale(scaleFactor);
		}
  	}

 	updateDamageText() {
		this.damageText.setText(`Damage: ${this.abbrvNum(this.registry.get('damage'))}`);
  	}

	abbrvNum(number: number): string {
		const abbrv = ['k', 'm', 'b', 't', 'sn'];

		for (var i = abbrv.length - 1; i > -1; i--) {
			const size = Math.pow(10, (i + 1) * 3);

			if (size <= number) {
				if (abbrv[i] == 'sn')
					return number.toExponential();
				else
					return number.toString() + String(abbrv[i]);
			}
		}

		return number.toString();
	}
}
