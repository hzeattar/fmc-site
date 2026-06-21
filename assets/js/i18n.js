/* =========================================================
   FMC — Internationalization engine + translations
   Languages: en, ar (RTL), ru, fr, es, zh, hi
   ========================================================= */
(function () {
  var LANGS = [
    { code: "en", native: "English", label: "English", dir: "ltr" },
    { code: "ar", native: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", label: "Arabic", dir: "rtl" },
    { code: "ru", native: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", label: "Russian", dir: "ltr" },
    { code: "fr", native: "Fran\u00e7ais", label: "French", dir: "ltr" },
    { code: "es", native: "Espa\u00f1ol", label: "Spanish", dir: "ltr" },
    { code: "zh", native: "\u4e2d\u6587", label: "Chinese", dir: "ltr" },
    { code: "hi", native: "\u0939\u093f\u0928\u094d\u0926\u0940", label: "Hindi", dir: "ltr" }
  ];

  var T = window.FMC_TRANSLATIONS || {};

  var stored = null;
  try { stored = localStorage.getItem("fmc_lang"); } catch (e) {}
  var lang = stored && byCode(stored) ? stored : "en";

  function byCode(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return null;
  }

  function t(key) {
    var d = T[lang] || {};
    if (Object.prototype.hasOwnProperty.call(d, key)) return d[key];
    var en = T.en || {};
    if (Object.prototype.hasOwnProperty.call(en, key)) return en[key];
    return key;
  }

  function apply(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    root.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    root.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    root.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
  }

  function applyDir() {
    var L = byCode(lang) || LANGS[0];
    document.documentElement.lang = lang;
    document.documentElement.dir = L.dir;
  }

  function setLang(code) {
    if (!byCode(code)) return;
    lang = code;
    try { localStorage.setItem("fmc_lang", code); } catch (e) {}
    applyDir();
    apply(document);
    document.dispatchEvent(new CustomEvent("fmc:langchange", { detail: { lang: code } }));
  }

  // set <html dir/lang> as early as possible (before body paints)
  applyDir();
  document.addEventListener("DOMContentLoaded", function () { apply(document); });

  window.FMC_I18N = {
    LANGS: LANGS,
    t: t,
    apply: apply,
    setLang: setLang,
    byCode: byCode,
    get lang() { return lang; }
  };
})();
