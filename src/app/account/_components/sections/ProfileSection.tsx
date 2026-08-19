import { useState } from "react";
import { User } from "lucide-react";
import { ProfilePictureUpload } from "./ProfilePictureUpload";

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * A reusable section card component for account settings
 */
function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

interface ProfileSectionProps {
  user?: {
    displayName?: string;
    email?: string;
    photoURL?: string;
  };
  onProfilePictureUpdate?: (imageUrl: string) => void;
}

/**
 * Profile section for account settings
 */
export function ProfileSection({
  user,
  onProfilePictureUpdate,
}: ProfileSectionProps) {
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
  });

  const handleUploadSuccess = (imageUrl: string) => {
    onProfilePictureUpdate?.(imageUrl);
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <SectionCard
        title="Profile Picture"
        description="Upload a photo to personalize your account"
      >
        <ProfilePictureUpload
          currentImageUrl={user?.photoURL}
          userName={user?.displayName || user?.email || "User"}
          onUploadSuccess={handleUploadSuccess}
        />
      </SectionCard>

      {/* Basic Info Section */}
      <SectionCard
        title="Basic Information"
        description="Manage your basic profile information"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <User className="w-4 h-4 inline mr-2" />
              Display Name
            </label>
            <input
              type="text"
              value={profileData.displayName}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your display name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Contact support to change your email address
            </p>
          </div>

          <button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Save Changes
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
