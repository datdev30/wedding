(function () {
  "use strict";

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  function bindCopyButtons() {
    var buttons = document.querySelectorAll("[data-bank-copy]");
    if (!buttons.length) return;

    var defaultLabel = "Sao chép STK";

    buttons.forEach(function (btn) {
      if (!(btn instanceof HTMLElement)) return;
      if (btn.dataset.bankCopyBound === "1") return;
      btn.dataset.bankCopyBound = "1";

      var stk = (btn.getAttribute("data-bank-copy") || "").replace(/\s/g, "");
      if (!stk) return;

      btn.addEventListener("click", function () {
        copyText(stk)
          .then(function () {
            btn.textContent = "Đã chép STK!";
            window.setTimeout(function () {
              btn.textContent = defaultLabel;
            }, 2000);
          })
          .catch(function () {
            btn.textContent = "Không chép được";
            window.setTimeout(function () {
              btn.textContent = defaultLabel;
            }, 2200);
          });
      });
    });
  }

  function ensureLightbox() {
    var el = document.getElementById("bank-qr-lightbox");
    if (el) return el;

    var root = document.createElement("div");
    root.id = "bank-qr-lightbox";
    root.className = "bank-qr-lightbox";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Mã QR phóng to");
    root.innerHTML =
      '<div class="bank-qr-lightbox__backdrop" aria-hidden="true"></div>' +
      '<button type="button" class="bank-qr-lightbox__close" aria-label="Đóng">&times;</button>' +
      '<div class="bank-qr-lightbox__stage">' +
      '<img class="bank-qr-lightbox__img" alt="" decoding="async" />' +
      "</div>";

    document.body.appendChild(root);
    return root;
  }

  function bindQrLightbox() {
    var root = ensureLightbox();
    var img = root.querySelector(".bank-qr-lightbox__img");
    var backdrop = root.querySelector(".bank-qr-lightbox__backdrop");
    var closeBtn = root.querySelector(".bank-qr-lightbox__close");
    if (!img || !backdrop || !closeBtn) return;

    function openLightbox(src, altText) {
      if (!src) return;
      img.src = src;
      img.alt = altText || "Mã QR ngân hàng";
      root.classList.add("is-open");
      root.setAttribute("aria-hidden", "false");
      document.body.classList.add("bank-qr-lightbox-open");
      closeBtn.focus();
    }

    function closeLightbox() {
      root.classList.remove("is-open");
      root.setAttribute("aria-hidden", "true");
      img.removeAttribute("src");
      img.alt = "";
      document.body.classList.remove("bank-qr-lightbox-open");
    }

    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;
      var btn = t.closest(".bank-qr-tile__btn");
      if (!btn || !(btn instanceof HTMLElement)) return;
      var src = btn.getAttribute("data-bank-qr-full");
      if (!src) return;
      e.preventDefault();
      var thumb = btn.querySelector(".bank-qr-tile__img");
      var altText =
        thumb && thumb instanceof HTMLImageElement ? thumb.alt || "" : "";
      openLightbox(src, altText);
    });

    backdrop.addEventListener("click", closeLightbox);
    closeBtn.addEventListener("click", closeLightbox);

    root.setAttribute("aria-hidden", "true");

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("is-open")) {
        e.preventDefault();
        closeLightbox();
      }
    });
  }

  function init() {
    bindCopyButtons();
    bindQrLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
