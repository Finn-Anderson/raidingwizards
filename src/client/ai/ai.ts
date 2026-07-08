import * as Phaser from 'phaser';
import { MainMenu } from '../scenes/MainMenu';
import { Game } from '../scenes/Game';
import { MainMenuComponent } from './mainMenuComponent'
import { GameComponent } from './gameComponent'

export class AI extends Phaser.GameObjects.Sprite {
	override scene: MainMenu | Game;
	identifier: string;

	stats: {health: number, defence: number, attack: number, speed: number, ability1Index: number, ability2Index: number}; // item?
	debuffs: {debuff: string, applier: AI}[];

	index: number = 0;
	storedScale: number = 1;

	MainMenuComponent: MainMenuComponent;
	GameComponent: GameComponent;

	constructor(scene: MainMenu | Game, x: number, y: number, texture: string | Phaser.Textures.Texture, index: number, frame?: string | number) {
		super(scene, x, y, texture, frame);
		this.index = index;

		this.displayWidth = 48;
		this.displayHeight = 48;
		
		this.scene = scene;
		scene.add.existing(this);

		this.identifier = String(texture);
		this.stats = {health: 1, defence: 1, attack: 1, speed: 1, ability1Index: 0, ability2Index: 2};
		this.debuffs = [];

		this.MainMenuComponent = new MainMenuComponent(this);
		this.GameComponent = new GameComponent(this);
	}

	create() {
		this.scene.anims.create({
			key: 'idle',
			frames: this.scene.anims.generateFrameNumbers(this.identifier, { start: 0, end: 1 }),
			frameRate: 2,
			repeat: -1
		});

		this.scene.anims.create({
			key: 'attack',
			frames: this.scene.anims.generateFrameNumbers(this.identifier, { start: 2, end: 2 }),
			frameRate: 1,
			repeat: 0
		});

		if (this.scene instanceof MainMenu)
			this.MainMenuComponent.createMainMenu();
		else
			this.GameComponent.createGame();

		this.setupMouseOverAnim(this);
		this.setInteractive();
	}

	setupMouseOverAnim(element: Phaser.GameObjects.GameObject) {
		element.on('pointerover', () => {
			this.play('idle');
		});

		element.on('pointerout', () => {
			this.stop();
			this.setFrame(0);
		});
	}

	updateLayout(w: number, h: number, scale: number) {
		this.setPosition(w, h);
		this.setScale(scale * 2);

		if (this.scene instanceof MainMenu)
			this.MainMenuComponent.updateMainMenuLayout(w, h, scale);
		else
			this.GameComponent.updateGameLayout(w, h, scale);

		this.storedScale = scale;
	}

	setStats(newStats: {health: number, defence: number, attack: number, speed: number, ability1Index: number, ability2Index: number}) {
		this.stats = newStats;

		if (this.scene instanceof MainMenu)
			this.MainMenuComponent.updateUpgradeDisplay();
	}

	getLevel() {
		return 1 + this.stats.health + this.stats.defence + this.stats.attack + this.stats.speed - 4;
	}
}