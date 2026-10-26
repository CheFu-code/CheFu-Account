// In-flight reads only: no settled authentication/profile cache or credentials
// in keys. Each auth mutation fences reads on both sides of the cookie change.
let revision = 0;
const pending = new Map<string, Promise<unknown>>();

export class SupersededAuthReadError extends Error {
    constructor() {
        super("The account changed while loading. Please try again.");
        this.name = "SupersededAuthReadError";
    }
}

export function invalidateAuthReads() {
    revision++;
    pending.clear();
}

export function shareAuthRead<T>(key: string, task: () => Promise<T>): Promise<T> {
    const existing = pending.get(key);
    if (existing) return existing as Promise<T>;
    const startedAt = revision;
    const request = Promise.resolve().then(task).then(
        result => {
            if (startedAt !== revision) throw new SupersededAuthReadError();
            return result;
        },
        error => {
            if (startedAt !== revision) throw new SupersededAuthReadError();
            throw error;
        },
    );
    pending.set(key, request);
    const clear = () => { if (pending.get(key) === request) pending.delete(key); };
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
