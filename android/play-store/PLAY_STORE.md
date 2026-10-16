# Google Play — Listing & Console Answers

Copy these into **Play Console → your app**. Images are in this folder.

## Main store listing

**App name** (max 30): `Vivekanand Law Firm`

**Short description** (max 80):
`Legal information, consultations, legal tools, law books and firm merchandise.`

**Full description:**

```
Vivekanand Law Firm — the official app of the firm's chambers.

PRACTICE AREAS
Information on the firm's work in Criminal Defence, Civil Litigation, Family & Matrimonial matters, NDPS Act, SC/ST (Prevention of Atrocities) Act, POCSO Act, Cheque Bounce cases under Section 138 of the Negotiable Instruments Act, and Writ petitions.

COURTS
Supreme Court of India, High Court of Judicature at Patna, Delhi High Court, and the Sessions and District Courts in Bihar.

CONSULTATION REQUESTS
Send a consultation request to the firm's office on WhatsApp or e-mail, choosing an in-person meeting, phone call or video call.

KNOW YOUR RIGHTS
Plain-language notes on rights on arrest, registration of FIR (including Zero FIR and e-FIR), bail and free legal aid under the Bharatiya Nagarik Suraksha Sanhita, 2023, with the corresponding provisions of the Code of Criminal Procedure.

LEGAL TOOLS
• Cheque bounce (Section 138) date calculator
• Limitation periods quick reference
• Links to eCourts, Supreme Court and Patna High Court case status

LEGAL UPDATES
Short notes on recent developments in law.

BOOKS & MERCHANDISE
Buy law books, Bare Acts, court diaries and firm merchandise. Pay by UPI or cash on delivery.

DISCLAIMER
In accordance with the rules of the Bar Council of India, this app is meant for information only and does not amount to advertisement or solicitation. Information in the app is not legal advice and does not create an advocate–client relationship.
```

**Graphics**
- App icon (512×512): `../../app/icons/icon-512.png`
- Feature graphic (1024×500): `feature-graphic-1024x500.png`
- Phone screenshots (1080×1920): `screenshots/` — upload 4 to 8 of them. Take new screenshots of the Store after you replace the sample catalogue.

## Store settings
- **Category:** Business
- **Contact e-mail:** adv.vivekshrivastava@gmail.com
- **Website:** https://www.vivekshrivastava.in
- **Privacy policy:** https://www.vivekshrivastava.in/app/privacy.html

## App content (Policy → App content)
| Form | Answer |
|---|---|
| Privacy policy | URL above |
| Ads | No, the app does not contain ads |
| App access | All functionality is available without special access (no login) |
| Content rating | Complete the questionnaire. Category: Reference, News, or Educational. Answer "No" to violence, sexual content, gambling and similar questions. Expect a rating of "Everyone" / "3+" |
| Target audience | 18 and over |
| News app | No |
| Government app | No |
| Financial features | None (payments are made in the user's own UPI app) |
| Health | No |

### Data safety
The app has no server and no analytics. Cart, address and order history are stored only on the phone. Consultation and order details reach the firm only when the user sends them through WhatsApp, e-mail or a UPI app that they open themselves. On that basis:

- **Does your app collect or share any of the required user data types?** → **No**
- **Is all user data encrypted in transit?** → Yes. The app only loads its content (articles, store list) over HTTPS.
- **Do you provide a way for users to request that their data be deleted?** → Yes, by e-mail (see privacy policy).

If you later add a server, a login or analytics, update this form.

## Release
1. In GitHub: **Actions → Android app → Run workflow**.
2. Download the **vivekanand-law-play-store-release** artifact and unzip it.
3. In Play Console: **Test and release → Production** (or **Closed testing**, see below) **→ Create new release** → upload the `.aab` file.
4. When asked, keep **Play App Signing** switched on (recommended). Google then holds the final signing key, and your upload key can be reset through Play support if it is ever lost.

### Personal developer accounts: 14-day testing rule
A **personal** Play developer account created after November 2023 must run a **closed test with at least 12 testers for 14 continuous days** before it can publish to Production. Invite staff, juniors and clerks by their Gmail addresses under **Closed testing**.

An **organisation** account (which needs a D-U-N-S number for the firm) does not have this requirement.
