import {
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AccountResponse } from "./account-types";

export type PasskeyCredential = {
  credentialId: string;
  email: string;
  createdAt?: string;
  lastUsedAt?: string;
};

export type PasskeySetupState = {
  isLoadingCredentials: boolean;
  credentials: PasskeyCredential[];
  isRegistering: boolean;
  isDeleting: Record<string, boolean>;
  error?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export function usePasskeyManagement(account: AccountResponse) {
  const [state, setState] = useState<PasskeySetupState>({
    isLoadingCredentials: true,
    credentials: [],
    isRegistering: false,
    isDeleting: {},
  });

  // Load existing credentials
  const loadCredentials = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoadingCredentials: true, error: undefined }));

      const response = await fetch(`${API_BASE}/auth/passkey/credentials`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load credentials");
      }

      const credentials: PasskeyCredential[] = await response.json();
      setState((prev) => ({
        ...prev,
        credentials,
        isLoadingCredentials: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load credentials";
      setState((prev) => ({
        ...prev,
        isLoadingCredentials: false,
        error: message,
      }));
      toast.error(message);
    }
  }, []);

  // Load credentials on mount
  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // Start registration flow
  const startPasskeyRegistration = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isRegistering: true, error: undefined }));

      // Step 1: Get registration options
      const optionsResponse = await fetch(`${API_BASE}/auth/passkey/register/options`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!optionsResponse.ok) {
        throw new Error("Failed to get registration options");
      }

      const { challengeId, options } = await optionsResponse.json();

      // Step 2: Start registration with browser
      const attResponse = await startRegistration(options);

      // Step 3: Verify registration with server
      const verifyResponse = await fetch(`${API_BASE}/auth/passkey/register/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          response: attResponse,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Failed to verify registration");
      }

      toast.success("Passkey registered successfully!");
      await loadCredentials();
      setState((prev) => ({ ...prev, isRegistering: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Passkey registration failed";
      setState((prev) => ({
        ...prev,
        isRegistering: false,
        error: message,
      }));
      toast.error(message);
    }
  }, [loadCredentials]);

  // Delete a credential
  const deleteCredential = useCallback(
    async (credentialId: string) => {
      try {
        setState((prev) => ({
          ...prev,
          isDeleting: { ...prev.isDeleting, [credentialId]: true },
          error: undefined,
        }));

        const response = await fetch(
          `${API_BASE}/auth/passkey/credentials/${credentialId}`,
          {
            method: "DELETE",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to delete credential");
        }

        toast.success("Passkey deleted successfully!");
        await loadCredentials();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete passkey";
        setState((prev) => ({
          ...prev,
          isDeleting: { ...prev.isDeleting, [credentialId]: false },
          error: message,
        }));
        toast.error(message);
      }
    },
    [loadCredentials],
  );

  return {
    ...state,
    loadCredentials,
    startPasskeyRegistration,
    deleteCredential,
  };
}
