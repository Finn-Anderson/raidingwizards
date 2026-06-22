export type InitResponse = {
  type: 'init';
  postId: string;
  money: number;
  username: string;
  subreddit: string;
  level: number;
};

export type NumberResponse = {
  type: 'number';
  postId: string;
  num: number;
};

export type JSONResponse = {
  type: 'json';
  postId: string;
  response: Response;
};