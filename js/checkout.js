/* =========================================================
   Mkurugenzi — checkout
   Payment flows are SIMULATED on the frontend. Each one goes
   through a single function (see PaymentGateway below) so the
   backend can swap in real calls:
     - M-Pesa: Safaricom Daraja STK Push + callback polling
     - Cards:  a PCI-compliant processor (e.g. Pesapal, Flutterwave,
               Stripe, DPO). Never send raw card numbers to your own server;
               tokenise in the browser with the processor's SDK.
     - PayPal: PayPal JS SDK / Orders API
   ========================================================= */

const COUNTIES = ["Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"];
const BRANDS = { visa: "Visa", mastercard: "Mastercard", amex: "American Express" };

const form = $("#checkout");
const items = Cart.items();

/* ---------- Empty bag ---------- */
if (!items.length) {
  $("#checkout-root").style.display = "block";
  $("#checkout-root").innerHTML = `<div class="empty"><p>Your bag is empty, so there's nothing to check out yet.</p><a class="btn" href="shop.html">Browse the shop</a></div>`;
} else {
  initCheckout();
}

function initCheckout() {
  // Delivery options
  $("#delivery-options").innerHTML = DELIVERY.map((d, i) => `
    <label class="option"><input type="radio" name="delivery" value="${d.id}" ${i === 1 ? "checked" : ""}>
      <span class="option__text"><strong>${d.name}</strong><small>${d.eta}</small></span>
      <strong>${d.fee ? money(d.fee) : "Free"}</strong></label>`).join("");
  $("#county").insertAdjacentHTML("beforeend", COUNTIES.map((c) => `<option>${c}</option>`).join(""));
  $("#county").value = "Nairobi";

  // Restore saved details (only non-sensitive ones)
  const saved = Store.get("customer", {});
  ["first", "last", "email", "phone", "county", "town", "street"].forEach((k) => { if (saved[k]) form.elements[k].value = saved[k]; });

  renderSummary();
  syncDelivery();
  syncMethod();

  form.addEventListener("change", (e) => {
    if (e.target.name === "delivery") syncDelivery();
    if (e.target.name === "method") syncMethod();
    if (e.target.id === "county") {
      const opt = form.elements.delivery.value;
      if (opt === "nairobi" && e.target.value && e.target.value !== "Nairobi") {
        form.querySelector('input[value="countrywide"]').checked = true;
        syncDelivery();
        toast("Switched to countrywide courier for deliveries outside Nairobi");
      }
    }
  });
  form.addEventListener("input", (e) => clearError(e.target));

  // Phone: copy to M-Pesa number if that's still empty
  $("#phone").addEventListener("blur", () => { if (!$("#mpesa-phone").value) $("#mpesa-phone").value = $("#phone").value; });

  // Card formatting + brand detection
  $("#card-number").addEventListener("input", onCardInput);
  $("#card-exp").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length === 1 && Number(v) > 1) v = "0" + v;
    e.target.value = v.length > 2 ? v.slice(0, 2) + " / " + v.slice(2) : v;
  });
  $("#card-cvc").addEventListener("input", (e) => (e.target.value = e.target.value.replace(/\D/g, "").slice(0, cardBrand($("#card-number").value) === "amex" ? 4 : 3)));

  form.addEventListener("submit", onSubmit);
}

