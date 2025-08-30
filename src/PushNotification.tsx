import { useState, useEffect } from 'react'
import './PushNotification.css'

// VAPID公開鍵 (実際のアプリでは環境変数から取得)
const VAPID_PUBLIC_KEY = 'BJ8YKZk_DlJuAGSrq1Q4Q2U0vJ0KrjXZZ4B7BQfF5Jj4Z1QhLwUzKwOqXd6Y3aGbHwK1FgPjXzY9NhBvZVd-zKo'

interface PushNotificationProps {
  className?: string
}

const PushNotification: React.FC<PushNotificationProps> = ({ className = '' }) => {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // ブラウザがPush APIをサポートしているか確認
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      checkSubscriptionStatus()
    }
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const currentSubscription = await registration.pushManager.getSubscription()
      setSubscription(currentSubscription)
    } catch (err) {
      console.error('購読状況の確認に失敗しました:', err)
      setError('購読状況の確認に失敗しました')
    }
  }

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const subscribeUser = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 通知権限を要求
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('通知の権限が許可されませんでした')
      }

      const registration = await navigator.serviceWorker.ready
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      setSubscription(newSubscription)
      
      // ここで実際のアプリでは、購読情報をサーバーに送信します
      console.log('購読情報:', JSON.stringify(newSubscription))
      
      // デモ用: 5秒後にテスト通知を送信
      setTimeout(() => {
        sendTestNotification()
      }, 5000)
      
    } catch (err) {
      console.error('購読に失敗しました:', err)
      setError(err instanceof Error ? err.message : '購読に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeUser = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (subscription) {
        await subscription.unsubscribe()
        setSubscription(null)
        
        // ここで実際のアプリでは、サーバーから購読情報を削除します
        console.log('購読を解除しました')
      }
    } catch (err) {
      console.error('購読解除に失敗しました:', err)
      setError('購読解除に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestNotification = () => {
    // デモ用のローカル通知
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('テスト通知', {
          body: 'プッシュ通知の購読が完了しました！',
          icon: '/favicon.svg',
          badge: '/favicon.svg'
        })
      })
    }
  }

  if (!isSupported) {
    return (
      <div className={`push-notification ${className}`}>
        <p className="error">このブラウザはプッシュ通知をサポートしていません</p>
      </div>
    )
  }

  return (
    <div className={`push-notification ${className}`}>
      <h3>プッシュ通知</h3>
      
      {error && (
        <p className="error">{error}</p>
      )}
      
      <div className="status">
        <p>
          状態: {subscription ? '購読中' : '未購読'}
        </p>
      </div>
      
      <div className="controls">
        {!subscription ? (
          <button
            onClick={subscribeUser}
            disabled={isLoading}
            className="subscribe-btn"
          >
            {isLoading ? '購読中...' : 'プッシュ通知を購読'}
          </button>
        ) : (
          <>
            <button
              onClick={unsubscribeUser}
              disabled={isLoading}
              className="unsubscribe-btn"
            >
              {isLoading ? '解除中...' : '購読を解除'}
            </button>
            <button
              onClick={sendTestNotification}
              disabled={isLoading}
              className="test-btn"
            >
              テスト通知を送信
            </button>
          </>
        )}
      </div>
      
      {subscription && (
        <details className="subscription-details">
          <summary>購読詳細</summary>
          <pre>{JSON.stringify(subscription.toJSON(), null, 2)}</pre>
        </details>
      )}
    </div>
  )
}

export default PushNotification
