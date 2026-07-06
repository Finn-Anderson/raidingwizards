import * as Phaser from 'phaser';
import { AI } from '../ai/ai';
import { MainMenu } from '../scenes/MainMenu';
import { Ability } from './ability';

export class MainMenuComponent {
	owner: AI;

	upgradeIcons: Phaser.GameObjects.Image[] = [];
	statsIcons: Phaser.GameObjects.Image[] = [];
	statsText: Phaser.GameObjects.Text[] = [];
	costImage: Phaser.GameObjects.Image;
	costText: Phaser.GameObjects.Text;

	abilityContainers: Phaser.GameObjects.Rectangle[] = [];
	abilityImages: Phaser.GameObjects.Image[] = [];

	constructor(ai: AI) {
		this.owner = ai;
	}

	createMainMenu() {
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

			const textImg = this.owner.scene.add.image(4, 4, str).setOrigin(0).setInteractive();
			this.statsIcons.push(textImg);

			const text = this.owner.scene.add
				.text(4, 4, `1`, {
					fontFamily: '"Kristen ITC", arial, serif',
					fontSize: 48,
					color: '#ffffff',
					stroke: '#f2f2f2',
					strokeThickness: 2,
				}).setOrigin(0).setInteractive();
			this.statsText.push(text);

			const image = this.owner.scene.add.image(4, 4, 'upgrade').setOrigin(0).setInteractive({useHandCursor: true}).enableFilters()
				.on('pointerover', () => { image.filters?.internal.addGlow(); image.filters?.external.addGlow(0xff5700, 2); })
				.on('pointerout', () => { image.filters?.internal.clear(); image.filters?.external.clear(); })
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

		const ability1: Ability = this.owner.scene.registry.get('abilities')[this.owner.stats.ability1Index];
		const display1 = ability1.display(this.owner, 4, 4, 0);
		this.abilityContainers.push(display1.rectangle);
		this.abilityImages.push(display1.image);

		const ability2 = this.owner.scene.registry.get('abilities')[this.owner.stats.ability2Index];
		const display2 = ability2.display(this.owner, 4, 4, 0);
		this.abilityContainers.push(display2.rectangle);
		this.abilityImages.push(display2.image);
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

		this.costText.setPosition(w + 128 * scale, h + 100 * scale);
		this.costText.setScale(scale);

		this.abilityContainers.forEach((element) => {
			element.setPosition(w - 64, h + 108 * scale);
			element.setScale(scale);
		});

		this.abilityImages.forEach((element) => {
			element.setPosition(w + 64, h + 108 * scale);
			element.setScale(scale);
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

	updateUpgradeDisplay() {
		const bShow = this.owner.scene.registry.get('money') >= this.owner.getLevel();

		for (var i = 0; i < this.statsText.length; i++) {
			var num = 0;
			if (i == 0) 
				num = this.owner.stats.attack;
			else if (i == 1)
				num = this.owner.stats.defence;
			else if (i == 2) 
				num = this.owner.stats.health;
			else
				num = this.owner.stats.speed;

			this.statsText[i]!.setText(this.owner.scene.abbrvNum(num));

			this.upgradeIcons[i]!.setScale(bShow ? this.owner.storedScale : 0);
		}

		this.costText.setText(this.owner.scene.abbrvNum(this.owner.getLevel()));
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