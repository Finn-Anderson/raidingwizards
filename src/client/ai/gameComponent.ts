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
	debuffDisplay: {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image, hoverComponent: HoverComponent}[] = [];
	
	ability1cooldown = 0;
	ability2cooldown = 0;

	constructor(ai: AI) {
		this.owner = ai;
	}

	createGame(bEnemy: boolean = false) {
		this.health = this.owner.stats.health * 5;
		this.maxHealth = this.health;

		if (bEnemy)
			return;

		const ability1: Ability = this.owner.scene.registry.get('abilities')[this.owner.stats.ability1Index];
		const display1 = ability1.display(this.owner, 4, 4, 0);
		this.abilityDisplay.push(display1);

		const ability2 = this.owner.scene.registry.get('abilities')[this.owner.stats.ability2Index];
		const display2 = ability2.display(this.owner, 4, 4, 0);
		this.abilityDisplay.push(display2);
	}

	updateGameLayout(w: number, h: number, scale: number) {
		this.abilityDisplay.forEach((element, index) => {
			const height = this.owner.scene.scale.height;

			const x = (152 + 72 * (index * 2 - 1)) * scale;
			const y = height - 72 * scale;

			element.rectangle.setPosition(x, y);
			if (element.rectangle.scale > 0)
				element.rectangle.setScale(scale);

			element.image.setPosition(x, y);
			if (element.image.scale > 0)
				element.image.setScale(scale * 1.5);

			element.hoverComponent.updateLayout(x, y, scale);
		});

		const halfPoint = (this.debuffDisplay.length - 1) / 2;
		this.debuffDisplay.forEach((element, index) => {
			const x = w + (64 * (index - halfPoint)) * scale;
			const y = h - 128 * scale;

			element.rectangle.setPosition(x, y);
			element.rectangle.setScale(scale / 2);

			element.image.setPosition(x, y);
			element.image.setScale(scale / 2);

			element.hoverComponent.updateLayout(x, y, scale);
		});
	}

	turn(targets: AI[], allies: AI[], auto: boolean) {
		const scene = this.owner.scene as Game;

		if (this.health <= 0) {
			scene.doTurn(this.owner);

			return;
		}

		let speed = this.owner.stats.speed;
		for (const element of this.owner.debuffs) {
			if (element.ability.debuff != 'slow')
				continue;

			speed = speed / 2;
			break;
		}

		this.stamina += speed;

		if (this.stamina < this.maxStamina) {
			scene.doTurn(this.owner);

			return;
		}

		this.stamina -= this.maxStamina;
		
		let ability1: Ability = this.owner.scene.registry.get('abilities')[this.owner.stats.ability1Index];
		let ability2: Ability = this.owner.scene.registry.get('abilities')[this.owner.stats.ability2Index];
		let ability: Ability = ability1;

		this.ability1cooldown = Math.max(this.ability1cooldown - 1, 0);
		this.ability2cooldown = Math.max(this.ability2cooldown - 1, 0);

		if (this.ability1cooldown > 0 && this.ability2cooldown > 0) {
			this.clearDebuffs();
			scene.doTurn(this.owner);

			return;
		}

		let mainTarget: AI | null = null;
		for (const element of this.owner.debuffs) {
			if (element.ability.debuff != 'taunt')
				continue;

			mainTarget = element.applier;
			auto = true;
		}

		if (auto) {
			if (this.ability1cooldown > 0)
				ability = ability2;
			else if (this.ability2cooldown == 0 && ability2.turns > ability1.turns)
				ability = ability2;

			if (!mainTarget) {
				mainTarget = this.selectTarget(ability, [...targets], [...allies]);

				if (!mainTarget && this.ability1cooldown == 0 && this.ability2cooldown == 0) {
					ability = ability == ability1 ? ability2 : ability1;
					this.selectTarget(ability, [...targets], [...allies]);
				}
			}

			if (!mainTarget) {
				this.clearDebuffs();
				scene.doTurn(this.owner);

				return;
			}

			if (ability.type == 'health')
				targets = allies;

			if (ability == ability1)
				this.ability1cooldown = ability.turns;
			else
				this.ability2cooldown = ability.turns;

			ability.performAbility(this.owner, mainTarget, targets);
		}
		else {
			this.owner.play(this.owner.identifier+'idle');

			this.abilityDisplay.forEach((element) => { element.rectangle.setScale(this.owner.storedScale); element.image.setScale(this.owner.storedScale * 5) });
			scene.skipContainer.setScale(this.owner.storedScale);
			scene.skipImage.setScale(this.owner.storedScale);

			// Add ability turn timer display + prevent interaction
		}

		this.clearDebuffs();
	}

	clearDebuffs() {
		for (var i = this.owner.debuffs.length - 1; i > -1; i--) {
			this.owner.debuffs[i]!.turns--;

			if (this.owner.debuffs[i]!.turns == 0)
				this.owner.debuffs.splice(i, 1);
		}

		this.displayDebuffs();
	}

	takeHealth(damage: number) {
		if (damage == 0)
			return;

		this.health = Math.max(Math.min(this.health - damage, this.maxHealth), 0);

		if (damage > 0)
			this.owner.setTint(0xff0029);
		else
			this.owner.setTint(0x00ff57);

		if (this.health <= 0)
			this.owner.setRotation(90 * (Math.PI / 180)); // replace with gravestone
		else
			this.owner.setRotation(0);

		setTimeout(() => { this.owner.clearTint(); }, 400);
	}

	selectTarget(ability: Ability, targets: AI[], allies: AI[]): AI | null {
		if (ability.type == 'health') {
			for (var i = 0; i < allies.length; i++) {
				if (allies[i]!.GameComponent.health == allies[i]!.GameComponent.maxHealth || (ability.name == 'revive' && allies[i]!.GameComponent.health > 0))
					continue;

				return targets[i] as AI;
			}
		}
		else {
			for (var i = targets.length - 1; i > -1; i--) {
				if (targets[i]!.GameComponent.health > 0)
					continue;

				targets.splice(i, 1);
			}

			if (ability.debuff != '') {
				for (var i = 0; i < targets.length; i++) {
					let bContainsDebuff: boolean = false;
					for (var j = 0; j < targets[i]!.debuffs.length; j++) {
						if (targets[i]!.debuffs[j]!.ability != ability)
							continue;

						bContainsDebuff = true;
						break;
					}

					if (bContainsDebuff)
						continue;

					return targets[i] as AI;
				}
			}
			else
				return targets[Math.round(Math.random() * (targets.length - 1))] as AI;
		}

		return null;
	}

	displayDebuffs() {
		this.debuffDisplay.forEach((element) => {
			element.rectangle.destroy();
			element.image.destroy();
			element.hoverComponent.destroy();
		});

		this.debuffDisplay.length = 0;

		this.owner.debuffs.forEach((element) => {
			const display1 = element.ability.display(this.owner, 0, 0, this.owner.storedScale / 2, true);
			this.debuffDisplay.push(display1);
		});

		const { width, height } = this.owner.scene.scale;
		this.owner.scene.updateLayout(width, height);
	}

	destroy() {
		this.abilityDisplay.forEach((element) => {
			element.rectangle.destroy();
			element.image.destroy();
			element.hoverComponent.destroy();
		});

		this.debuffDisplay.forEach((element) => {
			element.rectangle.destroy();
			element.image.destroy();
			element.hoverComponent.destroy();
		});
	}
}