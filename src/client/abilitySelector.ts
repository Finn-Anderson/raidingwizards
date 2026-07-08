import { Ability } from "./ai/ability";
import { AI } from "./ai/ai";
import { HoverComponent } from "./ai/hoverComponent";
import { MainMenu } from "./scenes/MainMenu";

export class AbilitySelector {
	closeButton: Phaser.GameObjects.Rectangle;
	closeText: Phaser.GameObjects.Text;

	titleContainer: Phaser.GameObjects.Graphics;
	titleText: Phaser.GameObjects.Text;

	contentsContainer: Phaser.GameObjects.Graphics;
	abilities: {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image, hoverComponent: HoverComponent}[];

	descriptionDivider: Phaser.GameObjects.Graphics;
	descriptionTitleText: Phaser.GameObjects.Text;
	descriptionText: Phaser.GameObjects.Text;

	owner: AI;
	statAbilityIndex: number;

	constructor(owner: AI, ability: Ability) {
		this.owner = owner;

		const { width, height } = this.owner.scene.scale;
		const x = width / 2;
		const y = height / 2;
		
		this.titleContainer = this.owner.scene.add.graphics({fillStyle: { color: 0xff5700 }, lineStyle: { width: 2, color: 0xe64e00 }})
			.fillRoundedRect(x, y, 500, 64, { tl: 4, tr: 4, bl: 0, br: 0 })
			.strokeRoundedRect(x, y, 500, 64, { tl: 4, tr: 4, bl: 0, br: 0 })
			.setDepth(2);

		this.titleText = this.owner.scene.add.text(x + 8, y + 4, `Select Ability`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setDepth(2);

		this.closeText = this.owner.scene.add.text(x + 500 - 8, y + 4, `X`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setDepth(2)
			.setOrigin(1, 0.5);

		this.closeButton = this.owner.scene.add.rectangle(x + 500, y, 28, 28, 0x000000, 0)
			.on('pointerover', () => { this.closeText.setTint(0xff5700); })
			.on('pointerout', () => { this.closeText.clearTint; })
			.on('pointerup', () => { this.close(); });

		this.contentsContainer = this.owner.scene.add.graphics({fillStyle: { color: 0x333333 }, lineStyle: { width: 2, color: 0x121212 }})
			.fillRoundedRect(x, y + 32, 500, 556, { tl: 0, tr: 0, bl: 4, br: 4 })
			.strokeRoundedRect(x, y + 32, 500, 556, { tl: 0, tr: 0, bl: 4, br: 4 })
			.setDepth(2);

		this.descriptionDivider = this.owner.scene.add.graphics({fillStyle: { color: 0x121212 }})
			.fillRoundedRect(x, y + 430, 500, 2, { tl: 0, tr: 0, bl: 4, br: 4 })
			.strokeRoundedRect(x, y + 430, 500, 2, { tl: 0, tr: 0, bl: 4, br: 4 })
			.setDepth(2);

		this.descriptionTitleText = this.owner.scene.add.text(x + 8, y + 466, `Select Ability`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setDepth(2);

		this.descriptionText = this.owner.scene.add.text(x + 8, y + 500, ``, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 32,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setDepth(2);

		this.statAbilityIndex = this.owner.stats.ability1Index;
		if (this.owner.scene.registry.get('abilities')[this.statAbilityIndex] != ability)
			this.statAbilityIndex = this.owner.stats.ability2Index;

		this.owner.scene.registry.get('abilities').forEach((element: Ability, index: number) => {
			let column = index - (Math.floor(index / 4) * 4);
			let row = Math.floor(index / 4);

			let abilityX = x + 48 * column;
			let abilityY = x + 48 * row;

			let ability: {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image, hoverComponent: HoverComponent} = element.display(this.owner, abilityX, abilityY, this.owner.storedScale, false);

			ability.rectangle.on('pointerup', () => {
				if (this.owner.stats.ability1Index == this.statAbilityIndex)
					this.owner.stats.ability1Index = index;
				else
					this.owner.stats.ability2Index = index;

				this.statAbilityIndex = index;

				this.updateSelectedVisual();
			});

			this.abilities.push(ability);
		})

		this.setDescription(ability);
		this.updateLayout(x, y, this.owner.storedScale);
		this.updateSelectedVisual();
	}

	close() {
		this.titleContainer.destroy();
		this.titleText.destroy();

		this.closeButton.destroy();
		this.closeText.destroy();

		this.contentsContainer.destroy();
		this.descriptionDivider.destroy();
		this.descriptionTitleText.destroy();
		this.descriptionText.destroy();

		this.abilities.forEach((element) => {
			element.rectangle.destroy();
			element.image.destroy();
			element.hoverComponent.destroy();
		});

		(this.owner.scene as MainMenu).abilitySelector = undefined;
	}

	setDescription(ability: Ability) {
		const text = ability.getText(this.owner);
		this.descriptionTitleText.setText(text.title);
		this.descriptionText.setText(text.description);
	}

	updateSelectedVisual() {
		this.abilities.forEach((element, index) => {
			if (this.statAbilityIndex == index) {
				element.rectangle.setFillStyle(0xff5700);
				element.rectangle.setStrokeStyle(2, 0xe64e00);
			}
			else {
				element.rectangle.setFillStyle(0x333333);
				element.rectangle.setStrokeStyle(2, 0x121212);
			}
		});
	}

	updateLayout(w: number, h: number, scale: number) {
		// update layout
	}
}