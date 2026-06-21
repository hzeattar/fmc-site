/* =========================================================
   FMC — shared site script
   Injects header + footer, handles nav, mobile menu, carousel.
   ========================================================= */
(function () {
  // Resolve base path so links work from / and /pages/
  var inPages = location.pathname.indexOf("/pages/") !== -1;
  var BASE = inPages ? "../" : "";
  window.FMC_BASE = BASE;

  // ---------- Brand logo (image wordmark) ----------
  function logo(cls) {
    return '<img class="brand-logo' + (cls ? ' ' + cls : '') + '" src="' +
      BASE + 'assets/img/fmc-logo.png" alt="Financial Monitoring Commission (FMC)" />';
  }
  window.FMC_LOGO = logo;
  window.FMC_SEAL = logo; // backward compatibility

  // ---------- Navigation model ----------
  var NAV = [
    {
      label: "About", key: "nav.about", href: "about.html", mega: [
        { t: "About the Commission", k: "m.aboutCommission", h: "about.html", s: "Mission, vision & mandate" },
        { t: "Commissioners & Leadership", k: "m.commissioners", h: "about.html#leadership", s: "Board of the FMC" },
        { t: "Organization", k: "m.organization", h: "about.html#organization", s: "Divisions & offices" },
        { t: "History", k: "m.history", h: "about.html#history", s: "Our establishment" },
        { t: "Careers", k: "m.careers", h: "about.html#careers", s: "Join the FMC" },
        { t: "Contact Us", k: "cta.contact", h: "contact.html", s: "Reach our offices" }
      ]
    },
    {
      label: "Industry Oversight", key: "nav.oversight", href: "oversight.html", mega: [
        { t: "Licensed Investment Firms", k: "m.licensedFirms", h: "companies.html", s: "Verified & registered firms" },
        { t: "Clearing Organizations", k: "m.clearing", h: "oversight.html#clearing", s: "Settlement & clearing" },
        { t: "Trading Venues", k: "m.venues", h: "oversight.html#venues", s: "Registered markets" },
        { t: "Intermediaries", k: "m.intermediaries", h: "oversight.html#intermediaries", s: "Brokers & advisers" },
        { t: "Registration Requirements", k: "m.registration", h: "oversight.html#registration", s: "How firms qualify" },
        { t: "Verify a Firm", k: "m.verify", h: "companies.html", s: "Check a license" }
      ]
    },
    {
      label: "Market Reports", key: "nav.reports", href: "reports.html", mega: [
        { t: "Commitments of Participants", k: "m.cop", h: "reports.html#cop", s: "Weekly positioning data" },
        { t: "Market Surveillance", k: "m.surveillance", h: "reports.html#surveillance", s: "Oversight reports" },
        { t: "Financial Data for Firms", k: "m.firmdata", h: "reports.html#firmdata", s: "Capital & customer funds" },
        { t: "Swaps & Derivatives", k: "m.swaps", h: "reports.html#swaps", s: "Reporting data" },
        { t: "Annual Reports", k: "m.annual", h: "reports.html#annual", s: "Yearly publications" }
      ]
    },
    {
      label: "Law & Regulation", key: "nav.law", href: "law.html", mega: [
        { t: "Regulations & Rules", k: "m.rules", h: "law.html#rules", s: "The FMC rulebook" },
        { t: "Federal Register Notices", k: "m.register", h: "law.html#register", s: "Official notices" },
        { t: "Rulemakings", k: "m.rulemaking", h: "law.html#rulemaking", s: "Proposed & final rules" },
        { t: "Commission Actions", k: "m.actions", h: "law.html#actions", s: "Orders & decisions" },
        { t: "Public Comments", k: "m.comments", h: "law.html#comments", s: "Submit input" }
      ]
    },
    {
      label: "Press Room", key: "nav.press", href: "press.html", mega: [
        { t: "Press Releases", k: "m.releases", h: "press.html#releases", s: "Latest announcements" },
        { t: "Speeches & Testimony", k: "m.speeches", h: "press.html#speeches", s: "Official statements" },
        { t: "Events", k: "m.events", h: "press.html#events", s: "Public meetings" },
        { t: "Media Resources", k: "m.media", h: "press.html#media", s: "For journalists" }
      ]
    },
    {
      label: "Education & Protection", key: "nav.education", href: "education.html", mega: [
        { t: "Investor Protection", k: "m.protect", h: "education.html#protect", s: "Stay safe from fraud" },
        { t: "Customer Advisories", k: "m.advisories", h: "education.html#advisories", s: "Warnings & alerts" },
        { t: "Fraud Awareness", k: "m.fraud", h: "education.html#fraud", s: "Spot the red flags" },
        { t: "Check a Firm's License", k: "m.checkLicense", h: "companies.html", s: "Before you invest" },
        { t: "Learning Center", k: "m.learn", h: "education.html#learn", s: "Guides & resources" }
      ]
    },
    {
      label: "Enforcement", key: "nav.enforcement", href: "enforcement.html", mega: [
        { t: "Enforcement Actions", k: "m.enfActions", h: "enforcement.html#actions", s: "Cases & penalties" },
        { t: "File a Complaint", k: "cta.file", h: "complaint.html", s: "Report a firm" },
        { t: "Track a Complaint", k: "cta.track", h: "track.html", s: "Check your case status" },
        { t: "Whistleblower Program", k: "m.whistle", h: "enforcement.html#whistleblower", s: "Report misconduct" },
        { t: "Report Fraud", k: "cta.report", h: "complaint.html", s: "Submit evidence" }
      ]
    }
  ];

  // ---------- Language switcher ----------
  function buildLangSwitch() {
    if (!window.FMC_I18N) return "";
    var I = window.FMC_I18N;
    var cur = I.byCode(I.lang) || I.LANGS[0];
    var items = I.LANGS.map(function (L) {
      return '<button type="button" data-lang="' + L.code + '"' +
        (L.code === I.lang ? ' class="active"' : '') + '>' +
        L.native + '<span class="native">' + L.label + '</span></button>';
    }).join("");
    return '<div class="lang-switch" id="langSwitch">' +
      '<button class="lang-btn" id="langBtn" aria-haspopup="true" aria-expanded="false">' +
        '<span class="globe"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.8 5.6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z"/></svg></span>' +
        '<span class="lang-current">' + cur.native + '</span>' +
        '<span class="caret">&#9662;</span>' +
      '</button>' +
      '<div class="lang-menu">' + items + '</div>' +
    '</div>';
  }

  // ---------- Build header ----------
  function buildHeader() {
    var navItems = NAV.map(function (item) {
      var mega = "";
      if (item.mega) {
        mega = '<div class="mega"><h4 data-i18n="' + item.key + '">' + item.label + '</h4>' +
          item.mega.map(function (m) {
            return '<a href="' + BASE + "pages/" + m.h + '"><span data-i18n="' + m.k + '">' + m.t + '</span>' +
              (m.s ? '<small>' + m.s + '</small>' : '') + '</a>';
          }).join("") + '</div>';
      }
      return '<li class="' + (item.mega ? "has-mega" : "") + '">' +
        '<a href="' + BASE + "pages/" + item.href + '" data-i18n="' + item.key + '">' + item.label + '</a>' + mega + '</li>';
    }).join("");

    return '' +
      '<div class="govuk-bar"><div class="container">' +
        '<a class="govuk-lockup" href="https://www.gov.uk" target="_blank" rel="noopener noreferrer">' +
          '<img src="' + BASE + 'assets/img/govuk-logo.png" alt="GOV.UK" />' +
        '</a>' +
        '<span class="govuk-note" data-i18n="govbar.note">This service is monitored and overseen by the UK Government</span>' +
      '</div></div>' +
      '<div class="topbar"><div class="container">' +
        '<div class="gov-note"><span class="dot"></span><span data-i18n="topbar.note">An official regulatory authority of the Financial Monitoring Commission</span></div>' +
        '<div class="topbar-links">' +
          '<a href="' + BASE + 'pages/track.html" data-i18n="cta.track">Track a Complaint</a>' +
          '<a href="' + BASE + 'pages/contact.html" data-i18n="cta.contact">Contact</a>' +
          '<a href="' + BASE + 'pages/complaint.html" data-i18n="cta.report">Report Fraud</a>' +
          buildLangSwitch() +
        '</div>' +
      '</div></div>' +
      '<header class="site-header"><div class="container header-main">' +
        '<a class="brand" href="' + BASE + 'index.html" aria-label="Financial Monitoring Commission (FMC)">' + logo() +
        '</a>' +
        '<div class="header-tools">' +
          '<div class="search-box"><input type="text" placeholder="Search fmc.org.uk" data-i18n-ph="search.ph" aria-label="Search"><button aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></button></div>' +
          '<a class="btn btn-gold btn-sm" href="' + BASE + 'pages/complaint.html" data-i18n="cta.file">File a Complaint</a>' +
          '<button class="menu-toggle" id="menuToggle" aria-label="Menu">&#9776;</button>' +
        '</div>' +
      '</div>' +
      '<nav class="main-nav" id="mainNav"><div class="container"><ul class="nav-list">' + navItems + '</ul></div></nav>' +
      '</header>';
  }

  // ---------- Build footer ----------
  function buildFooter() {
    return '' +
      '<footer class="site-footer"><div class="container">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' + logo('on-dark') +
            '<p data-i18n="footer.blurb">An independent authority safeguarding investors and overseeing the integrity of investment and derivatives markets.</p>' +
          '</div>' +
          '<div class="footer-col"><h4 data-i18n="footer.commission">Commission</h4>' +
            '<a href="' + BASE + 'pages/about.html" data-i18n="footer.aboutFmc">About the FMC</a>' +
            '<a href="' + BASE + 'pages/about.html#leadership" data-i18n="m.commissioners">Commissioners</a>' +
            '<a href="' + BASE + 'pages/oversight.html" data-i18n="nav.oversight">Industry Oversight</a>' +
            '<a href="' + BASE + 'pages/reports.html" data-i18n="nav.reports">Market Reports</a>' +
            '<a href="' + BASE + 'pages/law.html" data-i18n="nav.law">Law &amp; Regulation</a>' +
          '</div>' +
          '<div class="footer-col"><h4 data-i18n="footer.investors">For Investors</h4>' +
            '<a href="' + BASE + 'pages/companies.html" data-i18n="m.licensedFirms">Licensed Firms</a>' +
            '<a href="' + BASE + 'pages/education.html" data-i18n="m.protect">Investor Protection</a>' +
            '<a href="' + BASE + 'pages/complaint.html" data-i18n="cta.file">File a Complaint</a>' +
            '<a href="' + BASE + 'pages/track.html" data-i18n="cta.track">Track a Complaint</a>' +
            '<a href="' + BASE + 'pages/education.html#fraud" data-i18n="m.fraud">Fraud Awareness</a>' +
          '</div>' +
          '<div class="footer-col"><h4 data-i18n="footer.resources">Resources</h4>' +
            '<a href="' + BASE + 'pages/press.html" data-i18n="nav.press">Press Room</a>' +
            '<a href="' + BASE + 'pages/enforcement.html" data-i18n="nav.enforcement">Enforcement</a>' +
            '<a href="' + BASE + 'pages/contact.html" data-i18n="cta.contact">Contact Us</a>' +
            '<a href="' + BASE + 'pages/about.html#careers" data-i18n="footer.careers">Careers</a>' +
            '<a href="#" data-i18n="footer.foia">Freedom of Information</a>' +
          '</div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<div>&copy; ' + new Date().getFullYear() + ' Financial Monitoring Commission (FMC). <span data-i18n="footer.rights">All rights reserved.</span></div>' +
          '<div><a href="#" data-i18n="footer.privacy">Privacy Policy</a> &middot; <a href="#" data-i18n="footer.accessibility">Accessibility</a> &middot; <a href="#" data-i18n="footer.terms">Terms of Use</a> &middot; <a href="' + BASE + 'pages/admin.html" class="admin-link">Admin</a></div>' +
        '</div>' +
      '</div></footer>';
  }

  // ---------- Inject ----------
  function inject() {
    var h = document.getElementById("site-header");
    if (h) h.innerHTML = buildHeader();
    var f = document.getElementById("site-footer");
    if (f) f.innerHTML = buildFooter();
    wireNav();
    wireLang();
    if (window.FMC_I18N) window.FMC_I18N.apply(document);
    highlightActive();
    document.addEventListener("fmc:langchange", function (e) {
      var I = window.FMC_I18N;
      if (!I) return;
      var cur = I.byCode(e.detail.lang);
      var lc = document.querySelector(".lang-current");
      if (lc && cur) lc.textContent = cur.native;
      document.querySelectorAll(".lang-menu button").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-lang") === e.detail.lang);
      });
      highlightActive();
    });
  }

  // ---------- Language switcher behavior ----------
  function wireLang() {
    var sw = document.getElementById("langSwitch");
    if (!sw) return;
    var btn = document.getElementById("langBtn");
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = sw.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    sw.querySelectorAll(".lang-menu button").forEach(function (b) {
      b.addEventListener("click", function () {
        sw.classList.remove("open");
        if (btn) btn.setAttribute("aria-expanded", "false");
        if (window.FMC_I18N) window.FMC_I18N.setLang(b.getAttribute("data-lang"));
      });
    });
    document.addEventListener("click", function (e) {
      if (!sw.contains(e.target)) sw.classList.remove("open");
    });
  }

  // ---------- Nav behavior ----------
  function wireNav() {
    var toggle = document.getElementById("menuToggle");
    var nav = document.getElementById("mainNav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () { nav.classList.toggle("open"); });
    }
    var items = document.querySelectorAll(".nav-list > li.has-mega");
    items.forEach(function (li) {
      var link = li.querySelector(":scope > a");
      // desktop hover
      li.addEventListener("mouseenter", function () { if (window.innerWidth > 980) li.classList.add("open"); });
      li.addEventListener("mouseleave", function () { if (window.innerWidth > 980) li.classList.remove("open"); });
      // mobile / click toggle
      link.addEventListener("click", function (e) {
        if (window.innerWidth <= 980) {
          e.preventDefault();
          li.classList.toggle("open");
        }
      });
    });
  }

  function highlightActive() {
    var page = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-list > li > a").forEach(function (a) {
      if (a.getAttribute("href").indexOf(page) !== -1 && page !== "index.html") {
        a.parentElement.classList.add("active");
        a.style.borderBottomColor = "var(--gold)";
        a.style.background = "var(--navy-2)";
      }
    });
  }

  // ---------- Homepage carousel ----------
  window.FMC_initCarousel = function () {
    var slides = document.querySelectorAll(".hero .slide");
    var dotsWrap = document.querySelector(".hero-dots");
    if (!slides.length) return;
    var idx = 0, timer;
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var b = document.createElement("button");
        if (i === 0) b.classList.add("active");
        b.addEventListener("click", function () { go(i); reset(); });
        dotsWrap.appendChild(b);
      });
    }
    function go(n) {
      slides[idx].classList.remove("active");
      var dots = dotsWrap ? dotsWrap.querySelectorAll("button") : [];
      if (dots[idx]) dots[idx].classList.remove("active");
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add("active");
      if (dots[idx]) dots[idx].classList.add("active");
    }
    function next() { go(idx + 1); }
    function prev() { go(idx - 1); }
    function reset() { clearInterval(timer); timer = setInterval(next, 6000); }
    var nb = document.querySelector(".hero-arrow.next");
    var pb = document.querySelector(".hero-arrow.prev");
    if (nb) nb.addEventListener("click", function () { next(); reset(); });
    if (pb) pb.addEventListener("click", function () { prev(); reset(); });
    reset();
  };

  document.addEventListener("DOMContentLoaded", inject);
})();
