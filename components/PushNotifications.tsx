'use client';

import { useCallback, useEffect, useState } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Macintosh but exposes touch points.
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

const DISMISS_KEY = 'ai-news-push-dismissed';

// ─── Icons ───────────────────────────────────────────────────────────────────
function IconBell() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom">
      <path d="M12 16V3" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register the service worker and work out what this browser can do.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
      } catch {
        setDismissed(false);
      }

      const hasSW = 'serviceWorker' in navigator;
      const hasPush = 'PushManager' in window;
      const hasNotification = 'Notification' in window;

      // iOS only exposes PushManager once the site is installed to the Home Screen.
      if (isIosSafari() && !isStandalone()) {
        if (!cancelled) setNeedsInstall(true);
        return;
      }

      if (!hasSW || !hasPush || !hasNotification) return;

      if (!cancelled) {
        setSupported(true);
        setPermission(Notification.permission);
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled) setSubscribed(Boolean(existing));
      } catch (err) {
        console.error('[push] service worker registration failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        setBusy(false);
        return;
      }

      const keyRes = await fetch('/api/push/public-key');
      if (!keyRes.ok) throw new Error('Push notifications are not configured yet.');
      const { publicKey } = await keyRes.json();

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });
      if (!res.ok) throw new Error('Could not save your subscription.');

      setSubscribed(true);
      setJustSubscribed(true);
    } catch (err: any) {
      console.error('[push] subscribe failed', err);
      setError(err?.message || 'Could not enable notifications.');
    } finally {
      setBusy(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* storage unavailable — banner simply returns next visit */
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
      setJustSubscribed(false);
      dismiss();
    } catch (err: any) {
      console.error('[push] unsubscribe failed', err);
      setError(err?.message || 'Could not turn off notifications.');
    } finally {
      setBusy(false);
    }
  }, [dismiss]);

  // Confirmation shown right after opting in, with a way straight back out.
  if (justSubscribed) {
    return (
      <div className="fixed bottom-4 left-4 z-40 max-w-xs rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
        <p className="text-sm font-semibold text-gray-900">Notifications are on</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          You&apos;ll get an alert here whenever a new article is published.
        </p>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={dismiss}
            className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800"
          >
            Got it
          </button>
          <button
            onClick={unsubscribe}
            disabled={busy}
            className="text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-gray-800 disabled:opacity-50"
          >
            {busy ? 'Turning off…' : 'Turn off'}
          </button>
        </div>
      </div>
    );
  }

  // Nothing to show: already subscribed, dismissed, blocked, or unsupported.
  if (dismissed) return null;
  if (needsInstall) {
    return (
      <div className="fixed bottom-4 left-4 z-40 max-w-xs rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
        <p className="text-sm font-semibold text-gray-900">Get news alerts on your iPhone</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Tap <IconShare /> <span className="font-medium">Share</span>, choose{' '}
          <span className="font-medium">Add to Home Screen</span>, then open AI News from your
          Home Screen and turn on notifications.
        </p>
        <button
          onClick={dismiss}
          className="mt-3 text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-gray-800"
        >
          Not now
        </button>
      </div>
    );
  }

  if (!supported || permission === 'denied' || subscribed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-xs rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      <p className="text-sm font-semibold text-gray-900">Never miss an AI story</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-600">
        Get a browser notification the moment a new article is published.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={subscribe}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          <IconBell />
          {busy ? 'Enabling…' : 'Enable notifications'}
        </button>
        <button
          onClick={dismiss}
          className="text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-gray-800"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
