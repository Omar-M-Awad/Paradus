/* Scroll reveal: elements fade/rise into view as you scroll. Grouped items are staggered. */
(function () {
  if (!("IntersectionObserver" in window)) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add("in"); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -30px 0px" });

  function reveal(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.classList.add("reveal"); observer.observe(el);
    });
  }
  function revealStagger(containerSelector, itemSelector, stepMs) {
    document.querySelectorAll(containerSelector).forEach(function (container) {
      container.querySelectorAll(itemSelector).forEach(function (el, i) {
        el.classList.add("reveal");
        el.style.transitionDelay = Math.min(i * stepMs, 400) + "ms";
        observer.observe(el);
      });
    });
  }

  reveal(".section-head, .case-tagline, .case-lead, .case-note, .case-slot, .cta-band h2, .form-wrap");
  revealStagger(".proj-list", ".proj-row", 70);
  revealStagger(".steps-row", ".step-item", 90);
  revealStagger(".process-grid", ".process-item", 70);
  revealStagger(".system-cards", ".system-card", 110);
  revealStagger(".start-grid", ".start-card", 90);
  revealStagger(".compare", ".compare-col", 120);
  revealStagger(".case-rows", ".cs-row", 90);
  revealStagger(".bring-grid", ".bring-card", 40);
})();
