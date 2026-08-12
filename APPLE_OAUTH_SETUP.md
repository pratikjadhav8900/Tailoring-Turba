# Guide: Setting Up Sign in with Apple

This guide outlines the step-by-step process to generate the credentials required for Apple Sign In in the `Tailoring Turba` project.

---

## Prerequisites
* An active [Apple Developer Program](https://developer.apple.com/programs/) account.
* Access to the [Apple Developer Account Portal](https://developer.apple.com/account/).

---

## Step-by-Step Setup

### 1. Find Your Team ID
1. Navigate to your [Apple Developer Account Membership details](https://developer.apple.com/account/#/membership).
2. Locate the **Team ID** (a 10-character alphanumeric string, e.g., `A1B2C3D4E5`).
3. Set this value as `APPLE_TEAM_ID` in your `.env` file.

---

### 2. Create an App ID
1. Go to [Certificates, Identifiers & Profiles > Identifiers](https://developer.apple.com/account/resources/identifiers/list).
2. Click the blue **`+`** (plus) icon to register a new identifier.
3. Select **App IDs** and click **Continue**.
4. Select **App** as the type and click **Continue**.
5. Fill out the fields:
   * **Description**: e.g., `Tailoring Turba App`
   * **Bundle ID**: Choose **Explicit** and enter a reverse-domain string (e.g., `com.tailoringturba.app`).
6. Scroll down the **Capabilities** list and check the box next to **Sign In with Apple**.
7. Click **Continue**, review your configurations, and click **Register**.

---

### 3. Register a Services ID (Client ID)
Apple Sign In for web applications uses a **Services ID** instead of an App ID.
1. Go back to [Certificates, Identifiers & Profiles > Identifiers](https://developer.apple.com/account/resources/identifiers/list).
2. Click the blue **`+`** (plus) icon.
3. Select **Services IDs** and click **Continue**.
4. Fill out the fields:
   * **Description**: e.g., `Tailoring Turba Web Client`
   * **Identifier (Client ID)**: e.g., `com.tailoringturba.web` (this will be your `APPLE_CLIENT_ID`).
5. Click **Continue** and then **Register**.
6. Find your newly created Services ID in the list and click on it.
7. Check the box to enable **Sign In with Apple**, then click the **Configure** button next to it.
8. Set the configuration details:
   * **Primary App ID**: Select the App ID created in **Step 2**.
   * **Web Domain**: The domain where your website is hosted (e.g., `tailoringturba.com` or your Vercel URL).
   * **Return URLs**: The callback URL of your NextAuth installation. For development and production, append `/api/auth/callback/apple`. 
     * E.g., `http://localhost:3000/api/auth/callback/apple` (development)
     * E.g., `https://tailoringturba.com/api/auth/callback/apple` (production)
9. Click **Next**, click **Done**, and then click **Save** in the top right corner.
10. Set `APPLE_CLIENT_ID` in your `.env` file to your Services ID identifier (e.g., `com.tailoringturba.web`).

---

### 4. Generate a Sign in with Apple Private Key
1. Navigate to [Certificates, Identifiers & Profiles > Keys](https://developer.apple.com/account/resources/authkeys/list).
2. Click the blue **`+`** (plus) icon to register a new key.
3. Fill out the fields:
   * **Key Name**: e.g., `Tailoring Turba Auth Key`
   * Check **Sign In with Apple**.
4. Click the **Configure** button next to Sign In with Apple.
5. Select the **Primary App ID** you created in **Step 2** and click **Save**.
6. Click **Continue**, review, and click **Register**.
7. Note down the **Key ID** (a 10-character string). Set this as `APPLE_KEY_ID` in `.env`.
8. Click **Download** to save your private key (`.p8`) file.
   > [!IMPORTANT]
   > Keep this file secure. Apple allows downloading this key only once.

---

### 5. Format and Save Your Private Key
1. Open the downloaded `.p8` file in any text editor. It looks like:
   ```text
   -----BEGIN PRIVATE KEY-----
   MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
   -----END PRIVATE KEY-----
   ```
2. Convert all newlines into literal `\n` characters so that it fits on a single line in your `.env` file:
   ```env
   APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...\n-----END PRIVATE KEY-----"
   ```
