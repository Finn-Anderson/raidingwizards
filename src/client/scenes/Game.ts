import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AI } from '../ai/ai';
import { Ability } from '../ai/ability';
import { NumberResponse } from '../../shared/api';

export class Game extends Scene {
	background: Phaser.GameObjects.Image | null;

	damageImage: Phaser.GameObjects.Image | null;
	damageText: Phaser.GameObjects.Text | null;

	skipContainer: Phaser.GameObjects.Rectangle | null;
	skipImage: Phaser.GameObjects.Image | null;

	loopContainer: Phaser.GameObjects.Rectangle | null;
	loopImage: Phaser.GameObjects.Image | null;

	autoContainer: Phaser.GameObjects.Rectangle | null;
	autoText: Phaser.GameObjects.Text | null;

	gameOverOverlay: Phaser.GameObjects.Rectangle | null;
	gameOverDamageText: Phaser.GameObjects.Text | null;
	gameOverText: Phaser.GameObjects.Text | null;
	continueText: Phaser.GameObjects.Text | null;

	commentButton: Phaser.GameObjects.Rectangle | null;
	commentText: Phaser.GameObjects.Text | null;

	wizards: AI[];
	enemy: AI | null;

	selectedAbility: Ability | null;
	selectedAI: AI | null;

	level: number;

	timerHandler: number;
	gameOverAlpha: number;

	constructor() {
		super('Game');
	}

