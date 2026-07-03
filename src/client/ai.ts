import * as Phaser from 'phaser';
import { MainMenu } from './scenes/MainMenu';

export class AI extends Phaser.GameObjects.Sprite {
	override scene: MainMenu;
	identifier: string = "";
	stats: {health: number, defence: number, attack: number, speed: number}; // Add 2 abilities to end of array and item(? on item)
	index: number = 0;

	constructor(scene: MainMenu, x: number, y: number, texture: string | Phaser.Textures.Texture, index: number, frame?: string | number) {
		super(scene, x, y, texture, frame);
		this.index = index;

		this.displayWidth = 48;
		this.displayHeight = 48;
		
		this.scene = scene;
		scene.add.existing(this);

		this.identifier = String(texture);
	}

	init() {
		this.stats = {
			health: 1, 
			defence: 1, 
			attack: 1, 
			speed: 1
		};
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

		this.on('pointerover', () => {
			this.play('idle');
		});

		this.on('pointerout', () => {
			this.stop();
		});

		this.setInteractive();
	}

	updateLayout(w: number, h: number, scale: number) {
		this.setPosition(w, h);
		this.setScale(scale);
	}

	getCost() {
		return 1 + this.stats.health + this.stats.defence + this.stats.attack + this.stats.speed - 4;
	}

	setStats(newStats: {health: number, defence: number, attack: number, speed: number}) {
		this.stats = newStats;
		this.updateUpgradeDisplay();
	}

	upgradeStat(name: String) {
		this.scene.registry.set('money', this.scene.registry.get('money') - this.getCost());
		this.scene.updateMoneyText();

		if (name == "health")
			this.stats.health++;
		else if (name == "defence")
			this.stats.defence++;
		else if (name == "attack")
			this.stats.attack++;
		else
			this.stats.speed++;

		for (const element of this.scene.wizards)
			element.updateUpgradeDisplay();

		this.save();
	}

	updateUpgradeDisplay() {
		const bShow = this.scene.registry.get('money') >= this.getCost();
	}

	async save() {
		try {
			var aiList = [];
			for (const element of this.scene.wizards)
				aiList.push(element.stats);

			var payload = {
				username: this.scene.registry.get('username'),
				ai: aiList
			};
			const data = JSON.stringify( payload );
					
			await fetch('/api/updateai', { 
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: data 
			});
		} catch(error) {
			console.error('Failed to save ai stats:', error);
		}
	}
}