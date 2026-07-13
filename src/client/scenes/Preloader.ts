import { Scene } from 'phaser';
import { InitResponse } from '../../shared/api';
import { Ability } from '../ai/ability';

export class Preloader extends Scene {
	constructor() {
		super('Preloader');
	}

  	init() {
		const { width, height } = this.scale;
		
		this.add.image(0, 0, 'background').setOrigin(0)

		this.add.rectangle(width / 2, height / 2, width / 1.5, 32).setStrokeStyle(1, 0xffffff);

		const bar = this.add.rectangle(width / 2 - (width / 1.5 / 2) + 4, height / 2, 4, 28, 0xffffff);
		this.load.on('progress', (progress: number) => {
			bar.width = Math.max(width / 1.5 * progress - 8, 0);
		});
  	}

  	preload() {
		this.load.setPath('../assets/');

		// Spritesheets
		this.load.spritesheet('player', 'ai/player/player-spritesheet.png', {frameWidth: 100, frameHeight: 100});
		this.load.spritesheet('enemy0', 'ai/enemy/enemy1-spritesheet.png', {frameWidth: 100, frameHeight: 100});
		this.load.spritesheet('enemy1', 'ai/enemy/enemy2-spritesheet.png', {frameWidth: 200, frameHeight: 200});

		// Main Menu
		this.load.image('fight', 'fight.png');
		this.load.image('money', 'coin.png');
		this.load.image('level', 'level.png');

		// Game
		this.load.image('skip', 'skip.png');
		this.load.image('loop', 'loop.png');
		this.load.image('particle', 'particle.png');

		// AI
		this.load.image('attack', 'attack.png');
		this.load.image('defence', 'defence.png');
		this.load.image('health', 'health.png');
		this.load.image('speed', 'speed.png');
		this.load.image('upgrade', 'upgrade.png');

		// Abilities
		this.load.image('multiAttack', 'abilities/multiAttack.png');
		this.load.image('weaken', 'abilities/weaken.png');
		this.load.image('taunt', 'abilities/taunt.png');
		this.load.image('multiHeal', 'abilities/multiHeal.png');
		this.load.image('slow', 'abilities/slow.png');
		this.load.image('revive', 'abilities/revive.png');
  	}

  	create() {
		void (async () => {
			try {
				const response = await fetch('/api/init');
				if (!response.ok) throw new Error(`API error: ${response.status}`);

				const data = (await response.json()) as InitResponse;
				this.registry.set('money', data.money);
				this.registry.set('level', data.level);
				this.registry.set('username', data.username);
				this.registry.set('subreddit', data.subreddit);
				this.registry.set('ai', data.ai);
				this.registry.set('auto', data.auto);
				this.registry.set('loop', data.loop);

				this.scene.start('MainMenu');
			} catch (error) {
				this.registry.set('money', 0);
				this.registry.set('level', 0);
				this.registry.set('username', undefined);
				this.registry.set('subreddit', undefined);
				var aiArray = [];
				for (var i = 0; i < 1; i++)
					aiArray.push({health: 1, defence: 1, attack: 1, speed: 1})
				this.registry.set('ai', aiArray);
				this.registry.set('auto', false);
				this.registry.set('loop', 'single');

				console.error('Failed to fetch initial count:', error);

				this.scene.start('MainMenu');
			}
		})();

		let abilities: Ability[] = [];
		abilities.push(new Ability('Attack', 'attack', 'attack', 1, 1, 1));
		abilities.push(new Ability('Multi-Attack', 'attack', 'multiAttack', 4, 1, 3));
		abilities.push(new Ability('Weaken', 'attack', 'weaken', 4, 0, 1, 'weaken', 'Reduces enemy\'s defence by half (stacks) for 2 turns', 2));
		abilities.push(new Ability('Riposte', 'defence', 'defence', 1, 0.5, 1));
		abilities.push(new Ability('Taunt', 'defence', 'taunt', 4, 0, 1, 'taunt', 'Taunts enemy to target last taunter', 1));
		abilities.push(new Ability('Heal', 'health', 'health', 1, 0.5, 1));
		abilities.push(new Ability('Multi-Heal', 'health', 'multiHeal', 5, 1, 5));
		abilities.push(new Ability('Revive', 'health', 'revive', 8, 5, 1));
		abilities.push(new Ability('Slow', 'speed', 'slow', 4, 0, 1, 'slow', 'Halves enemy speed (does not stack) for 2 turns', 2));

		this.registry.set('abilities', abilities);
  	}
}
