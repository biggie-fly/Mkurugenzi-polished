/* =========================================================
   Mkurugenzi — shared app shell
   Cart, wishlist, header, footer, cart drawer, search, toasts.
   ========================================================= */

/* ---------- Storage (falls back to memory if blocked) ---------- */
const memoryStore = {};
const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("mk_" + key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return key in memoryStore ? memoryStore[key] : fallback;
    }
  },
  set(key, value) {
    memoryStore[key] = value;
    try { localStorage.setItem("mk_" + key, JSON.stringify(value)); } catch (e) {}
  },
};

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => "KSh " + Number(n).toLocaleString("en-KE");
const getProduct = (id) => PRODUCTS.find((p) => p.id === id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hashParam = () => decodeURIComponent(location.hash.replace(/^#/, ""));

/* ---------- Drawn product placeholders ---------- */
const SHAPES = {
  tee: '<path d="M62 46 86 34c4 10 24 10 28 0l24 12 30 30-20 20-12-10v116H64V86l-12 10-20-20z"/>',
  crop: '<path d="M62 56 86 44c4 10 24 10 28 0l24 12 30 30-20 20-12-10v66H64V96l-12 10-20-20z"/>',
  hoodie: '<path d="M74 52c4-26 48-26 52 0l30 12 22 128-20 4-14-96v118H56V100l-14 96-20-4L44 64z"/><path d="M80 170h40v26H80z" opacity=".18" fill="#000"/>',
  sweatsuit: '<path d="M76 26c4-20 44-20 48 0l26 10 18 82-16 3-12-62v62H60V59l-12 62-16-3 18-82z"/><path d="M62 126h76l6 100h-28l-16-72-16 72H56z"/>',
  jacket: '<path d="M78 40 100 48l22-8 34 18 22 134-20 4-14-96v118H56V100l-14 96-20-4L44 58z"/><path d="M99 50h2v162h-2z" opacity=".3" fill="#000"/>',
  quarterzip: '<path d="M80 40 100 46l20-6 36 18 22 134-20 4-14-96v108H56V100l-14 96-20-4L44 58z"/><path d="M99 46h2v50h-2z" opacity=".35" fill="#000"/>',
  cap: '<path d="M46 150c0-50 26-74 58-74s58 24 58 74z"/><path d="M40 150h130c14 0 14 16 0 16H40z" opacity=".85"/><circle cx="104" cy="78" r="5" opacity=".6"/>',
  tote: '<path d="M78 92c0-48 44-48 44 0" fill="none" stroke-width="7"/><path d="M48 92h104l8 120H40z"/>',
  socks: '<path d="M60 40h34v110l20 22c10 12-4 30-18 20l-36-30z"/><path d="M110 40h34v110l20 22c10 12-4 30-18 20l-36-30z" opacity=".85"/>',
};
function placeholderSVG(p) {
  const light = ["#F7F4EE", "#EDE4D0", "#D2BC98"].includes(p.swatch);
  const stroke = light ? "#2B1A12" : "none";
  return `<svg class="ph" viewBox="0 0 210 240" role="img" aria-label="${esc(p.name)}" fill="${p.swatch}" stroke="${stroke}" stroke-opacity=".35" stroke-width="1.5">${SHAPES[p.type] || SHAPES.tee}</svg>`;
}
/* Image with placeholder underneath; image hides itself if it fails. */
function productMedia(p, cls = "") {
  return `<div class="media ${cls}">${placeholderSVG(p)}<img src="${p.img}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove()"></div>`;
}

/* ---------- Cart ---------- */
const Cart = {
  items() { return Store.get("cart", []); },
  save(items) { Store.set("cart", items); updateBadges(); renderDrawer(); },
  add(id, size, qty = 1) {
    const p = getProduct(id);
    if (!p || p.price == null) return;
    const items = Cart.items();
    const line = items.find((i) => i.id === id && i.size === size);
    if (line) line.qty = Math.min(line.qty + qty, 10);
    else items.push({ id, size, qty });
    Cart.save(items);
    toast(`${p.name} (${size}) added to bag`, { label: "View bag", action: openDrawer });
  },
  setQty(id, size, qty) {
    let items = Cart.items();
    const line = items.find((i) => i.id === id && i.size === size);
    if (!line) return;
    line.qty = Math.max(1, Math.min(10, qty));
    Cart.save(items);
  },
  remove(id, size) { Cart.save(Cart.items().filter((i) => !(i.id === id && i.size === size))); },
  clear() { Cart.save([]); },
  count() { return Cart.items().reduce((n, i) => n + i.qty, 0); },
  subtotal() { return Cart.items().reduce((s, i) => s + (getProduct(i.id)?.price || 0) * i.qty, 0); },
};

/* ---------- Wishlist ---------- */
const Wishlist = {
  items() { return Store.get("wishlist", []); },
  has(id) { return Wishlist.items().includes(id); },
  toggle(id) {
    let w = Wishlist.items();
    const p = getProduct(id);
    if (w.includes(id)) { w = w.filter((x) => x !== id); toast(`Removed ${p.name} from saved items`); }
    else { w.push(id); toast(`Saved ${p.name}`, { label: "See saved", href: "wishlist.html" }); }
    Store.set("wishlist", w);
    updateBadges();
    $$(`[data-wish="${id}"]`).forEach((b) => b.setAttribute("aria-pressed", Wishlist.has(id)));
    document.dispatchEvent(new CustomEvent("wishlist:change"));
  },
};

/* ---------- Logo (original signature mark, text fallback) ---------- */
function logoHTML(extra = "") {
  return `<span class="logo-mark ${extra}"><img src="${BRAND.logo}" alt="Mkurugenzi" onerror="this.remove()"><span class="wordmark">Mkurugenzi</span></span>`;
}

/* ---------- Theme ---------- */
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  Store.set("theme", t);
  $$(".theme-btn").forEach((b) => b.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode"));
}

/* ---------- Icons ---------- */
const ICON = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>',
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>',
  sun: '<svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
  moon: '<svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-3.6A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8c-1-.4-1.9-1.3-2.3-2.3l.8-1-1-2z" stroke-width="1.2"/></svg>',
};

/* ---------- Header ---------- */
function renderHeader() {
  const page = document.body.dataset.page;
  const active = (key) => (page === key ? ' aria-current="page"' : "");
  const shopCat = page === "shop" ? hashParam() : "";
  const catActive = (c) => (shopCat === c ? ' aria-current="page"' : "");
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="announce">Pay with M-Pesa, Visa, Mastercard, Amex or PayPal. Delivery across Kenya.</div>
    <div class="bar wrap">
      <button class="icon-btn menu-btn" aria-label="Open menu" aria-expanded="false">${ICON.menu}</button>
      <a href="index.html" aria-label="Mkurugenzi home">${logoHTML()}</a>
      <nav class="main-nav" aria-label="Main">
        <a href="shop.html#gents"${catActive("gents")}>Gents</a>
        <a href="shop.html#ladies"${catActive("ladies")}>Ladies</a>
        <a href="shop.html#unisex"${catActive("unisex")}>Unisex</a>
        <a href="shop.html"${page === "shop" && !shopCat ? ' aria-current="page"' : ""}>Shop all</a>
        <a href="about.html"${active("about")}>Our story</a>
        <a href="contact.html"${active("contact")}>Contact</a>
      </nav>
      <div class="tools">
        <button class="icon-btn theme-btn" data-theme-toggle aria-label="${document.documentElement.dataset.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}">${ICON.sun}${ICON.moon}</button>
        <button class="icon-btn" data-open-search aria-label="Search">${ICON.search}</button>
        <a class="icon-btn" href="wishlist.html" aria-label="Saved items">${ICON.heart}<span class="badge" data-wish-count></span></a>
        <button class="icon-btn" data-open-cart aria-label="Bag">${ICON.bag}<span class="badge" data-cart-count></span></button>
      </div>
    </div>`;
  document.body.prepend(header);

  // Mobile menu
  const mobile = document.createElement("div");
  mobile.className = "mobile-nav";
  mobile.hidden = true;
  mobile.innerHTML = `
    <div class="mobile-nav__panel" role="dialog" aria-label="Menu">
      <button class="icon-btn" data-close aria-label="Close menu">${ICON.close}</button>
      <nav aria-label="Mobile">
        <a href="shop.html#gents">Gents</a><a href="shop.html#ladies">Ladies</a><a href="shop.html#unisex">Unisex</a>
        <a href="shop.html">Shop all</a><a href="about.html">Our story</a><a href="help.html">Help and sizing</a><a href="contact.html">Contact</a>
      </nav>
      <a class="btn btn--light" href="https://wa.me/${STORE.whatsapp}" target="_blank" rel="noopener">${ICON.whatsapp} Chat on WhatsApp</a>
    </div>`;
  document.body.append(mobile);
  const menuBtn = $(".menu-btn", header);
  const setMenu = (open) => { mobile.hidden = !open; menuBtn.setAttribute("aria-expanded", open); document.body.classList.toggle("locked", open); };
  menuBtn.addEventListener("click", () => setMenu(true));
  mobile.addEventListener("click", (e) => { if (e.target === mobile || e.target.closest("[data-close]") || e.target.closest("a")) setMenu(false); });
}

/* ---------- Footer ---------- */
function renderFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <a href="index.html" aria-label="Mkurugenzi home">${logoHTML("logo-mark--lg")}</a>
        <p>More than just a brand. Streetwear and essentials designed in Nairobi.</p>
        <form class="news" novalidate>
          <label for="news-email">Get new drops by email</label>
          <div class="news__row"><input id="news-email" type="email" placeholder="you@example.com" autocomplete="email" required><button class="btn btn--light" type="submit">Sign up</button></div>
          <p class="news__msg" role="status"></p>
        </form>
      </div>
      <div><h3>Shop</h3><ul><li><a href="shop.html#gents">Gents</a></li><li><a href="shop.html#ladies">Ladies</a></li><li><a href="shop.html#unisex">Unisex</a></li><li><a href="shop.html">Shop all</a></li></ul></div>
      <div><h3>Help</h3><ul><li><a href="help.html#delivery">Delivery</a></li><li><a href="help.html#returns">Exchanges</a></li><li><a href="help.html#sizing">Size guide</a></li><li><a href="help.html#faq">FAQ</a></li></ul></div>
      <div><h3>Talk to us</h3><ul><li><a href="https://wa.me/${STORE.whatsapp}" target="_blank" rel="noopener">WhatsApp ${STORE.phoneDisplay}</a></li><li><a href="mailto:${STORE.email}">${STORE.email}</a></li><li>${STORE.location}</li><li><a href="contact.html">Contact form</a></li></ul></div>
    </div>
    <div class="wrap footer-base">
      <p>© ${new Date().getFullYear()} Mkurugenzi. All rights reserved.</p>
      <ul class="pay-marks" aria-label="Accepted payments">${payMarks()}</ul>
    </div>`;
  document.body.append(footer);
  const form = $(".news", footer);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("input", form), msg = $(".news__msg", form);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { msg.textContent = "Enter an email address like name@example.com."; input.focus(); return; }
    const list = Store.get("newsletter", []); list.push(input.value.trim()); Store.set("newsletter", list);
    msg.textContent = "You're on the list. We'll email you when the next drop lands."; form.reset();
  });
}

