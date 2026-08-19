import { useState } from "react";
import { toast } from "sonner";
import { apiUrl } from "../../../../lib/chefu-account";

export interface ProfilePictureUploadState {
  isUploading: boolean;
  error: string | null;
  previewUrl: string | null;
}

/**
 * Hook for uploading and managing user's profile picture
 */
export function useProfilePictureUpload() {
  const [state, setState] = useState<ProfilePictureUploadState>({
    isUploading: false,
    error: null,
    previewUrl: null,
  });

  /**
   * Converts a File to base64 Data URL
   */
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Uploads a profile picture to the backend
   */
  async function uploadProfilePicture(file: File): Promise<string | null> {
    try {
      // Validate file
      if (!file) {
        throw new Error("No file selected");
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image");
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("Image must be less than 5MB");
      }

      setState((prev) => ({ ...prev, isUploading: true, error: null }));

      // Convert file to base64
      const imageBase64 = await fileToBase64(file);

      // Create preview
      const preview = imageBase64;
      setState((prev) => ({ ...prev, previewUrl: preview }));

      // Upload to backend
      const response = await fetch(apiUrl("/auth/profile-picture"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Upload failed (${response.status})`
        );
      }

      const data = await response.json();
      
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: null,
      }));

      toast.success("Profile picture updated successfully!");
      return data.url;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
        previewUrl: null,
      }));
      toast.error(errorMessage);
      return null;
    }
  }

  /**
   * Clears the error state
   */
  function clearError() {
    setState((prev) => ({ ...prev, error: null }));
  }

  return {
    uploadProfilePicture,
    isUploading: state.isUploading,
    error: state.error,
    previewUrl: state.previewUrl,
    clearError,
  };
}
