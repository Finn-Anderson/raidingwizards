import * as Phaser from 'phaser';
import { LeaderboardResponse } from '../shared/api';

export class Leaderboard {
	table: HTMLTableElement
	domElement: Phaser.GameObjects.DOMElement

	constructor(scene: Phaser.Scene, x: number, y: number) {
		async () => {
			try {
				const response = await fetch('/api/leaderboard');
				if (!response.ok)
					throw new Error(`Failed to fetch subreddits: ${response.status}`);

				const responseData = (await response.json()) as LeaderboardResponse;
				responseData.list.forEach((row, index) => {
					if (index == 0) {
						this.table = document.createElement('table');

						const trHeader = document.createElement('tr');
						trHeader.id = 'table-header'

						const th = document.createElement('th');
						th.colSpan = 3;
						trHeader.appendChild(th);

						this.table.appendChild(trHeader);
					}

					const tr = document.createElement('tr');

					const tdRank = document.createElement('td');
					tdRank.innerHTML = row.rank.toString();
					tr.appendChild(tdRank);

					const tdSubreddit = document.createElement('td');
					tdSubreddit.innerHTML = row.member.toString();
					tr.appendChild(tdSubreddit);

					const tdLevel = document.createElement('td');
					tdLevel.innerHTML = row.score.toString();
					tr.appendChild(tdLevel);

					this.table.appendChild(tr);
				});
			} catch (error) {
				console.error('Failed to get leaderboard:', error);
			}

			this.domElement = scene.add.dom(x, y, this.table).setOrigin(1, 0);
		}
	}

	updateLayout(w: number, h: number, scale: number) {
		if (!this.domElement)
			return;

		this.domElement.setPosition(w, h);
		this.domElement.setScale(scale);
	}
}