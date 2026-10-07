"use client";

import { useState } from "react";
import { SaveButton, TextField } from "../AccountControls";
import { AccountButton, FieldRow, SectionHeader } from "../AccountPrimitives";
import type { AccountSettingsFormProps } from "../account-form-types";
import { ProfilePictureUpload } from "./ProfilePictureUpload";

export function PersonalInfoSection({
    account,
    bio,
    firstName,
    isSaving,
    lastName,
    location,
    name,
    phone,
    onProfilePictureSuccess,
    setName,
    setFirstName,
    setBio,
    setLastName,
    setLocation,
    setPhone,
    setWebsite,
    website,
}: AccountSettingsFormProps) {
    const [editing, setEditing] = useState(false);
    const currentFirstName = firstName || account.profile.firstName || "Not set";
    const currentLastName = lastName || account.profile.lastName || "Not set";
    const displayedPhone = phone || "Not set";
    const displayedBio = bio || "Not set";
    const displayedWebsite = website || "Not set";
    const displayedLocation = location || "Not set";

    return (
        <div className="account-personal-info">


            <section className="account-personal-section">
                <SectionHeader
                    title="Personal Information"
                    description="Your personal details. Some information may be visible to others where indicated."
                />

                <div className="account-editable-toolbar">
                    <h2 className="account-subsection-title">Editable fields</h2>
                    {!editing ? (
                        <AccountButton onClick={() => setEditing(true)}>Edit</AccountButton>
                    ) : (
                        <div className="flex gap-2">
                            <SaveButton isSaving={isSaving} label="Save changes" />
                            <AccountButton onClick={() => setEditing(false)}>Cancel</AccountButton>
                        </div>
                    )}
                </div>

                {editing ? (
                    <div className="account-edit-form">
                        <ProfilePictureUpload
                            currentImageUrl={account.profile.profilePicture}
                            userName={name || account.user.displayName || account.user.email}
                            onUploadSuccess={onProfilePictureSuccess}
                        />
                        <div className="account-edit-grid">
                            <TextField label="First name" value={firstName} onChange={setFirstName} />
                            <TextField label="Last name" value={lastName} onChange={setLastName} />
                        </div>
                        <TextField
                            label="Phone number"
                            value={phone}
                            onChange={setPhone}
                            type="tel"
                            placeholder="+27 00 000 0000"
                        />
                        <TextField
                            label="Professional bio"
                            value={bio}
                            onChange={setBio}
                            placeholder="Tell us a little about yourself"
                        />
                        <TextField
                            label="Website"
                            value={website}
                            onChange={setWebsite}
                            placeholder="https://example.com"
                        />
                        <TextField
                            label="Location"
                            value={location}
                            onChange={setLocation}
                            placeholder="City, country"
                        />
                        <TextField
                            label="Display name"
                            value={name}
                            onChange={setName}
                            placeholder="How your name appears across Chefu"
                        />
                    </div>
                ) : (
                    <dl className="account-personal-fields">
                        <FieldRow label="First name" value={currentFirstName} />
                        <FieldRow label="Last name" value={currentLastName} />
                        <FieldRow label="Display name" value={name || "Not set"} />
                        <FieldRow label="Phone number" value={displayedPhone} />
                        <FieldRow label="Professional bio" value={displayedBio} />
                        <FieldRow label="Website" value={displayedWebsite} />
                        <FieldRow label="Location" value={displayedLocation} />
                    </dl>
                )}
            </section>
        </div>
    );
}
