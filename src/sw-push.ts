import { precacheAndRoute } from 'workbox-precaching'

interface ExtendedServiceWorkerGlobalScope extends ServiceWorkerGlobalScope {
  addEventListener: (type: string, listener: (event: Event) => void) => void
  registration: ServiceWorkerRegistration
  clients: {
    openWindow: (url: string) => Promise<unknown>
  }
}

declare let self: ExtendedServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

// プッシュ通知イベントのリスナー
self.addEventListener('push', (event: Event) => {
  const pushEvent = event as unknown as {
    data?: {
      text: () => string
    }
    waitUntil: (promise: Promise<void>) => void
  }

  const options = {
    body: pushEvent.data?.text() || 'プッシュ通知のデフォルトメッセージ',
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
})

// 通知クリックイベントのリスナー
self.addEventListener('notificationclick', (event: Event) => {
  const notificationEvent = event as unknown as {
    notification: {
      close: () => void
    }
    action?: string
    waitUntil: (promise: Promise<void>) => void
  }

  notificationEvent.notification.close()

  if (notificationEvent.action === 'explore') {
    // アプリを開く
    notificationEvent.waitUntil(
      self.clients.openWindow('/').then(() => undefined)
    )
  } else if (notificationEvent.action === 'close') {
    // 何もしない（通知を閉じるだけ）
  } else {
    // デフォルトのクリック動作
    notificationEvent.waitUntil(
      self.clients.openWindow('/').then(() => undefined)
    )
  }
})