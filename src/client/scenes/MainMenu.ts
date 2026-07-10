import { Scene } from 'phaser';
import { DropdownList } from '../dropdown';
import { Leaderboard } from '../leaderboard';
import { AI } from '../ai/ai';
import { AIAdder } from '../aiAdder';
import { AbilitySelector } from '../abilitySelector';

export class MainMenu extends Scene {
	background: Phaser.GameObjects.Image;

	fightContainer: Phaser.GameObjects.Rectangle;
	fight: Phaser.GameObjects.Sprite;

	moneyImage: Phaser.GameObjects.Image;
	moneyText: Phaser.GameObjects.Text;
	
	levelImage: Phaser.GameObjects.Image;
	levelText: Phaser.GameObjects.Text;

	dropdown: DropdownList;
	leaderboard: Leaderboard;

	wizards: AI[] = [];
	buttons: AIAdder[] = [];
	
	scaleFactor: number = 1;
	abilitySelector: AbilitySelector | null = null;

	constructor() {
		super('MainMenu');
	}

	create() {
		const { width, height } = this.scale;

		this.background = this.add.image(0, 0, 'background').setOrigin(0);

		this.fightContainer = this.add.rectangle(width / 2, height * 0.92, 164, 164, 0x333333).setStrokeStyle(2, 0x121212).setRounded(98).setInteractive({useHandCursor: true})
			.on('pointerover', () => { 
				this.fightContainer.setFillStyle(0xff5700); 
				this.fightContainer.setStrokeStyle(2, 0xe64e00);
			})
			.on('pointerout', () => { 
				this.fightContainer.setFillStyle(0x333333); 
				this.fightContainer.setStrokeStyle(2, 0x121212); 
			})
			.on('pointerup', () => {
				this.scene.start('Game');
			});
		this.fight = this.add.sprite(width / 2, height * 0.92, 'fight');

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

		for (let i = 0; i < 6; i++) {
			const x = i % 2 == 0 ? width / 4 : width / 2 + width / 4;
			const y = height / 4 + Math.floor(i / 2) * height / 4;

			if (this.registry.get('ai').length > i) {
				const ai = new AI(this, x, y, 'player', i);
				ai.setStats(this.registry.get('ai')[i]);
				ai.create();

				this.wizards.push(ai);
			}
			else {
				const aiAdder = new AIAdder(this, x, y, width, height, i);

				this.buttons.push(aiAdder);
			}
		}
		this.updateMoneyText();
		
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

		this.fightContainer.setPosition(width / 2, height * 0.92);
		this.fightContainer.setScale(this.scaleFactor);

		this.fight.setPosition(width / 2, height * 0.92);
		this.fight.setDisplaySize(96 * this.scaleFactor, 96 * this.scaleFactor);

		this.moneyImage.setPosition(8 * this.scaleFactor, 88 * this.scaleFactor);
		this.moneyImage.setScale(this.scaleFactor);

		this.moneyText.setPosition(60 * this.scaleFactor, 80 * this.scaleFactor);
		this.moneyText.setScale(this.scaleFactor);

		this.levelImage.setPosition(8 * this.scaleFactor, 144 * this.scaleFactor);
		this.levelImage.setScale(this.scaleFactor);

		this.levelText.setPosition(60 * this.scaleFactor, 136 * this.scaleFactor);
		this.levelText.setScale(this.scaleFactor);

		this.dropdown.updateLayout(8 * this.scaleFactor, 8 * this.scaleFactor, this.scaleFactor);

		this.leaderboard.updateLayout(width - 8 * this.scaleFactor, 8 * this.scaleFactor, this.scaleFactor);

		this.wizards.forEach((ai) => {
			const x = ai.index % 2 == 0 ? width / 4 : width / 2 + width / 4;
			const y = height / 4 + Math.floor(ai.index / 2) * height / 4;

			ai.updateLayout(x, y, this.scaleFactor);
		});
		
		if (this.registry.get('money') < 10)
			return;

		this.buttons.forEach((element) => { element.updateLayout(width, height, this.scaleFactor); });

		if (this.abilitySelector)
			this.abilitySelector.updateLayout(width / 2 - 250 * this.scaleFactor, height / 2 - 310 * this.scaleFactor, this.scaleFactor);
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
