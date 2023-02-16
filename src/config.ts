import { config } from 'dotenv';

config();

export const BILIBILI_LIVE_NUMBER = parseInt(process.env.BILIBILI_LIVE_NUMBER ?? '0');
export const CHAT_GPT_EMAIL = process.env.CHAT_GPT_EMAIL ?? '';
export const CHAT_GPT_PASSWORD = process.env.CHAT_GPT_PASSWORD ?? '';