/* ---------- Summary ---------- */
function deliveryFee() {
  const d = DELIVERY.find((x) => x.id === form.elements.delivery?.value);
  return d ? d.fee : 0;
}
function total() { return Cart.subtotal() + deliveryFee(); }
function renderSummary() {
  $("#sum-lines").innerHTML = items.map((i) => {
    const p = getProduct(i.id);
    return `<div class="mini-line"><div class="media-wrap">${productMedia(p)}<span class="qty-dot">${i.qty}</span></div>
      <div><strong style="font-size:.9375rem">${esc(p.name)}</strong><br><span class="muted small">Size ${esc(i.size)}</span></div>
      <span>${money(p.price * i.qty)}</span></div>`;
  }).join("");
  $("#sum-sub").textContent = money(Cart.subtotal());
  const fee = deliveryFee();
  $("#sum-ship").textContent = fee ? money(fee) : "Free";
  $("#sum-total").textContent = money(total());
  $("#usd").textContent = "US$" + (total() / STORE.usdRate).toFixed(2);
  updatePayButton();
}
function syncDelivery() {
  const pickup = form.elements.delivery.value === "pickup";
  $("#address").hidden = pickup;
  $("#pickup-note").hidden = !pickup;
  renderSummary();
}
function currentMethod() { return form.elements.method.value; }
function syncMethod() {
  const m = currentMethod();
  const panel = ["visa", "mastercard", "amex"].includes(m) ? "card" : m;
  $$("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== panel));
  if (panel === "card") {
    $("#card-hint").textContent = `Paying with ${BRANDS[m]}.`;
    const amex = m === "amex";
    $("#card-cvc").placeholder = amex ? "4 digits" : "3 digits";
    $("#cvc-hint").textContent = amex ? "The 4 digits on the front of your card." : "The 3 digits on the back of your card.";
  }
  if (panel === "mpesa" && !$("#mpesa-phone").value) $("#mpesa-phone").value = $("#phone").value;
  updatePayButton();
}
function updatePayButton() {
  const m = currentMethod(), t = money(total());
  $("#pay-btn").textContent = m === "mpesa" ? `Pay ${t} with M-Pesa` : m === "paypal" ? `Continue to PayPal` : `Pay ${t}`;
}

/* ---------- Card helpers ---------- */
function cardBrand(num) {
  const n = num.replace(/\D/g, "");
  if (/^3[47]/.test(n)) return "amex";
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return "mastercard";
  if (n.length >= 2) return "other";
  return "";
}
function luhn(num) {
  let sum = 0, dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return sum % 10 === 0;
}
function onCardInput(e) {
  const brand = cardBrand(e.target.value);
  const max = brand === "amex" ? 15 : 16;
  const digits = e.target.value.replace(/\D/g, "").slice(0, max);
  e.target.value = brand === "amex"
    ? digits.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "))
    : digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  const logos = { visa: '<i class="logo logo--visa">VISA</i>', mastercard: '<i class="logo logo--mastercard" aria-label="Mastercard"></i>', amex: '<i class="logo logo--amex">AMEX</i>' };
  $("#card-brand").innerHTML = logos[brand] || "";
  // Switch the selected tab to match the card that was typed
  if (BRANDS[brand] && brand !== currentMethod()) {
    form.querySelector(`input[name=method][value=${brand}]`).checked = true;
    syncMethod();
  }
}

/* ---------- Validation ---------- */
function normalisePhone(v) {
  const d = v.replace(/\D/g, "");
  const m = d.match(/^(?:254|0)?([17]\d{8})$/);
  return m ? "254" + m[1] : null;
}
function setError(input, msg) {
  const field = input.closest(".field");
  if (field) { field.classList.add("invalid"); $(".field-error", field).textContent = msg; }
  input.setAttribute("aria-invalid", "true");
}
function clearError(input) {
  const field = input.closest(".field");
  if (field) { field.classList.remove("invalid"); const err = $(".field-error", field); if (err) err.textContent = ""; }
  input.removeAttribute("aria-invalid");
  if (input.id === "terms") $("#terms-error").textContent = "";
  $("#form-error").textContent = "";
}
function validate() {
  const errors = [];
  const req = (id, msg) => { const el = $("#" + id); if (!el.value.trim()) { setError(el, msg); errors.push(el); } };
  req("first", "Enter your first name.");
  req("last", "Enter your last name.");
  const email = $("#email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError(email, "Enter an email like name@example.com."); errors.push(email); }
  const phone = $("#phone");
  if (!normalisePhone(phone.value)) { setError(phone, "Enter a Kenyan mobile number, like 0712 345 678."); errors.push(phone); }

  if (form.elements.delivery.value !== "pickup") {
    req("county", "Choose your county.");
    req("town", "Enter your town or area.");
    req("street", "Enter your street and building so the rider can find you.");
  }

  const m = currentMethod();
  if (m === "mpesa") {
    const mp = $("#mpesa-phone");
    if (!normalisePhone(mp.value)) { setError(mp, "Enter the Safaricom number that will receive the prompt, like 0712 345 678."); errors.push(mp); }
  }
  if (BRANDS[m]) {
    req("card-name", "Enter the name exactly as it appears on the card.");
    const numEl = $("#card-number"), num = numEl.value.replace(/\D/g, "");
    const brand = cardBrand(num);
    if (brand === "other") { setError(numEl, "We accept Visa, Mastercard and American Express. Try one of those, or pay with M-Pesa."); errors.push(numEl); }
    else if (num.length !== (brand === "amex" ? 15 : 16) || !luhn(num)) { setError(numEl, "That card number isn't valid. Check the digits and try again."); errors.push(numEl); }
    const expEl = $("#card-exp"), [mm, yy] = expEl.value.split("/").map((s) => Number(s.trim()));
    const now = new Date(), expEnd = new Date(2000 + yy, mm, 1);
    if (!mm || mm > 12 || !yy || expEnd <= now) { setError(expEl, mm && yy && mm <= 12 ? "This card has expired. Use another card." : "Enter the expiry as MM / YY."); errors.push(expEl); }
    const cvcEl = $("#card-cvc"), need = brand === "amex" ? 4 : 3;
    if (cvcEl.value.length !== need) { setError(cvcEl, `Enter the ${need}-digit security code.`); errors.push(cvcEl); }
  }
  if (!$("#terms").checked) { $("#terms-error").textContent = "Tick the box to agree to the delivery and exchange terms."; errors.push($("#terms")); }
  return errors;
}

/* ---------- Submit ---------- */
function onSubmit(e) {
  e.preventDefault();
  const errors = validate();
  if (errors.length) {
    $("#form-error").textContent = `Check the ${errors.length} highlighted field${errors.length > 1 ? "s" : ""} above.`;
    errors[0].focus();
    errors[0].scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  // Remember contact + address (never card details)
  const f = form.elements;
  Store.set("customer", { first: f.first.value, last: f.last.value, email: f.email.value, phone: f.phone.value, county: f.county.value, town: f.town.value, street: f.street.value });

  const order = buildOrder();
  const m = currentMethod();
  if (m === "mpesa") mpesaFlow(order);
  else if (m === "paypal") paypalFlow(order);
  else cardFlow(order);
}

function buildOrder() {
  const f = form.elements;
  const d = DELIVERY.find((x) => x.id === f.delivery.value);
  return {
    number: "MK-" + Date.now().toString(36).toUpperCase().slice(-6),
    createdAt: new Date().toISOString(),
    customer: { name: `${f.first.value.trim()} ${f.last.value.trim()}`, email: f.email.value.trim(), phone: normalisePhone(f.phone.value) },
    delivery: { option: d.name, fee: d.fee, eta: d.eta, address: d.id === "pickup" ? null : [f.street.value, f.town.value, f.county.value].join(", "), notes: f.notes.value },
    items: items.map((i) => ({ ...i, name: getProduct(i.id).name, price: getProduct(i.id).price })),
    subtotal: Cart.subtotal(),
    total: total(),
    payment: { method: currentMethod() },
  };
}

/* ---------- Payment gateway (replace with real API calls) ---------- */
const PaymentGateway = {
  // POST /api/payments/mpesa/stk  -> { checkoutRequestId }, then poll /status
  mpesaStkPush(phone, amount) { return new Promise((res) => setTimeout(() => res({ checkoutRequestId: "ws_CO_" + Date.now() }), 900)); },
  mpesaStatus() { return new Promise((res) => setTimeout(() => res({ status: "success", receipt: "S" + Math.random().toString(36).slice(2, 11).toUpperCase() }), 5000)); },
  // Demo: card numbers ending in 0002 are declined, everything else is approved.
  chargeCard(card, amount) { return new Promise((res) => setTimeout(() => res(card.number.endsWith("0002") ? { status: "declined" } : { status: "success", last4: card.number.slice(-4) }), 2200)); },
  paypalApprove(amount) { return new Promise((res) => setTimeout(() => res({ status: "success", id: "PAYID-" + Date.now() }), 1500)); },
};

/* ---------- Modal ---------- */
const modal = $("#pay-modal"), box = $("#modal-box");
let modalCancel = null;
function openModal(html, onCancel) { box.innerHTML = html; modal.hidden = false; document.body.classList.add("locked"); modalCancel = onCancel; (box.querySelector("button, a") || box).focus(); }
function closeModal() { modal.hidden = true; document.body.classList.remove("locked"); $("#pay-btn").disabled = false; }
modal.addEventListener("close-request", () => { if (modalCancel) modalCancel(); });

/* M-Pesa STK push */
function mpesaFlow(order) {
  const phone = normalisePhone($("#mpesa-phone").value);
  const pretty = "+" + phone.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");
  let timer, seconds = 60, cancelled = false;
  $("#pay-btn").disabled = true;
  const cancel = () => { cancelled = true; clearInterval(timer); closeModal(); toast("M-Pesa payment cancelled. Nothing was charged."); };

  openModal(`<i class="logo logo--mpesa" style="margin:0 auto">M-PESA</i>
    <h2 id="modal-title" style="margin-top:1rem">Check your phone</h2>
    <p>We sent a payment request to <strong>${pretty}</strong>. Enter your M-Pesa PIN to pay.</p>
    <div class="phone-mock" aria-hidden="true"><strong>M-PESA</strong>Do you want to pay KSh ${order.total.toLocaleString("en-KE")} to MKURUGENZI? Enter M-PESA PIN.</div>
    <div class="countdown" id="cd" aria-live="off">1:00</div>
    <p class="muted small" id="mp-status" role="status">Sending request…</p>
    <div style="display:flex;gap:.5rem;justify-content:center"><button class="btn btn--ghost" id="mp-cancel">Cancel</button><button class="btn" id="mp-resend" hidden>Resend prompt</button></div>`, cancel);
  $("#mp-cancel").addEventListener("click", cancel);

  const start = () => {
    seconds = 60; $("#mp-resend").hidden = true;
    $("#mp-status").textContent = "Sending request…";
    PaymentGateway.mpesaStkPush(phone, order.total).then(() => {
      if (cancelled) return;
      $("#mp-status").textContent = "Waiting for you to enter your PIN. (Demo: confirms automatically.)";
      clearInterval(timer);
      timer = setInterval(() => {
        seconds--; $("#cd").textContent = `0:${String(seconds).padStart(2, "0")}`;
        if (seconds <= 0) { clearInterval(timer); $("#mp-status").textContent = "The prompt timed out. Resend it, or choose another payment method."; $("#mp-resend").hidden = false; }
      }, 1000);
      return PaymentGateway.mpesaStatus();
    }).then((r) => {
      if (cancelled || !r || seconds <= 0) return;
      clearInterval(timer);
      order.payment = { method: "mpesa", phone, receipt: r.receipt };
      complete(order);
    });
  };
  $("#mp-resend").addEventListener("click", start);
  start();
}

/* Card */
function cardFlow(order) {
  const number = $("#card-number").value.replace(/\D/g, "");
  const brand = cardBrand(number);
  $("#pay-btn").disabled = true;
  openModal(`<h2 id="modal-title">Confirming your payment</h2><div class="spinner" aria-hidden="true"></div><p class="muted" role="status">Checking with your bank. Don't close this page.</p>`, null);
  PaymentGateway.chargeCard({ number, brand }, order.total).then((r) => {
    if (r.status !== "success") {
      openModal(`<h2 id="modal-title">Your bank declined the payment</h2><p>Nothing was charged. Check your card details, try another card, or pay with M-Pesa.</p><button class="btn" id="m-close">Try again</button>`, closeModal);
      $("#m-close").addEventListener("click", () => { closeModal(); $("#card-number").focus(); });
      return;
    }
    order.payment = { method: brand, last4: r.last4 };
    complete(order);
  });
}

/* PayPal */
function paypalFlow(order) {
  const usd = (order.total / STORE.usdRate).toFixed(2);
  $("#pay-btn").disabled = true;
  openModal(`<i class="logo logo--paypal" style="margin:0 auto">PayPal</i>
    <h2 id="modal-title" style="margin-top:1rem">Approve with PayPal</h2>
    <p>In the live site this opens PayPal to sign in. Approve a payment of <strong>US$${usd}</strong> to Mkurugenzi.</p>
    <div style="display:flex;gap:.5rem;justify-content:center"><button class="btn btn--ghost" id="pp-cancel">Cancel</button><button class="btn" id="pp-ok">Approve payment</button></div>
    <p class="muted small" role="status" id="pp-status"></p>`, () => { closeModal(); });
  $("#pp-cancel").addEventListener("click", closeModal);
  $("#pp-ok").addEventListener("click", (e) => {
    e.target.disabled = true; $("#pp-status").textContent = "Confirming with PayPal…";
    PaymentGateway.paypalApprove(order.total).then((r) => { order.payment = { method: "paypal", id: r.id, usd }; complete(order); });
  });
}

/* ---------- Confirmation ---------- */
function complete(order) {
  closeModal();
  const orders = Store.get("orders", []); orders.push(order); Store.set("orders", orders);
  Cart.clear();
  const methodText = {
    mpesa: `M-Pesa, receipt ${order.payment.receipt}`,
    visa: `Visa ending ${order.payment.last4}`,
    mastercard: `Mastercard ending ${order.payment.last4}`,
    amex: `American Express ending ${order.payment.last4}`,
    paypal: `PayPal, US$${order.payment.usd}`,
  }[order.payment.method];
  $("#checkout-main").innerHTML = `<section class="confirm"><div class="wrap">
    <p class="muted">Order ${order.number}</p>
    <h1>Thank you, ${esc(order.customer.name.split(" ")[0])}.</h1>
    <p style="font-size:var(--step-1)">Your order is confirmed. We've sent a receipt to ${esc(order.customer.email)} and will text ${"+" + order.customer.phone} with delivery updates.</p>
    <div class="receipt">
      ${order.items.map((i) => `<div class="row-between" style="padding:.35rem 0"><span>${esc(i.name)}, size ${esc(i.size)} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join("")}
      <div class="row-between" style="padding:.35rem 0;border-top:1px solid var(--line);margin-top:.5rem"><span>${esc(order.delivery.option)}</span><span>${order.delivery.fee ? money(order.delivery.fee) : "Free"}</span></div>
      <div class="row-between total" style="font-weight:700;font-size:var(--step-1);padding-top:.5rem"><span>Total paid</span><span>${money(order.total)}</span></div>
      <p class="muted small" style="margin:1rem 0 0">Paid with ${methodText}<br>${order.delivery.address ? "Delivering to " + esc(order.delivery.address) + ". " : "Pick up in Nairobi CBD. "}${esc(order.delivery.eta)}.</p>
    </div>
    <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:2rem"><a class="btn" href="shop.html">Keep shopping</a><a class="btn btn--ghost" href="https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Hi, I have a question about order " + order.number)}" target="_blank" rel="noopener">Ask about this order</a></div>
  </div></section>`;
  window.scrollTo({ top: 0 });
}
