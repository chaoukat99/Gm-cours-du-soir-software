// ===== Configuration =====
const WHATSAPP_NUMBER = "212600000000"; // À remplacer par votre numéro (format international, sans +)
const FREE_SHIPPING_FROM = 500;
const SHIPPING_COST = 30;

// ===== En-tête au scroll =====
const header = document.getElementById("header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 20);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ===== Menu mobile =====
const burger = document.getElementById("burger");
const menu = document.getElementById("menu");

burger.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});
menu.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  })
);

// ===== Apparition au scroll =====
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ===== Toast =====
const toast = document.getElementById("toast");
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

// ===== Panier =====
const cart = new Map(); // nom -> { price, qty }
const cartList = document.getElementById("cart");
const totalEl = document.getElementById("total");
const shippingEl = document.getElementById("shipping");

function subtotal() {
  let sum = 0;
  cart.forEach(({ price, qty }) => (sum += price * qty));
  return sum;
}

function shipping(sub) {
  if (sub === 0) return 0;
  return sub >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
}

function renderCart() {
  cartList.innerHTML = "";

  if (cart.size === 0) {
    cartList.innerHTML = '<li class="cart-empty">Ajoutez des produits depuis la section « Produits ».</li>';
  }

  cart.forEach(({ price, qty }, name) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="item-name">${name}</span>
      <span class="qty">
        <button type="button" data-action="minus" aria-label="Retirer un">−</button>
        <span>${qty}</span>
        <button type="button" data-action="plus" aria-label="Ajouter un">+</button>
      </span>
      <strong>${price * qty} DH</strong>`;
    li.querySelector('[data-action="minus"]').addEventListener("click", () => changeQty(name, -1));
    li.querySelector('[data-action="plus"]').addEventListener("click", () => changeQty(name, 1));
    cartList.appendChild(li);
  });

  const sub = subtotal();
  const ship = shipping(sub);
  shippingEl.textContent = sub === 0 ? "—" : ship === 0 ? "Gratuite" : `${ship} DH`;
  totalEl.textContent = `${sub + ship} DH`;
}

function changeQty(name, delta) {
  const item = cart.get(name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.delete(name);
  renderCart();
}

document.querySelectorAll(".add").forEach((btn) => {
  btn.addEventListener("click", () => {
    const { name, price } = btn.dataset;
    const item = cart.get(name);
    if (item) item.qty += 1;
    else cart.set(name, { price: Number(price), qty: 1 });
    renderCart();
    showToast(`✓ ${name} ajouté au panier`);
  });
});

// ===== Formulaire de commande → WhatsApp =====
const form = document.getElementById("order-form");
const formMsg = document.getElementById("form-msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  formMsg.textContent = "";

  if (cart.size === 0) {
    formMsg.textContent = "Votre panier est vide.";
    return;
  }

  let valid = true;
  form.querySelectorAll("input[required]").forEach((input) => {
    const empty = input.value.trim() === "";
    input.classList.toggle("invalid", empty);
    if (empty) valid = false;
  });

  const phone = form.phone.value.replace(/\s/g, "");
  if (phone && !/^(\+212|0)[5-7]\d{8}$/.test(phone)) {
    form.phone.classList.add("invalid");
    formMsg.textContent = "Numéro de téléphone marocain invalide.";
    return;
  }
  if (!valid) {
    formMsg.textContent = "Merci de remplir tous les champs.";
    return;
  }

  const sub = subtotal();
  const ship = shipping(sub);
  const lines = [];
  cart.forEach(({ price, qty }, name) => lines.push(`• ${qty} × ${name} — ${price * qty} DH`));

  const message = [
    "Bonjour Zitoune Atlas, je souhaite commander :",
    ...lines,
    `Livraison : ${ship === 0 ? "gratuite" : ship + " DH"}`,
    `Total : ${sub + ship} DH`,
    "",
    `Nom : ${form.fullname.value.trim()}`,
    `Téléphone : ${phone}`,
    `Ville : ${form.city.value.trim()}`,
    `Adresse : ${form.address.value.trim()}`,
  ].join("\n");

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
});

form.querySelectorAll("input").forEach((input) =>
  input.addEventListener("input", () => input.classList.remove("invalid"))
);

// ===== Année du footer =====
document.getElementById("year").textContent = new Date().getFullYear();
