import * as Phaser from 'phaser';
import { MainMenu } from '../scenes/MainMenu';
import { Game } from '../scenes/Game';
import { MainMenuComponent } from './mainMenuComponent'
import { GameComponent } from './gameComponent'
import { Ability } from './ability';

export class AI extends Phaser.GameObjects.Sprite {
	override scene: MainMenu | Game;
	identifier: string;

	stats: {health: number, defence: number, attack: number, speed: number, ability1Index: number, ability2Index: number}; // item?
	debuffs: {ability: Ability, turns: number, applier: AI}[];

	index: number = 0;
	storedScale: number = 1;

	statsIcons: Phaser.GameObjects.Image[] = [];
	statsText: Phaser.GameObjects.Text[] = [];

	MainMenuComponent: MainMenuComponent;
	GameComponent: GameComponent;

	constructor(scene: MainMenu | Game, x: number, y: number, texture: string | Phaser.Textures.Texture, index: number, frame?: string | number) {
		super(scene, x, y, texture, frame);
		this.index = index;

		this.setDisplaySize(48, 48);
		
		this.scene = scene;
		scene.add.existing(this);

		this.identifier = String(texture);
		this.stats = {health: 1, defence: 1, attack: 1, speed: 1, ability1Index: 0, ability2Index: 2};
		this.debuffs = [];

		this.MainMenuComponent = new MainMenuComponent(this);
		this.GameComponent = new GameComponent(this);
	}

	create(bEnemy: boolean = false) {
		this.scene.anims.create({
			key: this.identifier+'idle',
			frames: this.scene.anims.generateFrameNumbers(this.identifier, { start: 0, end: 1 }),
			frameRate: 2,
			repeat: -1
		});

		this.scene.anims.create({
			key: this.identifier+'attack',
			frames: this.scene.anims.generateFrameNumbers(this.identifier, { start: 2, end: 2 }),
			frameRate: 1,
			repeat: 0
		});

		for (let i = 0; i < 4; i++) {
			let str: string;
			let num: number;
			if (i == 0) {
				str = 'attack';
				num = this.stats.attack;
			}
			else if (i == 1) {
				str = 'defence';
				num = this.stats.defence;
			}
			else if (i == 2) {
				str = 'health';
				num = this.stats.health;
			}
			else {
				str = 'speed';
				num = this.stats.speed;
			}

			const textImg = this.scene.add.image(4, 4, str).setOrigin(0).setInteractive();
			this.statsIcons.push(textImg);

			const text = this.scene.add
				.text(4, 4, `${this.scene.abbrvNum(num)}`, {
					fontFamily: '"Kristen ITC", arial, serif',
					fontSize: 48,
					color: '#ffffff',
					stroke: '#f2f2f2',
					strokeThickness: 2,
				}).setOrigin(0).setInteractive();
			this.statsText.push(text);

			if (this.scene instanceof MainMenu) {
				this.setupMouseOverAnim(textImg);
				this.setupMouseOverAnim(text);
			}
		}

		if (this.scene instanceof MainMenu) {
			this.MainMenuComponent.createMainMenu();
			this.setupMouseOverAnim(this);
		}
		else
			this.GameComponent.createGame(bEnemy);

		this.setInteractive();

		this.on('destroy', () => {
			for (let i = this.statsText.length - 1; i > -1; i--) {
				this.statsIcons[i]!.destroy();
				this.statsText[i]!.destroy();

				this.statsIcons.splice(i, 1);
				this.statsText.splice(i, 1);
			}
		});
	}

	setupMouseOverAnim(element: Phaser.GameObjects.GameObject) {
		element.on('pointerover', () => {
			this.play(this.identifier+'idle');
		});

		element.on('pointerout', () => {
			this.stop();
			this.setFrame(0);
		});
	}

	updateLayout(w: number, h: number, scale: number, frameHeight: number = 1) {
		this.setPosition(w, h);
		this.setScale(scale * 2);

		for (let i = 0; i < this.statsText.length; i++) {
			if (this.scene instanceof Game && this.scene.enemy == this) {
				const x = i % 2 == 0 ? w - 50 * scale : w + 50 * scale;
				const y = h + (this.height + Math.floor(i / 2) * 50) * scale;

				this.statsIcons[i]!.setPosition(x - (i % 2 == 0 ? 52 * scale : 0), y + 8 * scale);
				this.statsText[i]!.setPosition(x + (i % 2 == 0 ? 0 : 52 * scale), y);
			}
			else {
				this.statsIcons[i]!.setPosition(w + 72 * scale, h + (((i - 2) * 48 + 8) * scale));
				this.statsText[i]!.setPosition(w + 124 * scale, h + (((i - 2) * 48) * scale));
			}

			this.statsIcons[i]!.setScale(scale);
			this.statsText[i]!.setScale(scale);
		}

		if (this.scene instanceof MainMenu)
			this.MainMenuComponent.updateMainMenuLayout(w, h, scale);
		else
			this.GameComponent.updateGameLayout(w, h, scale, frameHeight);

		this.storedScale = scale;
	}

	updateStatDisplay(scene: MainMenu) {
		for (let i = 0; i < this.statsText.length; i++) {
			let num: number;
			if (i == 0) 
				num = this.stats.attack;
			else if (i == 1)
				num = this.stats.defence;
			else if (i == 2) 
				num = this.stats.health;
			else
				num = this.stats.speed;

			this.statsText[i]!.setText(scene.abbrvNum(num));
		}
	}

	setStats(newStats: {health: number, defence: number, attack: number, speed: number, ability1Index: number, ability2Index: number}) {
		this.stats = newStats;
	}

	getLevel() {
		return 1 + this.stats.health + this.stats.defence + this.stats.attack + this.stats.speed - 4;
	}
}