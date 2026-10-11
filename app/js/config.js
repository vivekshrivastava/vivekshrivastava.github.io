/*
 * Vivekanand Law Firm — app configuration.
 * Edit the values below to update the firm's details everywhere in the app.
 * Items marked TODO must be filled in before publishing on the Play Store.
 */
window.FIRM = {
  name: "Vivekanand Law Firm",
  shortName: "Vivekanand Law",
  tagline: "Advocates & Legal Consultants",
  leadAdvocate: "Adv. Vivek Shrivastava",
  enrolment: "", // TODO: Bar Council enrolment no., e.g. "BR/1234/1990"
  courts: [
    "Supreme Court of India",
    "High Court of Judicature at Patna",
    "Delhi High Court",
    "Sessions & District Courts, Bihar"
  ],
  phones: ["+919873246043", "+919958173388"],
  whatsapp: "919873246043", // country code + number, digits only
  email: "adv.vivekshrivastava@gmail.com",
  address: "", // TODO: full chamber / office address
  mapQuery: "", // TODO: e.g. "Vivekanand Law Firm, Patna" (used for the map link)
  hours: "Mon – Sat, 10:00 AM – 7:00 PM",
  website: "https://www.vivekshrivastava.in",

  // Store payments (UPI). Orders are confirmed over WhatsApp — no server needed.
  upiId: "", // TODO: e.g. "vivekanandlaw@sbi"
  upiPayeeName: "Vivekanand Law Firm",
  codAvailable: true,
  shippingFlat: 60, // INR, waived above freeShippingAbove
  freeShippingAbove: 999,

  // Content (articles, products) is refreshed from the website when online,
  // so you can update the store without releasing a new app version.
  remoteDataBase: "https://www.vivekshrivastava.in/app/data/"
};
