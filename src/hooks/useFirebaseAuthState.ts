"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, onIdTokenChanged, type User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";

export function useFirebaseAuthState() {
    const [user, setUser] = useState<User | null>(() => auth.currentUser);
    const [isReady, setIsReady] = useState(() => Boolean(auth.currentUser));

    useEffect(() => {
        let mounted = true;

        const syncUser = (nextUser: User | null) => {
            if (!mounted) return;
            setUser(nextUser);
            setIsReady(true);
        };

        const unsubscribeAuth = onAuthStateChanged(auth, syncUser);
        const unsubscribeToken = onIdTokenChanged(auth, syncUser);

        return () => {
            mounted = false;
            unsubscribeAuth();
            unsubscribeToken();
        };
    }, []);

    const refresh = useCallback(async () => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setUser(null);
            setIsReady(true);
            return null;
        }

        await currentUser.reload();
        await currentUser.getIdToken(true);
        setUser(auth.currentUser);
        setIsReady(true);

        return auth.currentUser;
    }, []);

    return { isReady, refresh, user };
}
