const serverUrl = "http://localhost:3000";  // Nodeサーバー
// const publicKey = "BGJmvus3pliirrSTNNCJOaw3VG9ZSZz7KxUfKIA4uYu5V0PbVVggP8sX22LsPizapfOESZBy6fhcKearwq9R9_I";

const statusEl = document.getElementById('status');

// Service Worker登録
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    statusEl.textContent = 'Service Worker未対応です。';
    return null;
  }

  const reg = await navigator.serviceWorker.register('sw.js');
  statusEl.textContent = 'Service Worker 登録完了';
  return reg;
}

// VAPIDキー→Uint8Array変換
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

// 通知を有効化
document.getElementById('enable-push').addEventListener('click', async () => {
  const reg = await registerServiceWorker();
  if (!reg) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('通知が許可されていません');
    return;
  }

  const res = await fetch(`${serverUrl}/vapidPublicKey`);
  const vapidPublicKey = await res.text();

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  await fetch(`${serverUrl}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });

  statusEl.textContent = '通知有効になりました！';
});


// 通知を無効化
document.getElementById('disable-push').addEventListener('click', async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('通知を無効にしました');
      document.getElementById('status').textContent = '通知が無効になりました';
    } else {
      console.log('購読が見つかりません');
      document.getElementById('status').textContent = '通知は既に無効です';
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
      console.log('Service Workerを登録解除しました');
    }
  } catch (error) {
    console.error('無効化エラー:', error);
    document.getElementById('status').textContent = '無効化に失敗しました';
  }
});


// 通知送信
document.getElementById('send-push').addEventListener('click', async () => {
  const res = await fetch(`${serverUrl}/send-notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'PWA通知テスト',
      body: '通知が届きました🎉'
    })
  });

  if (res.ok) {
    alert('通知を送信しました！');
  } else {
    alert('通知送信に失敗しました。');
  }
});