function payMarks() {
  return ["M-Pesa", "Visa", "Mastercard", "Amex", "PayPal"].map((m) => `<li class="pay-mark pay-mark--${m.toLowerCase().replace(/[^a-z]/g, "")}">${m}</li>`).join("");
}

/* ---------- Cart drawer ---------- */
function buildDrawer() {
  const d = document.createElement("div");
  d.className = "drawer";
  d.hidden = true;
  d.innerHTML = `<aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div class="drawer__head"><h2 id="drawer-title">Your bag</h2><button class="icon-btn" data-close aria-label="Close bag">${ICON.close}</button></div>
      <div class="drawer__body"></div>
      <div class="drawer__foot"></div>
    </aside>`;
  document.body.append(d);
  d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) closeDrawer(); });
  bindLineControls(d);
  renderDrawer();
}
function renderDrawer() {
  const d = $(".drawer"); if (!d) return;
  const items = Cart.items();
  const body = $(".drawer__body", d), foot = $(".drawer__foot", d);
  if (!items.length) {
    body.innerHTML = `<div class="empty"><p>Your bag is empty.</p><a class="btn" href="shop.html">Browse the shop</a></div>`;
    foot.innerHTML = "";
    return;
  }
  body.innerHTML = items.map(lineHTML).join("");
  foot.innerHTML = `<div class="row-between"><span>Subtotal</span><strong>${money(Cart.subtotal())}</strong></div>
    <p class="muted small">Delivery is worked out at checkout.</p>
    <a class="btn btn--block" href="checkout.html">Checkout</a>
    <a class="btn btn--ghost btn--block" href="cart.html">View bag</a>`;
}
function lineHTML(i) {
  const p = getProduct(i.id); if (!p) return "";
  return `<div class="line" data-id="${p.id}" data-size="${esc(i.size)}">
    <a href="product.html#${p.id}" class="line__img">${productMedia(p)}</a>
    <div class="line__info">
      <a href="product.html#${p.id}" class="line__name">${esc(p.name)}</a>
      <span class="muted small">Size ${esc(i.size)}</span>
      <div class="qty" role="group" aria-label="Quantity">
        <button data-qty="-1" aria-label="Decrease quantity">−</button><span aria-live="polite">${i.qty}</span><button data-qty="1" aria-label="Increase quantity">+</button>
      </div>
    </div>
    <div class="line__end"><strong>${money(p.price * i.qty)}</strong><button class="link-btn" data-remove>Remove</button></div>
  </div>`;
}
function bindLineControls(root) {
  root.addEventListener("click", (e) => {
    const line = e.target.closest(".line"); if (!line) return;
    const { id, size } = line.dataset;
    const cur = Cart.items().find((i) => i.id === id && i.size === size); if (!cur) return;
    if (e.target.closest("[data-qty]")) Cart.setQty(id, size, cur.qty + Number(e.target.closest("[data-qty]").dataset.qty));
    if (e.target.closest("[data-remove]")) Cart.remove(id, size);
    document.dispatchEvent(new CustomEvent("cart:change"));
  });
}
let lastFocus;
function openDrawer() {
  const d = $(".drawer"); lastFocus = document.activeElement;
  d.hidden = false; document.body.classList.add("locked");
  requestAnimationFrame(() => d.classList.add("is-open"));
  $("[data-close]", d).focus();
}
function closeDrawer() {
  const d = $(".drawer"); d.classList.remove("is-open"); document.body.classList.remove("locked");
  setTimeout(() => (d.hidden = true), 250); lastFocus?.focus();
}

