import { getToken, onMessage, deleteToken, Unsubscribe } from 'firebase/messaging';
import { messaging } from '../firebase-config';

/**
 * FCM トークン管理とメッセージ処理のサービス
 */

export interface FCMTokenResult {
  token: string | null;
  error?: string;
}

export interface FCMMessage {
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
  };
  data?: Record<string, string>;
}

/**
 * 通知権限を要求する
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('このブラウザは通知をサポートしていません');
  }

  if (Notification.permission === 'granted') {
    return Notification.permission;
  }

  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * FCM トークンを取得する
 */
export const getFCMToken = async (): Promise<FCMTokenResult> => {
  try {
    // 通知権限を確認・要求
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      return {
        token: null,
        error: '通知の権限が許可されていません'
      };
    }

    // Service Worker の登録を確認
    if (!('serviceWorker' in navigator)) {
      return {
        token: null,
        error: 'Service Worker がサポートされていません'
      };
    }

    // Service Worker が ready になるまで待機
    const registration = await navigator.serviceWorker.ready;
    
    // カスタム Service Worker が登録されていることを確認
    console.log('Service Worker registration:', registration.scope);

    // FCM トークンを取得（カスタム Service Worker を使用）
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return {
        token: null,
        error: 'FCM トークンの取得に失敗しました'
      };
    }

    console.log('FCM Token:', token);
    return { token };

  } catch (error) {
    console.error('FCM トークン取得エラー:', error);
    return {
      token: null,
      error: error instanceof Error ? error.message : 'FCM トークンの取得に失敗しました'
    };
  }
};

/**
 * フォアグラウンドでのメッセージを監視する
 */
export const onForegroundMessage = (callback: (payload: FCMMessage) => void): Unsubscribe => {
  return onMessage(messaging, (payload) => {
    console.log('フォアグラウンドメッセージを受信:', payload);
    callback(payload);
  });
};

/**
 * トークンの更新を監視する（将来的な拡張用）
 */
export const onTokenRefresh = (callback: (token: string) => void): (() => void) => {
  // Firebase v9 では onTokenRefresh は削除されているため、
  // 定期的にトークンを確認する方法を実装
  const checkTokenPeriodically = async () => {
    try {
      const result = await getFCMToken();
      if (result.token) {
        callback(result.token);
      }
    } catch (error) {
      console.error('トークン更新チェックエラー:', error);
    }
  };

  // 24時間ごとにトークンをチェック
  const intervalId = setInterval(checkTokenPeriodically, 24 * 60 * 60 * 1000);

  // クリーンアップ関数を返す
  return () => {
    clearInterval(intervalId);
  };
};

/**
 * ローカル通知を表示する（テスト用）
 */
export const showLocalNotification = (title: string, options?: NotificationOptions): void => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      ...options,
    });
  }
};

/**
 * FCM トークンをクリップボードにコピーする
 */
export const copyTokenToClipboard = async (token: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(token);
      return true;
    } else {
      // フォールバック: textarea を使用
      const textArea = document.createElement('textarea');
      textArea.value = token;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('クリップボードへのコピーに失敗:', error);
    return false;
  }
};

/**
 * FCM トークンを削除して購読を完全に解除する
 */
export const deleteFCMToken = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!messaging) {
      return {
        success: false,
        error: 'Firebase Messaging が初期化されていません'
      };
    }

    await deleteToken(messaging);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('FCM トークンの削除に失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'トークンの削除に失敗しました'
    };
  }
};
