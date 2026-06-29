import { Hono } from 'hono';
import { context, redis, reddit, ZRangeOptions } from '@devvit/web/server';
import type { InitResponse, NumberResponse, SubredditResponse } from '../../shared/api';

type ErrorResponse = {
	status: 'error';
	message: string;
};

export const api = new Hono();

api.get('/init', async (c) => {
	const { postId } = context;

	if (!postId) {
		console.error('API Init Error: postId not found in devvit context');
		return c.json<ErrorResponse>(
		{
			status: 'error',
			message: 'postId is required but missing from context',
		},
		400
		);
	}

	try {
		const username = await reddit.getCurrentUsername();
		var money = undefined; 
		var subreddit = undefined;
		var level = undefined;

		redis.del('leaderboard');

		if (username != undefined) {
			username.toLowerCase();
			money = await redis.get(username + 'money');

			subreddit = await redis.get(username + 'subreddit');
			if (subreddit == undefined)
				subreddit = "u/" + username;

			level = await redis.zScore('leaderboard', subreddit);
		}

		return c.json<InitResponse>({
			type: 'init',
			postId: postId,
			money: money ? parseInt(money) : 0,
			username: username ?? 'anonymous',
			subreddit: subreddit ?? 'anonymous',
			level: level ? level : 0,
		});
	} catch (error) {
		console.error(`API Init Error for post ${postId}:`, error);
		let errorMessage = 'Unknown error during initialization';
		if (error instanceof Error)
			errorMessage = `Initialization failed: ${error.message}`;
		return c.json<ErrorResponse>({ status: 'error', message: errorMessage }, 400);
	}
});

api.get('/leaderboard', async (c) => {
	const { postId } = context;

	if (!postId) {
		console.error('API Init Error: postId not found in devvit context');
		return c.json<ErrorResponse>(
		{
			status: 'error',
			message: 'postId is required but missing from context',
		},
		400
		);
	}

	try {
		const requestBody = await c.req.raw.clone().json();

		let options: ZRangeOptions = {
			reverse: true,
			by: 'score',
			limit: {
				offset: 0,
				count: 5
			}
		};
		const list: {member: string; score: number;}[] = await redis.zRange('leaderboard', 0, Infinity, options);

		var bContainsSubreddit = false;
		let leaderboard: {rank: number; member: string; score: number;}[] = [];
		list.forEach((element, index) => {
			leaderboard.push({rank: index, member: element.member, score: element.score});

			if (element.member == requestBody.subreddit)
				bContainsSubreddit = true;
		})

		if (!bContainsSubreddit && requestBody.subreddit != 'anonymous') {
			const rank = await redis.zRank('leaderboard', requestBody.subreddit);
			
			if (rank) {
				const score = await redis.zScore('leaderboard', requestBody.subreddit);
				leaderboard.push({rank: rank, member: requestBody.subreddit, score: score!});
			}
		}

		return c.json<SubredditResponse>({
			type: 'list',
			postId,
			list,
		});
	} catch (e) {
		console.log('Leaderboard Error:', await c.req.text());
	}
});

api.post('/getsubreddits', async (c) => {
	const { postId } = context;

	if (!postId) {
		console.error('API Init Error: postId not found in devvit context');
		return c.json<ErrorResponse>(
		{
			status: 'error',
			message: 'postId is required but missing from context',
		},
		400
		);
	}

	try {
		const requestBody = await c.req.raw.clone().json();

		let options: ZRangeOptions = {
			reverse: true,
			by: 'lex',
			limit: {
				offset: 0,
				count: Infinity
			}
		};
		const list: {member: string; score: number;}[] = await redis.zRange('leaderboard', "["+requestBody.value, "("+requestBody.value, options);
		console.log(list);

		return c.json<SubredditResponse>({
			type: 'list',
			postId,
			list,
		});
	} catch (e) {
		console.log('Get Subreddits Error:', await c.req.text());
	}
});

api.post('/setmoney', async (c) => {
	const { postId } = context;
	if (!postId) {
		return c.json<ErrorResponse>({
			status: 'error',
			message: 'postId is required',
		}, 400);
	}

	try {
		const requestBody = await c.req.raw.clone().json();
		const num = requestBody.money;
		await redis.set(requestBody.username + 'money', String(num));
		return c.json<NumberResponse>({
			type: 'number',
			postId,
			num,
		});
	} catch (e) {
		console.log('Set Money Error:', await c.req.text());
	}
});

api.post('/setsubreddit', async (c) => {
	const { postId } = context;
	if (!postId) {
		return c.json<ErrorResponse>({
			status: 'error',
			message: 'postId is required',
		}, 400);
	}

	try {
		const requestBody = await c.req.raw.clone().json();
		const subreddit = requestBody.subreddit;
		if (requestBody.username != 'anonymous')
			await redis.set(requestBody.username + 'subreddit', subreddit);
		const level = await redis.zScore('leaderboard', subreddit);
		const num = level ? level : 0;
		return c.json<NumberResponse>({
			type: 'number',
			postId,
			num,
		});
	} catch (e) {
		console.log('Set Subreddit Error:', await c.req.text());
	}
});

api.post('/setlevel', async (c) => {
	const { postId } = context;
	if (!postId) {
		return c.json<ErrorResponse>({
			status: 'error',
			message: 'postId is required',
		}, 400);
	}

	try {
		const requestBody = await c.req.raw.clone().json();
		const num = await redis.zIncrBy('leaderboard', requestBody.subreddit, requestBody.level);
		return c.json<NumberResponse>({
			type: 'number',
			postId,
			num,
		});
	} catch (e) {
		console.log('Set Level Error:', await c.req.text());
	}
});