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
1. Add the four `ANDROID_KEY*` secrets in **Settings → Secrets and variables → Actions** (values are in the private key file you were given; never commit the key).
2. **Actions → Android app → Run workflow**, then download **vivekanand-law-play-store-release** (`.aab`).
3. Follow `android/play-store/PLAY_STORE.md` for the listing text, images, data-safety answers and release steps.

The version code increases automatically with each build. Keep `vivekanand-upload-key.jks` and its password safe (password manager + offline copy).
