import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AI } from '../ai/ai';
import { Ability } from '../ai/ability';
import { NumberResponse } from '../../shared/api';

export class Game extends Scene {
	background: Phaser.GameObjects.Image;

	damageImage: Phaser.GameObjects.Image;
	damageText: Phaser.GameObjects.Text;

	skipContainer: Phaser.GameObjects.Rectangle;
	skipImage: Phaser.GameObjects.Image;

	loopContainer: Phaser.GameObjects.Rectangle;
	loopImage: Phaser.GameObjects.Image; // In order: single, loop, infinity

	autoContainer: Phaser.GameObjects.Rectangle;
	autoText: Phaser.GameObjects.Text;

	gameOverOverlay: Phaser.GameObjects.Rectangle;
	gameOverText: Phaser.GameObjects.Text;

	wizards: AI[] = [];
	enemy: AI | null = null;

	selectedAbility: Ability | null = null;
	selectedAI: AI;

	level: number = 0;

	constructor() {
		super('Game');
	}

  	create() {
		const { width, height } = this.scale;

		this.background = this.add.image(0, 0, 'background').setOrigin(0);

		this.registry.set('damage', 0);

		this.damageImage = this.add.image(0, 0, 'attack').setOrigin(0).setTint(0xff0029);
		this.damageText = this.add
			.text(0, 0, `${this.registry.get('damage')}`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 72,
				color: '#ff0029',
				stroke: '#e60025',
				strokeThickness: 2,
			});

		for (let i = 0; i < this.registry.get('ai').length; i++) {
			const x = i % 2 == 0 ? width / 8 : width / 4 + width / 8;
			const y = height / 4 + Math.floor(i / 2) * height / 4;

			const ai = new AI(this, x, y, 'player', i);
			ai.setStats(this.registry.get('ai')[i]);
			ai.create();
			ai.enableFilters().setInteractive({ useHandCursor: true });
			ai.on('pointerup', () => {
				if (!this.selectedAbility)
					return;

				this.selectedAbility.performAbility(this.selectedAI, ai, [...this.wizards]);
			});

			this.wizards.push(ai);

			this.level += ai.getLevel();
		}

		this.level = Math.floor(this.level * 0.9);

		this.spawnEnemy();

		this.skipContainer = this.add.rectangle(0, 0, 112, 112, 0x333333).setStrokeStyle(2, 0x121212).setRounded(48).setInteractive({useHandCursor: true}).setScale(0)
			.on('pointerover', () => { 
				this.skipContainer.setFillStyle(0xff5700); 
				this.skipContainer.setStrokeStyle(2, 0xe64e00);
			})
			.on('pointerout', () => { 
				this.skipContainer.setFillStyle(0x333333); 
				this.skipContainer.setStrokeStyle(2, 0x121212); 
			})
			.on('pointerup', () => {
				this.selectedAI.stop();
				this.selectedAI.setFrame(0);

				this.selectedAI.GameComponent.abilityDisplay.forEach((element) => { element.rectangle.setScale(0); element.image.setScale(0) });
				this.skipContainer.setScale(0);
				this.skipImage.setScale(0);

				this.doTurn(this.selectedAI);
			});
		this.skipImage = this.add.image(0, 0, 'skip').setScale(0);

		let fill = 0x333333;
		let stroke = 0x121212;
		if (this.registry.get('auto')) {
			fill = 0xff5700;
			stroke = 0xe64e00;
		}

		this.loopContainer = this.add.rectangle(0, 0, 112, 112, fill).setStrokeStyle(2, stroke).setRounded(48).setInteractive({useHandCursor: true})
			.on('pointerover', () => { 
				if (this.registry.get('loop'))
					return;

				this.loopContainer.setFillStyle(0xff5700); 
				this.loopContainer.setStrokeStyle(2, 0xe64e00);
			})
			.on('pointerout', () => { 
				if (this.registry.get('loop'))
					return;
				
				this.loopContainer.setFillStyle(0x333333); 
				this.loopContainer.setStrokeStyle(2, 0x121212); 
			})
			.on('pointerup', () => {
				let loop = !this.registry.get('loop');

				if (loop) {
					this.loopContainer.setFillStyle(0xff5700);
					this.loopContainer.setStrokeStyle(2, 0xe64e00);
				}
				else {
					this.loopContainer.setFillStyle(0x333333);
					this.loopContainer.setStrokeStyle(2, 0x121212);
				}

				this.registry.set('loop', loop);
			});
		this.loopImage = this.add.image(0, 0, 'loop');

