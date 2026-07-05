import * as Phaser from 'phaser';
import { AI } from '../ai/ai';

export class Ability {
	type: string;
	texture: string;

	turns: number;
	cooldown: number;

	damageMultiplier: number;
	numProjectiles: number;

	debuff: string;
	tooltip: string;

	constructor(type: string, texture: string, turns: number, damageMultiplier: number, numProjectiles: number = 1, debuff: string = '', tooltip: string = '') {
		this.type = type;
		this.texture = texture;

		this.turns = turns;
		this.cooldown = 0;

		this.damageMultiplier = damageMultiplier;
		this.numProjectiles = numProjectiles;

		this.debuff = debuff;
		this.tooltip = tooltip;
	}

	display(scene: Phaser.Scene, x: number, y: number, scale: number) {
		// Creates and returns image.
	}

	use(owner: AI, target: AI) {
		let damage = 1;
		if (this.type == 'attack' || this.type == 'health')
			damage = owner.stats.attack;
		else if (this.type == 'defence')
			damage = owner.stats.defence;
		else
			damage = owner.stats.speed;

		damage *= this.damageMultiplier;

		for (const element of owner.debuffs) {
			if (element.debuff != 'weaken')
				continue;

			damage = damage / 2;
		}

		if (this.type == 'health')
			damage *= -1;
		
		owner.GameComponent.takeHealth(damage);

		if (this.debuff != '')
			target.debuffs.push({debuff: this.debuff, applier: owner});
	}
}