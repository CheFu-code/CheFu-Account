export function completeAuthRedirect(target: string, replace: (href: string) => void) {
    if (target.startsWith("/")) {
        replace(target);
        return;
    }
    window.location.assign(target);
}

export function readLoginError(error: unknown) {
    if (!(error instanceof Error)) return "Unable to login. Please try again.";
    return error.message || "Login failed. Please try again.";
}

export function readMfaError(error: unknown) {
    if (!(error instanceof Error)) return "Check the code and try again.";
    return error.message || "Check the code and try again.";
}
