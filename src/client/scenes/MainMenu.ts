import { Scene, GameObjects } from 'phaser';
import { DropdownList } from '../dropdown';
import { Leaderboard } from '../leaderboard';
import { AI } from '../ai/ai';

export class MainMenu extends Scene {
	background: GameObjects.Image | null = null;
	fight: GameObjects.Sprite | null = null;
	moneyImage: GameObjects.Image | null = null;
	levelImage: GameObjects.Image | null = null;
	moneyText: Phaser.GameObjects.Text;
	levelText: Phaser.GameObjects.Text;
	dropdown: DropdownList;
	leaderboard: Leaderboard;
	wizards: AI[];
	buttons: {button: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text, cost: Phaser.GameObjects.Text, costImg: Phaser.GameObjects.Image, index: number}[];
	scaleFactor: number = 1;

	constructor() {
		super('MainMenu');
	}

	init(): void {
		this.background = null;
		this.moneyImage = null;
		this.levelImage = null;
		this.fight = null;
		this.wizards = [];
		this.buttons = [];
	}

	create() {
		const { width, height } = this.scale;

		this.background = this.add.image(0, 0, 'background').setOrigin(0);

		this.fight = this.add.sprite(width - 24 - 32, height * 0.5, 'fight').setInteractive({ useHandCursor: true })
			.on('pointerover', () => { this.fight?.setTint(0xff5700); })
			.on('pointerout', () => { this.fight?.clearTint(); })
			.on('pointerup', () => { this.scene.start('Game'); });

		this.moneyImage = this.add.image(4, 4, 'money').setOrigin(0);

		this.moneyText = this.add
			.text(4, 4, `${this.abbrvNum(this.registry.get('money'))}`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffd700',
				stroke: '#e6c200',
				strokeThickness: 2,
			})
			.setOrigin(0);

		this.levelImage = this.add.image(4, 4, 'level').setOrigin(0);