	init() {
		this.background = null;

		this.damageImage = null;
		this.damageText = null;
		
		this.skipContainer = null;
		this.skipImage = null;
		
		this.loopContainer = null;
		this.loopImage = null;
		
		this.autoContainer = null;
		this.autoText = null;

		this.gameOverOverlay = null;
		this.gameOverDamageText = null;
		this.gameOverText = null;
		this.continueText = null;

		this.commentButton = null;
		this.commentText = null;

		this.wizards = [];
		this.enemy = null;

		this.selectedAbility = null;
		this.selectedAI = null;

		this.level = 0;

		this.timerHandler = -1;
		this.gameOverAlpha = 0;
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
				if (!this.selectedAbility || (ai.GameComponent.health == 0 && this.selectedAbility.name != 'Revive'))
					return;

				this.selectedAbility.performAbility(this.selectedAI!, ai, [...this.wizards]);
			});

			this.wizards.push(ai);

			this.level += ai.getLevel();
		}

		this.level = Math.floor(this.level * 0.5);

		this.spawnEnemy();

		this.skipContainer = this.add.rectangle(0, 0, 112, 112, 0x333333).setStrokeStyle(2, 0x121212).setRounded(48).setInteractive({useHandCursor: true}).setScale(0)
			.on('pointerover', () => { 
				this.skipContainer!.setFillStyle(0xff5700); 
				this.skipContainer!.setStrokeStyle(2, 0xe64e00);
			})
			.on('pointerout', () => { 
				this.skipContainer!.setFillStyle(0x333333); 
				this.skipContainer!.setStrokeStyle(2, 0x121212); 
			})
			.on('pointerup', () => {
				this.selectedAI!.stop();
				this.selectedAI!.setFrame(0);

				this.selectedAI!.GameComponent.abilityDisplay.forEach((element) => { element.rectangle.setScale(0); element.image.setScale(0) });
				this.skipContainer!.setScale(0);
				this.skipImage!.setScale(0);

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

				this.loopContainer!.setFillStyle(0xff5700); 
				this.loopContainer!.setStrokeStyle(2, 0xe64e00);
			})
			.on('pointerout', () => { 
				if (this.registry.get('loop'))
					return;
				
				this.loopContainer!.setFillStyle(0x333333); 
				this.loopContainer!.setStrokeStyle(2, 0x121212); 
			})
			.on('pointerup', () => {
				const loop = !this.registry.get('loop');

				if (loop) {
					this.loopContainer!.setFillStyle(0xff5700);
					this.loopContainer!.setStrokeStyle(2, 0xe64e00);
				}
				else {
					this.loopContainer!.setFillStyle(0x333333);
					this.loopContainer!.setStrokeStyle(2, 0x121212);
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

				this.autoContainer!.setFillStyle(0xff5700); 
				this.autoContainer!.setStrokeStyle(2, 0xe64e00);
			})
			.on('pointerout', () => { 
				if (this.registry.get('auto'))
					return;

				this.autoContainer!.setFillStyle(0x333333); 
				this.autoContainer!.setStrokeStyle(2, 0x121212); 
			})
			.on('pointerup', () => {
				const auto = !this.registry.get('auto');

				if (auto) {
					this.autoContainer!.setFillStyle(0xff5700);
					this.autoContainer!.setStrokeStyle(2, 0xe64e00);
				}
				else {
					this.autoContainer!.setFillStyle(0x333333);
					this.autoContainer!.setStrokeStyle(2, 0x121212);
				}

				if (auto && this.selectedAI != this.enemy && this.selectedAI!.anims.currentAnim!.key == this.selectedAI!.identifier+'idle')
					this.selectedAI!.GameComponent.performAutoAttack(this, null, [this.enemy as AI], [...this.wizards]);

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
		this.gameOverDamageText = this.add
			.text(0, 0, `0`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 96,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setAlpha(0)
			.setOrigin(0.5);
		this.continueText = this.add
			.text(0, 0, `continue`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setAlpha(0)
			.setOrigin(0.5);

		this.commentButton = this.add.rectangle(0, 0, 720, 72, 0x333333).setStrokeStyle(2, 0x121212).setRounded(4).setAlpha(0)
			.on('pointerover', () => { 
				this.commentButton!.setFillStyle(0xff5700); 
				this.commentButton!.setStrokeStyle(2, 0xe64e00);
			})
			.on('pointerout', () => {
				this.commentButton!.setFillStyle(0x333333); 
				this.commentButton!.setStrokeStyle(2, 0x121212);
			})
			.on('pointerup', () => {
				this.postComment();
			});
		this.commentText = this.add
			.text(0, 0, `Post Result to Comments`, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
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

		this.damageImage!.setPosition(8 * scaleFactor, 16 * scaleFactor);
		this.damageImage!.setScale(scaleFactor * 1.5);

		this.damageText!.setPosition(90 * scaleFactor, 8 * scaleFactor);
		this.damageText!.setScale(scaleFactor);
		
		this.wizards.forEach((ai) => {
			const x = ai.index % 2 == 0 ? width / 8 - 40 * scaleFactor : width / 4 + width / 8;
			const y = height / 4 + Math.floor(ai.index / 2) * height / 4;

			ai.updateLayout(x, y, scaleFactor, height);
		});

		if (this.enemy) {
			this.enemy.setPosition(width - 196 * scaleFactor, height / 2);
			this.enemy.setScale(scaleFactor);
			this.enemy.updateLayout(width - 196 * scaleFactor, height / 2, scaleFactor);
		}

		this.skipContainer!.setPosition(360 * scaleFactor, height - 64 * scaleFactor);
		if (this.skipContainer!.scale > 0)
			this.skipContainer!.setScale(scaleFactor);

		this.skipImage!.setPosition(360 * scaleFactor, height - 64 * scaleFactor);
		if (this.skipImage!.scale > 0)
			this.skipImage!.setScale(scaleFactor);

		this.loopContainer!.setPosition(width - 200 * scaleFactor, height - 64 * scaleFactor);
		if (this.loopContainer!.scale > 0)
			this.loopContainer!.setScale(scaleFactor);

		this.loopImage!.setPosition(width - 200 * scaleFactor, height - 64 * scaleFactor);
		if (this.loopImage!.scale > 0)
			this.loopImage!.setScale(scaleFactor);

		this.autoContainer!.setPosition(width - 72 * scaleFactor, height - 64 * scaleFactor);
		if (this.autoContainer!.scale > 0)
			this.autoContainer!.setScale(scaleFactor);

		this.autoText!.setPosition(width - 108 * scaleFactor, height - 86 * scaleFactor);
		if (this.autoText!.scale > 0)
			this.autoText!.setScale(scaleFactor);

		this.gameOverOverlay!.setPosition(0, 0);
		this.gameOverOverlay!.setDisplaySize(width, height);

		this.gameOverText!.setPosition(width / 2, height / 4);
		this.gameOverText!.setScale(scaleFactor);

		this.gameOverDamageText!.setPosition(width / 2, height / 2);
		this.gameOverDamageText!.setScale(scaleFactor);

		this.continueText!.setPosition(width / 2, height * 0.75);
		this.continueText!.setScale(scaleFactor);

		this.commentButton!.setPosition(width / 2, height * 0.9);
		this.commentButton!.setScale(scaleFactor);

		this.commentText!.setPosition(width / 2, height * 0.9);
		this.commentText!.setScale(scaleFactor);
  	}

 	updateDamageText() {
		this.damageText!.setText(`${this.abbrvNum(this.registry.get('damage'))}`);
  	}

	abbrvNum(number: number): string {
		const abbrv = ['k', 'm', 'b', 't', 'sn'];

		for (let i = abbrv.length - 1; i > -1; i--) {
			const size = Math.pow(10, (i + 1) * 3);

			if (size <= number) {
				if (abbrv[i] == 'sn')
					return number.toExponential();
				else
					return (number / size).toFixed(2) + String(abbrv[i]);
			}
		}

		return number.toString();
	}

	doTurn(last: AI | null) {
		this.tweens.killAll();

		const aiList: AI[] = [...this.wizards];
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

			if (last.GameComponent.stamina >= last.GameComponent.maxStamina) {
				last.GameComponent.stamina -= last.GameComponent.maxStamina;
				last.GameComponent.clearDebuffs();
			}

			if (last.GameComponent.health > 0)
				last.GameComponent.speedBar!.setScale(Math.min(last.GameComponent.stamina / last.GameComponent.maxStamina, 1) * last.storedScale, last.storedScale);
		}

		index++;
		if (index == aiList.length)
			index = 0;

		const ai: AI = aiList[index] as AI;
		let auto: boolean = this.registry.get('auto');
		let targets: AI[] = [this.enemy as AI];
		let allies: AI[] = [...this.wizards];
		if (ai == this.enemy as AI) {
			auto = true;
			targets = [...this.wizards];
			allies = [this.enemy as AI];
		}

		this.selectedAI = ai;
		ai!.GameComponent.turn(this, targets, allies, auto);
	}

	spawnEnemy() {
		this.enemy?.GameComponent.destroy();
		this.enemy?.destroy();

		const { width, height } = this.scale;
		const scaleFactor = Math.min(Math.min(width / 1024, height / 768), 1);

		const stats: {health: number, defence: number, attack: number, speed: number, ability1Index: number, ability2Index: number} = {health: 1, defence: 1, attack: 1, speed: 1, ability1Index: 0, ability2Index: 2};
		for (let i = 0; i < this.level; i++) {
			const num = Math.round(Math.random() * 3);
			if (num == 0)
				stats.health++;
			else if (num == 1)
				stats.defence++;
			else if (num == 2)
				stats.health++;
			else
				stats.speed++;
		}

		const secondAbility = [...this.registry.get('abilities')] as Ability[];
		secondAbility.splice(0, 1);
		secondAbility.splice(3, 1);

		const length = secondAbility.length;
		const abiltiesIndexList: number[] = Array.from({length}, (_, index) => index);

		if (stats.attack >= stats.defence)
			stats.ability1Index = 0;
		else
			stats.ability1Index = 3;

		stats.ability2Index = abiltiesIndexList[Math.round(Math.random() * (length - 1))] as number;

		this.enemy = new AI(this, 0, 0, 'enemy' + Math.round(Math.random()), -1);
		const aiList: AI[] = [...this.wizards];
		aiList.push(this.enemy);

		this.enemy.setStats(stats);
		this.enemy.create(true);
		this.enemy.enableFilters().setInteractive({ useHandCursor: true });
		this.enemy.on('pointerup', () => {
			if (!this.selectedAbility)
				return;

			this.selectedAbility.performAbility(this.selectedAI!, this.enemy, [this.enemy as AI]);
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
		
		this.enemy.setPosition(width - 196 * scaleFactor, height / 2);
		this.enemy.setScale(scaleFactor);
		this.enemy.updateLayout(width - 196 * scaleFactor, height / 2, scaleFactor);

		this.level *= 1.25;
	}

	gameOver() {
		this.skipContainer!.setScale(0);
		this.skipImage!.setScale(0);

		this.loopContainer!.setScale(0);
		this.loopImage!.setScale(0);

		this.autoContainer!.setScale(0);
		this.autoText!.setScale(0);

		if (this.registry.get('loop')) {
			this.save();

			return;
		}

		this.gameOverDamageText!.setText(`${this.abbrvNum(this.registry.get('damage'))}`);

		this.gameOverOverlay!.setDepth(3);
		this.gameOverText!.setDepth(3);
		this.gameOverDamageText!.setDepth(3);
		this.continueText!.setDepth(3);

		this.commentButton!.setDepth(3).setInteractive({ useHandCursor: true });
		this.commentText!.setDepth(3);

		this.graduallyShowGameOver(0.01);
		this.timerHandler = setInterval(() => { this.graduallyShowGameOver(0.01) }, 0.01);

		this.save();
	}

	graduallyShowGameOver(alpha: number) {
		this.gameOverAlpha += alpha;

		this.gameOverOverlay!.setAlpha(this.gameOverAlpha * 0.75);
		this.gameOverText!.setAlpha(this.gameOverAlpha);
		this.gameOverDamageText!.setAlpha(this.gameOverAlpha);
		this.continueText!.setAlpha(this.gameOverAlpha);

		this.commentButton!.setAlpha(this.gameOverAlpha);
		this.commentText!.setAlpha(this.gameOverAlpha);

		if (this.gameOverAlpha >= 1)
			clearInterval(this.timerHandler);
	}

	save() {
		void (async () => {
			const username = this.registry.get('username');
			const subreddit = this.registry.get('subreddit');
			const damage = this.registry.get('damage');
			const money = this.registry.get('money') + Math.ceil(damage * 0.2);

			if (username == undefined) {
				this.registry.set('money', money);
			}
			else {
				try {
					const payload = {
						money: money,
						username: username
					};
					const data = JSON.stringify( payload );
							
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
					const payload = {
						level: damage,
						subreddit: subreddit
					};
					
					const data = JSON.stringify( payload );
							
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
					const payload = {
						auto: this.registry.get('auto'),
						loop: this.registry.get('loop')
					};
					
					const data = JSON.stringify( payload );
							
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

			if (this.registry.get('loop'))
				this.scene.start('Game');
			else
				this.gameOverOverlay!.setInteractive({ useHandCursor: true });
		})();
	}

	postComment() {
		if (this.registry.get('subreddit') == undefined)
			return;

		this.commentButton!.removeInteractive(true).destroy();
		this.commentText!.destroy();

		void (async () => {
			try {
				const payload = {
					score: this.registry.get('damage'),
					subreddit: this.registry.get('subreddit')
				};
				
				const data = JSON.stringify( payload );
						
				const response = await fetch('/api/postComment', { 
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: data 
				});
				if (!response.ok) throw new Error(`API error: ${response.status}`);
			} catch (error) {
				console.error('Failed to post comment:', error);
			}
		})();
	}
}