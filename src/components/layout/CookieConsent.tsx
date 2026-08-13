"use client";

import { useState, useEffect } from "react";
import styles from "./CookieConsent.module.css";

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const COOKIE_KEY = "tt_cookie_consent";

function getSavedPreferences(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = getSavedPreferences();
      if (!saved) setVisible(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const save = (preferences: CookiePreferences) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(preferences));
    setVisible(false);
  };

  const acceptAll = () => save({ necessary: true, analytics: true, marketing: true });
  const rejectAll = () => save({ necessary: true, analytics: false, marketing: false });
  const saveCustom = () => save(prefs);

  if (!visible) return null;

  return (
    <div className={styles.banner} role="dialog" aria-modal="true" aria-label="Cookie Consent">
      <div className={styles.inner}>

        {/* Text block */}
        <div className={styles.textBlock}>
          <p className={styles.body}>
            In addition to the cookies that are strictly necessary for the operation of this website,{" "}
            <strong>Tailoring Turba</strong> uses cookies and tracking tools to remember your
            preferences, measure site performance, and understand your interests. Our partners may
            use trackers to deliver personalised content based on your browsing habits and profile.
          </p>

          {showSettings && (
            <div className={styles.settingsPanel}>
              {[
                { key: "necessary" as const, label: "Strictly Necessary", desc: "Required for the site to work. Cannot be disabled.", locked: true },
                { key: "analytics" as const, label: "Analytics & Performance", desc: "Helps us understand how visitors use our site.", locked: false },
                { key: "marketing" as const, label: "Marketing & Personalisation", desc: "Used to deliver personalised ads and content.", locked: false },
              ].map((item, idx) => (
                <div key={item.key}>
                  {idx > 0 && <div className={styles.divider} />}
                  <div className={styles.settingsRow}>
                    <div>
                      <div className={styles.settingsLabel}>{item.label}</div>
                      <div className={styles.settingsDesc}>{item.desc}</div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={item.locked ? true : prefs[item.key]}
                      disabled={item.locked}
                      className={`${styles.toggle} ${item.locked || prefs[item.key] ? styles.toggleOn : ""} ${item.locked ? styles.toggleLocked : ""}`}
                      onClick={() => !item.locked && setPrefs(p => ({ ...p, [item.key]: !p[item.key] }))}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className={styles.policyLine}>
            You can click on &ldquo;Accept all cookies&rdquo; to consent to the use of cookies or click on
            &ldquo;Cookie Settings&rdquo; to configure your choices. You may change your preferences, and in
            particular withdraw your consent, on our website at any moment. For more information
            please consult our{" "}
            <a href="/privacy-policy" className={styles.policyLink}>Cookie Policy</a>.
          </p>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnSettings} onClick={() => setShowSettings(s => !s)}>
            Cookie settings
          </button>
          {showSettings ? (
            <>
              <button className={styles.btnReject} onClick={rejectAll}>Reject All</button>
              <button className={styles.btnAccept} onClick={saveCustom}>Save My Choices</button>
            </>
          ) : (
            <button className={styles.btnAccept} onClick={acceptAll}>Accept All Cookies</button>
          )}
        </div>
      </div>
    </div>
  );
}
