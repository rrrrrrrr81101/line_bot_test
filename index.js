'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const PORT = process.env.PORT || 3000;

const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

const app = express();

app.get('/', (req, res) => res.send('Hello LINE BOT!(GET)')); //ブラウザ確認用(無くても問題ない)
app.post('/webhook', line.middleware(config), (req, res) => {
    console.log(req.body.events);

    //ここのif分はdeveloper consoleの"接続確認"用なので削除して問題ないです。
    if(req.body.events[0].replyToken === '00000000000000000000000000000000' && req.body.events[1].replyToken === 'ffffffffffffffffffffffffffffffff'){
        res.send('Hello LINE BOT!(POST)');
        console.log('疎通確認用');
        return; 
    }

    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(config);

async function handleEvent(event) {
  // メッセージタイプがテキストでない場合は何もしない
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // 受け取ったメッセージを変数に格納
  const receivedText = event.message.text;

  // 返信メッセージを変数に格納
  let replyText;

  // 「利用状況」と入力された場合に特定のメッセージを返信
  if (receivedText === '利用状況') {
    replyText = '現在の利用状況は次の通りです：\n- サービスA: 利用可能\n- サービスB: 利用停止中';
  } else {
    // それ以外のメッセージはそのままエコーする
    replyText = receivedText;
  }

  // メッセージを返信
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText
  });
}


app.listen(PORT);
console.log(`Server running at ${PORT}`);