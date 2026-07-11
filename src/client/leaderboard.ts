import * as Phaser from 'phaser';
import { LeaderboardResponse } from '../shared/api';
import { MainMenu } from './scenes/MainMenu';

export class Leaderboard {
	table: HTMLTableElement
	domElement: Phaser.GameObjects.DOMElement

	constructor(scene: MainMenu, x: number, y: number) {
		this.refreshLeaderboard(scene, x, y);
	}

	async refreshLeaderboard(scene: MainMenu, x: number, y: number) {
		try {
			var payload = {
				subreddit: scene.registry.get('subreddit')
			};
			const data = JSON.stringify( payload );
					
			const response = await fetch('/api/leaderboard', { 
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: data 
			});
			if (!response.ok)
				throw new Error(`Failed to fetch leaderboard: ${response.status}`);
			
			if (this.domElement)
				this.domElement.destroy();

			const responseData = (await response.json()) as LeaderboardResponse;
			responseData.list.forEach((row, index) => {
				if (index == 0) {
					this.table = document.createElement('table');

					const trHeader = document.createElement('tr');
					trHeader.id = 'table-header'

					const th = document.createElement('th');
					th.innerHTML = 'Leaderboard';
					th.colSpan = 3;
					trHeader.appendChild(th);

					this.table.appendChild(trHeader);
				}

				const tr = document.createElement('tr');

				const tdRank = document.createElement('td');
				tdRank.innerHTML = row.rank.toString();
				if (row.member == scene.registry.get('subreddit'))
					tdRank.id = 'subreddit';
				tr.appendChild(tdRank);

				const tdSubreddit = document.createElement('td');
				tdSubreddit.innerHTML = row.member;
				tdSubreddit.style.fontSize = (48 - row.member.length).toString() + 'px';
				tr.appendChild(tdSubreddit);

				const tdLevel = document.createElement('td');
				tdLevel.innerHTML = scene.abbrvNum(row.score);
				tr.appendChild(tdLevel);

				this.table.appendChild(tr);
			});
		} catch (error) {
			console.error('Failed to get leaderboard:', error);
		}

		this.domElement = scene.add.dom(x, y, this.table).setOrigin(1, 0);
		const scaleFactor = Math.min(Math.min(scene.scale.width / 1024, scene.scale.height / 768), 1);
		this.updateLayout(scene.scale.width - 8 * scaleFactor, 8 * scaleFactor, scaleFactor)
	}

	updateLayout(w: number, h: number, scale: number) {
		if (!this.domElement)
			return;

		this.domElement.setPosition(w, h);
		this.domElement.setScale(scale);
	}
}