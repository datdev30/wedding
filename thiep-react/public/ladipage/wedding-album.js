/**
 * Album cưới: chỉ ảnh từ /wedding-album/ (manifest.json).
 * Xem thêm: +6 ảnh mỗi lần. Lightbox: Trước / Sau / Đóng, phím ← → Esc.
 */
(function () {
  "use strict";

  var INITIAL = 6;
  var BATCH = 6;

  function siteRoot() {
    var p = window.location.pathname || "/";
    var i = p.indexOf("/ladipage/");
    if (i === -1) return "";
    return p.slice(0, i);
  }

  function resolveUrl(name) {
    if (!name || typeof name !== "string") return "";
    name = name.trim();
    if (!name) return "";
    if (/^https?:\/\//i.test(name)) return name;
    var base = siteRoot() + "/wedding-album/";
    return base
      .replace(/\/+$/, "/")
      .concat(
        name
          .split("/")
          .filter(Boolean)
          .map(function (seg) {
            return encodeURIComponent(seg);
          })
          .join("/"),
      );
  }

  var allUrls = [];
  var visibleCount = 0;
  /** Số ảnh đã gắn vào grid — tránh innerHTML='' khi Xem thêm (không nháy trắng). */
  var renderedToGrid = 0;
  var lbIndex = 0;
  var lbEl = null;
  var touchStartX = 0;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function buildLightbox() {
    var lb = document.createElement("div");
    lb.id = "wedding-album-lightbox";
    lb.className = "walb";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-hidden", "true");
    lb.innerHTML =
      '<div class="walb__backdrop" data-walb-close></div>' +
      '<div class="walb__frame">' +
      '<div class="walb__topbar">' +
      '<span class="walb__brand">Album cưới</span>' +
      '<span class="walb__counter" id="walb-counter"></span>' +
      '<button type="button" class="walb__close" data-walb-close aria-label="Đóng">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
      "</button></div>" +
      '<div class="walb__stage-wrap">' +
      '<button type="button" class="walb__nav walb__nav--prev" id="walb-prev" aria-label="Ảnh trước">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>' +
      "</button>" +
      '<img class="walb__img" id="walb-img" alt="" decoding="async" />' +
      '<button type="button" class="walb__nav walb__nav--next" id="walb-next" aria-label="Ảnh sau">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>' +
      "</button></div></div>";
    document.body.appendChild(lb);
    return lb;
  }

  function lockScroll(on) {
    document.body.classList.toggle("walb-no-scroll", !!on);
  }

  function openLightbox(index) {
    if (!lbEl || !allUrls.length) return;
    lbIndex = Math.max(0, Math.min(index, allUrls.length - 1));
    lbEl.classList.add("walb--open");
    lbEl.setAttribute("aria-hidden", "false");
    lockScroll(true);
    updateLightboxImage();
  }

  function closeLightbox() {
    if (!lbEl) return;
    lbEl.classList.remove("walb--open");
    lbEl.setAttribute("aria-hidden", "true");
    lockScroll(false);
    var img = $("#walb-img", lbEl);
    if (img) {
      img.classList.remove("walb__img--ready");
      img.removeAttribute("src");
    }
  }

  function updateLightboxImage() {
    var img = $("#walb-img", lbEl);
    var counter = $("#walb-counter", lbEl);
    var prev = $("#walb-prev", lbEl);
    var next = $("#walb-next", lbEl);
    if (!img || !allUrls[lbIndex]) return;
    img.classList.remove("walb__img--ready");
    var url = allUrls[lbIndex];
    var nextImg = new Image();
    nextImg.onload = function () {
      img.src = url;
      img.alt = "Ảnh " + (lbIndex + 1);
      img.classList.add("walb__img--ready");
    };
    nextImg.onerror = function () {
      img.alt = "Không tải được ảnh";
      img.classList.add("walb__img--ready");
    };
    nextImg.src = url;
    if (counter) {
      counter.textContent = lbIndex + 1 + " / " + allUrls.length;
    }
    if (prev) prev.disabled = lbIndex <= 0;
    if (next) next.disabled = lbIndex >= allUrls.length - 1;
  }

  function stepLightbox(delta) {
    var n = lbIndex + delta;
    if (n < 0 || n >= allUrls.length) return;
    lbIndex = n;
    updateLightboxImage();
  }

  function bindLightbox() {
    lbEl = buildLightbox();
    lbEl.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.closest && t.closest("[data-walb-close]")) closeLightbox();
    });
    $("#walb-prev", lbEl).addEventListener("click", function (e) {
      e.stopPropagation();
      stepLightbox(-1);
    });
    $("#walb-next", lbEl).addEventListener("click", function (e) {
      e.stopPropagation();
      stepLightbox(1);
    });
    document.addEventListener("keydown", function (e) {
      if (!lbEl || !lbEl.classList.contains("walb--open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepLightbox(-1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        stepLightbox(1);
      }
    });
    var stage = $(".walb__stage-wrap", lbEl);
    if (stage) {
      stage.addEventListener(
        "touchstart",
        function (e) {
          if (e.changedTouches && e.changedTouches[0]) {
            touchStartX = e.changedTouches[0].clientX;
          }
        },
        { passive: true },
      );
      stage.addEventListener(
        "touchend",
        function (e) {
          if (!e.changedTouches || !e.changedTouches[0]) return;
          var dx = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(dx) < 50) return;
          if (dx > 0) stepLightbox(-1);
          else stepLightbox(1);
        },
        { passive: true },
      );
    }
  }

  /**
   * @param {boolean} fullReset true = load lỗi / lần đầu: xóa grid và vẽ lại từ 0
   */
  function renderGrid(fullReset) {
    var grid = document.getElementById("WEDDING_ALBUM_GRID");
    var empty = document.getElementById("WEDDING_ALBUM_EMPTY");
    var moreBtn = document.getElementById("WEDDING_ALBUM_MORE_BTN");
    if (!grid) return;
    if (fullReset) {
      grid.innerHTML = "";
      renderedToGrid = 0;
    }
    var slice = allUrls.slice(0, visibleCount);
    if (!slice.length) {
      if (empty) {
        empty.hidden = false;
        empty.textContent =
          "Chưa có ảnh. Thêm file vào thư mục wedding-album và khai báo trong manifest.json.";
      }
      if (moreBtn) moreBtn.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    var i;
    for (i = renderedToGrid; i < visibleCount; i++) {
      var url = allUrls[i];
      if (!url) continue;
      var fig = document.createElement("figure");
      fig.className = "wedding-album-card";
      fig.setAttribute("role", "listitem");
      fig.tabIndex = 0;
      fig.dataset.index = String(i);
      var im = document.createElement("img");
      im.className = "wedding-album-card__img";
      im.loading = "lazy";
      im.decoding = "async";
      im.alt = "Ảnh album " + (i + 1);
      im.src = url;
      fig.appendChild(im);
      (function (idx) {
        fig.addEventListener("click", function () {
          openLightbox(idx);
        });
        fig.addEventListener("keydown", function (ev) {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            openLightbox(idx);
          }
        });
      })(i);
      grid.appendChild(fig);
    }
    renderedToGrid = visibleCount;
    if (moreBtn) {
      var rest = allUrls.length - visibleCount;
      moreBtn.hidden = rest <= 0;
      moreBtn.disabled = rest <= 0;
      if (!moreBtn.hidden) {
        moreBtn.setAttribute("aria-label", "Tải thêm ảnh album");
        moreBtn.innerHTML =
          '<span class="wedding-album-more-btn__text">Xem thêm</span>' +
          '<svg class="wedding-album-more-btn__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
      } else {
        moreBtn.removeAttribute("aria-label");
      }
    }
  }

  function loadMore() {
    var rest = allUrls.length - visibleCount;
    if (rest <= 0) return;
    visibleCount += Math.min(BATCH, rest);
    renderGrid(false);
  }

  function init() {
    bindLightbox();
    var moreBtn = document.getElementById("WEDDING_ALBUM_MORE_BTN");
    if (moreBtn) {
      moreBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        loadMore();
      });
    }
    var manifestUrl = siteRoot() + "/wedding-album/manifest.json";
    fetch(manifestUrl, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("manifest");
        return r.json();
      })
      .then(function (data) {
        var list = data && data.images;
        if (!Array.isArray(list)) list = [];
        allUrls = list.map(resolveUrl).filter(Boolean);
        visibleCount = Math.min(INITIAL, allUrls.length);
        renderGrid(true);
      })
      .catch(function () {
        allUrls = [];
        visibleCount = 0;
        renderGrid(true);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
