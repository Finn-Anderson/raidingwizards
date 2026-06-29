import * as Phaser from 'phaser';
import { NumberResponse, SubredditResponse } from '../shared/api';

export class DropdownList {
	scene: Phaser.Scene;
	element: HTMLInputElement;
	container: HTMLDivElement;
	domElement: Phaser.GameObjects.DOMElement

	constructor(scene: Phaser.Scene, x: number, y: number) {
		this.scene = scene;

		const div = document.createElement('div');
		this.element = document.createElement('input');
		this.element.value = this.scene.registry.get('subreddit');
		div.appendChild(this.element);

		this.container = document.createElement('div');
		div.appendChild(this.container);

		this.domElement = this.scene.add.dom(x, y, div);

		this.defineInteractions();
	}

	defineInteractions() {
		this.element.addEventListener('keypress', async (event) => {
			if (event.key != "Enter")
				return;

			if (this.element.value == "") {
				this.setSubreddit("u/" + this.scene.registry.get('username'));
			}
			else {
				const list = [...this.container.children];
				for (const item of list) {
					const value = item.getAttribute('value');

					if (value != this.element.value && value?.split("r/").pop() != this.element.value)
						continue;

					this.setSubreddit(value);

					break;
				}
			}
		});

		this.element.addEventListener('input', async () => {
			try {
				var payload = {
					value: this.element.value.toLowerCase(),
				};
				const data = JSON.stringify( payload );
						
				const response = await fetch('/api/getsubreddits', { 
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: data 
				});
				if (!response.ok)
					throw new Error(`Failed to fetch subreddits: ${response.status}`);

				const responseData = (await response.json()) as SubredditResponse;

				const result = await responseData.list;
				this.container.innerHTML = '';
				for (var i = 0; i < (result.length > 5 ? 5 : result.length); i++) {
					const button = document.createElement('button');
					button.innerHTML = result.at(i)!.member + " - <span>" + result.at(i)!.score + "</span>";
					button.value = result.at(i)!.member;
					button.onclick = this.setSubreddit.bind(button, button.value);
					this.container.appendChild(button);
				}
			} catch (error) {
				console.error('Failed to search for subreddits:', error);
			}
		});

		document.addEventListener('click', (event) => {
			if (event.target != this.element)
				this.element.blur();
		});
	}

	updateLayout(w: number, h: number, scale: number) {
		this.domElement.setPosition(w, h);
		this.domElement.setScale(scale);
	}

	setSubreddit(value: string) {
		value.toLowerCase();
		if (!value.startsWith("r/") && !value.startsWith("u/"))
			value = "r/" + value;

		this.element.value = value;
		this.container.innerHTML = '';

		this.scene.registry.set('subreddit', value);

		void (async () => {
			try {
				var payload = {
					username: this.scene.registry.get('username'),
					subreddit: value
				};
				const data = JSON.stringify( payload );
						
				const response = await fetch('/api/setsubreddit', { 
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: data 
				});
				if (!response.ok) throw new Error(`API error: ${response.status}`);
				
				const responseData = (await response.json()) as NumberResponse;
       			this.scene.registry.set('level', responseData.num);
			} catch (error) {
				console.error('Failed to set subreddit:', error);
			}
		})();
	}
}