import { Ability } from "./ai/ability";
import { AI } from "./ai/ai";
import { HoverComponent } from "./ai/hoverComponent";
import { MainMenu } from "./scenes/MainMenu";

export class AbilitySelector {
	bounds: Phaser.GameObjects.Rectangle;

	titleContainer: Phaser.GameObjects.Graphics;
	titleText: Phaser.GameObjects.Text;

	closeButton: Phaser.GameObjects.Rectangle;
	closeText: Phaser.GameObjects.Text;

	contentsContainer: Phaser.GameObjects.Graphics;
	abilities: {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image, hoverComponent: HoverComponent}[] = [];

	descriptionDivider: Phaser.GameObjects.Graphics;
	descriptionTitleText: Phaser.GameObjects.Text;
	descriptionText: Phaser.GameObjects.Text;

	owner: AI;
	statAbilityIndex: number;

	constructor(owner: AI, ability: Ability) {
		this.owner = owner;

		const { width, height } = this.owner.scene.scale;
		const x = width / 2 - 250 * this.owner.storedScale;
		const y = height / 2 - 310 * this.owner.storedScale;

		this.bounds = this.owner.scene.add.rectangle(x, y, 500, 620, 0x000000, 1).setInteractive().setOrigin(0);
		
		this.titleContainer = this.owner.scene.add.graphics({fillStyle: { color: 0xff5700 }, lineStyle: { width: 2, color: 0xe64e00 }})
			.fillRoundedRect(0, 0, 500, 64, { tl: 4, tr: 4, bl: 0, br: 0 })
			.strokeRoundedRect(0, 0, 500, 64, { tl: 4, tr: 4, bl: 0, br: 0 })
			.setDepth(1);

		this.titleText = this.owner.scene.add.text(x + 8, y + 4, `Select Ability`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setDepth(1);

		this.closeText = this.owner.scene.add.text(x + 500 - 8, y + 4, `X`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setDepth(1)
			.setOrigin(1, 0);

		this.closeButton = this.owner.scene.add.rectangle(x + 500 - 4, y, 48, 48, 0x000000, 0).setInteractive({useHandCursor: true})
			.on('pointerover', () => { this.closeText.setTint(0xff0029); })
			.on('pointerout', () => { this.closeText.clearTint(); })
			.on('pointerup', () => { this.close(); })
			.setDepth(1)
			.setOrigin(1, 0);

		this.contentsContainer = this.owner.scene.add.graphics({fillStyle: { color: 0x333333 }, lineStyle: { width: 2, color: 0x121212 }})
			.fillRoundedRect(0, 0, 500, 700 - 64, { tl: 0, tr: 0, bl: 4, br: 4 })
			.strokeRoundedRect(0, 0, 500, 700 - 64, { tl: 0, tr: 0, bl: 4, br: 4 })
			.setDepth(1);

		this.descriptionDivider = this.owner.scene.add.graphics({fillStyle: { color: 0x121212 }})
			.fillRoundedRect(0, 0, 500, 2, { tl: 0, tr: 0, bl: 4, br: 4 })
			.strokeRoundedRect(0, 0, 500, 2, { tl: 0, tr: 0, bl: 4, br: 4 })
			.setDepth(1);

		this.descriptionTitleText = this.owner.scene.add.text(x + 8, y + 570, `Testor`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setDepth(1);

		this.descriptionText = this.owner.scene.add.text(x + 8, y + 628, ``, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 32,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setDepth(1)
			.setWordWrapWidth(500, true);

		this.statAbilityIndex = this.owner.stats.ability1Index;
		if (this.owner.scene.registry.get('abilities')[this.statAbilityIndex] != ability)
			this.statAbilityIndex = this.owner.stats.ability2Index;

		this.owner.scene.registry.get('abilities').forEach((element: Ability, index: number) => {
			let column = index - (Math.floor(index / 4) * 4);
			let row = Math.floor(index / 4);

			let abilityX = x + 64 + 128 * column;
			let abilityY = y + 128 + 128 * row;

			let ability: {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image, hoverComponent: HoverComponent} = element.display(this.owner, abilityX, abilityY, this.owner.storedScale, true);
			ability.rectangle.setDepth(1);
			ability.image.setDepth(1);

			ability.rectangle.on('pointerup', () => {
				if (this.owner.stats.ability1Index == this.statAbilityIndex)
					this.owner.stats.ability1Index = index;
				else
					this.owner.stats.ability2Index = index;

				this.setDescription(this.owner.scene.registry.get('abilities')[index]);
				this.statAbilityIndex = index;

				this.updateSelectedVisual();
				this.owner.MainMenuComponent.regenerateAbilities();

				ability.hoverComponent.clearDisplayTimer();
				this.owner.MainMenuComponent.save();
			});

			this.abilities.push(ability);
		});

		this.setDescription(ability);
		this.updateLayout(x, y, this.owner.storedScale);
		this.updateSelectedVisual();
	}

	close() {
		this.bounds.destroy();

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

		(this.owner.scene as MainMenu).abilitySelector = null;
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
				element.rectangle.setFillStyle(0x444444);
				element.rectangle.setStrokeStyle(2, 0x121212);
			}
		});
	}

	updateLayout(w: number, h: number, scale: number) {
		this.bounds.setPosition(w, h);
		this.bounds.setScale(scale);

		this.titleContainer.setPosition(w, h);
		this.titleContainer.setScale(scale);

		this.titleText.setPosition(w + 8 * scale, h + 4 * scale);
		this.titleText.setScale(scale);

		this.closeText.setPosition(w + (500 - 4) * scale, h);
		this.closeText.setScale(scale);

		this.closeButton.setPosition(w + (500 - 8) * scale, h + 4 * scale);
		this.closeButton.setScale(scale);

		this.contentsContainer.setPosition(w, h + 64 * scale);
		this.contentsContainer.setScale(scale);

		this.descriptionDivider.setPosition(w, h + 454 * scale);
		this.descriptionDivider.setScale(scale);

		this.descriptionTitleText.setPosition(w + 8 * scale, h + 462 * scale);
		this.descriptionTitleText.setScale(scale);

		this.descriptionText.setPosition(w + 8 * scale, h + 528 * scale);
		this.descriptionText.setScale(scale);

		this.abilities.forEach((element, index) => {
			let column = index - (Math.floor(index / 4) * 4);
			let row = Math.floor(index / 4);

			let x = w + (64 + 124 * column) * scale;
			let y = h + (128 + 128 * row) * scale;

			element.rectangle.setPosition(x, y);
			element.rectangle.setScale(scale * 1.5);

			element.image.setPosition(x, y);
			element.image.setScale(scale * 1.5);

			element.hoverComponent.updateLayout(x, y, scale);
		});
	}
}