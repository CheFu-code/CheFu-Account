type Entry = { controller: AbortController; promise: Promise<unknown> };

// Memory layer for shared requests. AccountCache supplies persistent data;
// session validation uses this layer alone and is fresh on each app startup.
export class ReadCache {
  private readonly entries = new Map<string, Entry>();

  read<T>(
    key: string,
    load: (signal: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    if (signal?.aborted) return Promise.reject(signal.reason);
    let entry = this.entries.get(key);
    if (!entry) {
      const controller = new AbortController();
      const promise = Promise.resolve()
        .then(() => {
          controller.signal.throwIfAborted();
          return load(controller.signal);
        })
        .then((value) => {
          // A request started before refresh/sign-out must never restore old data.
          controller.signal.throwIfAborted();
          return value;
        });
      entry = { controller, promise };
      this.entries.set(key, entry);
    }
    return this.subscribe(entry.promise as Promise<T>, signal);
  }

  invalidate(matches: (key: string) => boolean = () => true) {
    for (const [key, entry] of this.entries) {
      if (!matches(key)) continue;
      this.entries.delete(key);
      entry.controller.abort();
    }
  }

  private subscribe<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) return promise;
    return new Promise((resolve, reject) => {
      const abort = () => reject(signal.reason);
      signal.addEventListener("abort", abort, { once: true });
      void promise.then(
        (value) => {
          signal.removeEventListener("abort", abort);
          if (!signal.aborted) resolve(value);
        },
        (error) => {
          signal.removeEventListener("abort", abort);
          if (!signal.aborted) reject(error);
        },
      );
    });
  }
}
