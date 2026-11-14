import type { AccountResponse } from "../account-types";
import type { PersonalInfoUpdate } from "../../../../lib/account-profile";

export const personalFields = [
    { id: "name", label: "Name", help: "Your first and last name are saved together as your account name." },
    { id: "fullname", label: "Display name", help: "Updating this also updates your first and last name." },
    { id: "bio", label: "Professional bio", help: "A short introduction, up to 280 characters." },
    { id: "website", label: "Website", help: "Use a complete address starting with https:// or http://." },
    { id: "location", label: "Location", help: "For example, your city and country." },
] as const;

export type PersonalField = typeof personalFields[number]["id"];
export type PersonalDraft = Record<"firstName" | "lastName" | "fullname" | "bio" | "website" | "location", string>;

export function personalValues(account: AccountResponse): PersonalDraft {
    const text = (value: unknown) => typeof value === "string" ? value : "";
    return {
        firstName: text(account.profile.firstName), lastName: text(account.profile.lastName),
        fullname: text(account.profile.fullname) || text(account.user.displayName),
        bio: text(account.profile.bio), website: text(account.profile.website), location: text(account.profile.location),
    };
}

export function personalInfoChanges(field: PersonalField, draft: PersonalDraft, original: PersonalDraft): PersonalInfoUpdate {
    if (field === "name") {
        const firstName = draft.firstName.trim().replace(/\s+/g, " ");
        const lastName = draft.lastName.trim().replace(/\s+/g, " ");
        if (!firstName || !lastName) throw new Error("Enter both your first and last name.");
        return firstName === original.firstName && lastName === original.lastName ? {} : { firstName, lastName };
    }
    const value = field === "fullname" ? draft[field].trim().replace(/\s+/g, " ") : draft[field].trim();
    if (field === "fullname" && value.length < 2) throw new Error("Display name must contain at least 2 characters.");
    if (field === "bio" && value.length > 280) throw new Error("Keep your bio within 280 characters.");
    if ((field === "website" || field === "location") && value.length > 200) throw new Error("Use no more than 200 characters.");
    if (field === "website" && value) {
        let url: URL;
        try { url = new URL(value); } catch { throw new Error("Enter a valid website address."); }
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("Website addresses must start with https:// or http://.");
    }
    return value === original[field] ? {} : { [field]: value };
}