		this.levelText = this.add
			.text(4, 4, `${this.abbrvNum(this.registry.get('level'))}`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#29FF00',
				stroke: '#25e600',
				strokeThickness: 2,
			})
			.setOrigin(0);

		this.dropdown = new DropdownList(this, 8, 8);

		this.leaderboard = new Leaderboard(this, width - 8, 8);

		for (var i = 0; i < 6; i++) {
			const x = i % 2 == 0 ? width / 4 : width / 2 + width / 4;
			const y = height / 4 + Math.floor(i / 2) * height / 4;

			if (this.registry.get('ai').length > i) {
				const ai = new AI(this, x, y, 'player', 0);
				ai.create();
				ai.setStats(this.registry.get('ai')[i]);

				this.wizards.push(ai);
			}
			else {
				const text = this.add.text(x, y - 128, `+`, {
					fontFamily: '"Kristen ITC", arial, serif',
					fontSize: 48,
					color: '#ffffff',
					stroke: '#f2f2f2',
					strokeThickness: 2,
				});

				const cost = this.add.text(x, y + 48, `10`, {
					fontFamily: '"Kristen ITC", arial, serif',
					fontSize: 48,
					color: '#ffd700',
					stroke: '#e6c200',
					strokeThickness: 2,
				});
				
				const costImg = this.add.image(x, y + 48 - cost.width, 'money').setOrigin(0);

				const button = this.add.rectangle(x, y, 250, 250, 0x000000, 0)
					.setInteractive({useHandCursor: true})
					.on('pointerover', () => { text.setTint(0xff5700); })
					.on('pointerout', () => { text.clearTint(); })
					.on('pointerup', () => { 
						const currentMoney = this.registry.get('money');
						if (currentMoney < 10)
							return;

						const ai = new AI(this, x, y, 'player', i, 0);
						ai.create();

						this.buttons.at(i)?.button.destroy();
						this.buttons.at(i)?.text.destroy();
						this.buttons.at(i)?.cost.destroy();
						this.buttons.splice(i, 1);

						this.registry.set('money', currentMoney - 10);
						this.updateMoneyText();

						this.wizards.push(ai);
						ai.MainMenuComponent.save();
						
						this.updateLayout(width, height);
					});

				this.buttons.push({button, text, cost, costImg, index: i});
			}
		}
		this.updateMoneyText();
		
		// Setup responsive layout
		this.updateLayout(width, height);
		this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
			const { width, height } = gameSize;
			this.updateLayout(width, height);
		});
	}

	updateLayout(width: number, height: number) {
		this.cameras.resize(width, height);

		if (this.background)
			this.background.setDisplaySize(width, height);

		this.scaleFactor = Math.min(height / 1600, 1);

		if (this.fight) {
			this.fight.setPosition(width / 2, height * 0.9);
			this.fight.setDisplaySize(96 * this.scaleFactor, 96 * this.scaleFactor);
		}

		if (this.moneyImage) {
			this.moneyImage.setPosition(8 * this.scaleFactor, 88 * this.scaleFactor);
			this.moneyImage.setScale(this.scaleFactor);
		}

		if (this.moneyText) {
			this.moneyText.setPosition(60 * this.scaleFactor, 80 * this.scaleFactor);
			this.moneyText.setScale(this.scaleFactor);
		}

		if (this.levelImage) {
			this.levelImage.setPosition(8 * this.scaleFactor, 144 * this.scaleFactor);
			this.levelImage.setScale(this.scaleFactor);
		}

		if (this.levelText) {
			this.levelText.setPosition(60 * this.scaleFactor, 136 * this.scaleFactor);
			this.levelText.setScale(this.scaleFactor);
		}

		this.dropdown.updateLayout(8 * this.scaleFactor, 8 * this.scaleFactor, this.scaleFactor);

		this.leaderboard.updateLayout(width - 8 * this.scaleFactor, 8 * this.scaleFactor, this.scaleFactor);

		this.wizards.forEach((ai) => {
			const x = ai.index % 2 == 0 ? width / 4 : width / 2 + width / 4;
			const y = height / 4 + Math.floor(ai.index / 2) * height / 4;

			ai.updateLayout(x, y, this.scaleFactor);
		});
		
		if (this.registry.get('money') < 10)
			return;

		this.buttons.forEach((element) => {
			const x = element.index % 2 == 0 ? width / 4 : width / 2 + width / 4;
			const y = height / 4 + Math.floor(element.index / 2) * height / 4;

			element.button.setDisplaySize(250 * this.scaleFactor, 250 * this.scaleFactor).updateDisplayOrigin();
			element.button.setPosition(x, y);

			element.text.setPosition(x, y - 128 * this.scaleFactor);
			element.text.setScale(this.scaleFactor * 3);

			element.cost.setPosition(x + (element.cost.width / 2) * this.scaleFactor, y + 48 * this.scaleFactor);
			element.cost.setScale(this.scaleFactor);

			element.costImg.setPosition(x - (element.cost.width / 2) * this.scaleFactor, y + (48 + 8) * this.scaleFactor);
			element.costImg.setScale(this.scaleFactor);
		});
	}

 	updateMoneyText() {
		const currentMoney = this.registry.get('money');
		this.moneyText.setText(`${this.abbrvNum(currentMoney)}`);

		for (const element of this.wizards) {
			element.MainMenuComponent.updateUpgradeDisplay();
		}

		const bShow = currentMoney >= 10;
		this.buttons.forEach((element) => {
			element.button.setScale(bShow ? this.scaleFactor : 0);
			element.text.setScale(bShow ? this.scaleFactor * 3 : 0);
			element.cost.setScale(bShow ? this.scaleFactor : 0);
			element.costImg.setScale(bShow ? this.scaleFactor : 0);
		});
  	}

 	updateLevelText() {
		this.levelText.setText(`${this.abbrvNum(this.registry.get('level'))}`);
  	}

	updateLeaderboardText() {
		this.leaderboard.refreshLeaderboard(this, this.leaderboard.domElement.x, this.leaderboard.domElement.y);
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
