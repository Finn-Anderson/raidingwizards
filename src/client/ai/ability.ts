import * as Phaser from 'phaser';
import { MainMenu } from '../scenes/MainMenu';
import { Game } from '../scenes/Game';
import { AI } from './ai';
import { HoverComponent } from './hoverComponent';
import { AbilitySelector } from '../abilitySelector';

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
	}

	display(owner: AI, x: number, y: number, scale: number, customInteract: boolean = false): {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image, hoverComponent: HoverComponent} {
		const hoverComponent = new HoverComponent(owner.scene, x, y);

		let tint = 0xffffff;
		if (this.type == 'attack') 
			tint = 0xff0029;
		else if (this.type == 'defence') 
			tint = 0x5700ff;
		else if (this.type == 'health') 
			tint = 0x00ff57;
		else if (this.type == 'speed') 
			tint = 0x00a8ff;

		let size = 64;
		if (owner.scene instanceof Game)
			size = 320;

		const rectangle = owner.scene.add.rectangle(x, y, size, size, 0x333333).setStrokeStyle(2, 0x121212).setRounded(50).setScale(scale).setInteractive({useHandCursor: true})
			.on('pointerover', () => { 
				rectangle.setFillStyle(0xff5700); 
				rectangle.setStrokeStyle(2, 0xe64e00);

				const text = this.getText(owner);
				hoverComponent.setDescription(text.title, text.description);
				hoverComponent.startDisplayTimer();
			})
			.on('pointerout', () => { 
				rectangle.setFillStyle(0x333333); 
				rectangle.setStrokeStyle(2, 0x121212); 

				hoverComponent.clearDisplayTimer();
			});

		const image = owner.scene.add.image(x, y, this.texture).setScale(scale * (size / 64)).setTint(tint);

		if (!customInteract) {
			rectangle.on('pointerup', () => {
				if (owner.scene instanceof MainMenu) {
					if (owner.scene.abilitySelector == undefined)
						owner.scene.abilitySelector = new AbilitySelector(owner, this);
				}
				else {
					owner.scene.selectedAbility = this; // don't perform ability. Instead save ability as selected and glow all possible targets. Then perform ability on target select. Call function in game.
				}
			});
		}

		return {rectangle, image, hoverComponent};
	}

	performAbility(owner: AI, mainTarget: AI | undefined, targets: AI[]) {
		owner.GameComponent.abilityDisplay.forEach((element) => { element.rectangle.setScale(0); element.image.setScale(0) });

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

	getText(owner: AI): {title: string, description: string} {
		let damage = 0;
		let damageTxt = 'Damage';
		if (this.type == 'attack') {
			damage = owner.stats.attack;
		}
		else if (this.type == 'defence') {
			damage = owner.stats.defence;
		}
		else if (this.type == 'health') {
			damageTxt = 'Heal';
			damage = owner.stats.attack;
		}
		else if (this.type == 'speed') {
			damage = owner.stats.speed;
		}

		damage *= this.damageMultiplier;

		return {title: this.name, description: `${damageTxt}: ${damage}\nNumber of Projectiles: ${this.numProjectiles}\nCooldown: ${this.turns} turns\n${this.tooltip}`};
	}
}