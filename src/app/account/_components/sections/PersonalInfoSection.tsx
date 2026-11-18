"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "../AccountPrimitives";
import type { AccountSettingsFormProps } from "../account-form-types";
import { ProfilePictureUpload } from "./ProfilePictureUpload";
import { PersonalDetailRow } from "./PersonalDetailRow";
import { personalFields, personalValues } from "./personal-info-fields";
import { usePersonalInfoEditor } from "./usePersonalInfoEditor";
import styles from "./personal-info.module.css";

export function PersonalInfoSection({
    account,
    isSaving,
    onProfilePictureSuccess,
    onSavePersonalInfo,
}: AccountSettingsFormProps) {
    const editor = usePersonalInfoEditor(account, onSavePersonalInfo);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const values = personalValues(account);
    const busy = isSaving || editor.saving || uploadingPhoto;

    return (
        <section className="account-personal-section">
            <SectionHeader
                title="Personal information"
                description="Manage your profile and contact details."
            />
            <div className={styles.photo}>
                <h2>Profile photo</h2>
                <p className={styles.muted}>
                    Your photo saves automatically when the upload finishes.
                </p>
                <ProfilePictureUpload
                    currentImageUrl={account.profile.profilePicture}
                    userName={values.fullname || account.user.email}
                    onUploadSuccess={onProfilePictureSuccess}
                    disabled={isSaving || editor.active !== null}
                    onUploadingChange={setUploadingPhoto}
                />
            </div>
            <dl className={styles.details}>
                {personalFields.map((field) => (
                    <PersonalDetailRow
                        key={field.id}
                        field={field}
                        values={values}
                        editor={editor}
                        disabled={busy}
                    />
                ))}
            </dl>
            {account.profile.whatsappAvailable && (
                <p className={styles.muted}>
                    <MessageCircle className="mr-1 inline size-3.5" aria-hidden="true" />
                    WhatsApp available
                </p>
            )}
        </section>
    );
}
