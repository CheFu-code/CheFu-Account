"use client";

import { useRef } from "react";
import { Camera, Loader2, AlertCircle, UploadCloud } from "lucide-react";
import { useProfilePictureUpload } from "./useProfilePictureUpload";

interface ProfilePictureUploadProps {
    currentImageUrl?: string;
    userName?: string;
    onUploadSuccess?: (imageUrl: string) => void;
}

/**
 * Component for uploading and displaying a profile picture
 */
export function ProfilePictureUpload({
    currentImageUrl,
    userName = "User",
    onUploadSuccess,
}: ProfilePictureUploadProps) {
    const { uploadProfilePicture, isUploading, error, previewUrl, clearError } =
        useProfilePictureUpload();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.currentTarget.files?.[0];
        if (!file) return;

        const uploadedUrl = await uploadProfilePicture(file);
        if (uploadedUrl) {
            onUploadSuccess?.(uploadedUrl);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const displayImageUrl = previewUrl || currentImageUrl;
    const initial = (userName.trim()[0] || "U").toUpperCase();

    return (
        <div className="rounded-3xl border border-white/10 bg-[#11110f] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                {/* Profile Picture Display */}
                <div className="relative group size-20 shrink-0 sm:size-24">
                    <div className="size-full overflow-hidden rounded-2xl border-2 border-white/12 bg-[#24221e] shadow-md transition group-hover:border-[#e5ad5b]/60">
                        {displayImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={displayImageUrl}
                                alt={userName}
                                className="size-full object-cover"
                            />
                        ) : (
                            <div className="grid size-full place-items-center bg-[#e5ad5b] text-2xl font-bold text-[#26190a] sm:text-3xl">
                                {initial}
                            </div>
                        )}
                    </div>

                    {/* Camera Icon Badge */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-xl bg-[#e5ad5b] text-[#26190a] shadow-lg transition hover:bg-[#ffd18a] disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Upload profile picture"
                        title="Upload profile picture"
                    >
                        {isUploading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Camera className="size-4" />
                        )}
                    </button>
                </div>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                />

                {/* Upload Info & Action Button */}
                <div className="flex-1 space-y-2">
                    <div>
                        <h4 className="text-sm font-semibold text-[#f4f0e8]">
                            Profile picture
                        </h4>
                        <p className="text-xs text-[#8f887d]">
                            PNG, JPG, GIF, or WEBP up to 5MB.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/4 px-3.5 py-1.5 text-xs font-semibold text-[#d7d0c5] transition hover:border-[#e5ad5b]/40 hover:bg-white/8 hover:text-[#f4f0e8] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin text-[#e5ad5b]" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="size-3.5 text-[#e5ad5b]" />
                                    Change photo
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
                    <div className="flex-1">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={clearError}
                            className="mt-1 text-[11px] text-red-300 underline hover:text-white"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
