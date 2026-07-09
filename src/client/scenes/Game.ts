import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AI } from '../ai/ai';
import { Ability } from '../ai/ability';

export class Game extends Scene {
	background: Phaser.GameObjects.Image;

	damageImage: Phaser.GameObjects.Image;
	damageText: Phaser.GameObjects.Text;

	wizards: AI[] = [];
	enemy: AI;

	selectedAbility: Ability;
	auto: boolean = false;
	selectedAI: AI;

	level: number = 0;

	constructor() {
		super('Game');
	}

  	create() {
		const { width, height } = this.scale;

		this.background = this.add.image(0, 0, 'background').setOrigin(0);

		this.registry.set('damage', 0);

		this.damageImage = this.add.image(4, 4, 'attack').setOrigin(0).setTint(0xff0029);

		this.damageText = this.add
			.text(4, 4, `${this.registry.get('damage')}`, {
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

			this.wizards.push(ai);

			this.level += ai.getLevel();
		}

		this.level = Math.floor(this.level * 0.9);

		this.spawnEnemy();

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

		const scaleFactor = Math.min(Math.min(width / 1024, height / 768), 1);

		this.damageImage.setPosition(8 * scaleFactor, 16 * scaleFactor);
		this.damageImage.setScale(scaleFactor * 1.5);

		this.damageText.setPosition(90 * scaleFactor, 8 * scaleFactor);
		this.damageText.setScale(scaleFactor);
		
		this.wizards.forEach((ai) => {
			const x = ai.index % 2 == 0 ? width / 8 : width / 4 + width / 8;
			const y = height / 4 + Math.floor(ai.index / 2) * height / 4;

			ai.updateLayout(x, y, scaleFactor);
		});

		this.enemy.setPosition(width - 8, height / 2);
		this.enemy.setScale(scaleFactor * 4);
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
		let aiList: AI[] = this.wizards;
		aiList.push(this.enemy);

		let index: number = -1;
		if (last)
			index = aiList.findIndex((element) => element == last);

		index++;
		if (index == aiList.length)
			index = 0;

		let ai: AI = aiList[index] as AI;
		let auto: boolean = this.auto;
		let targets: AI[] = [this.enemy];
		let allies: AI[] = this.wizards;
		if (ai == this.enemy) {
			auto = true;
			targets = this.wizards;
			allies = [this.enemy];
		}

		ai!.GameComponent.turn(targets, allies, auto);
		this.selectedAI = ai;
	}

	spawnEnemy() {
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

		let length = (this.registry.get('abilities') as Ability[]).length;
		let abiltiesIndexList: number[] = Array.from({length}, (_, index) => index);

		let ability1Index = Math.round(Math.random() * (length - 1));
		stats.ability1Index = abiltiesIndexList[ability1Index] as number;
		abiltiesIndexList.splice(ability1Index, 1);
		length--;

		stats.ability2Index = abiltiesIndexList[Math.round(Math.random() * (length - 1))] as number;

		this.enemy = new AI(this, width - 8 * scaleFactor, height / 2, 'enemy', -1).setOrigin(1, 0.5).setScale(scaleFactor);
		this.enemy.setStats(stats);
		this.enemy.create();

		let aiList: AI[] = this.wizards;
		aiList.push(this.enemy);

		let maxStamina = 1;
		aiList.forEach((element) => {
			if (maxStamina < element.stats.speed)
				maxStamina = element.stats.speed;
		});

		aiList.forEach((element) => {
			element.GameComponent.maxStamina = maxStamina;
		});
	}
}