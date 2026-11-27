"use client";

import {
    useEffect,
    useRef,
    type ClipboardEvent,
    type KeyboardEvent,
} from "react";

export function SixDigitCodeInput({
    code,
    label,
    onCodeChange,
    onEnter,
}: {
    code: string;
    label: string;
    onCodeChange: (value: string) => void;
    onEnter?: () => void;
}) {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const digits = Array.from({ length: 6 }, (_, index) => code[index] ?? "");

    useEffect(() => {
        if (!code) inputRefs.current[0]?.focus();
    }, [code]);

    function updateDigit(index: number, value: string) {
        const nextDigit = value.replace(/\D/g, "").slice(-1);
        const nextCode = digits
            .map((digit, digitIndex) =>
                digitIndex === index ? nextDigit : digit,
            )
            .join("");

        onCodeChange(nextCode);
        if (nextDigit && index < 5) inputRefs.current[index + 1]?.focus();
    }

    function handleKeyDown(
        index: number,
        event: KeyboardEvent<HTMLInputElement>,
    ) {
        if (event.key === "Enter" && onEnter) {
            event.preventDefault();
            onEnter();
        } else if (event.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (event.key === "ArrowRight" && index < 5) {
            event.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
        event.preventDefault();
        const pastedCode = event.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);
        onCodeChange(pastedCode);
        inputRefs.current[Math.min(pastedCode.length, 5)]?.focus();
    }

    return (
        <fieldset className="space-y-2">
            <legend className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--fg-2)]">
                {label}
            </legend>
            <div className="grid grid-cols-6 gap-2">
                {digits.map((digit, index) => (
                    <input
                        key={index}
                        ref={(element) => {
                            inputRefs.current[index] = element;
                        }}
                        aria-label={`Authenticator code digit ${index + 1}`}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(event) =>
                            updateDigit(index, event.target.value)
                        }
                        onKeyDown={(event) => handleKeyDown(index, event)}
                        onPaste={handlePaste}
                        className="aspect-square w-full min-w-0 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-center text-xl font-semibold text-[var(--fg)] outline-none transition hover:border-[var(--accent)] focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent)]/15"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        autoFocus={index === 0}
                    />
                ))}
            </div>
        </fieldset>
    );
}
