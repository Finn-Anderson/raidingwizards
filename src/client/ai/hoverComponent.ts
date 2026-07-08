import * as Phaser from 'phaser';

export class HoverComponent {
	timeout: number;
	x: number;
	y: number;

	titleContainer: Phaser.GameObjects.Graphics;
	titleText: Phaser.GameObjects.Text;

	descriptionContainer: Phaser.GameObjects.Graphics;
	descriptionText: Phaser.GameObjects.Text;

	constructor(scene: Phaser.Scene, x: number, y: number) {
		this.titleContainer = scene.add.graphics({fillStyle: { color: 0xff5700 }, lineStyle: { width: 2, color: 0xe64e00 }})
			.fillRoundedRect(x, y, 500, 64, { tl: 4, tr: 4, bl: 0, br: 0 })
			.strokeRoundedRect(x, y, 500, 64, { tl: 4, tr: 4, bl: 0, br: 0 })
			.setAlpha(0)
			.setDepth(1);

		this.titleText = scene.add.text(x + 8, y + 4, ``, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 48,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setAlpha(0)
			.setDepth(1);

		this.descriptionContainer = scene.add.graphics({fillStyle: { color: 0x333333 }, lineStyle: { width: 2, color: 0x121212 }})
			.fillRoundedRect(x, y + 32, 500, 128, { tl: 0, tr: 0, bl: 4, br: 4 })
			.strokeRoundedRect(x, y + 32, 500, 128, { tl: 0, tr: 0, bl: 4, br: 4 })
			.setAlpha(0)
			.setDepth(1);

		this.descriptionText = scene.add.text(x + 8, y + 68, ``, {
				fontFamily: '"Kristen ITC", arial, serif',
				fontSize: 32,
				color: '#ffffff',
				stroke: '#f2f2f2',
				strokeThickness: 2,
			})
			.setAlpha(0)
			.setDepth(1);

		this.x = x;
		this.y = y;
	}

	updateLayout(w: number, h: number, scale: number) {
		this.titleContainer.setPosition(w, h);
		this.titleContainer.setScale(scale);

		this.titleText.setPosition(w + 8 * scale, h + 4 * scale);
		this.titleText.setScale(scale);

		this.descriptionContainer.setPosition(w, h + 32 * scale);
		this.descriptionContainer.setScale(scale);

		this.descriptionText.setPosition(w + 8 * scale, h + 68 * scale);
		this.descriptionText.setScale(scale);
	}

	setDescription(title: string, description: string) {
		this.titleText.setText(title);
		this.descriptionText.setText(description);

		this.descriptionContainer.clear()
			.fillRoundedRect(this.x, this.y + 32, 500, this.descriptionText.height, { tl: 0, tr: 0, bl: 4, br: 4 })
			.strokeRoundedRect(this.x, this.y + 32, 500, this.descriptionText.height, { tl: 0, tr: 0, bl: 4, br: 4 })
			.setAlpha(0)
			.setDepth(1);
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

	destroy() {
		this.titleContainer.destroy();
		this.titleText.destroy();

		this.descriptionContainer.destroy();
		this.descriptionText.destroy();
	}
}