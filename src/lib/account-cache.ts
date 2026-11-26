import { ReadCache } from "./read-cache";
import type { PersistentCache } from "./persistent-cache";

export class AccountCache {
  private readonly memory = new ReadCache();
  private account: string | null = null;

  constructor(private readonly storage: PersistentCache) {}

  // A caller must obtain this identity from a fresh server session first.
  activate(account: string) {
    if (this.account === account) return;
    this.memory.invalidate();
    this.account = account;
  }

  async read<T>(
    path: string,
    load: (signal: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    const account = this.account;
    if (!account)
      throw new Error(
        "Validate your account session before loading cached data.",
      );
    return this.memory.read(
      `${account}\0${path}`,
      async (requestSignal) => {
        const saved = await this.storage.read(account, path);
        requestSignal.throwIfAborted();
        if (saved.found) return saved.value as T;
        const value = await load(requestSignal);
        requestSignal.throwIfAborted();
        await this.storage.write(account, path, value, saved.version);
        requestSignal.throwIfAborted();
        return value;
      },
      signal,
    );
  }

  async invalidate(path?: string) {
    const account = this.account;
    this.dropMemory(path);
    if (account) await this.storage.invalidate(account, path);
  }

  async clear() {
    const account = this.account;
    this.account = null;
    this.memory.invalidate();
    await this.storage.invalidate(account || undefined);
  }

  dropMemory(path?: string) {
    this.memory.invalidate(
      path ? (key) => key.endsWith(`\0${path}`) : undefined,
    );
  }

  forget() {
    this.account = null;
    this.memory.invalidate();
  }

  get identity() {
    return this.account;
  }
}