/* ---------- Search overlay ---------- */
function buildSearch() {
  const s = document.createElement("div");
  s.className = "search";
  s.hidden = true;
  s.innerHTML = `<div class="search__panel" role="dialog" aria-modal="true" aria-label="Search products">
    <div class="wrap">
      <div class="search__row"><label class="sr-only" for="q">Search products</label>
        <input id="q" type="search" placeholder="Search hoodies, caps, Botanical…" autocomplete="off">
        <button class="icon-btn" data-close aria-label="Close search">${ICON.close}</button></div>
      <div class="search__suggest">Try <button data-term="Sweatsuit">Sweatsuit</button><button data-term="Cap">Cap</button><button data-term="Botanical">Botanical</button><button data-term="Black Excellence">Black Excellence</button></div>
      <div class="search__results" aria-live="polite"></div>
    </div></div>`;
  document.body.append(s);
  const input = $("#q", s), results = $(".search__results", s);
  const run = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML = ""; return; }
    const hits = PRODUCTS.filter((p) => [p.name, p.collection, TYPE_INFO[p.type].label, CATEGORIES[p.cat].name].join(" ").toLowerCase().includes(q));
    results.innerHTML = hits.length
      ? `<p class="muted small">${hits.length} result${hits.length > 1 ? "s" : ""}</p><div class="search__grid">${hits.slice(0, 8).map((p) => `<a href="product.html#${p.id}" class="search__hit">${productMedia(p)}<span>${esc(p.name)}</span><span class="muted">${priceText(p)}</span></a>`).join("")}</div>`
      : `<p>No products match "${esc(input.value)}". Try a colour, like black or sand, or a category, like hoodie.</p>`;
  };
  input.addEventListener("input", run);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") location.href = "shop.html#q=" + encodeURIComponent(input.value); });
  s.addEventListener("click", (e) => {
    if (e.target === s || e.target.closest("[data-close]")) closeSearch();
    const t = e.target.closest("[data-term]"); if (t) { input.value = t.dataset.term; run(); }
  });
}
function openSearch() { const s = $(".search"); s.hidden = false; document.body.classList.add("locked"); $("#q").focus(); }
function closeSearch() { $(".search").hidden = true; document.body.classList.remove("locked"); }

