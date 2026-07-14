import * as Phaser from 'phaser';
import { MainMenu } from '../scenes/MainMenu';
import { AI } from './ai';
import { Ability } from './ability';
import { HoverComponent } from './hoverComponent';

export class MainMenuComponent {
	owner: AI;

	upgradeIcons: Phaser.GameObjects.Image[] = [];
	statsIcons: Phaser.GameObjects.Image[] = [];
	statsText: Phaser.GameObjects.Text[] = [];
	costImage: Phaser.GameObjects.Image;
	costText: Phaser.GameObjects.Text | null = null;

	abilityDisplay: {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image, hoverComponent: HoverComponent}[] = [];

	constructor(ai: AI) {
		this.owner = ai;
	}

	createMainMenu() {
		for (var i = 0; i < 4; i++) {
			let str = '';
			let num = 1;
			if (i == 0) {
				str = 'attack';
				num = this.owner.stats.attack;
			}
			else if (i == 1) {
				str = 'defence';
				num = this.owner.stats.defence;
			}
			else if (i == 2) {
				str = 'health';
				num = this.owner.stats.health;
			}
			else {
				str = 'speed';
				num = this.owner.stats.speed;
			}

			const textImg = this.owner.scene.add.image(4, 4, str).setOrigin(0).setInteractive();
			this.statsIcons.push(textImg);

			const text = this.owner.scene.add
				.text(4, 4, `${this.owner.scene.abbrvNum(num)}`, {
					fontFamily: '"Kristen ITC", arial, serif',
					fontSize: 48,
					color: '#ffffff',
					stroke: '#f2f2f2',
					strokeThickness: 2,
				}).setOrigin(0).setInteractive();
			this.statsText.push(text);

			const image = this.owner.scene.add.image(4, 4, 'upgrade').setOrigin(0).setInteractive({useHandCursor: true}).setTint(0x29FF00)
				.on('pointerover', () => { image.setTint(0xff5700); })
				.on('pointerout', () => { image.setTint(0x29FF00); })
				.on('pointerup', () => { this.upgradeStat(str); });
			
			this.upgradeIcons.push(image);

			this.owner.setupMouseOverAnim(textImg);
			this.owner.setupMouseOverAnim(text);
			this.owner.setupMouseOverAnim(image);
		}

		this.costImage = this.owner.scene.add.image(4, 4, 'money').setOrigin(0).setInteractive();

		this.costText = this.owner.scene.add
			.text(4, 4, `${this.owner.scene.abbrvNum(this.owner.getLevel())}`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffd700',
				stroke: '#e6c200',
				strokeThickness: 2,
			})
			.setOrigin(0)
			.setInteractive();

		this.owner.setupMouseOverAnim(this.costImage);
		this.owner.setupMouseOverAnim(this.costText);

		this.regenerateAbilities();
	}

	updateMainMenuLayout(w: number, h: number, scale: number) {
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

		this.costText?.setPosition(w + 128 * scale, h + 100 * scale);
		this.costText?.setScale(scale);

		this.abilityDisplay.forEach((element, index) => {
			const width = w + (40 * (index * 2 - 1) * scale - 4);
			const height = h + 140 * scale;

			element.rectangle.setPosition(width, height);
			element.rectangle.setScale(scale);

			element.image.setPosition(width, height);
			element.image.setScale(scale);

			element.hoverComponent.updateLayout(width, height, scale);
		});
	}

	upgradeStat(name: String) {
		this.owner.scene.registry.set('money', this.owner.scene.registry.get('money') - this.owner.getLevel());

		if (name == 'health')
			this.owner.stats.health++;
		else if (name == 'defence')
			this.owner.stats.defence++;
		else if (name == 'attack')
			this.owner.stats.attack++;
		else
			this.owner.stats.speed++;

		if (this.owner.scene instanceof MainMenu)
			this.owner.scene.updateMoneyText();

		this.save();
	}

	updateUpgradeDisplay(scene: MainMenu, money: number) {
		const level = this.owner.getLevel();
		const bShow = money >= level;

		for (var i = 0; i < this.statsText.length; i++) {
			let num = 0;
			if (i == 0) 
				num = this.owner.stats.attack;
			else if (i == 1)
				num = this.owner.stats.defence;
			else if (i == 2) 
				num = this.owner.stats.health;
			else
				num = this.owner.stats.speed;

			this.statsText[i]!.setText(scene.abbrvNum(num));

			this.upgradeIcons[i]!.setScale(bShow ? this.owner.storedScale : 0);
		}

		this.costText!.setText(scene.abbrvNum(level));
	}

	regenerateAbilities() {
		this.abilityDisplay.forEach((element) => {
			element.rectangle.destroy();
			element.image.destroy();
			element.hoverComponent.destroy();
		});

		this.abilityDisplay.length = 0;

		const ability1: Ability = this.owner.scene.registry.get('abilities')[this.owner.stats.ability1Index];
		const display1 = ability1.display(this.owner, 4, 4, 0, false, 1);
		this.abilityDisplay.push(display1);

		const ability2 = this.owner.scene.registry.get('abilities')[this.owner.stats.ability2Index];
		const display2 = ability2.display(this.owner, 4, 4, 0, false, 2);
		this.abilityDisplay.push(display2);

		const { width, height } = this.owner.scene.scale;
		this.owner.scene.updateLayout(width, height);
	}

	save() {
		void (async () => {
			try {
				var aiList = [];
				for (const element of this.owner.scene.wizards)
					aiList.push(element.stats);

				var payload = {
					username: this.owner.scene.registry.get('username'),
					money: this.owner.scene.registry.get('money'),
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