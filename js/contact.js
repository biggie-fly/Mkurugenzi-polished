/* =========================================================
   Mkurugenzi — contact page
   Messages are kept in localStorage for now. Replace sendMessage()
   with a POST to the backend (e.g. /api/contact) when it exists.
   ========================================================= */
$("#channels").innerHTML = `
  <a class="channel" href="https://wa.me/${STORE.whatsapp}" target="_blank" rel="noopener"><h3>WhatsApp</h3><p>${STORE.phoneDisplay}. Fastest for order questions.</p><span class="go">Open chat</span></a>
  <a class="channel" href="tel:+${STORE.whatsapp}"><h3>Call</h3><p>${STORE.phoneDisplay}, ${STORE.hours}</p><span class="go">Call us</span></a>
  <a class="channel" href="mailto:${STORE.email}"><h3>Email</h3><p>${STORE.email}</p><span class="go">Write to us</span></a>
  <div class="channel"><h3>Find us</h3><p>${STORE.location}. Pickup in Nairobi CBD by arrangement.</p></div>`;

const cform = $("#contact");
const topic = $("#c-topic");
topic.addEventListener("change", () => { $("#order-field").hidden = !["An order I placed", "Exchange"].includes(topic.value); });
$("#c-msg").addEventListener("input", (e) => ($("#c-count").textContent = `${e.target.value.length} / 1000`));
cform.addEventListener("input", (e) => {
  const f = e.target.closest(".field"); if (!f) return;
  f.classList.remove("invalid"); const er = $(".field-error", f); if (er) er.textContent = "";
  $("#c-form-error").textContent = "";
});

function err(el, msg) { const f = el.closest(".field"); f.classList.add("invalid"); $(".field-error", f).textContent = msg; el.setAttribute("aria-invalid", "true"); return el; }

function sendMessage(data) {
  // TODO(backend): return fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return new Promise((res) => setTimeout(() => {
    const all = Store.get("messages", []); all.push(data); Store.set("messages", all); res({ ok: true, ref: "MSG-" + Date.now().toString(36).toUpperCase().slice(-5) });
  }, 900));
}

cform.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = cform.elements, errors = [];
  if (f.name.value.trim().length < 2) errors.push(err(f.name, "Enter your name."));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) errors.push(err(f.email, "Enter an email like name@example.com so we can reply."));
  if (f.phone.value.trim() && !/^(?:\+?254|0)?[17]\d{8}$/.test(f.phone.value.replace(/[\s-]/g, ""))) errors.push(err(f.phone, "Enter a Kenyan mobile number, like 0712 345 678, or leave it blank."));
  if (!f.topic.value) errors.push(err(f.topic, "Choose a topic so the right person replies."));
  if (!$("#order-field").hidden && f.order.value.trim() && !/^MK-[A-Z0-9]{4,}$/i.test(f.order.value.trim())) errors.push(err(f.order, "Order numbers look like MK-AB12CD."));
  if (f.message.value.trim().length < 10) errors.push(err(f.message, "Tell us a bit more. At least 10 characters."));
  if (errors.length) { $("#c-form-error").textContent = `Check the ${errors.length} highlighted field${errors.length > 1 ? "s" : ""}.`; errors[0].focus(); return; }

  const btn = cform.querySelector("button[type=submit]");
  btn.disabled = true; btn.textContent = "Sending…";
  const data = { name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), topic: f.topic.value, order: f.order.value.trim(), message: f.message.value.trim(), copy: f.copy.checked, sentAt: new Date().toISOString() };
  sendMessage(data).then((r) => {
    $("#form-card").innerHTML = `<div class="success" role="status">
      <h2>Message sent.</h2>
      <p>Thanks, ${esc(data.name.split(" ")[0])}. We'll reply to ${esc(data.email)} within one working day. Your reference is <strong>${r.ref}</strong>.</p>
      <p>Need an answer sooner? <a href="https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Hi, following up on message " + r.ref)}" target="_blank" rel="noopener">Message us on WhatsApp</a>.</p>
      <button class="btn btn--ghost" id="again">Send another message</button></div>`;
    $("#again").addEventListener("click", () => location.reload());
  });
});
