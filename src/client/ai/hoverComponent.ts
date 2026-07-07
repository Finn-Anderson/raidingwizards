import * as Phaser from 'phaser';
import { Ability } from './ability';

export class HoverComponent {
	timeout: number;

	titleContainer: Phaser.GameObjects.Rectangle;
	titleText: Phaser.GameObjects.Text;

	descriptionContainer: Phaser.GameObjects.Rectangle;
	descriptionText: Phaser.GameObjects.Text;

	constructor() {
		// Create layout + set alpha to 0;
	}

	updateLayout() {

	}

	setDescription(title: string, description: string) {
		
	}

	startDisplayTimer() {
		this.timeout = setTimeout(() => {
			this.titleContainer.setAlpha(1);
			this.titleText.setAlpha(1);

			this.descriptionContainer.setAlpha(1);
			this.descriptionText.setAlpha(1);
		}, 200);
	}

	clearDisplayTimer() {
		clearTimeout(this.timeout);

		this.titleContainer.setAlpha(0);
		this.titleText.setAlpha(0);

		this.descriptionContainer.setAlpha(0);
		this.descriptionText.setAlpha(0);
	}
}