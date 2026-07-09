import { apiRequest } from './api';
import type { AuthSession } from './auth';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalClient) => void | Promise<void>>;
  }
}

type OneSignalClient = {
  init: (options: { appId: string; serviceWorkerPath?: string; serviceWorkerParam?: { scope: string } }) => Promise<void>;
  Notifications?: {
    permission?: boolean;
    requestPermission?: () => Promise<boolean>;
  };
  Slidedown?: {
    promptPush?: () => Promise<void>;
  };
  User?: {
    PushSubscription?: {
      id?: string | null;
      optedIn?: boolean;
      optIn?: () => Promise<void>;
      addEventListener?: (
        eventName: 'change',
        callback: (event: { current?: { id?: string | null } }) => void,
      ) => void;
    };
  };
};

type PushConfig = {
  enabled: boolean;
  provider: 'onesignal';
  app_id?: string | null;
};

let scriptPromise: Promise<void> | null = null;
let initializedForUserId: string | null = null;

function loadOneSignalScript() {
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-onesignal-sdk="true"]');
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.async = true;
    script.defer = true;
    script.dataset.onesignalSdk = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load OneSignal SDK.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

async function saveSubscription(session: AuthSession, subscriptionId: string) {
  await apiRequest('/push/subscriptions', {
    method: 'POST',
    token: session.token,
    body: {
      provider: 'onesignal',
      subscription_id: subscriptionId,
      device_label: navigator.userAgent.slice(0, 120),
    },
  });
}

export async function registerEmergencyPushNotifications(session: AuthSession) {
  if (session.user.role !== 'owner' && session.user.role !== 'manager') {
    return;
  }
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return;
  }
  if (initializedForUserId === session.user.id) {
    return;
  }

  const config = await apiRequest<PushConfig>('/push/config', { token: session.token }).catch(() => null);
  if (!config?.enabled || !config.app_id) {
    return;
  }

  initializedForUserId = session.user.id;
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  await loadOneSignalScript();

  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({
      appId: config.app_id as string,
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/' },
    });

    if (!OneSignal.Notifications?.permission) {
      await OneSignal.Slidedown?.promptPush?.();
      await OneSignal.Notifications?.requestPermission?.();
    }

    if (OneSignal.User?.PushSubscription?.optedIn === false) {
      await OneSignal.User.PushSubscription.optIn?.();
    }

    const currentId = OneSignal.User?.PushSubscription?.id;
    if (currentId) {
      await saveSubscription(session, currentId).catch((error) => {
        console.error('Failed to save push subscription:', error);
      });
    }

    OneSignal.User?.PushSubscription?.addEventListener?.('change', (event) => {
      const nextId = event.current?.id;
      if (nextId) {
        saveSubscription(session, nextId).catch((error) => {
          console.error('Failed to update push subscription:', error);
        });
      }
    });
  });
}
