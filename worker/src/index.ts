import { sendPushNotification } from "./webpush";

interface Env {
  SUME_KV: KVNamespace;
  VAPID_SUBJECT: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
}

interface Reminder {
  time: string; // HH:MM
  medName: string;
}

interface SubscriptionRecord {
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  reminders: Reminder[];
  updatedAt: number;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/subscribe" && request.method === "POST") {
      return handleSubscribe(request, env);
    }

    if (url.pathname === "/api/unsubscribe" && request.method === "POST") {
      return handleUnsubscribe(request, env);
    }

    if (url.pathname === "/api/vapid-public-key") {
      return json({ publicKey: env.VAPID_PUBLIC_KEY });
    }

    return json({ error: "Not found" }, 404);
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await processReminders(env);
  },
};

async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
    reminders: Reminder[];
  };

  if (!body.subscription?.endpoint || !body.subscription?.keys) {
    return json({ error: "Invalid subscription" }, 400);
  }

  const key = keyFromEndpoint(body.subscription.endpoint);
  const record: SubscriptionRecord = {
    subscription: body.subscription,
    reminders: body.reminders || [],
    updatedAt: Date.now(),
  };

  await env.SUME_KV.put(key, JSON.stringify(record));

  // Also index by reminder time for fast cron lookups
  await updateTimeIndex(env, key, record.reminders);

  return json({ ok: true });
}

async function handleUnsubscribe(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { endpoint: string };
  if (!body.endpoint) return json({ error: "Missing endpoint" }, 400);

  const key = keyFromEndpoint(body.endpoint);

  // Clean up time index entries
  const existing = await env.SUME_KV.get(key);
  if (existing) {
    const record = JSON.parse(existing) as SubscriptionRecord;
    await removeFromTimeIndex(env, key, record.reminders);
  }

  await env.SUME_KV.delete(key);
  return json({ ok: true });
}

async function processReminders(env: Env): Promise<void> {
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const currentTime = `${hh}:${mm}`;

  // Get all subscription keys that have a reminder at this time
  const indexKey = `time:${currentTime}`;
  const indexData = await env.SUME_KV.get(indexKey);
  if (!indexData) return;

  const subKeys = JSON.parse(indexData) as string[];
  const staleKeys: string[] = [];

  for (const subKey of subKeys) {
    const data = await env.SUME_KV.get(subKey);
    if (!data) {
      staleKeys.push(subKey);
      continue;
    }

    const record = JSON.parse(data) as SubscriptionRecord;
    const dueReminders = record.reminders.filter((r) => r.time === currentTime);

    for (const reminder of dueReminders) {
      const payload = JSON.stringify({
        title: "Sume",
        body: `Time to take ${reminder.medName}`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: `sume-reminder-${reminder.time}`,
      });

      const result = await sendPushNotification(
        record.subscription,
        payload,
        env.VAPID_SUBJECT,
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY
      );

      // 410 Gone = subscription expired, clean it up
      if (result.status === 410 || result.status === 404) {
        staleKeys.push(subKey);
        await env.SUME_KV.delete(subKey);
        break;
      }
    }
  }

  // Clean stale entries from time index
  if (staleKeys.length > 0) {
    const remaining = subKeys.filter((k) => !staleKeys.includes(k));
    if (remaining.length > 0) {
      await env.SUME_KV.put(indexKey, JSON.stringify(remaining));
    } else {
      await env.SUME_KV.delete(indexKey);
    }
  }
}

// Helpers

function keyFromEndpoint(endpoint: string): string {
  // Hash the endpoint to create a stable, short key
  const hash = endpoint.split("/").pop() || endpoint;
  return `sub:${hash}`;
}

async function updateTimeIndex(env: Env, subKey: string, reminders: Reminder[]): Promise<void> {
  // First, remove from all time indices (brute force for simplicity)
  // Then add to the correct ones
  const times = new Set(reminders.map((r) => r.time));

  for (const time of times) {
    const indexKey = `time:${time}`;
    const existing = await env.SUME_KV.get(indexKey);
    const keys: string[] = existing ? JSON.parse(existing) : [];
    if (!keys.includes(subKey)) {
      keys.push(subKey);
      await env.SUME_KV.put(indexKey, JSON.stringify(keys));
    }
  }
}

async function removeFromTimeIndex(env: Env, subKey: string, reminders: Reminder[]): Promise<void> {
  const times = new Set(reminders.map((r) => r.time));

  for (const time of times) {
    const indexKey = `time:${time}`;
    const existing = await env.SUME_KV.get(indexKey);
    if (!existing) continue;
    const keys = (JSON.parse(existing) as string[]).filter((k) => k !== subKey);
    if (keys.length > 0) {
      await env.SUME_KV.put(indexKey, JSON.stringify(keys));
    } else {
      await env.SUME_KV.delete(indexKey);
    }
  }
}
