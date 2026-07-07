import * as Phaser from 'phaser';
import { MainMenu } from '../scenes/MainMenu';
import { Game } from '../scenes/Game';
import { AI } from './ai';
import { HoverComponent } from './hoverComponent';

export class Ability {
	name: string;
	type: string;
	texture: string;

	turns: number;
	cooldown: number;

	damageMultiplier: number;
	numProjectiles: number;

	debuff: string;
	tooltip: string;

	hoverComponent: HoverComponent;

	constructor(name: string, type: string, texture: string, turns: number, damageMultiplier: number, numProjectiles: number = 1, debuff: string = '', tooltip: string = '') {
		this.name = name;
		this.type = type;
		this.texture = texture;

		this.turns = turns;
		this.cooldown = 0;

		this.damageMultiplier = damageMultiplier;
		this.numProjectiles = numProjectiles;

		this.debuff = debuff;
		this.tooltip = tooltip;

		this.hoverComponent = new HoverComponent();
	}

	display(owner: AI, x: number, y: number, scale: number): {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image} {
		let tint = 0xffffff;
		let damage = 0;
		let damageTxt = 'Damage';
		if (this.type == 'attack') {
			tint = 0xff0029;
			damage = owner.stats.attack;
		}
		else if (this.type == 'defence') {
			tint = 0x5700ff;
			damage = owner.stats.defence;
		}
		else if (this.type == 'health') {
			tint = 0x00ff57;
			damageTxt = 'Heal';
			damage = owner.stats.attack;
		}
		else if (this.type == 'speed') {
			tint = 0x00a8ff;
			damage = owner.stats.speed;
		}

		let size = 64;
		if (owner.scene instanceof Game)
			size = 320;

		const rectangle = owner.scene.add.rectangle(x, y, size, size, 0x333333).setStrokeStyle(2, 0x121212).setRounded(50).setScale(scale).setInteractive({useHandCursor: true})
			.on('pointerover', () => { 
				rectangle.setFillStyle(0xff5700); 
				rectangle.setStrokeStyle(2, 0xe64e00);

				this.hoverComponent.setDescription(this.name, `${damageTxt}: ${this.damageMultiplier}\nNumber of Projectiles: ${this.numProjectiles}\nCooldown: ${this.turns} turns\n${this.tooltip}`);
				this.hoverComponent.startDisplayTimer();
			})
			.on('pointerout', () => { 
				rectangle.setFillStyle(0x333333); 
				rectangle.setStrokeStyle(2, 0x121212); 

				this.hoverComponent.clearDisplayTimer();
			});

		const image = owner.scene.add.image(x, y, this.texture).setScale(scale * (size / 64)).setTint(tint);

		rectangle.on('pointerup', () => {
			if (owner.scene instanceof MainMenu) {
				// Launch ability selector window
			}
			else {
				owner.scene.selectedAbility = this; // don't perform ability. Instead save ability as selected and glow all possible targets. Then perform ability on target select;
			}
		});

		return {rectangle, image};
	}

	performAbility(owner: AI, mainTarget: AI | undefined, targets: AI[]) {
		owner.GameComponent.abilityContainers.forEach((element) => { element.setScale(0); });
		owner.GameComponent.abilityImages.forEach((element) => { element.setScale(0); });

		for (var i = 0; i < this.numProjectiles; i++) {
			let target = mainTarget;
			if (i != 0 || target == undefined)
				target = targets[Math.round(Math.random() * (targets.length - 1))] as AI;

			this.use(owner, target as AI);

			if (target!.GameComponent.health <= 0)
				targets = targets.filter(item => item !== target);
			else if (this.type == 'health' && target!.GameComponent.health == target!.GameComponent.maxHealth)
				targets = targets.filter(item => item !== target);

			if (targets.length == 0)
				break;
		}

		owner.play('attack'); // add fx colour on staff based on ability type

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
		let defence = target.stats.defence;

		for (const element of target.debuffs) {
			if (element.debuff != 'weaken')
				continue;

			defence = defence / 2;
		}

		if (this.type == 'health') {
			damage *= -1;
			defence = 1;
		}
		
		owner.GameComponent.takeHealth(damage / defence);

		if (this.debuff != '')
			target.debuffs.push({debuff: this.debuff, applier: owner});
	}
}