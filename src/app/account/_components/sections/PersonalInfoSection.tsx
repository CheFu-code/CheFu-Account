"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AccountButton, SectionHeader } from "../AccountPrimitives";
import type { AccountSettingsFormProps } from "../account-form-types";
import { PhoneVerificationDialog } from "../../../register/PhoneVerificationDialog";
import { ProfilePictureUpload } from "./ProfilePictureUpload";
import { PersonalDetailRow } from "./PersonalDetailRow";
import { personalFields, personalValues } from "./personal-info-fields";
import { usePersonalInfoEditor } from "./usePersonalInfoEditor";
import styles from "./personal-info.module.css";

export function PersonalInfoSection({
    account, appId, isSaving, onProfilePictureSuccess, onPhoneVerified, onSavePersonalInfo,
}: AccountSettingsFormProps) {
    const editor = usePersonalInfoEditor(account, onSavePersonalInfo);
    const [changingPhone, setChangingPhone] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const values = personalValues(account);
    const busy = isSaving || editor.saving || uploadingPhoto || changingPhone;
    const verified = Boolean(account.profile.phone && account.profile.phoneVerifiedAt && !account.profile.phoneVerificationRequired);

    return <section className="account-personal-section">
        <SectionHeader title="Personal information" description="Manage your profile and contact details." />
        <div className={styles.photo}>
            <h2>Profile photo</h2>
            <p className={styles.muted}>Your photo saves automatically when the upload finishes.</p>
            <ProfilePictureUpload currentImageUrl={account.profile.profilePicture}
                userName={values.fullname || account.user.email} onUploadSuccess={onProfilePictureSuccess}
                disabled={isSaving || editor.active !== null || changingPhone}
                onUploadingChange={setUploadingPhoto} />
        </div>
        <dl className={styles.details}>
            {personalFields.map(field => <PersonalDetailRow key={field.id} field={field}
                values={values} editor={editor} disabled={busy} />)}
            <div className={styles.row}>
                <dt>Phone number</dt>
                <dd className={styles.value}>
                    <div className={styles.text}>
                        <div>{account.profile.phone || "Not set"}</div>
                        {verified ? <span className={styles.verified}><ShieldCheck className="size-3.5" aria-hidden="true" /> Verified</span>
                            : <span className={styles.muted}>Confirm your number by SMS.</span>}
                    </div>
                    <AccountButton disabled={busy || editor.active !== null} onClick={() => setChangingPhone(true)}>
                        {account.profile.phone ? verified ? "Change" : "Verify" : "Add number"}
                    </AccountButton>
                </dd>
            </div>
        </dl>
        {changingPhone && <PhoneVerificationDialog appId={appId} purpose="profile" initialPhone={account.profile.phone || ""}
            onSkip={() => setChangingPhone(false)} onComplete={receipt => {
                onPhoneVerified(receipt);
                setChangingPhone(false);
            }} />}
    </section>;
}
