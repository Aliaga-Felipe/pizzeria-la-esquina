// Pizzería La Esquina — lógica compartida (horario abierto/cerrado, menú y pedido por WhatsApp)

// Número de WhatsApp del local: reemplazar por el real (formato internacional sin "+", ej. 5493511234567).
// Vacío = WhatsApp pide elegir el contacto, útil para la demo.
const WHATSAPP = "";

const MENU = [
  { id: "pizzas", name: "Pizzas", note: "Masa de fermentación lenta, horno a piedra.", sizes: ["Media", "Entera"], items: [
    { n: "Muzzarella", d: "Salsa de tomate perita, muzzarella, orégano y aceitunas verdes.", p: [7500, 13500], star: true },
    { n: "Napolitana", d: "Muzzarella, tomate en rodajas, ajo y perejil.", p: [8400, 15200] },
    { n: "Fugazzeta rellena", d: "Doble masa rellena de muzzarella, cebolla gratinada arriba.", p: [9900, 17900] },
    { n: "Jamón y morrones", d: "Muzzarella, jamón cocido natural y morrones asados.", p: [9200, 16500] },
    { n: "Calabresa", d: "Muzzarella y longaniza calabresa de Colonia Caroya.", p: [9400, 16900] },
    { n: "Rúcula y crudo", d: "Muzzarella, jamón crudo, rúcula fresca y parmesano.", p: [10500, 18900] },
    { n: "Napolitana sin TACC", d: "Prepizza apta celíacos, horneada aparte en bandeja exclusiva.", p: [9000, 16200], tacc: true },
  ]},
  { id: "empanadas", name: "Empanadas", note: "Al horno. La docena sale $18.000.", sizes: ["Unidad"], items: [
    { n: "Carne cortada a cuchillo", d: "Con cebolla de verdeo, huevo y un toque de comino.", p: [1600] },
    { n: "Árabes", d: "Carne, tomate, cebolla y limón. Cerradas en triángulo.", p: [1600], star: true },
    { n: "Jamón y queso", d: "Jamón cocido y muzzarella.", p: [1500] },
    { n: "Humita", d: "Choclo cremoso con salsa blanca y queso.", p: [1500] },
  ]},
  { id: "bebidas", name: "Bebidas", sizes: ["Precio"], items: [
    { n: "Fernet con Coca", d: "El de siempre, en vaso de 500 ml.", p: [5500], star: true },
    { n: "Cerveza artesanal", d: "Pinta de rubia o roja, de una cervecería de Córdoba.", p: [4800] },
    { n: "Gaseosa 1,5 L", d: "Coca-Cola, Sprite o Fanta.", p: [3800] },
    { n: "Agua sin gas 500 ml", d: "", p: [1800] },
  ]},
  { id: "postres", name: "Postres", sizes: ["Precio"], items: [
    { n: "Flan casero", d: "Con dulce de leche o crema.", p: [4200] },
    { n: "Helado ¼ kg", d: "Dos gustos a elección.", p: [5600] },
  ]},
];

const ars = n => "$" + n.toLocaleString("es-AR");

// --- Abierto / cerrado (Mar–Dom 19:30–00:30) ---
function isOpen(d = new Date()) {
  const day = d.getDay(), m = d.getHours() * 60 + d.getMinutes();
  if (m >= 19 * 60 + 30) return day !== 1;            // de 19:30 a medianoche, salvo lunes
  if (m < 30) return day !== 2;                         // 00:00–00:30 sigue el turno del día anterior (no lunes)
  return false;
}
const openEl = document.getElementById("open-now");
if (openEl) {
  const open = isOpen();
  openEl.dataset.open = open;
  openEl.textContent = open ? "Abierto ahora" : "Cerrado ahora · Lunes cerrado";
}

