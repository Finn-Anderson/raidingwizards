import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { IncrementResponse, DecrementResponse } from '../../shared/api';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  msg_text: Phaser.GameObjects.Text;
  money: number = 0;
  countText: Phaser.GameObjects.Text;
  incButton: Phaser.GameObjects.Text;
  decButton: Phaser.GameObjects.Text;
  goButton: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  create() {
    // Configure camera & background
    this.camera = this.cameras.main;
		this.money = this.registry.get("money");

    /* -------------------------------------------
     *  UI Elements
     * ------------------------------------------- */

    // Display the current count
    this.countText = this.add
      .text(4, 4, `Money: ${this.money}`, {
        fontFamily: 'Arial Black',
        fontSize: 56,
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    // Fetch the initial counter value from server and update UI

    // Button styling helper
    const createButton = (y: number, label: string, color: string, onClick: () => void) => {
      const button = this.add
        .text(512, y, label, {
          fontFamily: 'Arial Black',
          fontSize: 36,
          color: color,
          backgroundColor: '#444444',
          padding: {
            x: 25,
            y: 12,
          } as Phaser.Types.GameObjects.Text.TextPadding,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => button.setStyle({ backgroundColor: '#555555' }))
        .on('pointerout', () => button.setStyle({ backgroundColor: '#444444' }))
        .on('pointerdown', onClick);
      return button;
    };

    // Increment button
    this.incButton = createButton(this.scale.height * 0.55, 'Increment', '#00ff00', async () => {
			this.money++;
			this.updateCountText();
      try {
				var payload = {
					money: this.money,
					username: this.registry.get("username")
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
      } catch (error) {
        console.error('Failed to set money:', error);
      }
    });

    // Decrement button
    this.decButton = createButton(this.scale.height * 0.65, 'Decrement', '#ff5555', async () => {
			this.money--;
			this.updateCountText();
      try {
				var payload = {
					money: this.money,
					username: this.registry.get("username")
				};
				var data = new FormData();
				data.append( "json", JSON.stringify( payload ) );

        //const response = await fetch('/api/setmoney', { method: 'POST', body: data });
        //if (!response.ok) throw new Error(`API error: ${response.status}`);
      } catch (error) {
        console.error('Failed to set money:', error);
      }
    });

    // Game Over button – navigates to the GameOver scene
    this.goButton = createButton(this.scale.height * 0.75, 'Game Over', '#ffffff', () => {
      this.scene.start('GameOver');
    });

    // Setup responsive layout
    this.updateLayout(this.scale.width, this.scale.height);
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const { width, height } = gameSize;
      this.updateLayout(width, height);
    });

    // No automatic navigation to GameOver – users can stay in this scene.
  }

  updateLayout(width: number, height: number) {
    // Resize camera viewport to avoid black bars
    this.cameras.resize(width, height);

    // Center and scale background image to cover screen
    if (this.background) {
      this.background.setPosition(width / 2, height / 2);
      if (this.background.width && this.background.height) {
        const scale = Math.max(width / this.background.width, height / this.background.height);
        this.background.setScale(scale);
      }
    }

    // Calculate a scale factor relative to a 1024 × 768 reference resolution.
    // We only shrink on smaller screens – never enlarge above 1×.
    const scaleFactor = Math.min(Math.min(width / 1024, height / 768), 1);

    if (this.countText) {
      this.countText.setPosition(width / 2, height * 0.45);
      this.countText.setScale(scaleFactor);
    }

    if (this.incButton) {
      this.incButton.setPosition(width / 2, height * 0.55);
      this.incButton.setScale(scaleFactor);
    }

    if (this.decButton) {
      this.decButton.setPosition(width / 2, height * 0.65);
      this.decButton.setScale(scaleFactor);
    }

    if (this.goButton) {
      this.goButton.setPosition(width / 2, height * 0.75);
      this.goButton.setScale(scaleFactor);
    }
  }

  updateCountText() {
    this.countText.setText(`Money: ${this.money}`);
  }
}
