// In-flight reads only: no settled authentication/profile cache or credentials
// in keys. Each auth mutation fences reads on both sides of the cookie change.
let revision = 0;
const pending = new Map<string, { promise: Promise<unknown>; controller: AbortController }>();
const listeners = new Set<(identityChanged: boolean) => void>();
let mutations = 0;
const mutationWaiters = new Set<() => void>();

export function subscribeAuthInvalidation(listener: (identityChanged: boolean) => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

export function waitForAuthMutations() {
    return mutations ? new Promise<void>(resolve => mutationWaiters.add(resolve)) : Promise.resolve();
}

export class SupersededAuthReadError extends Error {
    constructor() {
        super("The account changed while loading. Please try again.");
        this.name = "SupersededAuthReadError";
    }
}

export function invalidateAuthReads(identityChanged = true) {
    revision++;
    for (const entry of pending.values()) entry.controller.abort();
    pending.clear();
    for (const listener of listeners) listener(identityChanged);
}

export function shareAuthRead<T>(key: string, task: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const existing = pending.get(key);
    if (existing) return existing.promise as Promise<T>;
    const controller = new AbortController();
    const startedAt = revision;
    const request = Promise.resolve().then(() => {
        if (controller.signal.aborted) throw new SupersededAuthReadError();
        return task(controller.signal);
    }).then(
        result => {
            if (startedAt !== revision) throw new SupersededAuthReadError();
            return result;
        },
        error => {
            if (startedAt !== revision) throw new SupersededAuthReadError();
            throw error;
        },
    );
    pending.set(key, { promise: request, controller });
    const clear = () => { if (pending.get(key)?.promise === request) pending.delete(key); };
    void request.then(clear, clear);
    return request;
}

export async function authMutationFetch(input: RequestInfo | URL, init?: RequestInit) {
    const path = typeof input === "string" ? input : String(input);
    const identityChanged = /\/auth\/(?:session(?:[/?]|$)|accounts\/switch|email-verification\/verify|passkey\/session\/verify|account(?:[/?]|$))/.test(path);
    mutations++;
    invalidateAuthReads(identityChanged);
    try {
        return await fetch(input, init);
    } finally {
        mutations--;
        invalidateAuthReads(identityChanged);
        if (!mutations) {
            for (const resolve of mutationWaiters) resolve();
            mutationWaiters.clear();
        }
    }
}
