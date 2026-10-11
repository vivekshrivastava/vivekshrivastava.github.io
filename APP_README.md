# Vivekanand Law Firm — Android App

| Folder | What it is |
|---|---|
| `app/` | The app itself (HTML/CSS/JS). Works offline. Also live on the website at `/app/` and installable on any phone. |
| `android/` | Native Android (Kotlin) shell that bundles `app/` into an APK / Play Store bundle. |
| `.github/workflows/android.yml` | Builds the APK automatically on GitHub on every change. |

## Features
- **Home** — Call, WhatsApp, Urgent Bail help, Legal Tools.
- **Practice Areas** — Criminal, Civil, Family, NDPS, SC/ST, POCSO, NI Act S.138, Writs.
- **Book a Consultation** — form sent to the firm on WhatsApp or e-mail (in person / phone / video).
- **Know Your Rights** — arrest, FIR, bail and legal aid (BNSS with old CrPC references).
- **Legal Tools** — Cheque-bounce date calculator, limitation quick reference, eCourts / SC / Patna HC case-status links.
- **Legal Updates** — articles, refreshed from the website without an app update.
- **Store** — books, Bare Acts, merchandise; cart, checkout, UPI payment or COD, order confirmation on WhatsApp, order history.
- **Bar Council of India disclaimer** on first launch, Privacy Policy, FAQs, Contact.

## Updating content (no coding)
- Firm details, phone, UPI ID, address: `app/js/config.js`
- Store items and prices: `app/data/products.json` (sample catalogue — replace)
- Legal updates: `app/data/updates.json`
- Practice areas, rights, FAQs, limitation table: `app/js/content.js`

Changes to the two JSON files reach installed apps automatically (once on the website's published branch).

## Getting the APK
GitHub → **Actions** → *Android app* → latest run → download **vivekanand-law-debug-apk**. Install on a phone to test.

## Publishing on Google Play
1. Create a Play Console developer account.
2. Create an upload key: `keytool -genkeypair -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
3. Add repo secrets (Settings → Secrets → Actions): `ANDROID_KEYSTORE_BASE64` (`base64 -w0 release.jks`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
4. Re-run the workflow and upload the `.aab` from **vivekanand-law-release**.
5. Privacy policy URL: `https://www.vivekshrivastava.in/app/privacy.html`.
6. Bump `versionCode` in `android/app/build.gradle.kts` for every new release.
