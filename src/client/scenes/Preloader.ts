import { Scene } from 'phaser';
import { InitResponse } from '../../shared/api';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    const { width, height } = this.scale;
	
    this.add.image(0, 0, 'background').setOrigin(0)

    this.add.rectangle(width / 2, height / 2, width / 1.5, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(width / 2 - (width / 1.5 / 2) + 4, height / 2, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = Math.max(width / 1.5 * progress - 8, 0);
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath('../assets');

    this.load.image('logo', 'logo.png');
    this.load.image('fight', 'fight.png');
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

   		this.scene.start('MainMenu');
      } catch (error) {
        this.registry.set('money', 0);
        this.registry.set('level', 0);
        this.registry.set('username', undefined);
        this.registry.set('subreddit', undefined);
        console.error('Failed to fetch initial count:', error);

   		this.scene.start('MainMenu');
      }
    })();
  }
}
