const WORKER_URL = import.meta.env.VITE_PUSH_WORKER_URL || "";

interface Reminder {
  time: string;
  medName: string;
}

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getVapidPublicKey(): Promise<string | null> {
  if (!WORKER_URL) return null;
  try {
    const res = await fetch(`${WORKER_URL}/api/vapid-public-key`);
    const data = await res.json();
    return data.publicKey;
  } catch {
    return null;
  }
}

async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (subscription) return subscription;

  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) return null;

  subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64urlToUint8Array(vapidKey).buffer as ArrayBuffer,
  });

  return subscription;
}

export async function syncReminders(reminders: Reminder[]): Promise<void> {
  if (!WORKER_URL) return;

  const subscription = await getPushSubscription();
  if (!subscription) return;

  const sub = subscription.toJSON();
  if (!sub.endpoint || !sub.keys) return;

  // Convert reminder times from local time to UTC for the cron job
  const utcReminders = reminders.map((r) => ({
    time: localToUtc(r.time),
    medName: r.medName,
  }));

  try {
    await fetch(`${WORKER_URL}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        },
        reminders: utcReminders,
      }),
    });
  } catch {
    // Silently fail — reminders still work locally when app is open
  }
}

export async function unsubscribePush(): Promise<void> {
  if (!WORKER_URL) return;

  const subscription = await getPushSubscription();
  if (!subscription) return;

  try {
    await fetch(`${WORKER_URL}/api/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
  } catch {
    // Best-effort cleanup
  }
}

function localToUtc(localTime: string): string {
  const [h, m] = localTime.split(":").map(Number);
  const now = new Date();
  now.setHours(h, m, 0, 0);
  const utcH = String(now.getUTCHours()).padStart(2, "0");
  const utcM = String(now.getUTCMinutes()).padStart(2, "0");
  return `${utcH}:${utcM}`;
}
