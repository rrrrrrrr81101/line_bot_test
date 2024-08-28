'use strict';

'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const PORT = process.env.PORT || 3000;

const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

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
        const elapsed = (currentTime - 1000 * 60 * 60 * 3 - new Date(washerATime)) / (1000 * 60 * 60); // 時間差分
        if (elapsed >= 1) {
            washerAInUse = false;
            washerATime = null;
        }
    }

    // 洗濯機B
    if (washerBInUse && washerBTime) {
        const elapsed = (currentTime - 1000 * 60 * 60 * 3 - new Date(washerBTime)) / (1000 * 60 * 60); // 時間差分
        if (elapsed >= 1) {
            washerBInUse = false;
            washerBTime = null;
        }
    }

    // 乾燥機A
    if (dryerAInUse && dryerATime) {
        const elapsed = (currentTime - 1000 * 60 * 60 * 3 - new Date(dryerATime)) / (1000 * 60 * 60); // 時間差分
        if (elapsed >= 3) {
            dryerAInUse = false;
            dryerATime = null;
        }
    }

    // 乾燥機B
    if (dryerBInUse && dryerBTime) {
        const elapsed = (currentTime - 1000 * 60 * 60 * 3 - new Date(dryerBTime)) / (1000 * 60 * 60); // 時間差分
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

  const currentTime = new Date().toLocaleString();

  switch(receivedText) {
    case '洗濯機A利用':
      if (washerAInUse) {
        replyText = 'その洗濯機はまだ使用できません';
      } else {
        washerAInUse = true;
        washerATime = currentTime - 1000 * 60 * 60 * 3;
        replyText = `洗濯機Aが${washerATime}から利用されています`;
      }
      break;

    case '洗濯機B利用':
      if (washerBInUse) {
        replyText = 'その洗濯機はまだ使用できません';
      } else {
        washerBInUse = true;
        washerBTime = currentTime - 1000 * 60 * 60 * 3;
        replyText = `洗濯機Bが${washerBTime}から利用されています`;
      }
      break;

    case '乾燥機A利用':
      if (dryerAInUse) {
        replyText = 'その乾燥機はまだ使用できません';
      } else {
        dryerAInUse = true;
        dryerATime = currentTime - 1000 * 60 * 60 * 3;
        replyText = `乾燥機Aが${dryerATime}から利用されています`;
      }
      break;

    case '乾燥機B利用':
      if (dryerBInUse) {
        replyText = 'その乾燥機はまだ使用できません';
      } else {
        dryerBInUse = true;
        dryerBTime = currentTime - 1000 * 60 * 60 * 3;
        replyText = `乾燥機Bが${dryerBTime}から利用されています`;
      }
      break;

    case '利用状況':
      replyText = 
        `利用状況:\n` +
        `洗濯機A: ${washerAInUse ? `利用中 (${washerATime}から)` : '使用可能'}\n` +
        `洗濯機B: ${washerBInUse ? `利用中 (${washerBTime}から)` : '使用可能'}\n` +
        `乾燥機A: ${dryerAInUse ? `利用中 (${dryerATime}から)` : '使用可能'}\n` +
        `乾燥機B: ${dryerBInUse ? `利用中 (${dryerBTime}から)` : '使用可能'}`;
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
