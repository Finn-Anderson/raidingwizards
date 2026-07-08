import * as Phaser from 'phaser';
import { Game } from '../scenes/Game';
import { AI } from './ai';
import { Ability } from './ability';
import { HoverComponent } from './hoverComponent';

export class GameComponent {
	owner: AI;

	health: number = 5;
	maxHealth: number = this.health;
	stamina: number = 0;
	maxStamina: number = 10;

	healthBarContainer: Phaser.GameObjects.Rectangle;
	healthBar: Phaser.GameObjects.Rectangle;
	speedBarContainer: Phaser.GameObjects.Rectangle;
	speedBar: Phaser.GameObjects.Rectangle;

	abilityDisplay: {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image, hoverComponent: HoverComponent}[] = [];

	constructor(ai: AI) {
		this.owner = ai;
	}

	createGame() {
		const ability1: Ability = this.owner.scene.registry.get('abilities')[this.owner.stats.ability1Index];
		const display1 = ability1.display(this.owner, 4, 4, 0);
		this.abilityDisplay.push(display1);

		const ability2 = this.owner.scene.registry.get('abilities')[this.owner.stats.ability2Index];
		const display2 = ability2.display(this.owner, 4, 4, 0);
		this.abilityDisplay.push(display2);
	}

	updateGameLayout(w: number, h: number, scale: number) {
		this.abilityDisplay.forEach((element, index) => {
			const width = w + (64 * (index * 2 - 1) * scale);
			const height = h;

			element.rectangle.setPosition(width, height);
			if (element.rectangle.scale > 0)
				element.rectangle.setScale(scale);

			element.image.setPosition(width, height);
			if (element.image.scale > 0)
				element.image.setScale(scale);

			element.hoverComponent.updateLayout(width, height, scale);
		});
	}

	turn(targets: AI[], allies: AI[], auto: boolean) {
		let speed = this.owner.stats.speed;
		for (const element of this.owner.debuffs) {
			if (element.debuff != 'slow')
				continue;

			speed = speed / 2;
		}

		this.stamina += speed;

		if (this.stamina < this.maxStamina)
			return;

		this.stamina -= this.maxStamina;

		let mainTarget: AI | undefined = undefined;
		for (const element of this.owner.debuffs) {
			if (element.debuff != 'taunt')
				continue;

			mainTarget = element.applier;
			auto = true;
		}

		if (auto) {
			let ability: Ability = this.owner.scene.registry.get('abilities')[this.owner.stats.ability1Index]; // calculate index based on cooldown timer i.e. if ability1 takes 4 turns to cooldown and ability2 takes 1, do ability1 first

			if (mainTarget == undefined) {
				// loop through targets and find most optimal target
				// if ability is debuff, don't do if all enemy's have debuff.
				// if ability is health, heal allies.
			}

			ability.performAbility(this.owner, mainTarget, targets);
		}
		else {
			this.owner.play('idle');

			this.abilityDisplay.forEach((element) => { element.rectangle.setScale(this.owner.storedScale); element.image.setScale(this.owner.storedScale * 5) });
		}

		this.owner.debuffs.length = 0;
	}

	takeHealth(damage: number) {
		this.health = Math.max(Math.min(this.health - damage, this.maxHealth), 0);

		if (damage < 0)
			this.owner.setTint(0xff0029);
		else
			this.owner.setTint(0x00ff57);

		if (this.health <= 0) {
			this.owner.setRotation(90 * (Math.PI / 180)); // animate
		}

		setTimeout(() => {
			this.owner.clearTint();

			if (this.health > 0)
				return;
			
			this.owner.scene.wizards = this.owner.scene.wizards.filter(item => item !== this.owner);
			this.owner.destroy();
		}, 200);
	}
}