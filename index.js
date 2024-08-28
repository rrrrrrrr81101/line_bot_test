'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const http = require('http'); // http モジュールを追加
const PORT = process.env.PORT || 3000;

const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};
//aa
const app = express();

// 洗濯機と乾燥機の利用状況を保持する変数
let washerAInUse = false;
let washerBInUse = false;
let dryerAInUse = false;
let dryerBInUse = false;

// 利用開始時間を保持する変数
let washerATime = null;
let washerBTime = null;
let dryerATime = null;
let dryerBTime = null;

// 日本時間の現在時刻をISOフォーマットで取得
function getJapanTime() {
    const offset = 9 * 60 * 60 * 1000; // JST (UTC+9)
    const japanTime = new Date(Date.now() + offset);
    return japanTime;
}

// 時間をAM/PM形式でフォーマットする関数
function formatTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // 12時間形式
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

// 使用可能になる時間を計算する関数
function getAvailableTime(startTime, hoursToAdd) {
    const startTimeObj = new Date(startTime);
    const availableTime = new Date(startTimeObj.getTime() + hoursToAdd * 60 * 60 * 1000);
    return formatTime(availableTime);
}

// サーバーの URL を指定
const SERVER_URL = `http://localhost:${PORT}`;

// サーバーにリクエストを送信する関数
function pingServer() {
    http.get(SERVER_URL, (res) => {
        console.log(`Pinged server, status code: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`Error pinging server: ${e.message}`);
    });
}

// 10 分ごとに pingServer 関数を実行
setInterval(pingServer, 10 * 60 * 1000); // 10 分 = 10 * 60 * 1000 ミリ秒

app.post('/webhook', line.middleware(config), (req, res) => {
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(config);

// 利用状況を更新するメソッド
function updateUsageStatus() {
    const currentTime = new Date();

    // 洗濯機A
    if (washerAInUse && washerATime) {
        const elapsed = (currentTime - new Date(washerATime)) / (1000 * 60 * 60); // 時間差分
        if (elapsed >= 1) {
            washerAInUse = false;
            washerATime = null;
        }
    }

    // 洗濯機B
    if (washerBInUse && washerBTime) {
        const elapsed = (currentTime - new Date(washerBTime)) / (1000 * 60 * 60); // 時間差分
        if (elapsed >= 1) {
            washerBInUse = false;
            washerBTime = null;
        }
    }

    // 乾燥機A
    if (dryerAInUse && dryerATime) {
        const elapsed = (currentTime - new Date(dryerATime)) / (1000 * 60 * 60); // 時間差分
        if (elapsed >= 3) {
            dryerAInUse = false;
            dryerATime = null;
        }
    }

    // 乾燥機B
    if (dryerBInUse && dryerBTime) {
        const elapsed = (currentTime - new Date(dryerBTime)) / (1000 * 60 * 60); // 時間差分
        if (elapsed >= 3) {
            dryerBInUse = false;
            dryerBTime = null;
        }
    }
}

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const receivedText = event.message.text;
  let replyText = '';

  // 利用状況を更新
  updateUsageStatus();

  const currentTime = getJapanTime();

  switch(receivedText) {
    case '洗濯機A利用':
      if (washerAInUse) {
        const availableTime = getAvailableTime(washerATime, 1);
        replyText = `その洗濯機はまだ使用できません。次に使用可能になるのは${availableTime}です。`;
      } else {
        washerAInUse = true;
        washerATime = currentTime;
        replyText = `洗濯機Aが${formatTime(currentTime)}から利用されています`;
      }
      break;

    case '洗濯機B利用':
      if (washerBInUse) {
        const availableTime = getAvailableTime(washerBTime, 1);
        replyText = `その洗濯機はまだ使用できません。次に使用可能になるのは${availableTime}です。`;
      } else {
        washerBInUse = true;
        washerBTime = currentTime;
        replyText = `洗濯機Bが${formatTime(currentTime)}から利用されています`;
      }
      break;

    case '乾燥機A利用':
      if (dryerAInUse) {
        const availableTime = getAvailableTime(dryerATime, 3);
        replyText = `その乾燥機はまだ使用できません。次に使用可能になるのは${availableTime}です。`;
      } else {
        dryerAInUse = true;
        dryerATime = currentTime;
        replyText = `乾燥機Aが${formatTime(currentTime)}から利用されています`;
      }
      break;

    case '乾燥機B利用':
      if (dryerBInUse) {
        const availableTime = getAvailableTime(dryerBTime, 3);
        replyText = `その乾燥機はまだ使用できません。次に使用可能になるのは${availableTime}です。`;
      } else {
        dryerBInUse = true;
        dryerBTime = currentTime;
        replyText = `乾燥機Bが${formatTime(currentTime)}から利用されています`;
      }
      break;

    case '利用状況':
      replyText = 
        `利用状況:\n` +
        `洗濯機A: ${washerAInUse ? `利用中 (${formatTime(new Date(washerATime))}から)` : '使用可能'}\n` +
        `洗濯機B: ${washerBInUse ? `利用中 (${formatTime(new Date(washerBTime))}から)` : '使用可能'}\n` +
        `乾燥機A: ${dryerAInUse ? `利用中 (${formatTime(new Date(dryerATime))}から)` : '使用可能'}\n` +
        `乾燥機B: ${dryerBInUse ? `利用中 (${formatTime(new Date(dryerBTime))}から)` : '使用可能'}`;
      break;

    default:
      replyText = 'それには対応していません';
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText
  });
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);
