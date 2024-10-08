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

app.post('/webhook', line.middleware(config), (req, res) => {
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(config);

// 利用状況を更新するメソッド
function updateUsageStatus() {
  const currentTime = getJapanTime();

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
    // 洗濯機A利用
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

    // 洗濯機B利用
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

    // 乾燥機A利用
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

    // 乾燥機B利用
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

    // キャンセル機能
    case '洗濯機A取り消し':
      if (washerAInUse) {
        washerAInUse = false;
        washerATime = null;
        replyText = '洗濯機Aの利用が取り消されました';
      } else {
        replyText = '洗濯機Aは既に利用可能です';
      }
      break;

    case '洗濯機B取り消し':
      if (washerBInUse) {
        washerBInUse = false;
        washerBTime = null;
        replyText = '洗濯機Bの利用が取り消されました';
      } else {
        replyText = '洗濯機Bは既に利用可能です';
      }
      break;

    case '乾燥機A取り消し':
      if (dryerAInUse) {
        dryerAInUse = false;
        dryerATime = null;
        replyText = '乾燥機Aの利用が取り消されました';
      } else {
        replyText = '乾燥機Aは既に利用可能です';
      }
      break;

    case '乾燥機B取り消し':
      if (dryerBInUse) {
        dryerBInUse = false;
        dryerBTime = null;
        replyText = '乾燥機Bの利用が取り消されました';
      } else {
        replyText = '乾燥機Bは既に利用可能です';
      }
      break;

      
    // コマンド機能
    case 'コマンド一覧':
      replyText = 
        `対応しているコマンド一覧:\n` +
        `1. 洗濯機A利用: 洗濯機Aを使用開始\n` +
        `2. 洗濯機B利用: 洗濯機Bを使用開始\n` +
        `3. 乾燥機A利用: 乾燥機Aを使用開始\n` +
        `4. 乾燥機B利用: 乾燥機Bを使用開始\n` +
        `5. 洗濯機A取り消し: 洗濯機Aの利用を取り消し\n` +
        `6. 洗濯機B取り消し: 洗濯機Bの利用を取り消し\n` +
        `7. 乾燥機A取り消し: 乾燥機Aの利用を取り消し\n` +
        `8. 乾燥機B取り消し: 乾燥機Bの利用を取り消し\n` +
        `9. 利用状況: 現在の全機器の利用状況を確認\n` +
        `10. コマンド一覧: このコマンド一覧を表示`;
      break;

      //利用状況
      case '利用状況':
        replyText = 
          `利用状況:\n` +
          `洗濯機A: ${washerAInUse ? `利用中 (${formatTime(new Date(washerATime))}から)` : '使用可能'}\n` +
          `洗濯機B: ${washerBInUse ? `利用中 (${formatTime(new Date(washerBTime))}から)` : '使用可能'}\n` +
          `乾燥機A: ${dryerAInUse ? `利用中 (${formatTime(new Date(dryerATime))}から)` : '使用可能'}\n` +
          `乾燥機B: ${dryerBInUse ? `利用中 (${formatTime(new Date(dryerBTime))}から)` : '使用可能'}`;
        break;

    default:
      replyText = 'そのコマンドには対応していません。`コマンド一覧`で利用可能なコマンドを確認してください。';
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText
  });
}

// HEAD リクエストを処理するエンドポイントを追加
app.head('/', (req, res) => {
    res.sendStatus(200); // HTTPステータス200を返すだけ
});

app.listen(PORT);
console.log(`Server running at ${PORT}`);
