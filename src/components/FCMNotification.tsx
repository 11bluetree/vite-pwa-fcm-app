import { useState, useEffect, useCallback } from 'react'
import {
  getFCMToken,
  onForegroundMessage,
  showLocalNotification,
  copyTokenToClipboard,
  deleteFCMToken,
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
  const stopSubscription = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Firebase側でトークンを削除
      const result = await deleteFCMToken()
      
      if (result.success) {
        // ローカル状態をリセット
        setTokenResult({ token: null })
        setLastMessage(null)
        setCopySuccess(false)
        
        showLocalNotification('通知を停止しました', {
          body: 'FCM プッシュ通知を完全に停止しました',
          icon: '/favicon.svg'
        })
      } else {
        setError(result.error || 'トークンの削除に失敗しました')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '通知の停止に失敗しました'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
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
            {isLoading ? '🔄 購読開始中...' : '🤚 プッシュ通知を開始'}
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
              {isLoading ? '🔄 停止中...' : '🚫 通知を停止'}
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
    </div>
  )
}

export default FCMNotification
