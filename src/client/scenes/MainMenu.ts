import { Scene, GameObjects } from 'phaser';
import { DropdownList } from '../dropdown';
import { Leaderboard } from '../leaderboard';
import { AI } from '../ai';

export class MainMenu extends Scene {
	background: GameObjects.Image | null = null;
	logo: GameObjects.Image | null = null;
	fight: GameObjects.Sprite | null = null;
	moneyText: Phaser.GameObjects.Text;
	levelText: Phaser.GameObjects.Text;
	dropdown: DropdownList;
	leaderboard: Leaderboard;
	wizards: AI[];

	constructor() {
		super('MainMenu');
	}

	/**
	 * Reset cached GameObject references every time the scene starts.
	 * The same Scene instance is reused by Phaser, so we must ensure
	 * stale (destroyed) objects are cleared out when the scene restarts.
	 */
	init(): void {
		this.background = null;
		this.logo = null;
		this.fight = null;
		this.wizards = [];
	}

	create() {
		const { width, height } = this.scale;

		this.background = this.add.image(0, 0, 'background').setOrigin(0);

		this.fight = this.add.sprite(width - 24 - 32, height * 0.5, 'fight').setInteractive({ useHandCursor: true })
			.on('pointerover', () => { this.fight?.setTint(0xff5700); })
			.on('pointerout', () => { this.fight?.clearTint(); })
			.on('pointerup', () => { this.scene.start('Game'); });

		this.moneyText = this.add
			.text(4, 4, `Money: ${this.abbrvNum(this.registry.get('money'))}`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffd700',
				stroke: '#e6c200',
				strokeThickness: 2,
			})
			.setOrigin(0);

		this.levelText = this.add
			.text(4, 4, `Level: ${this.abbrvNum(this.registry.get('level'))}`, {
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
				const ai = new AI(this, x, y, 'player', i, 0);
				ai.create();
				ai.setStats(this.registry.get('ai')[i]);

				this.wizards.push(ai);
			}
			else {
				const ai = new AI(this, x, y, 'player', i, 0);
				
				this.wizards.push(ai);
			}
		}
		
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

		const scaleFactor = Math.min(height / 1600, 1);

		if (this.logo) {
			this.logo.setPosition(width / 2, height * 0.45);
			this.logo.setScale(scaleFactor);
		}

		if (this.fight) {
			this.fight.setPosition(width / 2, height * 0.9);
			this.fight.setDisplaySize(96 * scaleFactor, 96 * scaleFactor);
		}

		if (this.moneyText) {
			this.moneyText.setPosition(8 * scaleFactor, 80 * scaleFactor);
			this.moneyText.setScale(scaleFactor);
		}

		if (this.levelText) {
			this.levelText.setPosition(8 * scaleFactor, 136 * scaleFactor);
			this.levelText.setScale(scaleFactor);
		}

		this.dropdown.updateLayout(8 * scaleFactor, 8 * scaleFactor, scaleFactor);

		this.leaderboard.updateLayout(width - 8 * scaleFactor, 8 * scaleFactor, scaleFactor);

		this.wizards.forEach((ai) => {
			const x = ai.index % 2 == 0 ? width / 4 : width / 2 + width / 4;
			const y = height / 4 + Math.floor(ai.index / 2) * height / 4;

			ai.updateLayout(x, y, scaleFactor * 2);
		});
	}

 	updateLevelText() {
		this.levelText.setText(`Level: ${this.abbrvNum(this.registry.get('level'))}`);
  	}

 	updateMoneyText() {
		this.moneyText.setText(`Money: ${this.abbrvNum(this.registry.get('money'))}`);
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
