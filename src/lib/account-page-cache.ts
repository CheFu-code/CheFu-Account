import { AccountCache } from "./account-cache";
import { IndexedDbCache } from "./persistent-cache";
import { ReadCache } from "./read-cache";
import { publishCacheEvent, subscribeCacheEvents, type CacheEvent } from "./cache-events";
import { subscribeAuthInvalidation, waitForAuthMutations } from "./auth-reads";
import type { AccountResponse } from "../app/account/_components/account-types";

const storage = new IndexedDbCache();
const pages = new AccountCache(storage);
const identityReads = new ReadCache();
const listeners = new Set<(identityChanged: boolean) => void>();
// A deliberate browser refresh loads all visited pages afresh. Opening another
// tab still shares persisted page data, after that tab validates its identity.
const reloading = typeof performance !== "undefined" &&
    (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload";
let barrier: Promise<void> = reloading ? storage.invalidate() : Promise.resolve();

function notify(identityChanged: boolean) {
    for (const listener of listeners) listener(identityChanged);
}
export function subscribePageInvalidation(listener: (identityChanged: boolean) => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

function invalidate(identityChanged: boolean, broadcast: boolean) {
    const account = pages.identity;
    identityReads.invalidate();
    // Fence memory immediately; persistent invalidations are queued before reads.
    pages.dropMemory();
    if (identityChanged) pages.forget();
    barrier = barrier.then(() => storage.invalidate(account || undefined));
    if (broadcast) {
        const event: CacheEvent = { kind: identityChanged ? "session" : "data", account };
        void barrier.then(() => publishCacheEvent(event));
    }
    notify(identityChanged);
}
subscribeAuthInvalidation(identityChanged => invalidate(identityChanged, true));
subscribeCacheEvents(event => {
    if (event.kind === "session") {
        invalidate(true, false);
        // Cookie changes are shared by tabs; discard any rendered old account.
        if (typeof window !== "undefined" && window.location.pathname === "/account") window.location.reload();
    } else if (event.account === pages.identity) {
        pages.dropMemory();
        notify(false);
    }
});

type AccountResult = { status: number; data: AccountResponse | null };
export function readAccountPage(appId: string, load: (signal: AbortSignal) => Promise<AccountResult>) {
    return identityReads.read(`account:${appId}`, async signal => {
        await waitForAuthMutations();
        await barrier;
        signal.throwIfAborted();
        const result = await load(signal);
        signal.throwIfAborted();
        if (result.status === 401 || result.status === 403) {
            const account = pages.identity;
            identityReads.invalidate(key => key !== `account:${appId}`);
            pages.forget();
            barrier = barrier.then(() => storage.invalidate(account || undefined));
            void barrier.then(() => publishCacheEvent({ kind: "session", account }));
            notify(true);
            return result;
        }
        if (!result.data?.user.uid) throw new Error("The server returned an invalid account identity.");
        pages.activate(result.data.user.uid);
        return result;
    });
}

export async function rememberAccountPage(appId: string, data: AccountResponse) {
    await barrier;
    if (pages.identity !== data.user.uid) return;
    identityReads.invalidate();
    await identityReads.read(`account:${appId}`, async () => ({ status: 200, data }));
}

export async function readAccountPageData<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
    await waitForAuthMutations();
    await barrier;
    return pages.read(key, load);
}

export async function invalidateAccountPage(key: string) {
    pages.dropMemory(key);
    barrier = barrier.then(() => pages.invalidate(key));
    await barrier;
    publishCacheEvent({ kind: "data", account: pages.identity, path: key });
    notify(false);
}

export function accountPageIdentity() { return pages.identity; }
