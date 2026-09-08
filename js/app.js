/* AYRA storefront interactions — cart, wishlist, UI. Product markup lives in HTML. */
(function ($) {
  "use strict";

  const CART_KEY = "ayra_cart";
  const WISH_KEY = "ayra_wish";
  const USER_KEY = "ayra_user";

  const money = (n) => "PKR " + Number(n).toLocaleString("en-PK");

  const store = {
    get(key, fallback) {
      try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, val) {
      localStorage.setItem(key, JSON.stringify(val));
    }
  };

  function toast(msg) {
    let $t = $(".toast");
    if (!$t.length) {
      $t = $('<div class="toast" role="status" />').appendTo("body");
    }
    $t.text(msg).addClass("is-on");
    setTimeout(() => $t.removeClass("is-on"), 2200);
  }

  function cart() {
    return store.get(CART_KEY, []);
  }

  function wish() {
    return store.get(WISH_KEY, []);
  }

  function saveCart(items) {
    store.set(CART_KEY, items);
    renderCart();
  }

  function saveWish(items) {
    store.set(WISH_KEY, items);
    syncWishButtons();
    updateCounts();
  }

  function updateCounts() {
    const c = cart().reduce((s, i) => s + (i.qty || 1), 0);
    const w = wish().length;
    $("[data-cart-count]").text(c).prop("hidden", c === 0);
    $("[data-wish-count]").text(w).prop("hidden", w === 0);
  }

  function addToCart(item) {
    const items = cart();
    const idx = items.findIndex(
      (i) => i.id === item.id && i.size === item.size && i.color === item.color
    );
    if (idx > -1) items[idx].qty += item.qty || 1;
    else items.push({ ...item, qty: item.qty || 1 });
    saveCart(items);
    openDrawer("#cart-drawer");
    toast("Added to bag");
  }

  function productFrom($el) {
    const $card = $el.closest("[data-product]");
    return {
      id: $card.data("id"),
      name: $card.data("name"),
      price: Number($card.data("price")),
      compare: Number($card.data("compare") || 0),
      image: $card.data("image"),
      href: $card.data("href") || "product-ivory-lawn-kurta.html",
      color: $card.data("color") || "Default",
      size: $card.data("size") || "M",
      qty: 1
    };
  }

  function renderCart() {
    const items = cart();
    const $list = $("[data-cart-list]");
    if ($list.length) {
      if (!items.length) {
        $list.html('<p class="empty">Your bag is empty.</p>');
      } else {
        $list.html(
          items
            .map(
              (i, n) => `
          <article class="cart-item">
            <img src="${i.image}" alt="${i.name}">
            <div>
              <h4><a href="${i.href}">${i.name}</a></h4>
              <p>${i.color} / ${i.size}</p>
              <div class="qty" data-idx="${n}">
                <button type="button" data-qty="-1" aria-label="Decrease">−</button>
                <input value="${i.qty}" readonly>
                <button type="button" data-qty="1" aria-label="Increase">+</button>
              </div>
              <button class="link-remove" data-remove="${n}" type="button">Remove</button>
            </div>
            <strong>${money(i.price * i.qty)}</strong>
          </article>`
            )
            .join("")
        );
      }
    }
    const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
    $("[data-subtotal]").text(money(sub));
    const ship = sub >= 5000 || sub === 0 ? 0 : 250;
    $("[data-shipping]").text(sub === 0 ? "—" : ship === 0 ? "Free" : money(ship));
    $("[data-total]").text(money(sub + ship));
    const pct = Math.min(100, (sub / 5000) * 100);
    $("[data-ship-bar]").css("width", pct + "%");
    $("[data-ship-note]").text(
      sub >= 5000
        ? "You have unlocked free shipping."
        : "Add " + money(Math.max(0, 5000 - sub)) + " more for free shipping."
    );
    updateCounts();
  }

  function syncWishButtons() {
    const ids = wish().map((w) => String(w.id));
    $("[data-wish]").each(function () {
      const id = String($(this).closest("[data-product]").data("id"));
      $(this).toggleClass("is-on", ids.includes(id));
      $(this).attr("aria-pressed", ids.includes(id));
    });
  }

  function openDrawer(sel) {
    $(".overlay, .drawer, .search-panel").removeClass("is-open");
    $(sel).addClass("is-open");
    $(".overlay").addClass("is-open");
    $("body").addClass("drawer-open");
  }

  function closeAll() {
    $(".overlay, .drawer, .search-panel, .modal-ayra, .lightbox").removeClass("is-open");
    $("body").removeClass("drawer-open nav-open");
  }

  /* Announcement rotator */
  const $slides = $(".announcement__slide");
  if ($slides.length) {
    let i = 0;
    setInterval(() => {
      $slides.removeClass("is-active");
      i = (i + 1) % $slides.length;
      $slides.eq(i).addClass("is-active");
    }, 3800);
  }

  /* Hero simple rotator */
  $("[data-hero-dot]").on("click", function () {
    const n = $(this).data("hero-dot");
    $("[data-hero]").removeClass("is-active").eq(n).addClass("is-active");
    $("[data-hero-dot]").removeClass("is-active");
    $(this).addClass("is-active");
  });

  $(document)
    .on("click", "[data-open-menu]", function () {
      if ($(this).closest(".mobile-tools").length) return;
      openDrawer("#mobile-menu");
    })
    .on("click", "[data-open-cart]", () => {
      renderCart();
      openDrawer("#cart-drawer");
    })
    .on("click", "[data-open-search]", () => {
      $(".overlay").addClass("is-open");
      $("#search-panel").addClass("is-open");
      setTimeout(() => $("#search-panel input").trigger("focus"), 200);
    })
    .on("click", "[data-close], .overlay", closeAll)
    .on("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });

  $(".mobile-nav [data-acc]").on("click", function () {
    $(this).next(".mobile-sub").toggleClass("is-open");
  });

  /* Search suggest filter (static HTML items) */
  $("#global-search").on("input", function () {
    const q = $(this).val().toLowerCase().trim();
    $(".suggest-item").each(function () {
      const t = $(this).text().toLowerCase();
      $(this).toggle(!q || t.indexOf(q) > -1);
    });
  });

  $(document).on("submit", "[data-search-form]", function (e) {
    const q = $(this).find("input").val();
    if (!q) {
      e.preventDefault();
      return;
    }
    /* form action already points to search.html */
  });

  /* Wishlist */
  $(document).on("click", "[data-wish]", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const item = productFrom($(this));
    let items = wish();
    const exists = items.find((w) => String(w.id) === String(item.id));
    if (exists) {
      items = items.filter((w) => String(w.id) !== String(item.id));
      toast("Removed from wishlist");
    } else {
      items.push(item);
      toast("Saved to wishlist");
    }
    saveWish(items);
  });

  /* Quick add / add to bag */
  $(document).on("click", "[data-add]", function (e) {
    e.preventDefault();
    const item = productFrom($(this));
    const $pdp = $(this).closest(".pdp-info");
    if ($pdp.length) {
      item.size = $pdp.find(".size-list .is-active").data("size") || item.size;
      item.color = $pdp.find(".swatch.is-active").data("color") || item.color;
      item.qty = Number($pdp.find(".qty input").val() || 1);
    }
    addToCart(item);
  });

  $(document).on("click", "[data-buy]", function (e) {
    e.preventDefault();
    $(this).closest("[data-product]").find("[data-add]").trigger("click");
    window.location.href = "checkout.html";
  });

  /* Quick view */
  $(document).on("click", "[data-quick]", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const p = productFrom($(this));
    const $m = $("#quick-view");
    $m.find("[data-qv-img]").attr("src", p.image).attr("alt", p.name);
    $m.find("[data-qv-name]").text(p.name);
    $m.find("[data-qv-price]").text(money(p.price));
    $m.find("[data-qv-link]").attr("href", p.href);
    $m.attr("data-product", "").data(p);
    $m.find(".qv-body").attr({
      "data-product": "",
      "data-id": p.id,
      "data-name": p.name,
      "data-price": p.price,
      "data-image": p.image,
      "data-href": p.href,
      "data-color": p.color,
      "data-size": p.size
    });
    $m.addClass("is-open");
    $(".overlay").addClass("is-open");
  });

  /* Cart qty / remove */
  $(document).on("click", "[data-qty]", function () {
    const items = cart();
    const idx = Number($(this).closest("[data-idx]").data("idx"));
    items[idx].qty = Math.max(1, items[idx].qty + Number($(this).data("qty")));
    saveCart(items);
  });

  $(document).on("click", "[data-remove]", function () {
    const items = cart();
    items.splice(Number($(this).data("remove")), 1);
    saveCart(items);
    toast("Removed from bag");
  });

  $("[data-promo]").on("click", function () {
    const code = String($("[data-promo-input]").val() || "").trim().toUpperCase();
    if (code === "AYRA10" || code === "FESTIVE20") {
      toast("Code applied at checkout");
      store.set("ayra_promo", code);
    } else {
      toast("Enter AYRA10 or FESTIVE20");
    }
  });

  /* Size / color */
  $(document).on("click", ".size-list button", function () {
    $(this).addClass("is-active").siblings().removeClass("is-active");
  });
  $(document).on("click", ".pdp-info .swatch, .qv-body .swatch", function () {
    $(this).addClass("is-active").siblings().removeClass("is-active");
  });

  $("[data-qty-pdp]").on("click", function () {
    const $i = $(this).siblings("input");
    $i.val(Math.max(1, Number($i.val()) + Number($(this).data("qty-pdp"))));
  });

  /* Gallery */
  $("[data-thumb]").on("click", function () {
    const src = $(this).data("thumb");
    const type = $(this).data("type") || "img";
    $("[data-thumb]").removeClass("is-active");
    $(this).addClass("is-active");
    const $stage = $("[data-gallery-stage]");
    if (type === "video") {
      $stage.html('<video src="' + src + '" controls autoplay muted playsinline></video>');
    } else {
      $stage.html('<img src="' + src + '" alt="Product image">');
    }
  });

  $("[data-zoom]").on("click", function () {
    const src = $("[data-gallery-stage] img").attr("src");
    if (!src) return;
    $("#lightbox img").attr("src", src);
    $("#lightbox").addClass("is-open");
  });

  /* PLP filter / sort using data attributes already in HTML */
  function applyFilters() {
    const $cards = $(".product-grid [data-product]");
    if (!$cards.length) return;
    const cats = $("[data-filter-cat]:checked").map(function () { return $(this).val(); }).get();
    const colors = $("[data-filter-color]:checked").map(function () { return $(this).val(); }).get();
    const sizes = $("[data-filter-size]:checked").map(function () { return $(this).val(); }).get();
    const fabrics = $("[data-filter-fabric]:checked").map(function () { return $(this).val(); }).get();
    const minP = Number($("[data-min]").val() || 0);
    const maxP = Number($("[data-max]").val() || 999999);
    const inStock = $("[data-filter-stock]").is(":checked");
    const disc = $("[data-filter-disc]").is(":checked");
    const rating = Number($("[data-filter-rating]:checked").val() || 0);

    $cards.each(function () {
      const $c = $(this);
      const price = Number($c.data("price"));
      let ok = true;
      if (cats.length && cats.indexOf(String($c.data("sub"))) === -1) ok = false;
      if (colors.length && colors.indexOf(String($c.data("color"))) === -1) ok = false;
      if (sizes.length && String($c.data("sizes") || "").split(",").filter((s) => sizes.indexOf(s) > -1).length === 0) ok = false;
      if (fabrics.length && fabrics.indexOf(String($c.data("fabric"))) === -1) ok = false;
      if (price < minP || price > maxP) ok = false;
      if (inStock && String($c.data("stock")) === "0") ok = false;
      if (disc && !Number($c.data("compare"))) ok = false;
      if (rating && Number($c.data("rating")) < rating) ok = false;
      $c.toggle(ok);
    });
    const vis = $cards.filter(":visible").length;
    $("[data-count]").text(vis + " pieces");
  }

  $(document).on("change", "[data-filter-cat],[data-filter-color],[data-filter-size],[data-filter-fabric],[data-filter-stock],[data-filter-disc],[data-filter-rating],[data-min],[data-max]", applyFilters);

  $("[data-sort]").on("change", function () {
    const val = $(this).val();
    const $grid = $(".product-grid");
    const $cards = $grid.children("[data-product]").get();
    $cards.sort(function (a, b) {
      const $a = $(a), $b = $(b);
      if (val === "price-asc") return $a.data("price") - $b.data("price");
      if (val === "price-desc") return $b.data("price") - $a.data("price");
      if (val === "newest") return String($b.data("date")).localeCompare(String($a.data("date")));
      if (val === "rating") return $b.data("rating") - $a.data("rating");
      if (val === "best") return $b.data("sold") - $a.data("sold");
      return 0;
    });
    $.each($cards, function (_, el) { $grid.append(el); });
  });

  /* Newsletter / contact / checkout */
  $("[data-newsletter]").on("submit", function (e) {
    e.preventDefault();
    toast("You are on the list.");
    this.reset();
  });

  $("[data-contact]").on("submit", function (e) {
    e.preventDefault();
    toast("Message received. We will reply shortly.");
    this.reset();
  });

  $("[data-checkout]").on("submit", function (e) {
    e.preventDefault();
    if (!cart().length) {
      toast("Your bag is empty.");
      return;
    }
    const orderNo = "AY" + Date.now().toString().slice(-8);
    store.set("ayra_last_order", {
      id: orderNo,
      items: cart(),
      name: $("#c-name").val(),
      email: $("#c-email").val(),
      phone: $("#c-phone").val(),
      status: "placed"
    });
    saveCart([]);
    window.location.href = "order-confirmation.html?order=" + orderNo;
  });

  $("[data-track]").on("submit", function (e) {
    e.preventDefault();
    const no = $("#track-no").val().trim();
    const last = store.get("ayra_last_order", {});
    if (no && (no === last.id || no.toUpperCase().indexOf("AY") === 0)) {
      $(".track-result").removeClass("d-none");
      $("[data-track-id]").text(no || last.id || "AY240918");
    } else {
      toast("Order not found. Try AY240918");
    }
  });

  /* Account tabs */
  $("[data-tab]").on("click", function (e) {
    e.preventDefault();
    const t = $(this).data("tab");
    $("[data-tab]").removeClass("is-active");
    $(this).addClass("is-active");
    $(".panel").removeClass("is-active");
    $("#" + t).addClass("is-active");
  });

  $("[data-login]").on("submit", function (e) {
    e.preventDefault();
    store.set(USER_KEY, { name: $("#acc-name").val() || "Ayesha Khan", email: $("#acc-email").val() });
    toast("Welcome back");
    window.location.href = "account.html";
  });

  $("[data-logout]").on("click", function (e) {
    e.preventDefault();
    localStorage.removeItem(USER_KEY);
    toast("Signed out");
    window.location.href = "login.html";
  });

  /* Review form */
  $("[data-review]").on("submit", function (e) {
    e.preventDefault();
    toast("Review submitted for approval");
    this.reset();
  });

  /* Size guide modal */
  $("[data-size-guide]").on("click", function (e) {
    e.preventDefault();
    $("#size-guide").addClass("is-open");
    $(".overlay").addClass("is-open");
  });

  /* Wishlist page render if container exists */
  if ($("[data-wish-page]").length) {
    const items = wish();
    const $w = $("[data-wish-page]");
    if (!items.length) $w.html('<p class="empty">No saved pieces yet.</p>');
    else {
      $w.html(
        items
          .map(
            (i) => `
        <article class="product-card" data-product data-id="${i.id}" data-name="${i.name}" data-price="${i.price}" data-image="${i.image}" data-href="${i.href}" data-color="${i.color}" data-size="${i.size}">
          <a class="product-card__media" href="${i.href}"><img src="${i.image}" alt="${i.name}"></a>
          <div class="product-card__body">
            <h3><a href="${i.href}">${i.name}</a></h3>
            <div class="price-row"><span class="price">${money(i.price)}</span></div>
            <p class="desc">In stock · Ready to ship</p>
            <button class="btn btn-full quick-add" data-add type="button">Add to bag</button>
            <button class="link-remove" data-wish type="button">Remove</button>
          </div>
        </article>`
          )
          .join("")
      );
    }
  }

  /* Touch swipe for gallery */
  let sx = 0;
  $("[data-gallery-stage]").on("touchstart", function (e) {
    sx = e.originalEvent.touches[0].clientX;
  });
  $("[data-gallery-stage]").on("touchend", function (e) {
    const dx = e.originalEvent.changedTouches[0].clientX - sx;
    if (Math.abs(dx) < 40) return;
    const $thumbs = $("[data-thumb]");
    let i = $thumbs.index($("[data-thumb].is-active"));
    i = dx < 0 ? Math.min($thumbs.length - 1, i + 1) : Math.max(0, i - 1);
    $thumbs.eq(i).trigger("click");
  });

  /* Search results from ?q= */
  const params = new URLSearchParams(window.location.search);
  if (params.get("q") && $(".product-grid [data-product]").length && /search\.html/i.test(location.pathname)) {
    const q = params.get("q").toLowerCase();
    $(".product-grid [data-product]").each(function () {
      const t = ($(this).data("name") + " " + $(this).data("sub") + " " + $(this).data("fabric") + " " + $(this).data("color")).toLowerCase();
      $(this).toggle(t.indexOf(q) > -1);
    });
    $("[data-count]").text($(".product-grid [data-product]:visible").length + " pieces");
    $(".page-hero h1").text("Results for “" + params.get("q") + "”");
    $("#global-search").val(params.get("q"));
  }

  if ($(".filters-desktop").length && !$("#filter-drawer").length) {
    $("body").append('<aside class="drawer drawer--left" id="filter-drawer"><div class="drawer-head"><h3>Filter</h3><button class="icon-btn" type="button" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div><div class="drawer-body" id="filter-drawer-body"></div></aside>');
    $(".filters-desktop").children().clone().appendTo("#filter-drawer-body");
  }
  $(document).on("click", ".mobile-tools .btn", function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    openDrawer("#filter-drawer");
  });

  const last = store.get("ayra_last_order", {});
  if (last.id) $("[data-track-id]").first().text(last.id);

  renderCart();
  syncWishButtons();
  applyFilters();
})(jQuery);
