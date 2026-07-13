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

	healthBarContainer: Phaser.GameObjects.Rectangle | null;
	healthBar: Phaser.GameObjects.Rectangle | null;
	speedBarContainer: Phaser.GameObjects.Rectangle | null;
	speedBar: Phaser.GameObjects.Rectangle | null;

	emitter: Phaser.GameObjects.Particles.ParticleEmitter | null;
	staffEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null;

	abilityDisplay: {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image, hoverComponent: HoverComponent, turnOverlay: Phaser.GameObjects.Rectangle, turnTimer: Phaser.GameObjects.Text}[] = [];
	debuffDisplay: {rectangle: Phaser.GameObjects.Rectangle, image: Phaser.GameObjects.Image, hoverComponent: HoverComponent}[] = [];
	
	ability1cooldown = 0;
	ability2cooldown = 0;

	constructor(ai: AI) {
		this.owner = ai;

		this.healthBarContainer = null;
		this.healthBar = null;

		this.speedBarContainer = null;
		this.speedBar = null;

		this.emitter = null;
		this.staffEmitter = null;
	}

	createGame(bEnemy: boolean = false) {
		this.health = this.owner.stats.health * 5;
		this.maxHealth = this.health;

		const width = this.owner.width * 1.5;

		this.healthBarContainer = this.owner.scene.add.rectangle(0, 0, width, 20, 0x333333).setStrokeStyle(2, 0x121212).setRounded(50).setOrigin(0, 0.5);
		this.healthBar = this.owner.scene.add.rectangle(0, 0, width - 4, 16, 0x29FF00).setStrokeStyle(2, 0x25e600).setRounded(50).setOrigin(0, 0.5);

		this.speedBarContainer = this.owner.scene.add.rectangle(0, 0, width - 8, 16, 0x333333).setStrokeStyle(2, 0x121212).setRounded(50).setOrigin(0, 0.5);
		this.speedBar = this.owner.scene.add.rectangle(0, 0, width - 12, 12, 0xffd700).setStrokeStyle(2, 0xe6c200).setRounded(50).setOrigin(0, 0.5);

		this.emitter = this.owner.scene.add.particles(0, 0, 'particle', {
			angle: { min: 0, max: 360 },
			speed: { min: 200, max: 400 },
			lifespan: 1000,
			gravityY: 0,
			quantity: 10,
			bounds: new Phaser.Geom.Rectangle(-100, -200, 1000, 750),
			emitting: false,
			alpha: { start: 1, end: 0 },
		});

		this.emitter.enableFilters();
		this.emitter.filters?.external.addBokeh(0.5, 10, 0.2);

		if (bEnemy)
			return;

		const ability1: Ability = this.owner.scene.registry.get('abilities')[this.owner.stats.ability1Index];
		const display1 = ability1.display(this.owner, 0, 0, 0);
		const turnDisplay1 = this.createTurnDisplay();
		this.abilityDisplay.push({rectangle: display1.rectangle, image: display1.image, hoverComponent: display1.hoverComponent, turnOverlay: turnDisplay1.turnOverlay, turnTimer: turnDisplay1.turnTimer});

		const ability2 = this.owner.scene.registry.get('abilities')[this.owner.stats.ability2Index];
		const display2 = ability2.display(this.owner, 0, 0, 0);
		const turnDisplay2 = this.createTurnDisplay();
		this.abilityDisplay.push({rectangle: display2.rectangle, image: display2.image, hoverComponent: display2.hoverComponent, turnOverlay: turnDisplay2.turnOverlay, turnTimer: turnDisplay2.turnTimer});

		this.staffEmitter = this.owner.scene.add.particles(0, 0, 'particle', {
			angle: { min: -120, max: -60 },
			speed: { min: 10, max: 20 },
			lifespan: 300,
			gravityY: 0,
			frequency: 25,
			bounds: new Phaser.Geom.Rectangle(-100, -200, 1000, 750),
			emitting: false,
			alpha: { start: 1, end: 1 },
			duration: 100
		});

		this.staffEmitter.enableFilters();
		this.staffEmitter.filters?.external.addBokeh(0.5, 2, 0.2);
	}

	createTurnDisplay() {
		const turnOverlay = this.owner.scene.add.rectangle(0, 0, 128, 128, 0x000000).setRounded(64).setAlpha(0.5).setScale(0).setInteractive({useHandCursor: false});

		const turnTimer = this.owner.scene.add
			.text(0, 0, `0`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 72,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setScale(0)
			.setOrigin(0.5);

		return {turnOverlay, turnTimer};
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

			element.turnOverlay.setPosition(x, y);
			if (element.turnOverlay.scale > 0)
				element.turnOverlay.setScale(scale);

			element.turnTimer.setPosition(x, y);
			if (element.turnTimer.scale > 0)
				element.turnTimer.setScale(scale);
		});

		const height = this.owner.height / 2;

		const halfPoint = (this.debuffDisplay.length - 1) / 2;
		this.debuffDisplay.forEach((element, index) => {
			const x = w + (64 * (index - halfPoint)) * scale;
			const y = h - height;

			element.rectangle.setPosition(x, y);
			element.rectangle.setScale(scale / 2);

			element.image.setPosition(x, y);
			element.image.setScale(scale * 1.5 / 2);

			element.hoverComponent.updateLayout(x, y, scale);
		});

		if (this.healthBarContainer) {
			this.healthBarContainer.setPosition(w - (this.healthBarContainer.width / 2) * scale, h - height - 82 * scale);
			if (this.healthBarContainer.scale > 0)
				this.healthBarContainer.setScale(scale);
		}
		
		if (this.healthBar) {
			this.healthBar.setPosition(w - (this.healthBar.width / 2) * scale, h - height - 82 * scale);
			if (this.healthBar.scale > 0)
				this.healthBar.setScale((this.health / this.maxHealth) * scale, scale);
		}
		
		if (this.speedBarContainer) {
			this.speedBarContainer.setPosition(w - (this.speedBarContainer.width / 2) * scale, h - height - 50 * scale);
			if (this.speedBarContainer.scale > 0)
				this.speedBarContainer.setScale(scale);
		}
		
		if (this.speedBar) {
			this.speedBar.setPosition(w - (this.speedBar.width / 2) * scale, h - height - 50 * scale);
			if (this.speedBar.scale > 0)
				this.speedBar.setScale((this.stamina / this.maxStamina) * scale);
		}

		if (this.emitter) {
			this.emitter.setPosition(w, h);
			this.emitter.setScale(scale);
		}

		if (this.staffEmitter) {
			this.staffEmitter.setPosition(w + 60 * scale, h - 50 * scale);
			this.staffEmitter.setScale(scale);
		}
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
		this.speedBar!.setScale((this.stamina / this.maxStamina) * this.owner.storedScale, this.owner.storedScale);

		if (this.stamina < this.maxStamina) {
			scene.doTurn(this.owner);

			return;
		}

		this.clearDebuffs();
		
		let ability1: Ability = this.owner.scene.registry.get('abilities')[this.owner.stats.ability1Index];
		let ability2: Ability = this.owner.scene.registry.get('abilities')[this.owner.stats.ability2Index];
		let ability: Ability = ability1;

		this.ability1cooldown = Math.max(this.ability1cooldown - 1, 0);
		this.ability2cooldown = Math.max(this.ability2cooldown - 1, 0);

		if (this.ability1cooldown > 0 && this.ability2cooldown > 0) {
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
				scene.doTurn(this.owner);

				return;
			}

			if (ability.type == 'health')
				targets = allies;

			ability.performAbility(this.owner, mainTarget, targets);
		}
		else {
			this.owner.play(this.owner.identifier+'idle');

			this.abilityDisplay.forEach((element, index) => { 
				element.rectangle.setScale(this.owner.storedScale); 
				element.image.setScale(this.owner.storedScale * 1.5);

				if ((index == 0 && this.ability1cooldown > 0) || (index == 1 && this.ability2cooldown > 0)) {
					element.turnOverlay.setScale(this.owner.storedScale).setDepth(1);
					element.turnTimer.setScale(this.owner.storedScale).setDepth(1);

					if (index == 0)
						element.turnTimer.setText(this.ability1cooldown.toString());
					else
						element.turnTimer.setText(this.ability2cooldown.toString());
				}
			});

			scene.skipContainer.setScale(this.owner.storedScale);
			scene.skipImage.setScale(this.owner.storedScale);
		}
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

		const prevHealth = this.health;
		this.health = Math.max(Math.min(this.health - damage, this.maxHealth), 0);

		let tint = 0xff0029;
		if (damage < 0)
			tint = 0x00ff57;

		this.owner.setTint(tint);
		this.emitter!.setParticleTint(tint);
		this.emitter!.explode(20, 0, 0);
		this.emitter!.setDepth(100);

		this.healthBar!.setScale((this.health / this.maxHealth) * this.owner.storedScale, this.owner.storedScale);

		if (this.health <= 0) {
			let deg = 90;
			if (this.owner.scene.wizards.includes(this.owner))
				deg = -90;

			this.owner.setRotation(deg * (Math.PI / 180));

			this.healthBarContainer!.setScale(0);
			this.healthBar!.setScale(0);

			this.speedBarContainer!.setScale(0);
			this.speedBar!.setScale(0);
		}
		else if (prevHealth <= 0) {
			this.owner.setRotation(0);
			this.owner.setFrame(0);

			this.healthBarContainer!.setScale(this.owner.storedScale);
			this.healthBar!.setScale((this.health / this.maxHealth) * this.owner.storedScale);

			this.speedBarContainer!.setScale(this.owner.storedScale);
			this.speedBar!.setScale((this.stamina / this.maxStamina) * this.owner.storedScale);
		}

		setTimeout(() => { 
			this.owner.clearTint(); 

			if (this.health <= 0 && this.owner.scene.wizards.includes(this.owner)) {
				this.owner.setRotation(0);
				this.owner.setFrame(3);
			}
		}, 400);
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