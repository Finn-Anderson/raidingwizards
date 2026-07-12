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

	damageMultiplier: number;
	numProjectiles: number;

	debuff: string;
	tooltip: string;
	length: number;

	constructor(name: string, type: string, texture: string, turns: number, damageMultiplier: number, numProjectiles: number = 1, debuff: string = '', tooltip: string = '', length: number = 1) {
		this.name = name;
		this.type = type;
		this.texture = texture;

		this.turns = turns;

		this.damageMultiplier = damageMultiplier;
		this.numProjectiles = numProjectiles;

		this.debuff = debuff;
		this.tooltip = tooltip;
		this.length = length;
	}

	display(owner: AI, x: number, y: number, scale: number, customInteract: boolean = false): {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image, hoverComponent: HoverComponent} {
		const hoverComponent = new HoverComponent(owner.scene, x, y, scale);

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
			size = 128;

		const rectangle = owner.scene.add.rectangle(x, y, size, size, 0x333333).setStrokeStyle(2, 0x121212).setRounded(size / 2).setScale(scale).setInteractive({useHandCursor: true})
			.on('pointerover', () => { 
				if (!customInteract && !(owner.scene instanceof Game && owner.scene.selectedAbility == this)) {
					rectangle.setFillStyle(0xff5700); 
					rectangle.setStrokeStyle(2, 0xe64e00);
				}

				const text = this.getText(owner);
				hoverComponent.setDescription(text.title, text.description);
				hoverComponent.startDisplayTimer();
			})
			.on('pointerout', () => { 
				if (!customInteract && !(owner.scene instanceof Game && owner.scene.selectedAbility == this)) {
					rectangle.setFillStyle(0x333333); 
					rectangle.setStrokeStyle(2, 0x121212); 
				}

				hoverComponent.clearDisplayTimer();
			});

		const image = owner.scene.add.image(x, y, this.texture).setScale(scale * (size / 64)).setTint(tint);

		if (!customInteract) {
			rectangle.on('pointerup', () => {
				if (owner.scene instanceof MainMenu) {
					if (!owner.scene.abilitySelector) {
						owner.scene.abilitySelector = new AbilitySelector(owner, this);
						hoverComponent.clearDisplayTimer();
					}
				}
				else {
					owner.scene.selectedAbility = this;
					
					let aiList: AI[] = [...owner.scene.wizards];
					aiList.push(owner.scene.enemy as AI);
					aiList.forEach((element) => {
						element.filters?.external.addGlow(tint, 8, 0, scale);
					});

					owner.GameComponent.abilityDisplay.forEach((element) => { 
						element.rectangle.setFillStyle(0x333333); 
						element.rectangle.setStrokeStyle(2, 0x121212);
					});

					rectangle.setFillStyle(0xff5700); 
					rectangle.setStrokeStyle(2, 0xe64e00);
				}
			});
		}

		return {rectangle, image, hoverComponent};
	}

	performAbility(owner: AI, mainTarget: AI | null, targets: AI[]) {
		owner.GameComponent.abilityDisplay.forEach((element) => { 
			element.rectangle.setScale(0); 
			element.image.setScale(0);
		
			element.turnOverlay.setScale(0);
			element.turnTimer.setScale(0);

			element.rectangle.setFillStyle(0x333333); 
			element.rectangle.setStrokeStyle(2, 0x121212);
		});

		if (this == owner.scene.registry.get('abilities')[owner.stats.ability1Index])
			owner.GameComponent.ability1cooldown = this.turns;
		else
			owner.GameComponent.ability2cooldown = this.turns;

		const scene = owner.scene as Game;
		scene.skipContainer.setScale(0);
		scene.skipImage.setScale(0);

		for (var i = targets.length - 1; i > -1; i--) {
			if ((this.type == 'health' && targets[i]!.GameComponent.health >= targets[i]!.GameComponent.maxHealth) || targets[i]!.GameComponent.health <= 0)
				targets.splice(i, 1);
		}

		for (var i = 0; i < this.numProjectiles; i++) {
			if (i != 0)
				mainTarget = targets[Math.round(Math.random() * (targets.length - 1))] as AI;

			this.use(owner, mainTarget as AI);

			if (mainTarget!.GameComponent.health <= 0 || (this.type == 'health' && mainTarget!.GameComponent.health == mainTarget!.GameComponent.maxHealth))
				targets = targets.filter(item => item != mainTarget);

			if (targets.length == 0)
				break;
		}

		owner.play(owner.identifier+'attack'); // add fx colour on staff based on ability type
		
		scene.selectedAbility = null;

		setTimeout(() => {
			owner.stop();
			owner.setFrame(0);

			const scene: Game = owner.scene as Game;
			const target: AI = mainTarget as AI;
			if (target == scene.enemy && target.GameComponent.health <= 0)
				scene.spawnEnemy();

			scene.doTurn(owner);
		}, 400);
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
			if (element.ability.debuff != 'weaken')
				continue;

			defence = defence / 2;
		}

		if (this.type == 'health') {
			damage *= -1;
			defence = 1;
		}
		
		damage = damage / defence;
		damage = Math.round((damage + Number.EPSILON) * 100) / 100;

		target.GameComponent.takeHealth(damage);

		const scene = owner.scene as Game;
		if (scene.enemy != owner) {
			scene.registry.set('damage', scene.registry.get('damage') + damage);
			scene.updateDamageText();
		}

		if (this.debuff != '') {
			target.debuffs.push({ability: this, turns: this.length, applier: owner});
			target.GameComponent.displayDebuffs();
		}
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