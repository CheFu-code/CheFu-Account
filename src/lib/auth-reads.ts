// In-flight reads only: no settled authentication/profile cache or credentials
// in keys. Each auth mutation fences reads on both sides of the cookie change.
let revision = 0;
const pending = new Map<string, { promise: Promise<unknown>; controller: AbortController }>();

export class SupersededAuthReadError extends Error {
    constructor() {
        super("The account changed while loading. Please try again.");
        this.name = "SupersededAuthReadError";
    }
}

export function invalidateAuthReads() {
    revision++;
    for (const entry of pending.values()) entry.controller.abort();
    pending.clear();
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
    invalidateAuthReads();
    try {
        return await fetch(input, init);
    } finally {
        invalidateAuthReads();
    }
}
