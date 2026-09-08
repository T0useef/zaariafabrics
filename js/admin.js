(function ($) {
  $("[data-admin-save]").on("submit click", function (e) {
    if (this.tagName === "FORM") e.preventDefault();
    if (this.tagName === "BUTTON") e.preventDefault();
    const n = $('<div class="toast is-on">Saved</div>').css({
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#161412",
      color: "#fffdf9",
      padding: "12px 18px",
      zIndex: 20
    });
    $("body").append(n);
    setTimeout(() => n.remove(), 1600);
  });
})(jQuery);
