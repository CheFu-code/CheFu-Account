import { useRef } from "react";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import { useProfilePictureUpload } from "./useProfilePictureUpload";
import Image from "next/image";

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

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Profile Picture Display */}
            <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-4 border-gray-200">
                    {displayImageUrl ? (
                        <Image
                            src={displayImageUrl}
                            alt={userName}
                            className="w-full h-full object-cover"
                            width={128}
                            height={128}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-4xl font-semibold">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Camera Icon Overlay */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-2.5 rounded-full shadow-lg transition-all"
                >
                    {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Camera className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
            />

            {/* Upload Text */}
            <div className="text-center">
                <p className="text-sm text-gray-600">
                    {isUploading ? "Uploading..." : "Click the camera icon to update"}
                </p>
                <p className="text-xs text-gray-500">JPG, PNG or GIF (Max 5MB)</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm text-red-800">{error}</p>
                        <button
                            onClick={clearError}
                            className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
