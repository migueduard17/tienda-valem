/* VALEM — comportamiento del sitio (menú, tienda, compra y contacto) */
(function () {
  "use strict";
  var V = window.VALEM || {};
  var money = function (n) { return "$" + Math.round(n).toLocaleString("es-CO"); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- Menú móvil ---- */
  var mb = $(".menu-btn"), ul = $("#nav-list");
  if (mb && ul) {
    mb.addEventListener("click", function () {
      var o = ul.classList.toggle("open");
      mb.setAttribute("aria-expanded", o);
    });
  }

  /* ---- Destacados (inicio) ---- */
  var feat = $("#destacados");
  if (feat && V.productos) {
    [6, 12, 2, 10].forEach(function (id) {
      var p = V.productos.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      var a = document.createElement("a");
      a.className = "feat";
      a.href = "tienda.html#p" + p.id;
      a.innerHTML = '<img loading="lazy" src="img/productos/' + p.img + '" alt="' + p.nombre + '">' +
        "<div><b>" + p.nombre + "</b><span>" + money(p.precio) + "</span></div>";
      feat.appendChild(a);
    });
  }

  /* ---- Tienda ---- */
  var grid = $("#grid");
  if (grid && V.productos) {
    var cat = "todos", orden = "default";
    var render = function () {
      var list = V.productos.filter(function (p) { return cat === "todos" || p.cat === cat; });
      if (orden === "asc") list.sort(function (a, b) { return a.precio - b.precio; });
      if (orden === "desc") list.sort(function (a, b) { return b.precio - a.precio; });
      grid.innerHTML = list.map(function (p) {
        return '<article class="prod" id="p' + p.id + '">' +
          '<div class="ph"><span class="tag">' + p.tag + '</span>' +
          '<img loading="lazy" src="img/productos/' + p.img + '" alt="' + p.nombre + ' — ref. ' + p.ref + '"></div>' +
          '<div class="body"><span class="ref">REF. ' + p.ref + '</span>' +
          "<h3>" + p.nombre + "</h3><p class=\"desc\">" + p.desc + "</p>" +
          '<div class="row"><span class="price">' + money(p.precio) + ' <small>COP</small></span>' +
          '<button class="btn btn-primary" data-buy="' + p.id + '">Compra ahora</button></div></div></article>';
      }).join("");
      $("#count").textContent = list.length + " productos";
    };
    $$(".chip").forEach(function (c) {
      c.addEventListener("click", function () {
        $$(".chip").forEach(function (x) { x.classList.remove("on"); x.setAttribute("aria-pressed", "false"); });
        c.classList.add("on"); c.setAttribute("aria-pressed", "true");
        cat = c.dataset.cat; render();
      });
    });
    $("#orden").addEventListener("change", function (e) { orden = e.target.value; render(); });
    render();
    if (location.hash) { var t = $(location.hash); if (t) setTimeout(function () { t.scrollIntoView({ block: "center" }); }, 150); }

    /* ---- Modal de compra ---- */
    var ov = $("#overlay"), cur = null, qty = 1, lastFocus = null;
    var calc = function () {
      var m = ($("input[name=pago]:checked") || {}).value;
      var sub = cur.precio * qty, d10 = sub > 150000 ? sub * 0.10 : 0;
      var d5 = m === "transferencia" ? (sub - d10) * 0.05 : 0;
      var total = sub - d10 - d5;
      $("#sum").innerHTML =
        "<div><span>Subtotal (" + qty + " × " + money(cur.precio) + ")</span><span>" + money(sub) + "</span></div>" +
        (d10 ? '<div class="off"><span>10% OFF (compras &gt; $150.000)</span><span>−' + money(d10) + "</span></div>" : "") +
        (d5 ? '<div class="off"><span>5% OFF pago de contado</span><span>−' + money(d5) + "</span></div>" : "") +
        "<div><span>Envío</span><span>" + (qty >= 2 ? "GRATIS" : "Se confirma por WhatsApp") + "</span></div>" +
        '<div class="tot"><span>Total</span><span>' + money(total) + "</span></div>";
      return { sub: sub, total: total, d10: d10, d5: d5 };
    };
    var openBuy = function (id) {
      cur = V.productos.filter(function (p) { return p.id === id; })[0];
      qty = 1; lastFocus = document.activeElement;
      $("#m-img").src = "img/productos/" + cur.img; $("#m-img").alt = cur.nombre;
      $("#m-name").textContent = cur.nombre;
      $("#m-ref").textContent = "REF. " + cur.ref + " · " + money(cur.precio) + " COP";
      $("#qty").textContent = qty;
      $("#form-compra").hidden = false; $("#exito").hidden = true; $("#err").textContent = "";
      calc(); ov.classList.add("open"); document.body.style.overflow = "hidden";
      $("#nombre").focus();
    };
    var closeBuy = function () {
      ov.classList.remove("open"); document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("[data-buy]"); if (b) openBuy(+b.dataset.buy);
    });
    $("#close").addEventListener("click", closeBuy);
    ov.addEventListener("click", function (e) { if (e.target === ov) closeBuy(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov.classList.contains("open")) closeBuy(); });
    $("#minus").addEventListener("click", function () { if (qty > 1) { qty--; $("#qty").textContent = qty; calc(); } });
    $("#plus").addEventListener("click", function () { if (qty < 10) { qty++; $("#qty").textContent = qty; calc(); } });
    $$("input[name=pago]").forEach(function (r) { r.addEventListener("change", calc); });

    $("#form-compra").addEventListener("submit", function (e) {
      e.preventDefault();
      var n = $("#nombre").value.trim(), c = $("#ciudad").value.trim(), m = $("input[name=pago]:checked");
      if (!n || !c || !m) { $("#err").textContent = "Completa tu nombre, ciudad y método de pago."; return; }
      var r = calc(), code = "VAL-" + Date.now().toString().slice(-6);
      var msg = "Hola VALEM, quiero hacer este pedido (" + code + "):\n" +
        "• " + cur.nombre + " (Ref. " + cur.ref + ") × " + qty + "\n" +
        "• Total: " + money(r.total) + " COP\n" +
        "• Pago: " + V.metodosPago[m.value].nombre + "\n" +
        "• Nombre: " + n + "\n• Ciudad: " + c;
      $("#wa-order").href = "https://wa.me/" + V.whatsapp + "?text=" + encodeURIComponent(msg);
      $("#code").textContent = code;
      $("#ok-name").textContent = n.split(" ")[0];
      $("#form-compra").hidden = true; $("#exito").hidden = false;
    });
    $("#ok-close").addEventListener("click", closeBuy);
  }

  /* ---- Formulario de contacto (abre WhatsApp con el mensaje) ---- */
  var cf = $("#form-contacto");
  if (cf) {
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = $("#c-nombre").value.trim(), a = $("#c-asunto").value, m = $("#c-msg").value.trim();
      if (!n || !m) { $("#c-err").textContent = "Escribe tu nombre y tu mensaje."; return; }
      $("#c-err").textContent = "";
      var txt = "Hola VALEM, soy " + n + ".\nAsunto: " + a + "\n\n" + m;
      var em = $("#c-mail").value.trim(); if (em) txt += "\n\nMi correo: " + em;
      window.open("https://wa.me/" + V.whatsapp + "?text=" + encodeURIComponent(txt), "_blank", "noopener");
      $("#c-ok").hidden = false;
    });
  }
})();
