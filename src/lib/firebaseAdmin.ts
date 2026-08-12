import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let adminAuth: Auth | null = null;

if (getApps().length === 0) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("[FIREBASE_ADMIN] Initialized successfully with credentials.");
    } else {
      console.warn("[FIREBASE_ADMIN] Missing server credentials. Server-side token validation is not available.");
    }
  } catch (error) {
    console.error("[FIREBASE_ADMIN_INIT_ERROR]", error);
  }
}

if (getApps().length > 0) {
  adminAuth = getAuth();
}

export { adminAuth };
