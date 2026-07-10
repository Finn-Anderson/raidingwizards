export type InitResponse = {
	type: 'init';
	postId: string;
	money: number;
	username: string | undefined;
	subreddit: string | undefined;
	level: number;
	ai: [{health: number, defence: number, attack: number, speed: number}];
	auto: boolean;
	loop: boolean;
};

export type NumberResponse = {
	type: 'number';
	postId: string;
	num: number;
};

export type SubredditResponse = {
	type: 'list';
	postId: string;
	list: {member: string, score: number;}[];
};

export type LeaderboardResponse = {
	type: 'list';
	postId: string;
	list: {rank: number, member: string, score: number}[];
};