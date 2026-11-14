"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ProfilePictureUpload } from "./ProfilePictureUpload";

export function ProfilePhotoDialog({ currentImageUrl, userName, onSaved, onClose }: {
    currentImageUrl?: string;
    userName: string;
    onSaved: (url: string) => void;
    onClose: () => void;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const locked = useRef(false);
    const [uploading, setUploading] = useState(false);
    const titleId = useId();
    const descriptionId = useId();
    useEffect(() => {
        const element = dialog.current;
        element?.showModal();
        return () => element?.close();
    }, []);
    function close() { if (!locked.current) onClose(); }

    return <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-[var(--fg)] shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
        onCancel={event => { event.preventDefault(); close(); }}
        onClick={event => { if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
        } }}>
        <div className="mb-2 flex items-center justify-between gap-4">
            <h2 id={titleId} className="text-xl font-semibold">Change profile photo</h2>
            <button type="button" aria-label="Close photo uploader" onClick={close} disabled={uploading}
                className="account-auth-password-toggle grid size-10 place-items-center rounded-lg disabled:opacity-50">
                <X className="size-5" aria-hidden="true" />
            </button>
        </div>
        <p id={descriptionId} className="mb-5 text-sm leading-6 text-[var(--fg-muted)]">Your photo saves automatically when the upload finishes.</p>
        <ProfilePictureUpload currentImageUrl={currentImageUrl} userName={userName}
            onUploadingChange={busy => { locked.current = busy; setUploading(busy); }}
            onUploadSuccess={url => { onSaved(url); onClose(); }} />
    </dialog>;
}
