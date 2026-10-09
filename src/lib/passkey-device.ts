export function getPasskeyDeviceName() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform || "Unknown device";
    const androidModel = userAgent.match(
        /Android[^;)]*;\s*(?:[a-z]{2}-[A-Z]{2};\s*)?([^;)]+?)(?:\s+Build\/[^;)]+)?[;)]/i,
    )?.[1];
    const appleDevice = /iPhone/i.test(userAgent)
        ? "iPhone"
        : /iPad/i.test(userAgent)
          ? "iPad"
          : /Mac/i.test(platform)
            ? "Mac"
            : null;

    if (androidModel) return `${androidModel.trim()} (Android)`;
    if (appleDevice) return appleDevice;
    if (/Windows/i.test(userAgent)) return "Windows device";
    if (/Linux/i.test(userAgent)) return "Linux device";
    return platform;
}
