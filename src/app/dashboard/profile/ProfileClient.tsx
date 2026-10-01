"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  FileText, 
  Camera, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  Trash2, 
  LogOut, 
  ShieldCheck, 
  AlertCircle 
} from "lucide-react";
import styles from "./page.module.css";

interface UserProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
  companyName?: string | null;
  gstNumber?: string | null;
  isB2BApproved?: boolean;
}

export default function ProfileClient({ initialUser }: { initialUser: UserProfile }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialUser.name || "");
  const [phone, setPhone] = useState(initialUser.phone || "");
  const [companyName, setCompanyName] = useState(initialUser.companyName || "");
  const [gstNumber, setGstNumber] = useState(initialUser.gstNumber || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialUser.image || null);
  const [avatarError, setAvatarError] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const userInitial = (name?.[0] || initialUser.email?.[0] || "U").toUpperCase();

  // Trigger hidden file picker
  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  // Upload file via /api/upload then update user.image via /api/user/profile
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Please select an image smaller than 8MB." });
      return;
    }

    setIsUploadingAvatar(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "Failed to upload photo");
      }

      const newImageUrl = uploadData.url;

      // Update in user profile
      const patchRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: newImageUrl }),
      });

      if (!patchRes.ok) {
        throw new Error("Failed to link photo to your account");
      }

      setAvatarUrl(newImageUrl);
      setAvatarError(false);
      setFeedback({ type: "success", message: "Profile photo updated successfully!" });
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      setFeedback({ type: "error", message: err.message || "Failed to upload photo. Please try again." });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Remove photo
  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    setIsUploadingAvatar(true);
    setFeedback(null);

    try {
      const patchRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: null }),
      });

      if (!patchRes.ok) throw new Error("Failed to remove photo");

      setAvatarUrl(null);
      setAvatarError(false);
      setFeedback({ type: "success", message: "Profile photo removed." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to remove photo" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save all profile form fields
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          companyName,
          gstNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setFeedback({ type: "success", message: "Profile changes saved successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "An error occurred while saving." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.profileContainer}>
      
      {/* Back button */}
      <div className={styles.backNav}>
        <Link href="/dashboard" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Account Hub</span>
        </Link>
      </div>

      {/* Header */}
      <header className={styles.pageHeader}>
        <div className={styles.badgeLabel}>ACCOUNT SETTINGS</div>
        <h1 className={styles.heading}>Edit Profile & Business Info</h1>
        <p className={styles.subheading}>
          Update your personal contact details, photo, and B2B wholesale credentials.
        </p>
      </header>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`${styles.alert} ${feedback.type === "success" ? styles.alertSuccess : styles.alertError}`}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className={styles.profileForm}>
        
        {/* CARD 1: AVATAR / PROFILE PHOTO */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Profile Photo</h2>
            <p className={styles.cardDesc}>Upload a photo to personalize your tailoring account.</p>
          </div>

          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatarLarge}>
                <div className={styles.avatarLargeInitial}>{userInitial}</div>
                {avatarUrl && !avatarError && (
                  <img
                    key={avatarUrl}
                    src={avatarUrl}
                    alt={name || "Profile"}
                    className={styles.avatarLargeImg}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                )}
                {isUploadingAvatar && (
                  <div className={styles.avatarOverlay}>
                    <Loader2 size={24} className={styles.spinner} />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handlePickAvatar}
                disabled={isUploadingAvatar}
                className={styles.cameraBadge}
                title="Change Photo"
                aria-label="Upload photo"
              >
                <Camera size={16} />
              </button>
            </div>

            <div className={styles.avatarActions}>
              <button
                type="button"
                onClick={handlePickAvatar}
                disabled={isUploadingAvatar}
                className={styles.btnSecondary}
              >
                {isUploadingAvatar ? "Uploading..." : "Upload New Photo"}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className={styles.btnDangerText}
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
              <span className={styles.avatarNote}>
                Supports JPG, PNG, or WebP up to 8MB.
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              style={{ display: "none" }}
            />
          </div>
        </section>

        {/* CARD 2: PERSONAL DETAILS */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Personal Information</h2>
            <p className={styles.cardDesc}>Used for tailoring consultations, dispatch alerts, and invoices.</p>
          </div>

          <div className={styles.fieldsGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="fullName">Full Name</label>
              <div className={styles.inputWrap}>
                <User size={18} className={styles.fieldIcon} />
                <input
                  id="fullName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className={styles.textInput}
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="emailAddress">Email Address</label>
              <div className={`${styles.inputWrap} ${styles.inputDisabled}`}>
                <Mail size={18} className={styles.fieldIcon} />
                <input
                  id="emailAddress"
                  type="email"
                  value={initialUser.email || ""}
                  disabled
                  className={styles.textInput}
                />
                <span className={styles.verifiedTag}>Primary</span>
              </div>
              <span className={styles.fieldHelp}>Email is linked to your login provider.</span>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="phoneNumber">Phone Number</label>
              <div className={styles.inputWrap}>
                <Phone size={18} className={styles.fieldIcon} />
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={styles.textInput}
                />
              </div>
              <span className={styles.fieldHelp}>Used for courier delivery and WhatsApp status updates.</span>
            </div>
          </div>
        </section>

        {/* CARD 3: B2B WHOLESALE & COMPANY CREDENTIALS */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.b2bHeaderRow}>
              <div>
                <h2 className={styles.cardTitle}>Business & Wholesale Credentials</h2>
                <p className={styles.cardDesc}>Add your registered entity name and GSTIN to receive tax-compliant B2B invoices.</p>
              </div>
              {initialUser.isB2BApproved ? (
                <div className={styles.b2bStatusApproved}>
                  <ShieldCheck size={14} /> Approved B2B
                </div>
              ) : (
                <div className={styles.b2bStatusNotice}>
                  Wholesale Enabled
                </div>
              )}
            </div>
          </div>

          <div className={styles.fieldsGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="companyName">Company / Brand / Organisation</label>
              <div className={styles.inputWrap}>
                <Building2 size={18} className={styles.fieldIcon} />
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Apparel Private Limited"
                  className={styles.textInput}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="gstNumber">GST Identification Number (GSTIN)</label>
              <div className={styles.inputWrap}>
                <FileText size={18} className={styles.fieldIcon} />
                <input
                  id="gstNumber"
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  maxLength={15}
                  className={styles.textInput}
                />
              </div>
              <span className={styles.fieldHelp}>15-character Indian GST format. Input tax credit is available on all corporate orders.</span>
            </div>
          </div>
        </section>

        {/* SUBMIT BUTTON BAR */}
        <div className={styles.submitBar}>
          <button
            type="submit"
            disabled={isSaving}
            className={styles.saveBtn}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>

      </form>

      {/* CARD 4: LOG OUT & SESSION */}
      <section className={`${styles.card} ${styles.dangerCard}`}>
        <div className={styles.dangerRow}>
          <div>
            <h3 className={styles.dangerTitle}>Sign Out of Session</h3>
            <p className={styles.dangerDesc}>Log out from this device securely.</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className={styles.signOutBtn}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

    </div>
  );
}
