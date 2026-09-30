/* Contact page: selector boxes sync the dropdown; the form POSTs to Web3Forms (key in js/config.js). */
(function () {
  var cfg = window.PARADUS || {};
  var form = document.getElementById("inquiryForm");
  if (!form) return;

  var keyField = document.getElementById("f-access-key");
  if (keyField) keyField.value = cfg.web3formsKey || "";

  // "What are you bringing?" boxes -> dropdown
  var grid = document.getElementById("bringGrid");
  var need = document.getElementById("f-need");
  if (grid) {
    grid.addEventListener("click", function (e) {
      var card = e.target.closest(".bring-card");
      if (!card) return;
      grid.querySelectorAll(".bring-card").forEach(function (c) { c.classList.remove("sel"); });
      card.classList.add("sel");
      var val = card.dataset.val.toLowerCase();
      Array.prototype.forEach.call(need.options, function (o) {
        if (o.value.toLowerCase() === val) need.value = o.value;
      });
      document.getElementById("f-about").focus({ preventScroll: false });
    });
  }

  var btn = document.getElementById("formSubmitBtn");
  var ok = document.getElementById("formSuccess");
  var err = document.getElementById("formError");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    ok.classList.remove("show"); err.classList.remove("show");
    if (!cfg.web3formsKey) { console.warn("Set web3formsKey in js/config.js to enable the contact form."); err.classList.add("show"); return; }

    var label = btn.textContent;
    btn.disabled = true; btn.textContent = "Sending…";
    fetch("47a2cc8b-e750-409c-a2cf-16363a37620b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        btn.disabled = false; btn.textContent = label;
        if (data.success) {
          ok.classList.add("show"); form.reset();
          grid && grid.querySelectorAll(".bring-card").forEach(function (c) { c.classList.remove("sel"); });
        } else { err.classList.add("show"); }
      })
      .catch(function () { btn.disabled = false; btn.textContent = label; err.classList.add("show"); });
  });
})();
