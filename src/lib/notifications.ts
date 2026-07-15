let permissionGranted = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") {
    permissionGranted = true;
    return true;
  }
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  permissionGranted = result === "granted";
  return permissionGranted;
}

export async function sendNotification(title: string, body: string): Promise<void> {
  if (!permissionGranted && Notification.permission !== "granted") return;
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "sume-timer",
      });
      return;
    } catch {}
  }
  try {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "sume-timer",
    });
  } catch {}
}

export function hasNotificationSupport(): boolean {
  return "Notification" in window;
}
