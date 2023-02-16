import { chromium } from '@playwright/test';
import { KeepLiveWS } from 'bilibili-live-ws';
import path from 'path';
import { BILIBILI_LIVE_NUMBER, CHAT_GPT_EMAIL, CHAT_GPT_PASSWORD } from './config';
import { SortHashMap } from './libs/utils/SortHashMap';

interface BILIBILI_MSG_INFO {
  info: [
    number[],
    // 消息体
    string,
    [
      // UID
      number,
      // 用户名
      string,
      // isOwner...
      number,
      number,
      number,
      number,
      number,
      string
    ]
  ];
}

async function bootstrap() {
  const live = new KeepLiveWS(BILIBILI_LIVE_NUMBER);
  const browser = await chromium.launchPersistentContext(
    path.resolve('C:\\Users\\siykt\\AppData\\Local\\Google\\Chrome\\User Data\\Default'),
    {
      headless: false,
      proxy: {
        server: 'http://127.0.0.1:7890',
      },
    }
  );
  const page = await browser.newPage();
  await page.addInitScript('Object.defineProperties(navigator, {webdriver:{get:()=>undefined}});');

  await page.goto('https://chat.openai.com/chat/310e6985-44ce-40a2-ab25-9252b672e4f7');

  try {
    await page.waitForTimeout(300);
    await page.click('div.flex.flex-row.gap-3 > button:nth-child(1)');
    await page.waitForSelector('#username');
    await page.fill('#username', CHAT_GPT_EMAIL);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.fill('#password', CHAT_GPT_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.click('div.prose > div.flex.gap-4.mt-6 > button');
    await page.click('div.prose > div.flex.gap-4.mt-6 > button:nth-child(2)');
    await page.click('div.prose > div.flex.gap-4.mt-6 > button:nth-child(2)');
  } catch (error) {}

  // 优先级队列
  const hash = new SortHashMap();
  // TODO 唯一消息队列可能不妥当, 可以考虑将string调整为消息数组
  const msgHash = new Map<number, string>();

  const sendMsg = async (msg: string) => {
    await page.fill('textarea', msg);
    try {
      await page.click('button.absolute', {
        timeout: 2000,
      });
      return true;
    } catch (error) {
      console.log('发送消息失败:', msg, error);
      return false;
    }
  };
  const SVIP_WEIGHT = 999999;
  const GIFT_WEIGHT_MAP: Record<string, number> = {};

  live.on('open', () => {
    console.log('已连接直播弹幕服务器');
  });
  live.on('live', () => {
    console.log('已连接直播间', BILIBILI_LIVE_NUMBER);
  });
  live.on('heartbeat', online => {
    console.log('当前人气值', online);
  });
  live.on('DANMU_MSG', async ({ info: [, message, [uid, , isOwner, isVip, isSVip]] }: BILIBILI_MSG_INFO) => {
    if (message.length >= 5) {
      // TODO 添加队列
      console.log(message);
      if (!(await sendMsg(message))) {
        hash.set(uid, isOwner ? Infinity : isSVip ? SVIP_WEIGHT : isVip ? SVIP_WEIGHT - 1 : 0);
        msgHash.set(uid, message);
      }
    }
  });
  live.on('SEND_GIFT', ({ data: { uid, uname, action, giftName, num } }) => {
    console.log('收到来自', uname, '的礼物:', giftName, '个数 *', num, 'action ->', action);
    hash.set(uid, Math.max(hash.get(uid) ?? 0, (GIFT_WEIGHT_MAP[giftName] ?? SVIP_WEIGHT - 2) * num));
  });

  // 处理消息队列
  setInterval(async () => {
    const uid = hash.first();
    if (!uid) return;
    const msg = msgHash.get(uid);
    if (msg && (await sendMsg(msg))) {
      hash.shift();
      msgHash.delete(uid);
    }
  }, 5000);
}

bootstrap();
