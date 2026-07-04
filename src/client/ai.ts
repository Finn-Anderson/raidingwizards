import * as Phaser from 'phaser';
import { MainMenu } from './scenes/MainMenu';

export class AI extends Phaser.GameObjects.Sprite {
	override scene: MainMenu;
	identifier: string = '';
	stats: {health: number, defence: number, attack: number, speed: number}; // Add 2 abilities to end of array and item(? on item)
	upgradeIcons: Phaser.GameObjects.Image[] = [];
	statsIcons: Phaser.GameObjects.Image[] = [];
	statsText: Phaser.GameObjects.Text[] = [];
	index: number = 0;
	storedScale: number = 1;
	costImage: Phaser.GameObjects.Image;
	costText: Phaser.GameObjects.Text;

	constructor(scene: MainMenu, x: number, y: number, texture: string | Phaser.Textures.Texture, index: number, frame?: string | number) {
		super(scene, x, y, texture, frame);
		this.index = index;

		this.displayWidth = 48;
		this.displayHeight = 48;
		
		this.scene = scene;
		scene.add.existing(this);

		this.identifier = String(texture);
		this.stats = {health: 1, defence: 1, attack: 1, speed: 1};
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

		for (var i = 0; i < 4; i++) {
			let str = '';
			if (i == 0)
				str = 'attack';
			else if (i == 1)
				str = 'defence';
			else if (i == 2)
				str = 'health';
			else
				str = 'speed';

			const textImg = this.scene.add.image(4, 4, str).setOrigin(0).setInteractive();
			this.statsIcons.push(textImg);

			const text = this.scene.add
				.text(4, 4, `1`, {
					fontFamily: '"Kristen ITC", arial, serif',
					fontSize: 48,
					color: '#ffffff',
					stroke: '#f2f2f2',
					strokeThickness: 2,
				}).setOrigin(0).setInteractive();
			this.statsText.push(text);

			const image = this.scene.add.image(4, 4, 'upgrade').setOrigin(0).setInteractive({useHandCursor: true})
				.on('pointerover', () => { image.filters?.internal.addGlow(); image.filters?.external.addGlow(); })
				.on('pointerout', () => { image.filters?.internal.clear(); image.filters?.external.clear(); })
				.on('pointerup', () => { this.upgradeStat(str); });
			this.upgradeIcons.push(image);

			this.setupMouseOverAnim(textImg);
			this.setupMouseOverAnim(text);
			this.setupMouseOverAnim(image);
		}

		this.costImage = this.scene.add.image(4, 4, 'money').setOrigin(0).setInteractive();

		this.costText = this.scene.add
			.text(4, 4, `${this.scene.abbrvNum(this.getCost())}`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffd700',
				stroke: '#e6c200',
				strokeThickness: 2,
			})
			.setOrigin(0)
			.setInteractive();

		this.setupMouseOverAnim(this);
		this.setupMouseOverAnim(this.costImage);
		this.setupMouseOverAnim(this.costText);

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

		for (var i = 0; i < this.statsText.length; i++) {
			this.statsIcons[i]!.setPosition(w + (72 * scale), h + (((i - 2) * 48 + 8) * scale));
			this.statsIcons[i]!.setScale(scale);

			this.statsText[i]!.setPosition(w + (124 * scale), h + (((i - 2) * 48) * scale));
			this.statsText[i]!.setScale(scale);

			this.upgradeIcons[i]!.setPosition(w + ((120 + this.statsText[i]!.width) * scale), h + (((i - 2) * 48 + 8) * scale));

			if (this.upgradeIcons[i]!.scale != 0)
				this.upgradeIcons[i]!.setScale(scale);
		}

		this.costImage.setPosition(w + 72 * scale, h + 108 * scale);
		this.costImage.setScale(scale);

		this.costText.setPosition(w + 128 * scale, h + 100 * scale);
		this.costText.setScale(scale);

		this.storedScale = scale;
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

		if (name == 'health')
			this.stats.health++;
		else if (name == 'defence')
			this.stats.defence++;
		else if (name == 'attack')
			this.stats.attack++;
		else
			this.stats.speed++;

		this.scene.updateMoneyText();

		this.save();
	}

	updateUpgradeDisplay() {
		const bShow = this.scene.registry.get('money') >= this.getCost();

		for (var i = 0; i < this.statsText.length; i++) {
			var num = 0;
			if (i == 0) 
				num = this.stats.attack;
			else if (i == 1)
				num = this.stats.defence;
			else if (i == 2) 
				num = this.stats.health;
			else
				num = this.stats.speed;

			this.statsText[i]!.setText(this.scene.abbrvNum(num));

			this.upgradeIcons[i]!.setScale(bShow ? this.storedScale : 0);
		}

		this.costText.setText(this.scene.abbrvNum(this.getCost()));
	}

	save() {
		void (async () => {
			try {
				var aiList = [];
				for (const element of this.scene.wizards)
					aiList.push(element.stats);

				var payload = {
					username: this.scene.registry.get('username'),
					money: this.scene.registry.get('money'),
					ai: aiList
				};
				const data = JSON.stringify( payload );
						
				const response = await fetch('/api/updateai', { 
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: data 
				});
				if (!response.ok) throw new Error(`API error: ${response.status}`);
			} catch(error) {
				console.error('Failed to save ai stats:', error);
			}
		})();
	}
}