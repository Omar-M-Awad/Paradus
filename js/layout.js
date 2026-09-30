/* Shared header + footer, injected on every page. Edit navigation / footer links HERE, once.
   Each page sets <body data-root="" | "../" data-page="home|methodology|heritage|contact">. */
(function () {
  var cfg = window.PARADUS || {};
  var root = document.body.dataset.root || "";
  var page = document.body.dataset.page || "";
  var email = cfg.email || "paradus.co@gmail.com";

  var LEOPARD_PATH = "M252.358,44.991l-6.622,5.943c-1.104,0.991-2.516,1.511-3.946,1.511c-0.786,0-1.578-0.157-2.328-0.479l-16.975-7.283 l-18.702-1.969l-18.702,22.721v35.354h4.922c3.262,0,5.906,2.644,5.906,5.906c0,3.262-2.644,5.906-5.906,5.906h-14.765 l-10.335-47.247h-32.975c-6.546,0-12.698-1.408-18.259-4.833l-17.314-9.666L74.315,74.189c-1.133,1.2-2.375,2.293-3.709,3.264 l-21.358,15.56l2.796,7.805l5.497,0.019c3.24,0.012,5.862,2.642,5.862,5.882c0,3.249-2.634,5.882-5.882,5.882H43.717l-9.44-26.567 c-0.679-1.988-0.335-4.183,0.925-5.876l17.462-21.36l-3.402-22.994L32.753,49.602c-3.501,2.927-7.765,4.365-12.011,4.365 c-5.048,0-10.071-2.033-13.757-6.016c-3.528-3.813-5.283-8.767-4.943-13.949c0.34-5.183,2.727-9.865,6.722-13.184 c2.089-1.737,5.193-1.451,6.931,0.64c1.737,2.09,1.451,5.193-0.64,6.931c-1.896,1.575-3.029,3.797-3.19,6.257 c-0.161,2.46,0.672,4.812,2.346,6.621c3.22,3.479,8.593,3.826,12.23,0.784c0,0,19.471-16.309,25.984-21.718 c8.49-7.051,19.586-10.218,30.301-10.218h66.942c4.683,0,9.285-1.225,13.348-3.553c3.997-2.283,8.02-4.162,12.492-4.162 c5.27,0,28.52,5.077,40.735,7.399c0.9-2.91,2.772-5.132,4.404-6.605c1.383-1.249,3.571-0.838,4.405,0.829l4.201,8.402l15.383,10.919 c1.299,0.915,2.057,2.402,2.057,3.987v2.038l6.406,9.099C254.541,40.514,254.223,43.318,252.358,44.991z M228.965,75.996 L228.965,75.996l-26.09-22.882L191.03,67.505l28.074,15.046l8.282,11.656c1.81,2.724,5.486,3.463,8.208,1.653 c2.723-1.81,3.463-5.485,1.653-8.208L228.965,75.996z M114.875,67.8c-1.441-0.643-2.843-1.36-4.187-2.182l-13.194-7.366 L77.799,79.063l10.822,33.538h13.78c3.262,0,5.906-2.644,5.906-5.906c0-3.262-2.644-5.906-5.906-5.906h-4.82l-4.277-13.168 L114.875,67.8z";

  var nav = [
    { key: "methodology", label: "Methodology", href: "methodology.html" },
    { key: "heritage",    label: "Our Heritage", href: "our-heritage.html" },
    { key: "contact",     label: "Contact",      href: "contact.html" }
  ];

  var header = document.getElementById("site-header");
  if (header) {
    header.outerHTML =
      '<header class="site-nav" id="siteNav"><div class="wrap nav-inner">' +
        '<a href="' + root + 'index.html" class="brand"><img src="' + root + 'assets/img/logo.png" alt="Paradus"><span>PARADUS</span></a>' +
        '<nav class="links" id="navLinks" aria-label="Main">' +
          nav.map(function (n) {
            return '<a href="' + root + n.href + '"' + (n.key === page ? ' class="active" aria-current="page"' : '') + '>' + n.label + '</a>';
          }).join("") +
        '</nav>' +
        '<button class="hamburger" id="hamburger" aria-label="Menu" aria-expanded="false" aria-controls="navLinks"><span></span><span></span><span></span></button>' +
      '</div></header>';
  }

  var footer = document.getElementById("site-footer");
  if (footer) {
    footer.outerHTML =
      '<footer class="site-footer"><div class="wrap">' +
        '<div class="footer-inner">' +
          '<a href="' + root + 'index.html" class="footer-brand"><img src="' + root + 'assets/img/logo.png" alt="Paradus"><span>PARADUS</span></a>' +
          '<div class="footer-links">' +
            nav.map(function (n) { return '<a href="' + root + n.href + '">' + n.label + '</a>'; }).join("") +
            '<a href="mailto:' + email + '">Email</a>' +
          '</div>' +
        '</div>' +
        '<div class="footer-meta"><span>Precision in the fluidity of motion.</span></div>' +
      '</div></footer>';
  }

  // leopard silhouette (single source of truth): <svg data-leopard viewBox="0 0 256 115">
  document.querySelectorAll("svg[data-leopard]").forEach(function (svg) {
    svg.innerHTML = '<path fill="currentColor" d="' + LEOPARD_PATH + '"/>';
  });

  // email links: <a data-email> gets href + text from config.js
  document.querySelectorAll("a[data-email]").forEach(function (a) {
    a.href = "mailto:" + email;
    a.textContent = email;
  });

  // header background on scroll
  var siteNav = document.getElementById("siteNav");
  function onScroll() { if (siteNav) siteNav.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // mobile menu
  var burger = document.getElementById("hamburger");
  var links = document.getElementById("navLinks");
  function setMenu(open) {
    if (!burger || !links) return;
    links.classList.toggle("open", open);
    burger.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (burger) {
    burger.addEventListener("click", function () { setMenu(!links.classList.contains("open")); });
    links.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 820) setMenu(false); });
  }
})();
