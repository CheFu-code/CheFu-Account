export type CacheEvent = {
  kind: "data" | "session";
  account: string | null;
  path?: string;
};
const name = "chefu-account-pages-v1";
const listeners = new Set<(event: CacheEvent) => void>();
let channel: BroadcastChannel | undefined;
let listening = false;

function receive(value: unknown) {
  const event = value as CacheEvent;
  if (
    !event ||
    !["data", "session"].includes(event.kind) ||
    (event.account !== null && typeof event.account !== "string") ||
    (event.path !== undefined && typeof event.path !== "string")
  )
    return;
  for (const listener of listeners) listener(event);
}

export function subscribeCacheEvents(listener: (event: CacheEvent) => void) {
  if (!listening && typeof window !== "undefined") {
    listening = true;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(name);
      channel.onmessage = (message) => receive(message.data);
    } else
      window.addEventListener("storage", (event) => {
        if (event.key === name && event.newValue) {
          try {
            receive(JSON.parse(event.newValue));
          } catch {
            /* Ignore unrelated storage values. */
          }
        }
      });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function publishCacheEvent(event: CacheEvent) {
  if (channel) channel.postMessage(event);
  else if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        name,
        JSON.stringify({ ...event, nonce: crypto.randomUUID() }),
      );
    } catch {
      /* Storage may be disabled. */
    }
  }
}
