import {
  signInWithCustomToken,
  type UserCredential,
} from "firebase/auth";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { startAuthentication } from "@simplewebauthn/browser";
import { auth } from "../../../lib/firebase";

export type PasskeySignInState = {
  isAuthenticating: boolean;
  error?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export function usePasskeySignIn() {
  const [state, setState] = useState<PasskeySignInState>({
    isAuthenticating: false,
  });

  const signInWithPasskey = useCallback(
    async (): Promise<UserCredential | null> => {
      try {
        setState({ isAuthenticating: true, error: undefined });

        // Step 1: Get authentication options
        const optionsResponse = await fetch(
          `${API_BASE}/auth/passkey/authenticate/options`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
          `${API_BASE}/auth/passkey/authenticate/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              challengeId,
              response: assertionResponse,
            }),
          },
        );

        if (!verifyResponse.ok) {
          throw new Error("Failed to verify authentication");
        }

        const { customToken } = await verifyResponse.json();

        // Step 4: Sign in with Firebase using custom token
        const credential = await signInWithCustomToken(auth, customToken);
        
        setState({ isAuthenticating: false });
        return credential;
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
