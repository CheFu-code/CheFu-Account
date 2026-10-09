import type { FormEvent } from "react";

export type AccountAuthBaseProps = {
    alternateHref: string;
    appName: string;
    email: string;
    isSubmitting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setEmail: (email: string) => void;
    onPasskeyClick?: () => void;
    isPasskeySubmitting?: boolean;
    trustDevice?: boolean;
    setTrustDevice?: (trust: boolean) => void;
};

export type AccountAuthScreenProps =
    | (AccountAuthBaseProps & {
        forgotPasswordHref: string;
        mode: "login";
        password: string;
        setPassword: (password: string) => void;
    })
    | (AccountAuthBaseProps & {
        forgotPasswordHref?: never;
        mode: "register";
        firstName: string;
        lastName: string;
        password: string;
        setFirstName: (firstName: string) => void;
        setLastName: (lastName: string) => void;
        setPassword: (password: string) => void;
    })
    | (AccountAuthBaseProps & {
        forgotPasswordHref?: never;
        mode: "forgot-password";
        password?: never;
        setPassword?: never;
    });
