import { Scene, GameObjects } from 'phaser';
import { MainMenu } from './scenes/MainMenu';
import { AI } from './ai/ai';

export class AIAdder {
	button: Phaser.GameObjects.Rectangle; 
	text: Phaser.GameObjects.Text; 
	cost: Phaser.GameObjects.Text; 
	costImg: Phaser.GameObjects.Image; 
	index: number;

	constructor(scene: MainMenu, x: number, y: number, width: number, height: number, index: number) {
		this.index = index;

		this.text = scene.add.text(x, y - 128, `+`, {
			fontFamily: '"Kristen ITC", arial, serif',
			fontSize: 48,
			color: '#ffffff',
			stroke: '#f2f2f2',
			strokeThickness: 2,
		});

		this.cost = scene.add.text(x, y + 48, `10`, {
			fontFamily: '"Kristen ITC", arial, serif',
			fontSize: 48,
			color: '#ffd700',
			stroke: '#e6c200',
			strokeThickness: 2,
		});
		
		this.costImg = scene.add.image(x, y + 48 - this.cost.width, 'money').setOrigin(0);

		this.button = scene.add.rectangle(x, y, 250, 250, 0x000000, 0)
			.setInteractive({useHandCursor: true})
			.on('pointerover', () => { this.text.setTint(0xff5700); })
			.on('pointerout', () => { this.text.clearTint(); })
			.on('pointerup', () => { 
				const currentMoney = scene.registry.get('money');
				if (currentMoney < 10)
					return;
				
				const ai = new AI(scene, x, y, 'player', this.index, 0);
				ai.create();

				this.button.destroy();
				this.text.destroy();
				this.cost.destroy();
				this.costImg.destroy();
				scene.buttons.splice(this.index - scene.wizards.length, 1);

				scene.registry.set('money', currentMoney - 10);
				scene.updateMoneyText();

				scene.wizards.push(ai);
				ai.MainMenuComponent.save();
				
				ai.MainMenuComponent.updateUpgradeDisplay();
				scene.updateLayout(width, height);
			});
	}

	updateLayout(width: number, height: number, scale: number) {
		const x = this.index % 2 == 0 ? width / 4 : width / 2 + width / 4;
		const y = height / 4 + Math.floor(this.index / 2) * height / 4;

		this.button.setDisplaySize(250 * scale, 250 * scale).updateDisplayOrigin();
		this.button.setPosition(x, y);

		this.text.setPosition(x, y - 128 * scale);
		this.text.setScale(scale * 3);

		this.cost.setPosition(x + (this.cost.width / 2) * scale, y + 48 * scale);
		this.cost.setScale(scale);

		this.costImg.setPosition(x - (this.cost.width / 2) * scale, y + (48 + 8) * scale);
		this.costImg.setScale(scale);
	}
}