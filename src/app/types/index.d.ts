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
        password: string;
        setPassword: (password: string) => void;
    })
    | (AccountAuthBaseProps & {
        forgotPasswordHref?: never;
        mode: "forgot-password";
        password?: never;
        setPassword?: never;
    });
