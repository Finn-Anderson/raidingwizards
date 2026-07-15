import * as Phaser from 'phaser';
import { NumberResponse, SubredditResponse } from '../shared/api';
import { MainMenu } from './scenes/MainMenu';

export class DropdownList {
	scene: MainMenu;
	element: HTMLInputElement;
	button: HTMLButtonElement;
	container: HTMLDivElement;
	domElement: Phaser.GameObjects.DOMElement

	constructor(scene: MainMenu, x: number, y: number) {
		this.scene = scene;
		const subreddit = this.scene.registry.get('subreddit');

		const div = document.createElement('div');

		const inputDiv = document.createElement('div');
		inputDiv.id = 'div-input';

		this.button = document.createElement('button');
		this.button.innerHTML = subreddit ? subreddit.substring(0, 2) : "r/";
		this.button.onclick = () => {
			if (this.button.innerHTML == "r/")
				this.button.innerHTML = "u/";
			else
				this.button.innerHTML = "r/";

			this.setSubreddit(this.button.innerHTML + this.element.value);
			this.GetSubreddits();
		};
		inputDiv.appendChild(this.button);

		this.element = document.createElement('input');
		this.element.value = subreddit.substring(2);
		inputDiv.appendChild(this.element);

		div.appendChild(inputDiv);

		this.container = document.createElement('div');
		div.appendChild(this.container);

		if (this.scene.registry.get('username') == 'anonymous') {
			this.element.title = "Login to assign score to a user/subreddit";
			this.element.disabled = true;
			this.button.disabled = true;
		}
		else {
			this.element.title = "Define user/subreddit to assign score to";
			this.defineInteractions();
		}

		this.domElement = this.scene.add.dom(x, y, div).setOrigin(0);
	}

	defineInteractions() {
		this.element.addEventListener('keypress', async (event) => {
			if (event.key != "Enter")
				return;

			if (this.element.value == "") {
				this.setSubreddit(this.button.innerHTML + this.scene.registry.get('username'));
			}
			else {
				const list = [...this.container.children];
				for (const item of list) {
					const value = item.getAttribute('value');

					if (value != this.button.innerHTML + this.element.value)
						continue;

					this.setSubreddit(value);

					break;
				}
			}
		});

		this.element.addEventListener('input', () => {
			this.GetSubreddits();
		});

		document.addEventListener('pointerdown', (event) => {
			if (!event.target || (event.target != this.element && (event.target as HTMLElement).parentElement != this.container)) {
				this.element.blur();
				this.container.innerHTML = '';
				this.element.value = this.scene.registry.get('subreddit').substring(2);
			}
		});
	}

	GetSubreddits() {
		void (async () => {
			this.element.value = this.element.value.toLowerCase().substring(0, 21);
			const value = this.button.innerHTML + this.element.value;
			try {
				const payload = {
					value: value
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

				if (document.activeElement != this.element)
					return;

				this.container.innerHTML = '';
				let bContainsSubreddit = false;

				for (let i = 0; i < (result.length > 5 ? 5 : result.length); i++) {
					const button = document.createElement('button');
					button.classList.add('dropdown-button');
					button.innerHTML = result.at(i)!.member + ' - <span id="score">' + result.at(i)!.score + '</span>';
					button.value = result.at(i)!.member;
					button.onclick = () => { this.setSubreddit(button.value) };
					this.container.appendChild(button);

					if (this.element.value == result.at(i)!.member.slice(2))
						bContainsSubreddit = true;
				}

				if (bContainsSubreddit)
					return;

				const button = document.createElement('button');
				button.classList.add('dropdown-button');
				button.innerHTML = 'Add new';
				button.value = value;
				button.onclick = () => { this.setSubreddit(button.value) };
				this.container.appendChild(button);
			} catch (error) {
				console.error('Failed to search for subreddits:', error);
			}
		})();
	}

	updateLayout(w: number, h: number, scale: number) {
		this.domElement.setPosition(w, h);
		this.domElement.setScale(scale);
	}

	setSubreddit(value: string) {
		this.container.innerHTML = '';
		this.element.value = value;
		
		this.scene.registry.set('subreddit', value);

		void (async () => {
			try {
				const payload = {
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
				this.scene.updateLevelText();
				this.scene.updateLeaderboardText();
			} catch (error) {
				console.error('Failed to set subreddit:', error);
			}
		})();
	}
}