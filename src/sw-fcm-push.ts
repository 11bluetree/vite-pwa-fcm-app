import { precacheAndRoute } from 'workbox-precaching'

interface ExtendedServiceWorkerGlobalScope extends ServiceWorkerGlobalScope {
  addEventListener: (type: string, listener: (event: Event) => void) => void
  registration: ServiceWorkerRegistration
  clients: {
    openWindow: (url: string) => Promise<unknown>
  }
}

declare let self: ExtendedServiceWorkerGlobalScope

// Workbox のプリキャッシュを設定
precacheAndRoute(self.__WB_MANIFEST)

// Firebase App と Messaging をインポート
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyCUNhaQQR70dL7WpERhFc1uwFst8LDF7Vs",
  authDomain: "test-995a0.firebaseapp.com",
  projectId: "test-995a0",
  storageBucket: "test-995a0.firebasestorage.app",
  messagingSenderId: "701878483294",
  appId: "1:701878483294:web:1c2b54efdb5a8d203837cf"
}

// Firebase を初期化
const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

// FCM バックグラウンド メッセージの処理
onBackgroundMessage(messaging, (payload) => {
  console.log('[sw-fcm-push.ts] Received background message ', payload)
  
  // 通知の内容をカスタマイズ
  const notificationTitle = payload.notification?.title || 'FCM Background Message'
  const notificationOptions = {
    body: payload.notification?.body || 'FCM Background Message body.',
    icon: payload.notification?.icon || '/favicon.svg',
    badge: '/favicon.svg',
    data: {
      ...payload.data,
      fcm_message_id: payload.messageId,
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: '開く',
        icon: '/favicon.svg'
      },
      {
        action: 'close', 
        title: '閉じる',
        icon: '/favicon.svg'
      }
    ],
    vibrate: [100, 50, 100]
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// 通知クリックイベントのリスナー
self.addEventListener('notificationclick', (event: Event) => {
  const notificationEvent = event as unknown as {
    notification: {
      close: () => void
      data?: Record<string, unknown>
    }
    action?: string
    waitUntil: (promise: Promise<void>) => void
  }

  console.log('[sw-fcm-push.ts] Notification click received.', notificationEvent)

  notificationEvent.notification.close()

  if (notificationEvent.action === 'open') {
    // アプリを開く
    notificationEvent.waitUntil(
      self.clients.openWindow('/').then(() => undefined)
    )
  } else if (notificationEvent.action === 'close') {
    // 通知を閉じるだけ
    console.log('Notification closed by user action.')
  } else {
    // デフォルトのクリック動作 - アプリを開く
    notificationEvent.waitUntil(
      self.clients.openWindow('/').then(() => undefined)
    )
  }
})

// 従来のプッシュイベントも処理（フォールバック）
self.addEventListener('push', (event: Event) => {
  const pushEvent = event as unknown as {
    data?: {
      text: () => string
      json: () => Record<string, unknown>
    }
    waitUntil: (promise: Promise<void>) => void
  }

  console.log('[sw-fcm-push.ts] Push event received', pushEvent)

  // FCM 以外のプッシュメッセージの場合の処理
  if (pushEvent.data) {
    let payload: { body?: string; [key: string]: unknown }
    try {
      payload = pushEvent.data.json()
    } catch {
      payload = { body: pushEvent.data.text() }
    }

    const options = {
      body: payload.body || 'プッシュ通知のデフォルトメッセージ',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: '詳細を見る',
          icon: '/favicon.svg'
        },
        {
          action: 'close',
          title: '閉じる',
          icon: '/favicon.svg'
        }
      ]
    }

    pushEvent.waitUntil(
      self.registration.showNotification('my-react-app', options)
    )
  }
})
