import { AI } from '../ai/ai';
import { Game } from '../scenes/Game';

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

	constructor(ai: AI) {
		this.owner = ai;
	}

	createGame() {
		
	}

	updateGameLayout(w: number, h: number, scale: number) {
		
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
			let index: number = this.owner.stats.ability1Index;

			if (mainTarget == undefined) {
				// loop through targets and find most optimal target
				// calculate index based on cooldown timer i.e. if ability1 takes 4 turns to cooldown and ability2 takes 1, do ability1 first. 
				// if ability is debuff, don't do if all enemy's have debuff.
				// if ability is health, heal allies.
			}

			this.performAbility(index, mainTarget, targets);
		}
		else {
			// display ability buttons
		}

		this.owner.debuffs.length = 0;
	}

	performAbility(index: number, mainTarget: AI | undefined, targets: AI[]) {
		// Perform ability. Loop on num projectiles. Update target status on death i.e. enemy = new stronger enemy, player = unusable, last player = game over.
	}

	takeHealth(damage: number) {
		this.health = Math.max(Math.min(this.health - damage, this.maxHealth), 0);

		if (damage < 0)
			this.owner.setTint(0xff0029);
		else
			this.owner.setTint(0x00ff57);

		setTimeout(() => {
			this.owner.clearTint();
		}, 200);
	}
}