/* ---------- Product card ---------- */
function priceText(p) {
  if (p.price == null) return "Price coming soon";
  return p.compareAt ? `<s>${money(p.compareAt)}</s> ${money(p.price)}` : money(p.price);
}
function productCard(p) {
  return `<article class="card">
    <a class="card__link" href="product.html#${p.id}">
      ${productMedia(p)}
      ${p.compareAt ? '<span class="tag">Sale</span>' : p.isNew ? '<span class="tag">New</span>' : ""}
    </a>
    <button class="wish" data-wish="${p.id}" aria-pressed="${Wishlist.has(p.id)}" aria-label="Save ${esc(p.name)}">${ICON.heart}</button>
    <div class="card__meta">
      <a href="product.html#${p.id}" class="card__name">${esc(p.name)}</a>
      <span class="card__price">${priceText(p)}</span>
    </div>
    ${p.price != null ? `<div class="card__sizes" aria-label="Quick add">${p.sizes.map((s) => `<button data-quick="${p.id}" data-size="${esc(s)}">${s === "One size" ? "Add to bag" : esc(s)}</button>`).join("")}</div>` : ""}
  </article>`;
}

/* ---------- Toast ---------- */
function toast(message, action) {
  let wrap = $(".toasts");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toasts"; wrap.setAttribute("role", "status"); document.body.append(wrap); }
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span>${esc(message)}</span>`;
  if (action) {
    const el = document.createElement(action.href ? "a" : "button");
    el.textContent = action.label;
    if (action.href) el.href = action.href; else el.addEventListener("click", () => { action.action(); t.remove(); });
    t.append(el);
  }
  wrap.append(t);
  setTimeout(() => t.classList.add("out"), 3600);
  setTimeout(() => t.remove(), 4000);
}

function updateBadges() {
  const c = Cart.count(), w = Wishlist.items().length;
  $$("[data-cart-count]").forEach((b) => { b.textContent = c || ""; b.hidden = !c; });
  $$("[data-wish-count]").forEach((b) => { b.textContent = w || ""; b.hidden = !w; });
}

/* ---------- Global wiring ---------- */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-open-cart]")) openDrawer();
  if (e.target.closest("[data-open-search]")) openSearch();
  if (e.target.closest("[data-theme-toggle]")) setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  const wish = e.target.closest("[data-wish]"); if (wish) Wishlist.toggle(wish.dataset.wish);
  const quick = e.target.closest("[data-quick]"); if (quick) Cart.add(quick.dataset.quick, quick.dataset.size);
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if ($(".drawer") && !$(".drawer").hidden) closeDrawer();
  if ($(".search") && !$(".search").hidden) closeSearch();
  const m = $(".mobile-nav"); if (m && !m.hidden) $(".mobile-nav [data-close]").click();
  const modal = $(".modal:not([hidden])"); if (modal) modal.dispatchEvent(new Event("close-request"));
});

renderHeader();
renderFooter();
buildDrawer();
buildSearch();
updateBadges();

/* =========================================================
   Scroll effects
   Content flies in as it scrolls into view (scrolling down) and
   fades back out as it leaves through the bottom (scrolling up).
   Uses IntersectionObserver + CSS transitions on opacity/translate/
   scale only, so it stays smooth on phones and reverses cleanly
   mid-way. Off for reduced motion.
   ========================================================= */
const Reveal = (() => {
  // Off when the visitor asks for less motion, or the browser lacks IntersectionObserver
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window);
  // What animates, and how. Stagger = delay children one after another.
  const RULES = [
    [".page-head .crumbs, .page-head h1, .page-head p, .page-head .cat-tabs", "up", true],
    [".section-head > :first-child", "left"],
    [".section-head > :last-child:not(:first-child)", "right"],
    [".panel", "up", true],
    [".card", "pop", true],
    [".coll-card", "pop", true],
    [".picker__stage", "zoom"],
    [".picker__copy > *", "right", true],
    [".services > div", "up", true],
    [".story > *, .manifesto", "up", true],
    [".dark .services > div", "up", true],
    [".step, .summary, .form-card, .channel, .help-section, .help-nav, .line, .empty, .receipt, .confirm h1, .confirm p", "up", true],
    [".pdp__gallery", "left"],
    [".pdp__info", "right"],
    [".details details", "up", true],
    [".footer-grid > *", "up", true],
    [".footer-base", "up"],
  ];
  const SCOPE = "main, .site-footer, #related-wrap";
  if (reduce) return { scan() {} };

  let booted = false;
  addEventListener("load", () => setTimeout(() => (booted = true), 300));

  // Which way is the page moving? Content that was hidden by scrolling up only
  // comes back while scrolling down, so it can't flip back and forth.
  let lastY = scrollY, goingUp = false;
  addEventListener("scroll", () => { const y = scrollY; if (Math.abs(y - lastY) > 2) { goingUp = y < lastY; lastY = y; } }, { passive: true });

  const show = (el) => { el.classList.remove("is-out"); el.classList.add("is-in"); };
  const hide = (el) => { el.classList.remove("is-in", "rv-instant"); el.classList.add("is-out"); };
  const showNow = (el) => { el.classList.remove("is-out"); el.classList.add("is-in", "rv-instant"); };

  // Two lines with a gap between them (hysteresis): appear when the element
  // passes 85% down the screen, disappear only when it drops below 94%.
  const inIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const el = en.target;
      // New content may appear in any direction; content hidden by scrolling up waits for a scroll down
      if (en.isIntersecting && (!goingUp || !el.classList.contains("is-out"))) show(el);
    });
  }, { rootMargin: "0px 0px -15% 0px", threshold: 0 });
  const outIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const el = en.target;
      if (!en.isIntersecting && goingUp && en.boundingClientRect.top > 0 && el.classList.contains("is-in")) hide(el);
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });

  function register(el, type, index, instant) {
    if (el.dataset.rv || el.closest(".drawer, .search, .modal, .sheet, .mobile-nav")) return;
    el.dataset.rv = type;
    el.style.setProperty("--rv-delay", (index % 5) * 70 + "ms");
    const r = el.getBoundingClientRect();
    const inView = r.top < innerHeight * 0.85 && r.bottom > 0;
    const above = r.bottom <= 0;
    // On screen at page load, already scrolled past, or replacing content that was
    // already visible (cart updates, filters): show straight away, no animation
    if ((inView && (!booted || instant)) || above) el.classList.add("is-in", "rv-instant");
    el.classList.add("reveal");
    inIO.observe(el); outIO.observe(el);
  }

  function scan(root = document, instant = false) {
    RULES.forEach(([sel, type, stagger]) => {
      root.querySelectorAll(sel).forEach((el) => {
        if (!el.closest(SCOPE)) return;
        const sibs = stagger && el.parentElement ? [...el.parentElement.children].filter((c) => c.matches(sel)) : [el];
        register(el, type, Math.max(0, sibs.indexOf(el)), instant);
      });
    });
  }

  // Stop watching removed elements so re-drawn lists don't pile up in memory.
  // Returns true if any of them was visible (so its replacement shouldn't re-animate).
  function release(node) {
    if (node.nodeType !== 1) return false;
    let wasVisible = false;
    const els = node.matches(".reveal") ? [node, ...node.querySelectorAll(".reveal")] : node.querySelectorAll(".reveal");
    els.forEach((el) => { if (el.classList.contains("is-in")) wasVisible = true; inIO.unobserve(el); outIO.unobserve(el); });
    return wasVisible;
  }

  // Show anything hidden that is sitting in the visible area (used when scrolling stops)
  function settle() {
    document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.85 && r.bottom > 0) show(el);
    });
  }

  // Elements near the very bottom may never reach the trigger line: show them at page end
  function revealAtBottom() {
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
      document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) show(el); });
    }
  }

  scan();

  // Content that pages draw later (shop filters, cart updates, related products)
  new MutationObserver((muts) => {
    muts.forEach((m) => {
      let replaced = false;
      m.removedNodes.forEach((n) => { if (release(n)) replaced = true; });
      const host = m.target;
      if (host.nodeType !== 1 || !host.closest(SCOPE) && !host.querySelector(SCOPE)) return; // ignore toasts, drawer, search
      if ([...m.addedNodes].some((n) => n.nodeType === 1)) scan(host, replaced);
    });
  }).observe(document.body, { childList: true, subtree: true });

  addEventListener("scroll", () => requestAnimationFrame(revealAtBottom), { passive: true });
  let settleTimer;
  addEventListener("scroll", () => { clearTimeout(settleTimer); settleTimer = setTimeout(settle, 160); }, { passive: true });
  addEventListener("resize", () => { clearTimeout(settleTimer); settleTimer = setTimeout(settle, 160); });

  // Keyboard users: anything that receives focus is shown immediately
  // (keyboard only: a mouse click must not move the element mid-click)
  document.addEventListener("focusin", (e) => {
    let kb = false; try { kb = e.target.matches(":focus-visible"); } catch (_) {}
    const el = kb && e.target.closest(".reveal:not(.is-in)");
    if (el) showNow(el);
  });
  // Printing: show everything
  addEventListener("beforeprint", () => document.querySelectorAll(".reveal").forEach(showNow));

  return { scan };
})();