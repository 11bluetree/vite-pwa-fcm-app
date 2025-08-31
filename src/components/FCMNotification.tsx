import { useState, useEffect, useCallback } from 'react'
import {
  getFCMToken,
  onForegroundMessage,
  showLocalNotification,
  copyTokenToClipboard,
  FCMMessage,
  FCMTokenResult
} from '../services/fcm-service'
import './FCMNotification.css'

interface FCMNotificationProps {
  className?: string
}

const FCMNotification: React.FC<FCMNotificationProps> = ({ className = '' }) => {
  const [tokenResult, setTokenResult] = useState<FCMTokenResult>({ token: null })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastMessage, setLastMessage] = useState<FCMMessage | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  // FCM 購読を開始
  const startSubscription = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getFCMToken()
      setTokenResult(result)
      
      if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'FCM の購読開始に失敗しました'
      setError(errorMessage)
      setTokenResult({ token: null, error: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // FCM 購読を解除
  const stopSubscription = useCallback(() => {
    setTokenResult({ token: null })
    setError(null)
    setLastMessage(null)
    setCopySuccess(false)
    
    showLocalNotification('購読を解除しました', {
      body: 'FCM プッシュ通知の購読を解除しました',
      icon: '/favicon.svg'
    })
  }, [])

  // フォアグラウンドメッセージの監視
  useEffect(() => {
    if (!tokenResult.token) return

    const unsubscribe = onForegroundMessage((payload: FCMMessage) => {
      console.log('フォアグラウンドメッセージ受信:', payload)
      setLastMessage(payload)
      
      // フォアグラウンドでもブラウザ通知を表示
      if (payload.notification) {
        showLocalNotification(
          payload.notification.title || 'FCM 通知',
          {
            body: payload.notification.body,
            icon: payload.notification.icon || '/favicon.svg',
            data: payload.data
          }
        )
      }
    })

    return () => {
      unsubscribe()
    }
  }, [tokenResult.token])

  // トークンをクリップボードにコピー
  const handleCopyToken = async () => {
    if (!tokenResult.token) return

    const success = await copyTokenToClipboard(tokenResult.token)
    setCopySuccess(success)
    
    if (success) {
      showLocalNotification('トークンをコピーしました', {
        body: 'FCM トークンがクリップボードにコピーされました',
        icon: '/favicon.svg'
      })
    }

    // 3秒後にコピー成功状態をリセット
    setTimeout(() => setCopySuccess(false), 3000)
  }

  // テスト通知を送信（ローカル）
  const sendTestNotification = () => {
    showLocalNotification('FCM テスト通知', {
      body: 'これは FCM のテスト通知です',
      icon: '/favicon.svg',
      badge: '/favicon.svg'
    })
  }

  // Service Worker がサポートされているかチェック
  const isServiceWorkerSupported = 'serviceWorker' in navigator
  const isNotificationSupported = 'Notification' in window

  if (!isServiceWorkerSupported || !isNotificationSupported) {
    return (
      <div className={`fcm-notification ${className}`}>
        <h3>Firebase Cloud Messaging</h3>
        <p className="error">
          このブラウザは FCM をサポートしていません
          {!isServiceWorkerSupported && ' (Service Worker 未対応)'}
          {!isNotificationSupported && ' (Notification 未対応)'}
        </p>
      </div>
    )
  }

  return (
    <div className={`fcm-notification ${className}`}>
      <h3>Firebase Cloud Messaging</h3>
      
      {error && (
        <div className="error-message">
          <p className="error">❌ {error}</p>
        </div>
      )}
      
      <div className="status">
        <p>
          🔔 購読状態: {tokenResult.token ? '✅ 購読中' : '❌ 未購読'}
        </p>
        {tokenResult.token && (
          <p className="permission-status">
            📱 通知権限: {Notification.permission}
          </p>
        )}
      </div>
      
      <div className="controls">
        {!tokenResult.token ? (
          <button
            onClick={startSubscription}
            disabled={isLoading}
            className="subscribe-btn"
          >
            {isLoading ? '🔄 購読開始中...' : '🤚 プッシュ通知を購読'}
          </button>
        ) : (
          <div className="fcm-active">
            <button
              onClick={sendTestNotification}
              disabled={isLoading}
              className="test-btn"
            >
              🔔 テスト通知を送信
            </button>
            
            <button
              onClick={handleCopyToken}
              disabled={isLoading}
              className={`copy-btn ${copySuccess ? 'copy-success' : ''}`}
            >
              {copySuccess ? '✅ コピー完了' : '📋 トークンをコピー'}
            </button>
            
            <button
              onClick={stopSubscription}
              disabled={isLoading}
              className="unsubscribe-btn"
            >
              🚫 購読を解除
            </button>
          </div>
        )}
      </div>

      {/* トークン表示エリア */}
      {tokenResult.token && (
        <details className="token-details">
          <summary>🔑 FCM トークン</summary>
          <div className="token-container">
            <textarea
              readOnly
              value={tokenResult.token}
              className="token-display"
              rows={6}
            />
            <p className="token-info">
              💡 このトークンを使用して、Firebase Console や サーバーから通知を送信できます
            </p>
          </div>
        </details>
      )}

      {/* 最後に受信したメッセージ */}
      {lastMessage && (
        <details className="message-details">
          <summary>📨 最新メッセージ</summary>
          <div className="message-container">
            <div className="message-content">
              {lastMessage.notification && (
                <div className="notification-part">
                  <h4>📢 通知</h4>
                  <p><strong>タイトル:</strong> {lastMessage.notification.title}</p>
                  <p><strong>本文:</strong> {lastMessage.notification.body}</p>
                  {lastMessage.notification.icon && (
                    <p><strong>アイコン:</strong> {lastMessage.notification.icon}</p>
                  )}
                </div>
              )}
              
              {lastMessage.data && Object.keys(lastMessage.data).length > 0 && (
                <div className="data-part">
                  <h4>📦 データ</h4>
                  <pre>{JSON.stringify(lastMessage.data, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </details>
      )}

      {/* 使用方法の説明 */}
      <details className="usage-info">
        <summary>ℹ️ 使用方法</summary>
        <div className="usage-content">
          <ol>
            <li>「プッシュ通知を購読」ボタンをクリック</li>
            <li>ブラウザの通知権限を許可</li>
            <li>生成された FCM トークンをコピー</li>
            <li>Firebase Console の「Cloud Messaging」からテスト通知を送信</li>
            <li>または、サーバーからトークンを使用して通知を送信</li>
            <li>不要になったら「購読を解除」で購読を停止</li>
          </ol>
          
          <h4>📡 Firebase Console での送信方法</h4>
          <ol>
            <li>Firebase Console → プロジェクト → Messaging</li>
            <li>「最初のキャンペーンを作成」または「新しいキャンペーン」</li>
            <li>「Firebase Notification メッセージ」を選択</li>
            <li>通知のタイトルと本文を入力</li>
            <li>「テストメッセージを送信」をクリック</li>
            <li>コピーした FCM トークンを貼り付け</li>
            <li>「テスト」をクリック</li>
          </ol>
        </div>
      </details>
    </div>
  )
}

export default FCMNotification
