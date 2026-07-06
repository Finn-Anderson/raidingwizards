import * as Phaser from 'phaser';
import { MainMenu } from '../scenes/MainMenu';
import { Game } from '../scenes/Game';
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

	display(owner: AI, x: number, y: number, scale: number): {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image} {
		const rectangle = owner.scene.add.rectangle(x, y, 100, 100, 0x333333).setStrokeStyle(2, 0x121212).setRounded(50).setScale(scale)
			.setInteractive({useHandCursor: true})
			.on('pointerover', () => { rectangle.setFillStyle(0xff5700); rectangle.setStrokeStyle(2, 0xe64e00); })
			.on('pointerout', () => { rectangle.setFillStyle(0x333333); rectangle.setStrokeStyle(2, 0x121212); });

		const image = owner.scene.add.image(x, y, this.texture).setScale(scale);

		rectangle.on('pointerup', () => {
			if (owner.scene instanceof MainMenu) {
				// Launch ability selector window
			}
			else {
				this.performAbility(owner, undefined, []);
			}
		});

		return {rectangle, image};
	}

	performAbility(owner: AI, mainTarget: AI | undefined, targets: AI[]) {
		if (mainTarget == undefined) {
			const scene = owner.scene as Game;
			mainTarget = scene.enemy;
			targets.push(mainTarget);
		}

		owner.GameComponent.abilityContainers.forEach((element) => { element.setScale(0); });
		owner.GameComponent.abilityImages.forEach((element) => { element.setScale(0); });

		for (var i = 0; i < this.numProjectiles; i++) {
			let target = mainTarget;
			if (i != 0 || target == undefined)
				target = targets[Math.round(Math.random() * (targets.length - 1))] as AI;

			this.use(owner, target as AI);

			if (target!.GameComponent.health <= 0)
				targets = targets.filter(item => item !== target);

			if (targets.length == 0)
				break;
		}

		owner.play('attack');

		setTimeout(() => {
			owner.stop();
			owner.setFrame(0);

			// run function to play next turn;
		}, 200);
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