		fill = 0x333333;
		stroke = 0x121212;
		if (this.registry.get('auto')) {
			fill = 0xff5700;
			stroke = 0xe64e00;
		}

		this.autoContainer = this.add.rectangle(0, 0, 112, 112, fill).setStrokeStyle(2, stroke).setRounded(48).setInteractive({useHandCursor: true})
			.on('pointerover', () => { 
				if (this.registry.get('auto'))
					return;

				this.autoContainer.setFillStyle(0xff5700); 
				this.autoContainer.setStrokeStyle(2, 0xe64e00);
			})
			.on('pointerout', () => { 
				if (this.registry.get('auto'))
					return;

				this.autoContainer.setFillStyle(0x333333); 
				this.autoContainer.setStrokeStyle(2, 0x121212); 
			})
			.on('pointerup', () => {
				let auto = !this.registry.get('auto');

				if (auto) {
					this.autoContainer.setFillStyle(0xff5700);
					this.autoContainer.setStrokeStyle(2, 0xe64e00);
				}
				else {
					this.autoContainer.setFillStyle(0x333333);
					this.autoContainer.setStrokeStyle(2, 0x121212);
				}

				if (auto && this.selectedAI != this.enemy) {
					let targets: AI[] = [this.enemy as AI];
					let allies: AI[] = this.wizards;

					this.selectedAI.GameComponent.turn(targets, allies, auto);
				}

				this.registry.set('auto', auto);
			});
		this.autoText = this.add
			.text(0, 0, `auto`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 30,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			}).setOrigin(0);

		this.gameOverOverlay = this.add.rectangle(0, 0, width, height, 0xff0029).setOrigin(0).setAlpha(0)
			.on('pointerup', () => {
				this.scene.start('MainMenu');
			});
		this.gameOverText = this.add
			.text(0, 0, `Game Over`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 72,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setAlpha(0)
			.setOrigin(0.5);

		this.updateLayout(width, height);
		this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
			const { width, height } = gameSize;
			this.updateLayout(width, height);
		});

		this.doTurn(null);
  	}

  	updateLayout(width: number, height: number) {
		this.cameras.resize(width, height);

    	if (this.background)
      		this.background.setDisplaySize(width, height);

		const scaleFactor = Math.min(height / 1600, 1);

		this.damageImage.setPosition(8 * scaleFactor, 16 * scaleFactor);
		this.damageImage.setScale(scaleFactor * 1.5);

		if (this.gameOverOverlay.alpha > 0)
			this.damageText.setPosition(width / 2, height / 2);
		else
			this.damageText.setPosition(90 * scaleFactor, 8 * scaleFactor);
		this.damageText.setScale(scaleFactor);
		
		this.wizards.forEach((ai) => {
			const x = ai.index % 2 == 0 ? width / 8 : width / 4 + width / 8;
			const y = height / 4 + Math.floor(ai.index / 2) * height / 4;

			ai.updateLayout(x, y, scaleFactor);
		});

		if (this.enemy) {
			this.enemy.setPosition(width - 196 * scaleFactor, height / 2);
			this.enemy.setScale(scaleFactor);
			this.enemy.updateLayout(width - 196 * scaleFactor, height / 2, scaleFactor);
		}

		this.skipContainer.setPosition(360 * scaleFactor, height - 64 * scaleFactor);
		if (this.skipContainer.scale > 0)
			this.skipContainer.setScale(scaleFactor);

		this.skipImage.setPosition(360 * scaleFactor, height - 64 * scaleFactor);
		if (this.skipImage.scale > 0)
			this.skipImage.setScale(scaleFactor);

		this.loopContainer.setPosition(width - 200 * scaleFactor, height - 64 * scaleFactor);
		if (this.loopContainer.scale > 0)
			this.loopContainer.setScale(scaleFactor);

		this.loopImage.setPosition(width - 200 * scaleFactor, height - 64 * scaleFactor);
		if (this.loopImage.scale > 0)
			this.loopImage.setScale(scaleFactor);

		this.autoContainer.setPosition(width - 72 * scaleFactor, height - 64 * scaleFactor);
		if (this.autoContainer.scale > 0)
			this.autoContainer.setScale(scaleFactor);

		this.autoText.setPosition(width - 108 * scaleFactor, height - 86 * scaleFactor);
		if (this.autoText.scale > 0)
			this.autoText.setScale(scaleFactor);

		this.gameOverOverlay.setPosition(0, 0);
		this.gameOverOverlay.setDisplaySize(width, height);

		this.gameOverText.setPosition(width / 2, height / 4);
		this.gameOverText.setScale(scaleFactor);
  	}

 	updateDamageText() {
		this.damageText.setText(`${this.abbrvNum(this.registry.get('damage'))}`);
  	}

	abbrvNum(number: number): string {
		const abbrv = ['k', 'm', 'b', 't', 'sn'];

		for (var i = abbrv.length - 1; i > -1; i--) {
			const size = Math.pow(10, (i + 1) * 3);

			if (size <= number) {
				if (abbrv[i] == 'sn')
					return number.toExponential();
				else
					return number.toString() + String(abbrv[i]);
			}
		}

		return number.toString();
	}

	doTurn(last: AI | null) {
		this.tweens.killAll();

		let aiList: AI[] = [...this.wizards];
		aiList.push(this.enemy as AI);
		aiList.forEach((element) => {
			element.filters?.external.clear();
		});

		let gameOver: boolean = true;
		this.wizards.forEach((ai) => {
			if (ai.GameComponent.health == 0)
				return;

			gameOver = false;
		});

		if (gameOver) {
			this.gameOver();

			return;
		}

		let index: number = -1;
		if (last) {
			index = aiList.findIndex((element) => element == last);

			if (last.GameComponent.stamina >= last.GameComponent.maxStamina)
				last.GameComponent.stamina -= last.GameComponent.maxStamina;

			last.GameComponent.speedBar!.setScale((last.GameComponent.stamina / last.GameComponent.maxStamina) * last.storedScale, last.storedScale);
		}

		index++;
		if (index == aiList.length)
			index = 0;

		let ai: AI = aiList[index] as AI;
		let auto: boolean = this.registry.get('auto');
		let targets: AI[] = [this.enemy as AI];
		let allies: AI[] = [...this.wizards];
		if (ai == this.enemy as AI) {
			auto = true;
			targets = [...this.wizards];
			allies = [this.enemy as AI];
		}

		this.selectedAI = ai;
		ai!.GameComponent.turn(targets, allies, auto);
	}

	spawnEnemy() {
		this.enemy?.GameComponent.destroy();
		this.enemy?.destroy();

		const { width, height } = this.scale;
		const scaleFactor = Math.min(Math.min(width / 1024, height / 768), 1);

		let stats: {health: number, defence: number, attack: number, speed: number, ability1Index: number, ability2Index: number} = {health: 1, defence: 1, attack: 1, speed: 1, ability1Index: 0, ability2Index: 2};
		for (var i = 0; i < this.level; i++) {
			let num = Math.round(Math.random() * 3);
			if (num == 0)
				stats.health++;
			else if (num == 1)
				stats.defence++;
			else if (num == 2)
				stats.health++;
			else
				stats.speed++;
		}

		let firstAbility = [0, 3];

		let secondAbility = [...this.registry.get('abilities')] as Ability[];
		secondAbility.splice(0, 1);
		secondAbility.splice(3, 1);

		let length = secondAbility.length;
		let abiltiesIndexList: number[] = Array.from({length}, (_, index) => index);

		stats.ability1Index = firstAbility[Math.round(Math.random())] as number;
		stats.ability2Index = abiltiesIndexList[Math.round(Math.random() * (length - 1))] as number;

		this.enemy = new AI(this, 0, 0, 'enemy' + Math.round(Math.random()), -1).setScale(scaleFactor);
		let aiList: AI[] = [...this.wizards];
		aiList.push(this.enemy);

		this.enemy.setStats(stats);
		this.enemy.create(true);
		this.enemy.enableFilters().setInteractive({ useHandCursor: true });
		this.enemy.on('pointerup', () => {
			if (!this.selectedAbility)
				return;

			this.selectedAbility.performAbility(this.selectedAI, this.enemy, [this.enemy as AI]);
		});

		let maxStamina = 1;
		aiList.forEach((element) => {
			if (maxStamina < element.stats.speed)
				maxStamina = element.stats.speed;
		});

		aiList.forEach((element) => {
			element.GameComponent.stamina = 0;
			element.GameComponent.maxStamina = maxStamina;
			element.GameComponent.speedBar!.setScale(0, element.storedScale);
		});
	}

	gameOver() {
		if (this.registry.get('loop')) {
			this.scene.start('Game');

			return;
		}

		this.skipContainer.setScale(0);
		this.skipImage.setScale(0);

		this.loopContainer.setScale(0);
		this.loopImage.setScale(0);

		this.autoContainer.setScale(0);
		this.autoText.setScale(0);

		this.gameOverOverlay.setDepth(3);
		this.gameOverText.setDepth(3);

		this.damageText.setDepth(3).setAlpha(0).setOrigin(0.5);
		this.damageText.setColor('#ffffff');
		this.damageText.setStroke('#f2f2f2', 2);

		void (async () => {
			const username = this.registry.get('username');
			const subreddit = this.registry.get('subreddit');
			const damage = this.registry.get('damage');
			const money = this.registry.get('money') + Math.ceil(damage * 0.1);

			if (username == undefined) {
				this.registry.set('money', money);
			}
			else {
				try {
					var moneyPayload = {
						money: money,
						username: username
					};
					const data = JSON.stringify( moneyPayload );
							
					const response = await fetch('/api/setmoney', { 
						method: 'POST',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json'
						},
						body: data 
					});
					if (!response.ok) throw new Error(`API error: ${response.status}`);
					const responseData = (await response.json()) as NumberResponse;
					this.registry.set('money', responseData.num);
				} catch (error) {
					console.error('Failed to set money:', error);
				}
			}
			
			if (subreddit == undefined) {
				this.registry.set('level', this.registry.get('level') + damage);
			}
			else {
				try {
					var levelPayload = {
						level: damage,
						subreddit: subreddit
					};
					
					const data = JSON.stringify( levelPayload );
							
					const response = await fetch('/api/setlevel', { 
						method: 'POST',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json'
						},
						body: data 
					});
					if (!response.ok) throw new Error(`API error: ${response.status}`);
					const responseData = (await response.json()) as NumberResponse;
					this.registry.set('level', responseData.num);
				} catch (error) {
					console.error('Failed to set level:', error);
				}
			}
			
			if (username != 'anonymous') {
				try {
					var uiPayload = {
						auto: this.registry.get('auto'),
						loop: this.registry.get('loop')
					};
					
					const data = JSON.stringify( uiPayload );
							
					const response = await fetch('/api/saveui', { 
						method: 'POST',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json'
						},
						body: data 
					});
					if (!response.ok) throw new Error(`API error: ${response.status}`);
				} catch (error) {
					console.error('Failed to set level:', error);
				}
			}

			this.gameOverOverlay.setInteractive({ useHandCursor: true });
		})();

		this.graduallyShowGameOver(0.01);
	}

	graduallyShowGameOver(alpha: number) {
		this.gameOverOverlay.setAlpha(alpha / 2);
		this.gameOverText.setAlpha(alpha);

		this.damageImage.setAlpha(alpha);
		this.damageText.setAlpha(alpha);

		if (alpha == 1)
			return;

		setTimeout(() => { this.graduallyShowGameOver(alpha + 0.01); }, 0.01);
	}
}