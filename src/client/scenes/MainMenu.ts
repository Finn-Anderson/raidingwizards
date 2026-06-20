import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene {
  background: GameObjects.Image | null = null;
  logo: GameObjects.Image | null = null;
  fight: GameObjects.Sprite | null = null;

  constructor() {
    super('MainMenu');
  }

  /**
   * Reset cached GameObject references every time the scene starts.
   * The same Scene instance is reused by Phaser, so we must ensure
   * stale (destroyed) objects are cleared out when the scene restarts.
   */
  init(): void {
    this.background = null;
    this.logo = null;
    this.fight = null;
  }

  create() {
    const { width, height } = this.scale;

		this.registry.set("test", );
		this.registry.get("test");

		this.background = this.add.image(0, 0, 'background').setOrigin(0);

		this.logo = this.add.image(0, 0, 'logo');

		this.fight = this.add.sprite(width - 24 - 32, height * 0.5, 'fight').setInteractive({ useHandCursor: true }).setOrigin(1.0)
      .on('pointerover', () => { this.fight?.setTint(0xff5700); })
      .on('pointerout', () => { this.fight?.clearTint(); })
			.on('pointerdown', () => { this.scene.start('Game'); });
		
		// Setup responsive layout
		this.updateLayout(this.scale.width, this.scale.height);
		this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
			const { width, height } = gameSize;
			this.updateLayout(width, height);
		});
  }

  updateLayout(width: number, height: number) {
    // Resize camera viewport to avoid black bars
    this.cameras.resize(width, height);

    // Center and scale background image to cover screen
    if (this.background) {
      this.background.setDisplaySize(width, height);
    }

    const scaleFactor = Math.min(Math.min(width / 1024, height / 768), 1);

    if (this.logo) {
      this.logo.setPosition(width / 2, height * 0.45);
      this.logo.setScale(scaleFactor);
    }

    if (this.fight) {
      this.fight.setPosition(width / 2, height * 0.9);
			this.fight.setDisplaySize(96 * scaleFactor, 96 * scaleFactor);
    }
  }
}
