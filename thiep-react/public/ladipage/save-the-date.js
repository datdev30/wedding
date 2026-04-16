/**
 * Save the date (SECTION3): ảnh chỉ từ /save-the-date/manifest.json
 * 2 ảnh: cột trái (IMAGE6, IMAGE7) = [0], cột phải (IMAGE8, IMAGE9) = [1]
 * 4 ảnh: lần lượt IMAGE6…IMAGE9
 * Click ảnh → phóng to (lightbox).
 */
(function () {
  "use strict";

  var IDS = ["IMAGE6", "IMAGE7", "IMAGE8", "IMAGE9"];
  var lightboxWired = false;
  var prevBodyOverflow = "";

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
    var base = siteRoot() + "/save-the-date/";
    return (
      base.replace(/\/+$/, "/") +
      name
        .split("/")
        .filter(Boolean)
        .map(function (seg) {
          return encodeURIComponent(seg);
        })
        .join("/")
    );
  }

  function setBg(id, url) {
    var node = document.getElementById(id);
    if (!node || !url) return;
    var bg = node.querySelector(".ladi-image-background");
    if (!bg) return;
    /* Phải dùng important: save-the-date.css gỡ CDN bằng background-image: none !important */
    bg.style.setProperty(
      "background-image",
      "url(" + JSON.stringify(url) + ")",
      "important"
    );
    bg.style.setProperty("background-size", "cover", "important");
    bg.style.setProperty("background-position", "center center", "important");
    bg.style.setProperty("background-repeat", "no-repeat", "important");
    node.classList.add("save-the-date-photo--zoomable");
    node.setAttribute("data-save-the-date-src", url);
  }

  function apply(urls) {
    if (!urls || !urls.length) return;
    var n = urls.length;
    if (n === 1) {
      setBg("IMAGE6", urls[0]);
      setBg("IMAGE7", urls[0]);
      setBg("IMAGE8", urls[0]);
      setBg("IMAGE9", urls[0]);
      return;
    }
    if (n === 2) {
      setBg("IMAGE6", urls[0]);
      setBg("IMAGE7", urls[0]);
      setBg("IMAGE8", urls[1]);
      setBg("IMAGE9", urls[1]);
      return;
    }
    if (n === 3) {
      setBg("IMAGE6", urls[0]);
      setBg("IMAGE7", urls[1]);
      setBg("IMAGE8", urls[2]);
      setBg("IMAGE9", urls[2]);
      return;
    }
    setBg("IMAGE6", urls[0]);
    setBg("IMAGE7", urls[1]);
    setBg("IMAGE8", urls[2]);
    setBg("IMAGE9", urls[3]);
  }

  function ensureLightboxDom() {
    if (document.getElementById("save-the-date-lightbox")) return;
    var root = document.createElement("div");
    root.id = "save-the-date-lightbox";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div class="std-lb-backdrop" aria-hidden="true"></div>' +
      '<button type="button" class="std-lb-close" aria-label="Đóng">&times;</button>' +
      '<img class="std-lb-img" src="" alt="" decoding="async" />';

    var backdrop = root.querySelector(".std-lb-backdrop");
    var btn = root.querySelector(".std-lb-close");
    backdrop.addEventListener("click", closeLightbox);
    btn.addEventListener("click", closeLightbox);

    document.body.appendChild(root);
  }

  function openLightbox(url) {
    ensureLightboxDom();
    var root = document.getElementById("save-the-date-lightbox");
    if (!root) return;
    var img = root.querySelector(".std-lb-img");
    if (!img) return;
    img.src = url;
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    var root = document.getElementById("save-the-date-lightbox");
    if (!root || !root.classList.contains("is-open")) return;
    var img = root.querySelector(".std-lb-img");
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    if (img) {
      img.removeAttribute("src");
    }
    document.body.style.overflow = prevBodyOverflow;
  }

  function onKeyEscape(e) {
    if (e.key !== "Escape") return;
    var root = document.getElementById("save-the-date-lightbox");
    if (!root || !root.classList.contains("is-open")) return;
    closeLightbox();
  }

  function onThumbClick(ev) {
    var el = ev.currentTarget;
    var url = el.getAttribute("data-save-the-date-src");
    if (!url) return;
    ev.preventDefault();
    ev.stopPropagation();
    openLightbox(url);
  }

  function setupLightbox() {
    if (lightboxWired) return;
    lightboxWired = true;
    ensureLightboxDom();
    window.addEventListener("keydown", onKeyEscape);
    IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("click", onThumbClick);
    });
  }

  function init() {
    var manifestUrl = siteRoot() + "/save-the-date/manifest.json";
    fetch(manifestUrl, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("manifest");
        return r.json();
      })
      .then(function (data) {
        var list = data && data.images;
        if (!Array.isArray(list) || !list.length) return;
        var urls = list.map(resolveUrl).filter(Boolean);
        if (!urls.length) return;
        apply(urls);
        setupLightbox();
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
