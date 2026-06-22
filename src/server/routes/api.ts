import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type { InitResponse, NumberResponse, JSONResponse } from '../../shared/api';

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

		if (username != undefined) {
			money = await redis.get(username + 'money');

			subreddit = await redis.get(username + 'subreddit');
			if (subreddit == undefined)
				subreddit = "u/" + username;

			level = await redis.hGet('leaderboard', subreddit);
		}

    return c.json<InitResponse>({
			type: 'init',
			postId: postId,
			money: money ? parseInt(money) : 0,
			username: username ?? 'anonymous',
			subreddit: subreddit ?? 'anonymous',
			level: level ? parseInt(level) : 0,
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = 'Unknown error during initialization';
    if (error instanceof Error) {
      	errorMessage = `Initialization failed: ${error.message}`;
    }
    return c.json<ErrorResponse>({ status: 'error', message: errorMessage }, 400);
  }
});

api.get('/getsubreddits', async (c) => {
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
		const response = await fetch('https://www.reddit.com/search.json?q=' + requestBody.value + '&type=sr', {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
		});
		if (!response.ok)
			throw new Error(`Failed to fetch subreddits: ${response.status}`);
		return c.json<JSONResponse>({
			type: 'json',
			postId,
			response,
		});
	} catch (e) {
		console.log("Request Body (not JSON or empty):", await c.req.text());
	}
})

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
		console.log("Request Body (not JSON or empty):", await c.req.text());
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
		await redis.set(requestBody.username + 'subreddit', requestBody.subreddit);
		const level = await redis.hGet('leaderboard', requestBody.subreddit);
		const num = level ? parseInt(level) : 0;
		return c.json<NumberResponse>({
			type: 'number',
			postId,
			num,
		});
	} catch (e) {
		console.log("Request Body (not JSON or empty):", await c.req.text());
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
		var level = await redis.hGet("leaderboard", requestBody.subreddit);
		var num = level ? parseInt(level) : 0 + requestBody.level;
		await redis.hSetNX('leaderboard', requestBody.subreddit, String(num));
		return c.json<NumberResponse>({
			type: 'number',
			postId,
			num,
		});
	} catch (e) {
		console.log("Request Body (not JSON or empty):", await c.req.text());
	}
});

/*api.post('/decrement', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', -1);
  return c.json<DecrementResponse>({
    count,
    postId,
    type: 'decrement',
  });
});*/