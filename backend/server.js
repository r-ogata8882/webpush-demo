const express = require("express");
const webpush = require("web-push");
const cors = require("cors");
const dotenv = require("dotenv"); 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// VAPIDキーを設定
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// 購読情報を一時的に保持（本来はDBに保存）
let subscriptions = [];

// 購読を受け取るAPI
app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  // 重複チェック
  const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
    console.log("保存:", subscription.endpoint);
  } else {
    console.log("既に存在:", subscription.endpoint);
  }
  res.status(201).json({});
});

// VAPID公開鍵を取得するAPI
app.get("/vapidPublicKey", (req, res) => {
  res.send(VAPID_PUBLIC_KEY);
});

// 通知を送信
app.post("/send-notification", async (req, res) => {
  const payload = JSON.stringify({
    title: req.body.title || "通知タイトル",
    body: req.body.body || "テスト通知です！"
  });

  const sendPromises = subscriptions.map(sub =>
    webpush.sendNotification(sub, payload).catch(err => {
      console.error("送信失敗:", err);
    })
  );

  await Promise.all(sendPromises);
  res.status(200).json({ message: "通知送信完了" });
});

app.listen(3000, () => console.log("Server started on port 3000"));
