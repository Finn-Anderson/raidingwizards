import * as Phaser from 'phaser';
import { AI } from '../ai/ai';
import { Game } from '../scenes/Game';
import { Ability } from './ability';

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

	abilityContainers: Phaser.GameObjects.Rectangle[];
	abilityImages: Phaser.GameObjects.Image[];

	constructor(ai: AI) {
		this.owner = ai;
	}

	createGame() {
		const ability1: Ability = this.owner.scene.registry.get('abilities')[this.owner.stats.ability1Index];
		const display1 = ability1.display(this.owner, 4, 4, 0);
		this.abilityContainers.push(display1.rectangle);
		this.abilityImages.push(display1.image);

		const ability2 = this.owner.scene.registry.get('abilities')[this.owner.stats.ability2Index];
		const display2 = ability2.display(this.owner, 4, 4, 0);
		this.abilityContainers.push(display2.rectangle);
		this.abilityImages.push(display2.image);
	}

	updateGameLayout(w: number, h: number, scale: number) {
		this.abilityContainers.forEach((element) => {
			if (element.scale == 0)
				return;

			element.setPosition(w, h);
			element.setScale(scale);
		});

		this.abilityImages.forEach((element) => {
			if (element.scale == 0)
				return;

			element.setPosition(w + 128, h);
			element.setScale(scale);
		});
	}

	turn(targets: AI[], auto: boolean) {
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

			this.abilityContainers.forEach((element) => { element.setScale(this.owner.storedScale); });
			this.abilityImages.forEach((element) => { element.setScale(this.owner.storedScale); });
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