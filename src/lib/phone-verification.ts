import { apiUrl, type ChefuAppId } from "./chefu-account";
import { authMutationFetch } from "./auth-reads";

export type VerifiedPhone = { verified: true; phone: string; verifiedAt: string };
export type PhoneChallenge = { verified: false; phone: string; resendAfterSeconds: number; expiresInSeconds: number };

export class PhoneVerificationError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly retryAfterSeconds = 0,
        public readonly attemptsRemaining?: number,
    ) {
        super(message);
        this.name = "PhoneVerificationError";
    }
}

function seconds(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0
        ? Math.min(86400, Math.ceil(value)) : 0;
}
function receipt(data: Record<string, unknown>): data is Record<string, unknown> & VerifiedPhone {
    return data.verified === true && typeof data.phone === "string" && /^\+[1-9]\d{7,14}$/.test(data.phone)
        && typeof data.verifiedAt === "string" && Number.isFinite(Date.parse(data.verifiedAt));
}
async function request(action: "send" | "check", body: object, appId: ChefuAppId, signal: AbortSignal) {
    let response: Response;
    try {
        response = await authMutationFetch(apiUrl(`/phone-verification/${action}`), {
            method: "POST", credentials: "include", cache: "no-store", signal,
            headers: { "Content-Type": "application/json", "x-chefu-app": appId },
            body: JSON.stringify(body),
        });
    } catch {
        throw new PhoneVerificationError(action === "send"
            ? "We couldn’t confirm the send. If a code arrives, enter it below. Otherwise, wait a moment before trying again."
            : "We couldn’t confirm verification. Try the code again or skip for now.", 0, action === "send" ? 30 : 0);
    }
    const raw: unknown = await response.json().catch(() => null);
    const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    if (!response.ok) {
        const message = typeof data.message === "string" ? data.message : Array.isArray(data.message)
            ? data.message.filter(value => typeof value === "string").join(" ") : "Unable to verify your phone number.";
        throw new PhoneVerificationError(response.status === 401 ? "Your sign-in expired. You can skip this step and sign in again."
            : response.status >= 500 ? "Phone verification is temporarily unavailable. You can try again or skip this step."
            : message, response.status, seconds(data.retryAfterSeconds),
        typeof data.attemptsRemaining === "number" && Number.isInteger(data.attemptsRemaining)
            ? Math.max(0, Math.min(5, data.attemptsRemaining)) : undefined);
    }
    return data;
}

export async function sendPhoneCode(phone: string, appId: ChefuAppId, signal: AbortSignal): Promise<PhoneChallenge | VerifiedPhone> {
    const data = await request("send", { phone }, appId, signal);
    if (receipt(data)) return data;
    if (data.verified !== false || typeof data.phone !== "string" || !/^\+[1-9]\d{7,14}$/.test(data.phone)
        || typeof data.resendAfterSeconds !== "number" || !Number.isFinite(data.resendAfterSeconds) || data.resendAfterSeconds < 0
        || typeof data.expiresInSeconds !== "number" || !Number.isFinite(data.expiresInSeconds) || data.expiresInSeconds <= 0) {
        throw new PhoneVerificationError("We couldn’t confirm the send. Wait a moment before trying again.", 0, 30);
    }
    return { verified: false, phone: data.phone, resendAfterSeconds: seconds(data.resendAfterSeconds), expiresInSeconds: seconds(data.expiresInSeconds) };
}

export async function checkPhoneCode(phone: string, code: string, appId: ChefuAppId, signal: AbortSignal): Promise<VerifiedPhone> {
    const data = await request("check", { phone, code }, appId, signal);
    if (!receipt(data) || data.phone !== phone) throw new PhoneVerificationError("Verification was not confirmed. Please try again.", 0);
    return data;
}
