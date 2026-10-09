import { useCallback, useState } from "react";
import { toast } from "sonner";
import { startAuthentication } from "@simplewebauthn/browser";
import { apiUrl, type ChefuAppId, type SessionTrustResult } from "../../lib/chefu-account";

export type PasskeySignInState = {
  isAuthenticating: boolean;
  error?: string;
};

export function usePasskeySignIn() {
  const [state, setState] = useState<PasskeySignInState>({
    isAuthenticating: false,
  });

  const signInWithPasskey = useCallback(
    async (
      appId: ChefuAppId,
      trustDevice = false,
    ): Promise<SessionTrustResult | null> => {
      try {
        setState({ isAuthenticating: true, error: undefined });

        // Step 1: Get authentication options
        const optionsResponse = await fetch(
          apiUrl("/auth/passkey/session/options"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-chefu-app": appId,
            },
          },
        );

        if (!optionsResponse.ok) {
          throw new Error("Failed to get authentication options");
        }

        const { challengeId, options } = await optionsResponse.json();

        // Step 2: Start authentication with browser
        const assertionResponse = await startAuthentication(options);

        // Step 3: Verify authentication with server
        const verifyResponse = await fetch(
          apiUrl("/auth/passkey/session/verify"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-chefu-app": appId,
            },
            credentials: "include",
            body: JSON.stringify({
              challengeId,
              response: assertionResponse,
              trustDevice,
            }),
          },
        );

        if (!verifyResponse.ok) {
          throw new Error("Failed to verify authentication");
        }

        setState({ isAuthenticating: false });
        return (await verifyResponse.json().catch(() => ({}))) as SessionTrustResult;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Passkey sign-in failed";
        setState({
          isAuthenticating: false,
          error: message,
        });
        toast.error(message);
        return null;
      }
    },
    [],
  );

  return {
    ...state,
    signInWithPasskey,
  };
}
