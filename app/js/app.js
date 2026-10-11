(function () {
  "use strict";

  const F = window.FIRM;
  const C = window.CONTENT;
  const view = document.getElementById("view");
  const IN_ANDROID_SHELL = location.hostname === "appassets.androidplatform.net";

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  const telLink = (p) => "tel:" + p;
  const waLink = (text) => "https://wa.me/" + F.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  const mailLink = (subject, body) => "mailto:" + F.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body || "");
  const mapLink = () => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(F.mapQuery || F.address || F.name);
  const fmtDate = (d) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const parseDate = (s) => { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const addMonths = (d, n) => {
    const x = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
    x.setDate(Math.min(d.getDate(), last));
    return x;
  };

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function modal(html, onMount) {
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = '<div class="sheet">' + html + "</div>";
    document.body.appendChild(m);
    const close = () => m.remove();
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-close]")) close(); });
    if (onMount) onMount(m, close);
    return close;
  }

  /* ---------- data (bundled, refreshed from the website when online) ---------- */
  const cache = {};
  async function loadJSON(name) {
    if (cache[name]) return cache[name];
    const sources = IN_ANDROID_SHELL && F.remoteDataBase ? [F.remoteDataBase + name, "data/" + name] : ["data/" + name];
    for (const url of sources) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(url, { signal: ctrl.signal, cache: "no-cache" });
        clearTimeout(timer);
        if (res.ok) {
          cache[name] = await res.json();
          store.set("vlf_data_" + name, cache[name]);
          return cache[name];
        }
      } catch (e) { /* try next source */ }
    }
    return (cache[name] = store.get("vlf_data_" + name, {}));
  }

  /* ---------- cart ---------- */
  const cart = {
    items() { return store.get("vlf_cart", {}); },
    save(c) { store.set("vlf_cart", c); updateCartBadge(); },
    add(id, n) { const c = this.items(); c[id] = (c[id] || 0) + (n || 1); if (c[id] <= 0) delete c[id]; this.save(c); },
    clear() { this.save({}); },
    count() { return Object.values(this.items()).reduce((a, b) => a + b, 0); }
  };
  function updateCartBadge() {
    const n = cart.count();
    const b = document.getElementById("cart-count");
    b.textContent = n;
    b.hidden = n === 0;
  }

  async function cartLines() {
    const data = await loadJSON("products.json");
    const byId = Object.fromEntries((data.products || []).map((p) => [p.id, p]));
    const lines = Object.entries(cart.items()).filter(([id]) => byId[id]).map(([id, qty]) => ({ p: byId[id], qty }));
    const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
    const shipping = subtotal === 0 || subtotal >= F.freeShippingAbove ? 0 : F.shippingFlat;
    return { lines, subtotal, shipping, total: subtotal + shipping };
  }

  /* ---------- views ---------- */
  const productImg = (p) => /\.(png|jpe?g|webp|svg)$/i.test(p.image || "")
    ? '<img src="' + esc(p.image) + '" alt="" loading="lazy">'
    : esc(p.image || "📦");

  const views = {
    async home() {
      const upd = (await loadJSON("updates.json")).updates || [];
      return `
        <section class="hero">
          <span class="tag">${esc(F.tagline)}</span>
          <h1>${esc(F.name.replace(" Law Firm", ""))} <span class="gold">Law Firm</span></h1>
          <p>Criminal defence, civil and family litigation, NDPS, SC/ST, POCSO and cheque-bounce matters — from the trial court to the Supreme Court.</p>
          <div class="courts">${F.courts.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
        </section>
        <div class="quick">
          <a href="${telLink(F.phones[0])}"><span>📞</span>Call</a>
          <a href="${waLink("Namaskar, I would like legal assistance.")}"><span>💬</span>WhatsApp</a>
          <a href="#/consult?urgent=1"><span>🚨</span>Urgent Bail</a>
          <a href="#/tools"><span>🧮</span>Legal Tools</a>
        </div>
        <div class="section-title"><h2>Practice Areas</h2><a href="#/practice">View all ›</a></div>
        <div class="grid2">${C.practiceAreas.slice(0, 4).map(tile).join("")}</div>
        <div class="section-title"><h2>Know Your Rights</h2><a href="#/rights">Read ›</a></div>
        <a class="card link" href="#/rights"><span class="tag">Arrest · FIR · Bail · Legal aid</span>
          <p class="small" style="margin:4px 0 0">What the police must do when they arrest you, and how to get an FIR registered.</p></a>
        <div class="section-title"><h2>Legal Updates</h2><a href="#/updates">All ›</a></div>
        ${upd.slice(0, 2).map(updateCard).join("")}
        <div class="section-title"><h2>Books & Merchandise</h2><a href="#/store">Shop ›</a></div>
        <a class="card link" href="#/store"><strong>📚 Law books, Bare Acts, court diaries & more</strong>
          <p class="small muted" style="margin:4px 0 0">Order in the app — pay by UPI${F.codAvailable ? " or cash on delivery" : ""}.</p></a>
        ${footer()}`;
    },

    practice() {
      return `<h1>Practice Areas</h1><p class="muted">Select an area to know how we can assist.</p>
        <div class="grid2">${C.practiceAreas.map(tile).join("")}</div>${footer()}`;
    },

    practiceDetail(id) {
      const a = C.practiceAreas.find((x) => x.id === id);
      if (!a) return views.notFound();
      return `<div style="font-size:2.2rem">${a.icon}</div><h1>${esc(a.title)}</h1>
        <div class="card"><ul class="points">${a.body.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>
        <a class="btn gold" href="#/consult?area=${encodeURIComponent(a.id)}">📅 Book a consultation</a>
        <a class="btn wa" href="${waLink("Namaskar, I need advice regarding " + a.title + ".")}">💬 Ask on WhatsApp</a>
        ${footer()}`;
    },

    consult(q) {
      const urgent = q.get("urgent") === "1";
      const area = q.get("area") || (urgent ? "criminal" : "");
      return `<h1>${urgent ? "Urgent Bail / Arrest Help" : "Book a Consultation"}</h1>
        ${urgent ? `<div class="notice">If a person has just been arrested, please <a href="${telLink(F.phones[0])}"><strong>call us now</strong></a>. The arrested person must be produced before a Magistrate within 24 hours.</div>` : ""}
        <form id="consult-form" class="card" novalidate>
          <label for="c-name">Full name *</label><input id="c-name" name="name" required autocomplete="name">
          <div class="row2">
            <div><label for="c-phone">Mobile *</label><input id="c-phone" name="phone" type="tel" inputmode="tel" required autocomplete="tel" pattern="[0-9+ ]{10,15}"></div>
            <div><label for="c-city">City / District</label><input id="c-city" name="city" autocomplete="address-level2"></div>
          </div>
          <label for="c-area">Nature of matter *</label>
          <select id="c-area" name="area" required>
            <option value="">— Select —</option>
            ${C.practiceAreas.map((a) => `<option value="${a.id}" ${a.id === area ? "selected" : ""}>${esc(a.title)}</option>`).join("")}
            <option value="other">Other</option>
          </select>
          <label for="c-court">Court / Stage (if any)</label><input id="c-court" name="court" placeholder="e.g. FIR registered, case pending at Patna HC">
          <div class="row2">
            <div><label for="c-date">Preferred date</label><input id="c-date" name="date" type="date" min="${new Date().toISOString().slice(0, 10)}"></div>
            <div><label for="c-mode">Mode</label><select id="c-mode" name="mode"><option>In person</option><option>Phone call</option><option>Video call</option></select></div>
          </div>
          <label for="c-desc">Brief facts *</label><textarea id="c-desc" name="desc" required placeholder="Briefly describe your matter. Do not share sensitive documents here."></textarea>
          <label class="check"><input type="checkbox" name="consent" required> I understand that sending this request does not by itself create an advocate–client relationship.</label>
          <button class="btn wa" type="submit" data-via="wa">💬 Send on WhatsApp</button>
          <button class="btn ghost" type="submit" data-via="mail">✉️ Send by e-mail</button>
        </form>${footer()}`;
    },

    async store(q) {
      const data = await loadJSON("products.json");
      const cats = ["All"].concat(data.categories || []);
      const cur = q.get("cat") || "All";
      const term = (q.get("q") || "").toLowerCase();
      const list = (data.products || []).filter((p) => (cur === "All" || p.category === cur) &&
        (!term || (p.title + " " + p.author).toLowerCase().includes(term)));
      return `<h1>Store</h1>
        <input class="search" id="store-search" type="search" placeholder="Search books & merchandise" value="${esc(q.get("q") || "")}">
        <div class="filters">${cats.map((c) => `<button data-cat="${esc(c)}" class="${c === cur ? "on" : ""}">${esc(c)}</button>`).join("")}</div>
        <div class="products">${list.map((p) => `
          <div class="card product">
            <a href="#/product/${encodeURIComponent(p.id)}" style="text-decoration:none;color:inherit;display:contents">
              <div class="img">${productImg(p)}</div>
              <h3>${esc(p.title)}</h3>
            </a>
            <div class="price">${inr(p.price)}${p.mrp > p.price ? `<s>${inr(p.mrp)}</s>` : ""}</div>
            <button class="btn sm gold" style="margin-top:8px" data-add="${esc(p.id)}" ${p.inStock ? "" : "disabled"}>${p.inStock ? "Add to cart" : "Out of stock"}</button>
          </div>`).join("") || '<p class="muted">No items found.</p>'}
        </div>
        <p class="small muted" style="margin-top:12px">Free delivery on orders above ${inr(F.freeShippingAbove)}.</p>${footer()}`;
    },

    async product(id) {
      const data = await loadJSON("products.json");
      const p = (data.products || []).find((x) => x.id === id);
      if (!p) return views.notFound();
      return `<div class="card"><div class="product" style="padding:0"><div class="img" style="height:180px;font-size:5rem">${productImg(p)}</div></div>
        <span class="tag">${esc(p.category)}</span><h1>${esc(p.title)}</h1>
        <p class="muted small">${esc(p.author)}</p>
        <p class="price" style="font-size:1.3rem">${inr(p.price)}${p.mrp > p.price ? `<s>${inr(p.mrp)}</s>` : ""}</p>
        <p>${esc(p.description)}</p>
        <button class="btn gold" data-add="${esc(p.id)}" ${p.inStock ? "" : "disabled"}>🛒 Add to cart</button>
        <a class="btn ghost" href="#/cart">View cart</a></div>${footer()}`;
    },

    async cart() {
      const { lines, subtotal, shipping, total } = await cartLines();
      if (!lines.length) return `<h1>Your Cart</h1><div class="card"><p>Your cart is empty.</p><a class="btn gold" href="#/store">Browse the store</a></div>`;
      return `<h1>Your Cart</h1>
        <div class="card">${lines.map((l) => `
          <div class="list-row">
            <div style="flex:1"><strong class="small">${esc(l.p.title)}</strong><div class="small muted">${inr(l.p.price)} each</div></div>
            <div class="qty"><button data-qty="${esc(l.p.id)}" data-n="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-qty="${esc(l.p.id)}" data-n="1" aria-label="Increase">+</button></div>
          </div>`).join("")}
        </div>
        <div class="card totals">
          <div><span>Subtotal</span><span>${inr(subtotal)}</span></div>
          <div><span>Delivery</span><span>${shipping ? inr(shipping) : "Free"}</span></div>
          <div class="grand"><span>Total</span><span>${inr(total)}</span></div>
        </div>
        <a class="btn gold" href="#/checkout">Proceed to checkout</a>`;
    },

    async checkout() {
      const { lines, total } = await cartLines();
      if (!lines.length) { location.hash = "#/cart"; return ""; }
      const saved = store.get("vlf_address", {});
      const upi = !!F.upiId;
      return `<h1>Checkout</h1>
        <form id="checkout-form" class="card" novalidate>
          <label for="o-name">Full name *</label><input id="o-name" name="name" required autocomplete="name" value="${esc(saved.name)}">
          <label for="o-phone">Mobile *</label><input id="o-phone" name="phone" type="tel" required autocomplete="tel" pattern="[0-9+ ]{10,15}" value="${esc(saved.phone)}">
          <label for="o-addr">Delivery address *</label><textarea id="o-addr" name="address" required autocomplete="street-address">${esc(saved.address)}</textarea>
          <div class="row2">
            <div><label for="o-city">City *</label><input id="o-city" name="city" required value="${esc(saved.city)}"></div>
            <div><label for="o-pin">PIN code *</label><input id="o-pin" name="pin" required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" value="${esc(saved.pin)}"></div>
          </div>
          <label>Payment method</label>
          ${upi ? `<label class="check"><input type="radio" name="pay" value="UPI" checked> Pay by UPI (GPay, PhonePe, Paytm, BHIM)</label>` : ""}
          ${F.codAvailable ? `<label class="check"><input type="radio" name="pay" value="COD" ${upi ? "" : "checked"}> Cash on delivery</label>` : ""}
          ${!upi && !F.codAvailable ? `<p class="small muted">Payment details will be shared on WhatsApp on confirmation.</p><input type="hidden" name="pay" value="On confirmation">` : ""}
          <button class="btn gold" type="submit">Place order · ${inr(total)}</button>
        </form>`;
    },

    async orders() {
      const orders = store.get("vlf_orders", []);
      return `<h1>My Orders</h1>${orders.length ? orders.slice().reverse().map((o) => `
        <div class="card"><div style="display:flex;justify-content:space-between"><strong>${esc(o.id)}</strong><span class="small muted">${esc(o.date)}</span></div>
        <div class="small">${o.lines.map((l) => esc(l.qty + " × " + l.title)).join("<br>")}</div>
        <div style="display:flex;justify-content:space-between;margin-top:8px"><span class="small muted">${esc(o.pay)}</span><strong>${inr(o.total)}</strong></div>
        <a class="btn sm wa" style="margin-top:10px" href="${waLink("Order status enquiry: " + o.id)}">Ask about this order</a></div>`).join("")
        : '<div class="card"><p>No orders yet.</p><a class="btn gold" href="#/store">Visit the store</a></div>'}`;
    },

    rights() {
      return `<h1>Know Your Rights</h1>
        <p class="muted small">General information under Indian law. For advice on your specific facts, please consult us.</p>
        ${C.rights.map((r, i) => `<details ${i === 0 ? "open" : ""}><summary>${esc(r.title)}</summary>
          <ul class="points">${r.points.map((p) => `<li class="small">${esc(p)}</li>`).join("")}</ul></details>`).join("")}
        <a class="btn gold" href="#/consult?urgent=1">🚨 Need urgent help?</a>${footer()}`;
    },

    tools() {
      return `<h1>Legal Tools</h1>
        <div class="card">
          <h2>Cheque Bounce (S. 138 NI Act) — Date Calculator</h2>
          <p class="small muted">Work out the statutory deadlines from the dates in your matter.</p>
          <form id="ni-form">
            <label for="ni-cheque">Date of cheque</label><input id="ni-cheque" type="date">
            <label for="ni-memo">Date you received the bank's return memo *</label><input id="ni-memo" type="date" required>
            <label for="ni-served">Date notice was served on the drawer (if served)</label><input id="ni-served" type="date">
            <button class="btn" type="submit">Calculate</button>
          </form>
          <div id="ni-result" class="result" style="margin-top:12px"></div>
        </div>
        <div class="card">
          <h2>Limitation Periods — Quick Reference</h2>
          <table>${C.limitation.map((r) => `<tr><td>${esc(r[0])}</td><td><strong>${esc(r[1])}</strong></td><td>${esc(r[2])}</td></tr>`).join("")}</table>
          <p class="small muted" style="margin-top:8px">Periods are computed under the Limitation Act, 1963 (incl. S. 12 exclusions) and may be subject to condonation of delay. Verify for your facts.</p>
        </div>
        <div class="card">
          <h2>Case Status & Official Portals</h2>
          ${C.caseStatusLinks.map((l) => `<a class="list-row" href="${esc(l[1])}"><span class="small">${esc(l[0])}</span><span class="chev">↗</span></a>`).join("")}
        </div>${footer()}`;
    },

    async updates() {
      const upd = (await loadJSON("updates.json")).updates || [];
      return `<h1>Legal Updates</h1>${upd.map(updateCard).join("") || '<p class="muted">No updates yet.</p>'}${footer()}`;
    },

    async update(id) {
      const u = ((await loadJSON("updates.json")).updates || []).find((x) => x.id === id);
      if (!u) return views.notFound();
      return `<span class="tag">${esc(u.tag)}</span><h1>${esc(u.title)}</h1>
        <p class="small muted">${fmtDate(parseDate(u.date))}</p>
        <div class="card">${u.body.map((b) => `<p>${esc(b)}</p>`).join("")}</div>
        <button class="btn ghost" data-share="${esc(u.title)}">🔗 Share</button>${footer()}`;
    },

    about() {
      return `<h1>About the Firm</h1>
        <div class="card"><p><strong>${esc(F.name)}</strong> is a litigation practice led by <strong>${esc(F.leadAdvocate)}</strong>, with over three decades of experience in criminal, civil and family law.</p>
          <p>The firm appears before the following fora:</p>
          <ul class="points">${F.courts.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
          ${F.enrolment ? `<p class="small muted">Enrolment No.: ${esc(F.enrolment)}</p>` : ""}
        </div>
        <div class="card"><h2>Our approach</h2>
          <p>Every brief is prepared with attention to the record. We identify the decisive point of the case early, and present it to the Court clearly and with candour.</p>
          <p>Client communications are privileged and kept strictly confidential.</p>
        </div>${footer()}`;
    },

    contact() {
      return `<h1>Contact Us</h1>
        <div class="card">
          ${F.phones.map((p) => `<a class="list-row" href="${telLink(p)}"><span>📞 ${esc(p)}</span><span class="chev">›</span></a>`).join("")}
          <a class="list-row" href="${waLink("Namaskar, I would like legal assistance.")}"><span>💬 WhatsApp</span><span class="chev">›</span></a>
          <a class="list-row" href="${mailLink("Enquiry from app")}"><span>✉️ ${esc(F.email)}</span><span class="chev">›</span></a>
          ${F.address ? `<a class="list-row" href="${mapLink()}"><span>📍 ${esc(F.address)}</span><span class="chev">↗</span></a>` : ""}
          <div class="list-row"><span>🕘 ${esc(F.hours)}</span></div>
        </div>
        <a class="btn gold" href="#/consult">📅 Book a consultation</a>${footer()}`;
    },

    faq() {
      return `<h1>Frequently Asked Questions</h1>${C.faqs.map((f) => `<details><summary>${esc(f[0])}</summary><p class="small">${esc(f[1])}</p></details>`).join("")}${footer()}`;
    },

    more() {
      const rows = [
        ["🏛️", "About the Firm", "#/about"], ["🛡️", "Know Your Rights", "#/rights"], ["🧮", "Legal Tools & Limitation", "#/tools"],
        ["📰", "Legal Updates", "#/updates"], ["📦", "My Orders", "#/orders"], ["❓", "FAQs", "#/faq"],
        ["📞", "Contact Us", "#/contact"], ["⚠️", "Disclaimer", "#/disclaimer"], ["🔒", "Privacy Policy", "privacy.html"]
      ];
      return `<h1>More</h1><div class="card">${rows.map((r) => `<a class="list-row" href="${r[2]}"><span>${r[0]} ${r[1]}</span><span class="chev">›</span></a>`).join("")}
        <button class="list-row" data-share="${esc(F.name)}" style="width:100%;background:none;border:0;font:inherit;color:inherit;text-align:left"><span>🔗 Share this app</span><span class="chev">›</span></button></div>${footer()}`;
    },

    disclaimer() { return `<h1>Disclaimer</h1><div class="card">${disclaimerText()}</div>${footer()}`; },

    notFound() { return `<h1>Page not found</h1><a class="btn" href="#/">Go home</a>`; }
  };

  function tile(a) {
    return `<a class="card tile" href="#/practice/${a.id}"><span class="ico">${a.icon}</span><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p></a>`;
  }
  function updateCard(u) {
    return `<a class="card link" href="#/updates/${encodeURIComponent(u.id)}"><span class="tag">${esc(u.tag)}</span>
      <h3 style="margin:4px 0">${esc(u.title)}</h3><p class="small muted" style="margin:0">${esc(u.summary)}</p></a>`;
  }
  function footer() {
    return `<footer class="legal">© ${new Date().getFullYear()} ${esc(F.name)} · <a href="#/disclaimer">Disclaimer</a> · <a href="privacy.html">Privacy</a></footer>`;
  }
  function disclaimerText() {
    return `<p class="small">The Bar Council of India does not permit advocates to solicit work or advertise. By proceeding, you acknowledge that:</p>
      <ul class="points small">
        <li>there has been no advertisement, personal communication, solicitation, invitation or inducement of any sort whatsoever from us or any of our members to solicit any work through this app;</li>
        <li>you wish to gain more information about ${esc(F.name)} for your own information and use;</li>
        <li>the information in this app is general in nature, is not legal advice, and does not create an advocate–client relationship;</li>
        <li>the firm is not liable for any consequence of action taken by you relying on material provided in this app.</li>
      </ul>`;
  }

  /* ---------- form & action handlers ---------- */
  function bind(route) {
    const consultForm = document.getElementById("consult-form");
    if (consultForm) {
      consultForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!consultForm.reportValidity()) return;
        const d = Object.fromEntries(new FormData(consultForm));
        const area = (C.practiceAreas.find((a) => a.id === d.area) || { title: "Other" }).title;
        const msg = [
          "*Consultation Request — " + F.name + "*",
          "Name: " + d.name, "Mobile: " + d.phone, d.city ? "City: " + d.city : "",
          "Matter: " + area, d.court ? "Court / Stage: " + d.court : "",
          d.date ? "Preferred date: " + fmtDate(parseDate(d.date)) : "", "Mode: " + d.mode, "", "Facts: " + d.desc
        ].filter((x) => x !== "").join("\n");
        const via = e.submitter && e.submitter.dataset.via;
        location.href = via === "mail" ? mailLink("Consultation request — " + d.name, msg.replace(/\*/g, "")) : waLink(msg);
        toast("Opening " + (via === "mail" ? "e-mail" : "WhatsApp") + "…");
      });
    }

    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!checkoutForm.reportValidity()) return;
        const d = Object.fromEntries(new FormData(checkoutForm));
        store.set("vlf_address", { name: d.name, phone: d.phone, address: d.address, city: d.city, pin: d.pin });
        const { lines, subtotal, shipping, total } = await cartLines();
        const now = new Date();
        const id = "VLF" + now.toISOString().slice(2, 10).replace(/-/g, "") + Math.floor(1000 + Math.random() * 9000);
        const order = { id, date: fmtDate(now), pay: d.pay, total, lines: lines.map((l) => ({ id: l.p.id, title: l.p.title, qty: l.qty, price: l.p.price })) };
        const orders = store.get("vlf_orders", []); orders.push(order); store.set("vlf_orders", orders);
        cart.clear();
        const msg = [
          "*New Order " + id + "*",
          ...order.lines.map((l) => l.qty + " × " + l.title + " — " + inr(l.price * l.qty)),
          "Subtotal: " + inr(subtotal), "Delivery: " + (shipping ? inr(shipping) : "Free"), "*Total: " + inr(total) + "*",
          "Payment: " + d.pay, "", "Deliver to:", d.name + ", " + d.phone, d.address, d.city + " — " + d.pin
        ].join("\n");
        const upi = d.pay === "UPI" && F.upiId
          ? "upi://pay?pa=" + encodeURIComponent(F.upiId) + "&pn=" + encodeURIComponent(F.upiPayeeName) + "&am=" + total.toFixed(2) + "&cu=INR&tn=" + encodeURIComponent("Order " + id)
          : "";
        modal(`<h2>Order placed ✅</h2><p>Order ID <strong>${esc(id)}</strong> · ${inr(total)}</p>
          ${upi ? `<p class="small">Step 1: Pay using any UPI app.</p><a class="btn gold" href="${esc(upi)}">Pay ${inr(total)} by UPI</a><p class="small" style="margin-top:12px">Step 2: Send the order (and payment screenshot) to us on WhatsApp to confirm dispatch.</p>`
                : `<p class="small">Please send the order to us on WhatsApp to confirm dispatch.</p>`}
          <a class="btn wa" href="${esc(waLink(msg))}">💬 Confirm order on WhatsApp</a>
          <a class="btn ghost" href="#/orders" data-close>View my orders</a>`);
      });
    }

    const niForm = document.getElementById("ni-form");
    if (niForm) {
      niForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const cheque = parseDate(document.getElementById("ni-cheque").value);
        const memo = parseDate(document.getElementById("ni-memo").value);
        const served = parseDate(document.getElementById("ni-served").value);
        const out = document.getElementById("ni-result");
        if (!memo) { out.innerHTML = '<p class="small" style="color:var(--danger)">Please enter the date of the return memo.</p>'; return; }
        const rows = [];
        if (cheque) rows.push(["Cheque valid for presentation till", fmtDate(addDays(addMonths(cheque, 3), -1))]);
        rows.push(["Last date to send demand notice (30 days)", fmtDate(addDays(memo, 30))]);
        if (served) {
          const payBy = addDays(served, 15);
          const coa = addDays(payBy, 1);
          rows.push(["Drawer may pay till (15 days)", fmtDate(payBy)]);
          rows.push(["Cause of action arises on", fmtDate(coa)]);
          rows.push(["Last date to file complaint (1 month)", fmtDate(addMonths(coa, 1))]);
        }
        out.innerHTML = rows.map((r) => `<div><span class="small">${r[0]}</span><strong class="small">${r[1]}</strong></div>`).join("") +
          `<p class="small muted" style="margin-top:10px">Indicative only — S. 138 provisos (b) & (c) and S. 142(1)(b) NI Act. A complaint filed before the 15 days expire is premature (Yogendra Pratap Singh v. Savitri Pandey, (2014) 10 SCC 713). Delay may be condoned on sufficient cause.</p>`;
      });
    }

    const search = document.getElementById("store-search");
    if (search) {
      search.addEventListener("change", () => {
        const q = new URLSearchParams(route.query); q.set("q", search.value); location.hash = "#/store?" + q;
      });
    }
  }

  document.addEventListener("click", async (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { cart.add(add.dataset.add, 1); toast("Added to cart"); return; }
    const qty = e.target.closest("[data-qty]");
    if (qty) { cart.add(qty.dataset.qty, Number(qty.dataset.n)); render._keepScroll = true; render(); return; }
    const cat = e.target.closest("[data-cat]");
    if (cat) { location.hash = "#/store?cat=" + encodeURIComponent(cat.dataset.cat); return; }
    const share = e.target.closest("[data-share]");
    if (share) {
      const url = F.website + "/app/" + location.hash;
      if (navigator.share) { navigator.share({ title: share.dataset.share, url }).catch(() => {}); }
      else if (navigator.clipboard) { await navigator.clipboard.writeText(url); toast("Link copied"); }
    }
  });

  /* ---------- router ---------- */
  function parseRoute() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [path, query] = raw.split("?");
    return { parts: path.split("/").filter(Boolean).map(decodeURIComponent), query: query || "" };
  }

  async function render() {
    const route = parseRoute();
    const [a, b] = route.parts;
    const q = new URLSearchParams(route.query);
    let html, tab = a || "home";
    switch (a) {
      case undefined: html = await views.home(); break;
      case "practice": html = b ? views.practiceDetail(b) : views.practice(); break;
      case "consult": html = views.consult(q); break;
      case "store": html = await views.store(q); break;
      case "product": html = await views.product(b); tab = "store"; break;
      case "cart": html = await views.cart(); tab = "store"; break;
      case "checkout": html = await views.checkout(); tab = "store"; break;
      case "orders": html = await views.orders(); tab = "more"; break;
      case "updates": html = b ? await views.update(b) : await views.updates(); tab = "more"; break;
      case "rights": case "tools": case "about": case "contact": case "faq": case "disclaimer":
        html = views[a](); tab = "more"; break;
      case "more": html = views.more(); break;
      default: html = views.notFound();
    }
    view.innerHTML = html;
    document.querySelectorAll(".tabbar a").forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
    if (!render._keepScroll) window.scrollTo(0, 0);
    render._keepScroll = false;
    bind(route);
  }

  window.addEventListener("hashchange", render);
  updateCartBadge();
  render();

  /* ---------- first-launch disclaimer (Bar Council of India rules) ---------- */
  if (!store.get("vlf_disclaimer_ok", false)) {
    modal(`<h2>Disclaimer</h2>${disclaimerText()}<button class="btn gold" data-close id="agree">I agree</button>`, (m) => {
      m.querySelector("#agree").addEventListener("click", () => store.set("vlf_disclaimer_ok", true));
      m.addEventListener("click", (e) => { if (e.target === m) e.stopImmediatePropagation(); }, true);
    });
  }

  /* ---------- offline support for the installable web app ---------- */
  if ("serviceWorker" in navigator && !IN_ANDROID_SHELL && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