// --- Menú y pedido ---
const menuEl = document.getElementById("menu");
if (menuEl) {
  const order = new Map(); // clave -> {label, price, qty}

  document.getElementById("cats").innerHTML = MENU.map((c, i) =>
    `<a href="#${c.id}" class="${i === 0 ? "active" : ""}">${c.name}</a>`).join("");

  menuEl.innerHTML = MENU.map(c => {
    const single = c.sizes.length === 1;
    const head = `<div class="cols-head"><span>${c.name}</span>${c.sizes.map(s => `<span>${s}</span>`).join("")}</div>`;
    const rows = c.items.map((it, i) => `
      <div class="item${single ? " single" : ""}">
        <div class="info">
          <h3>${it.n}${it.star ? ' <span class="badge star">Favorita</span>' : ""}${it.tacc ? ' <span class="badge tacc">Sin TACC</span>' : ""}</h3>
          ${it.d ? `<p>${it.d}</p>` : ""}
        </div>
        ${it.p.map((p, k) => `<button class="add" type="button" data-key="${c.id}-${i}-${k}"
            data-label="${it.n}${single ? "" : " (" + c.sizes[k].toLowerCase() + ")"}" data-price="${p}"
            aria-label="Sumar ${it.n}${single ? "" : " " + c.sizes[k].toLowerCase()} al pedido, ${ars(p)}">
            <span class="price">${ars(p)}</span><span class="plus">+ sumar</span></button>`).join("")}
      </div>`).join("");
    return `<section class="menu-cat" id="${c.id}"><h2>${c.name}</h2>${c.note ? `<p class="note">${c.note}</p>` : ""}${head}${rows}</section>`;
  }).join("");

  menuEl.addEventListener("click", e => {
    const b = e.target.closest(".add"); if (!b) return;
    const cur = order.get(b.dataset.key) || { label: b.dataset.label, price: +b.dataset.price, qty: 0 };
    cur.qty++; order.set(b.dataset.key, cur); render();
  });
  document.getElementById("order-list").addEventListener("click", e => {
    const b = e.target.closest("button[data-key]"); if (!b) return;
    const cur = order.get(b.dataset.key); cur.qty += +b.dataset.d;
    if (cur.qty <= 0) order.delete(b.dataset.key); render();
  });

  function render() {
    const items = [...order.entries()];
    const total = items.reduce((s, [, v]) => s + v.price * v.qty, 0);
    const count = items.reduce((s, [, v]) => s + v.qty, 0);
    document.getElementById("order-list").innerHTML = items.map(([k, v]) => `
      <li><span>${v.label}<br><span class="price" style="font-weight:500;color:var(--muted)">${ars(v.price * v.qty)}</span></span>
      <span class="qty"><button type="button" data-key="${k}" data-d="-1" aria-label="Quitar uno">−</button>${v.qty}<button type="button" data-key="${k}" data-d="1" aria-label="Sumar uno">+</button></span></li>`).join("");
    document.getElementById("order-empty").hidden = count > 0;
    document.getElementById("order-total").textContent = ars(total);
    const text = "Hola La Esquina! Quiero pedir:\n" + items.map(([, v]) => `• ${v.qty} x ${v.label} — ${ars(v.price * v.qty)}`).join("\n") +
      `\nTotal: ${ars(total)}\nDirección / retiro: `;
    const href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
    const send = document.getElementById("order-send");
    send.href = href; send.setAttribute("aria-disabled", count ? "false" : "true");
    document.getElementById("mobile-send").href = href;
    document.getElementById("mobile-count").textContent = count;
    document.getElementById("mobile-total").textContent = ars(total);
    document.getElementById("mobile-bar").hidden = count === 0;
  }
  render();

  // Altura real de la barra superior para la barra de categorías fija
  const setH = () => document.documentElement.style.setProperty("--topbar-h", document.querySelector(".topbar").offsetHeight + "px");
  setH(); addEventListener("resize", setH);

  // Resaltar la categoría visible
  const links = [...document.querySelectorAll("#cats a")];
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id)); });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll(".menu-cat").forEach(s => io.observe(s));
}
