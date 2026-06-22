import * as Phaser from 'phaser';
import { NumberResponse, JSONResponse } from '../shared/api';

export class DropdownList {
	scene: Phaser.Scene;
	rectangle: Phaser.GameObjects.Rectangle;
	focus: boolean = false;
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
			// this isn't working. Check serverside via console.log
			try {
				var payload = {
					value: this.element.value,
				};
				const data = JSON.stringify( payload );
						
				const response = await fetch('/api/getsubreddits', { 
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: data 
				});
				if (!response.ok)
					throw new Error(`Failed to fetch subreddits: ${response.status}`);
				const responseData = (await response.json()) as JSONResponse;

				const result = await responseData.response.json();
				const children = result.data.children;
				this.container.innerHTML = '';
				for (var i = 0; i < (children.length > 5 ? 5 : children.length); i++) {
					const button = document.createElement('button');
					button.value = children[i].data.display_name_prefixed;
					button.onclick = this.setSubreddit.bind(button, button.value);
					this.container.appendChild(button);
				}
			} catch (error) {
				console.error('Failed to search for subreddits:', error)
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
		this.element.value = value;
		this.container.innerHTML = '';

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