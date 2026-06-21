/* =========================================================
   FMC — Licensed Investment Firms register
   Generated dataset (108 firms) + grid + pagination + popup.
   window.FMC_COMPANIES is reused by the complaint form.
   Status model:
     - complaints >= 9  -> "frozen"  (Licence frozen)
     - complaints  < 9  -> "active"  (Licence active)
   40 firms carry open complaints "under review".
   ========================================================= */
(function () {
  var PER_PAGE = 9;

  /* ---- generation source data ---- */
  var BRANDS = ["Meridian", "Northbridge", "Atlas", "Sterling", "Cedar", "Harbour",
    "Equinox", "Pinnacle", "Aurora", "Kingsway", "Granite", "Vanguard",
    "Thornbury", "Blackwood", "Redwood", "Halcyon", "Irongate", "Westport"];
  var SUFFIX = ["Capital Partners", "Asset Management", "Securities", "Investments", "Markets", "Financial Group"];

  var TYPES = [
    ["Brokerage", "broker"],
    ["Asset Manager", "asset"],
    ["Derivatives Venue", "venue"],
    ["FX / CFD Broker", "broker"],
    ["Investment Adviser", "adviser"],
    ["Clearing Organization", "clearing"],
    ["Futures Broker", "broker"],
    ["Investment Bank", "bank"],
    ["Digital Asset Broker", "broker"],
    ["Pension Manager", "asset"],
    ["CFD Broker", "broker"]
  ];

  var CITIES = [
    ["London", "United Kingdom"], ["Edinburgh", "United Kingdom"], ["Manchester", "United Kingdom"],
    ["Birmingham", "United Kingdom"], ["Leeds", "United Kingdom"], ["Bristol", "United Kingdom"],
    ["Glasgow", "United Kingdom"], ["Cardiff", "United Kingdom"], ["Belfast", "United Kingdom"],
    ["Liverpool", "United Kingdom"], ["Dublin", "Ireland"], ["Frankfurt", "Germany"],
    ["Paris", "France"], ["Amsterdam", "Netherlands"], ["Luxembourg", "Luxembourg"],
    ["Zurich", "Switzerland"], ["Singapore", "Singapore"], ["Toronto", "Canada"],
    ["Sydney", "Australia"], ["Dubai", "United Arab Emirates"], ["New York", "United States"],
    ["Tokyo", "Japan"], ["Hong Kong", "Hong Kong"], ["Stockholm", "Sweden"]
  ];

  var CEOS = ["E. Hartwell", "R. Okafor", "L. Tanaka", "M. Pereira", "S. Nguyen", "K. Vogel",
    "A. Rahimi", "D. Schwartz", "C. Muller", "T. Saar", "F. MacLeod", "H. Bennett",
    "P. Adeyemi", "J. Whitfield", "N. Petrova", "O. Bianchi", "G. Larsson", "V. Costa",
    "I. Haddad", "B. Fischer"];

  var CAPITALS = ["£8,000,000", "£12,000,000", "£18,000,000", "£25,000,000", "£40,000,000",
    "£60,000,000", "£90,000,000", "£120,000,000", "£200,000,000", "£350,000,000"];

  var FUNDS = [
    "Segregated — Tier 1 custodian",
    "Segregated — independent depositary",
    "Segregated — daily reconciliation",
    "Client assets held by third-party custodian",
    "Trust-held, independently administered",
    "Margin held in segregated clearing accounts",
    "Custody assets ring-fenced",
    "Default fund + segregated margin"
  ];

  var AUDITS = ["Q1 this year — Clean", "Q2 this year — Clean", "Q3 last year — Clean",
    "Q4 last year — Clean", "Q1 this year — Minor findings closed"];

  var SERVICE_POOL = {
    broker: ["Equities", "ETFs", "Bonds", "CFDs", "FX", "Commodities", "Options", "Managed Portfolios"],
    asset: ["Mutual Funds", "Pension Mandates", "Advisory", "Liability Matching", "Index Strategies"],
    adviser: ["Financial Planning", "Discretionary Advice", "Retirement Planning", "Tax-Efficient Investing"],
    venue: ["Futures", "Options", "Clearing", "Market Data"],
    clearing: ["Clearing", "Settlement", "Risk Management", "Collateral Management"],
    bank: ["Capital Markets", "Custody", "Advisory", "Structured Products"]
  };

  /* indices (0-107) that carry open complaints, spread across all pages */
  var COMPLAINT_COUNTS = [3, 11, 2, 7, 14, 1, 9, 5, 18, 4,
    8, 2, 21, 6, 3, 12, 1, 7, 26, 4,
    9, 2, 15, 5, 3, 31, 8, 1, 11, 6,
    4, 17, 2, 9, 7, 3, 13, 1, 24, 5];

  function pad(n, len) { n = String(n); while (n.length < len) n = "0" + n; return n; }

  function buildComplaintMap() {
    var map = {};
    for (var k = 0; k < COMPLAINT_COUNTS.length; k++) {
      var idx = Math.round(k * (108 / COMPLAINT_COUNTS.length));
      if (idx > 107) idx = 107;
      while (map[idx] !== undefined) idx++;
      map[idx] = COMPLAINT_COUNTS[k];
    }
    return map;
  }

  function buildCompanies() {
    var cmap = buildComplaintMap();
    var list = [];
    for (var i = 0; i < 108; i++) {
      var brand = BRANDS[i % BRANDS.length];
      var suf = SUFFIX[Math.floor(i / BRANDS.length) % SUFFIX.length];
      var name = brand + " " + suf;
      var tp = TYPES[(i * 7 + 3) % TYPES.length];
      var type = tp[0], category = tp[1];
      var place = CITIES[(i * 5 + 2) % CITIES.length];
      var since = String(2008 + (i % 16));
      var ceo = CEOS[(i * 3 + 1) % CEOS.length];
      var capital = CAPITALS[(i * 11 + 4) % CAPITALS.length];
      var funds = FUNDS[(i * 13 + 1) % FUNDS.length];
      var audit = AUDITS[(i * 17 + 2) % AUDITS.length];
      var pool = SERVICE_POOL[category] || SERVICE_POOL.broker;
      var services = [
        pool[i % pool.length],
        pool[(i + 3) % pool.length],
        pool[(i + 6) % pool.length]
      ].filter(function (v, ix, a) { return a.indexOf(v) === ix; });

      var short = name.split(" ").map(function (w) { return w[0]; }).join("").toUpperCase().slice(0, 4);
      var complaints = cmap[i] || 0;
      var status = complaints >= 9 ? "frozen" : "active";

      if (status === "frozen") {
        funds = "Under enhanced monitoring — reconciliation under review";
        audit = "Suspended pending complaints review";
      } else if (complaints > 0) {
        audit = "Under review — open complaints";
      }

      var summary = "A " + type.toLowerCase() + " licensed by the FMC to serve retail and professional investors from its " +
        place[0] + " office. Authorisation covers the regulated activities listed below under FMC conduct and capital rules.";
      if (status === "frozen") {
        summary += " The licence is currently frozen while open complaints are reviewed.";
      }

      list.push({
        id: "FMC-" + since + "-" + pad(1000 + i, 4),
        name: name,
        short: short,
        type: type,
        category: category,
        status: status,
        complaints: complaints,
        country: place[1],
        city: place[0],
        since: since,
        services: services,
        ceo: ceo,
        website: "www." + brand.toLowerCase() + suf.split(" ")[0].toLowerCase() + ".example",
        regCapital: status === "frozen" ? capital + " (under review)" : capital,
        clientFunds: funds,
        lastAudit: audit,
        summary: summary
      });
    }
    return list;
  }

  var DEMO_COMPANIES = buildCompanies();
  var COMPANIES = DEMO_COMPANIES.slice(); /* will be replaced/prepended with DB companies */
  window.FMC_COMPANIES = COMPANIES;

  /* Map DB type string to internal category key */
  function typeToCategory(type) {
    type = (type || "").toLowerCase();
    if (type.indexOf("asset") !== -1 || type.indexOf("pension") !== -1) return "asset";
    if (type.indexOf("adviser") !== -1 || type.indexOf("advisor") !== -1) return "adviser";
    if (type.indexOf("venue") !== -1 || type.indexOf("derivatives") !== -1) return "venue";
    if (type.indexOf("clearing") !== -1) return "clearing";
    if (type.indexOf("bank") !== -1) return "bank";
    return "broker";
  }

  /* Build a full company object from a DB record */
  function dbToCompany(c) {
    var yr = c.since || String(new Date().getFullYear());
    var category = typeToCategory(c.type);
    var id = c.id || ("FMC-" + yr + "-" + String(c.db_id || 0).padStart(4, "0"));
    var pool = SERVICE_POOL[category] || SERVICE_POOL.broker;
    var i = c.db_id || 0;
    var services = [pool[i % pool.length], pool[(i + 3) % pool.length]].filter(function (v, ix, a) { return a.indexOf(v) === ix; });
    return {
      id: id,
      db_id: c.db_id,
      name: c.name,
      short: c.short || c.name.split(" ").map(function (w) { return w[0] || ""; }).join("").toUpperCase().slice(0, 4),
      type: c.type || "Brokerage",
      category: category,
      status: c.status || "active",
      complaints: 0,
      country: c.country || "United Kingdom",
      city: "",
      since: yr,
      services: services,
      ceo: "",
      website: c.website || "",
      regCapital: "",
      clientFunds: "",
      lastAudit: "",
      summary: c.summary || ("A " + (c.type || "firm").toLowerCase() + " licensed and regulated by the FMC."),
      _fromDB: true
    };
  }

  /* Fetch DB companies and prepend to COMPANIES, then re-render */
  function loadDbCompanies(cb) {
    fetch("/api/companies.php")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok && Array.isArray(data.companies) && data.companies.length) {
          var dbObjs = data.companies.map(dbToCompany);
          /* Replace COMPANIES: DB companies first, then demo companies not already in DB */
          var dbIds = {};
          dbObjs.forEach(function (c) { dbIds[c.name.toLowerCase()] = true; });
          var filteredDemo = DEMO_COMPANIES.filter(function (c) { return !dbIds[c.name.toLowerCase()]; });
          COMPANIES.length = 0;
          [].push.apply(COMPANIES, dbObjs.concat(filteredDemo));
          window.FMC_COMPANIES = COMPANIES;
        }
        if (cb) cb();
      })
      .catch(function () { if (cb) cb(); });
  }

  var openId = null;
  var page = 1;
  var lastList = COMPANIES;

  function T(k) { return (window.FMC_I18N && window.FMC_I18N.t) ? window.FMC_I18N.t(k) : k; }
  function typeLabel(type) { return T("ctype." + type); }

  function badge(status) {
    if (status === "frozen") return '<span class="badge suspended">&#9888; ' + T("comp.status.frozen") + '</span>';
    return '<span class="badge verified"><span class="tick">&#10003;</span> ' + T("comp.status.active") + '</span>';
  }

  function complaintPill(c) {
    if (!c.complaints) return "";
    return '<span class="cpill">' + c.complaints + ' ' + T("comp.underreview") + '</span>';
  }

  function render(list) {
    var grid = document.getElementById("companiesGrid");
    if (!grid) return;
    var pager = document.getElementById("compPager");
    if (!list.length) {
      grid.innerHTML = '<div class="no-results" style="grid-column:1/-1">' + T("comp.noresults") + '</div>';
      if (pager) pager.innerHTML = "";
      return;
    }
    var totalPages = Math.ceil(list.length / PER_PAGE);
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    var start = (page - 1) * PER_PAGE;
    var slice = list.slice(start, start + PER_PAGE);

    grid.innerHTML = slice.map(function (c) {
      var cRow = c.complaints
        ? '<div class="row"><span>' + T("comp.card.complaints") + '</span><b>' + c.complaints + ' &middot; ' + T("comp.underreview") + '</b></div>'
        : "";
      return '<article class="company-card' + (c.status === "frozen" ? " is-frozen" : "") + '" data-id="' + c.id + '">' +
        '<div class="logo">' + c.short + '</div>' +
        '<h3>' + c.name + '</h3>' +
        '<div class="sub">' + typeLabel(c.type) + ' &middot; ' + c.city + ', ' + c.country + '</div>' +
        '<div class="row"><span>' + T("comp.card.license") + '</span><b>' + c.id + '</b></div>' +
        '<div class="row"><span>' + T("comp.card.since") + '</span><b>' + c.since + '</b></div>' +
        cRow +
        '<div class="foot">' + badge(c.status) + '<span class="view">' + T("comp.view") + ' &rarr;</span></div>' +
        '</article>';
    }).join("");

    grid.querySelectorAll(".company-card").forEach(function (card) {
      card.addEventListener("click", function () { openModal(card.getAttribute("data-id")); });
    });

    renderPager(totalPages);
  }

  function renderPager(totalPages) {
    var pager = document.getElementById("compPager");
    if (!pager) return;
    if (totalPages <= 1) { pager.innerHTML = ""; return; }

    var items = [];
    items.push('<button class="pg-btn pg-nav" data-go="' + (page - 1) + '"' + (page === 1 ? " disabled" : "") + '>&larr; ' + T("comp.pager.prev") + '</button>');

    var nums = [];
    for (var p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) nums.push(p);
      else if (nums[nums.length - 1] !== "...") nums.push("...");
    }
    nums.forEach(function (n) {
      if (n === "...") items.push('<span class="pg-gap">&hellip;</span>');
      else items.push('<button class="pg-btn pg-num' + (n === page ? " active" : "") + '" data-go="' + n + '">' + n + '</button>');
    });

    items.push('<button class="pg-btn pg-nav" data-go="' + (page + 1) + '"' + (page === totalPages ? " disabled" : "") + '>' + T("comp.pager.next") + ' &rarr;</button>');
    pager.innerHTML = '<div class="pg-info">' + T("comp.pager.page") + ' ' + page + ' ' + T("comp.of") + ' ' + totalPages + '</div>' +
      '<div class="pg-row">' + items.join("") + '</div>';

    pager.querySelectorAll(".pg-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.hasAttribute("disabled")) return;
        page = parseInt(b.getAttribute("data-go"), 10);
        render(lastList);
        var sec = document.getElementById("companiesGrid");
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function openModal(id) {
    var c = COMPANIES.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    openId = id;
    var overlay = document.getElementById("companyModal");

    var statusNote = "";
    if (c.status === "frozen") statusNote = '<div class="callout danger" style="margin-top:14px">' + T("comp.modal.frozenNote") + '</div>';
    else if (c.complaints > 0) statusNote = '<div class="callout warn" style="margin-top:14px">' + T("comp.modal.activeComplaintsNote") + '</div>';

    var complaintsBlock =
      '<h4>' + T("comp.modal.complaintsTitle") + '</h4>' +
      '<div class="detail-grid">' +
        detail(T("comp.modal.openComplaints"), c.complaints > 0
          ? '<strong>' + c.complaints + '</strong> &middot; ' + T("comp.underreview")
          : T("comp.modal.noComplaints")) +
      '</div>';

    overlay.querySelector(".modal").innerHTML =
      '<div class="modal-head">' +
        '<div class="logo">' + c.short + '</div>' +
        '<div><h2>' + c.name + '</h2><div class="sub">' + typeLabel(c.type) + ' &middot; ' + T("comp.modal.sub") + '</div></div>' +
        '<button class="modal-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' + badge(c.status) + complaintPill(c) +
          '<span class="muted" style="font-size:.85rem">' + T("comp.modal.registerNote") + '</span></div>' +
        '<div class="license-strip">' +
          '<div><div class="muted" style="font-size:.72rem;text-transform:uppercase;letter-spacing:.05em">' + T("comp.modal.licNo") + '</div>' +
          '<div class="lic-no">' + c.id + '</div></div>' +
          '<div>' + badge(c.status) + '</div>' +
        '</div>' +
        '<p style="margin-top:16px">' + (c.summary || '') + '</p>' +
        '<h4>' + T("comp.modal.firmDetails") + '</h4>' +
        '<div class="detail-grid">' +
          detail(T("comp.d.type"), typeLabel(c.type)) +
          detail(T("comp.d.hq"), [c.city, c.country].filter(Boolean).join(", ") || "—") +
          detail(T("comp.d.since"), c.since || "—") +
          (c.ceo ? detail(T("comp.d.ceo"), c.ceo) : "") +
          (c.regCapital ? detail(T("comp.d.capital"), c.regCapital) : "") +
          (c.website ? detail(T("comp.d.website"), c.website) : "") +
        '</div>' +
        (c.clientFunds || c.lastAudit ? '<h4>' + T("comp.modal.fundsSup") + '</h4>' +
        '<div class="detail-grid">' +
          (c.clientFunds ? detail(T("comp.d.funds"), c.clientFunds) : "") +
          (c.lastAudit ? detail(T("comp.d.exam"), c.lastAudit) : "") +
        '</div>' : '') +
        complaintsBlock +
        (c.services && c.services.length ? '<h4>' + T("comp.modal.services") + '</h4>' +
        '<div class="tag-list">' + c.services.map(function (s) { return '<span>' + s + '</span>'; }).join("") + '</div>' : '') +
        statusNote +
      '</div>' +
      '<div class="modal-foot">' +
        '<span class="muted" style="font-size:.82rem">' + T("comp.modal.foot") + '</span>' +
        '<a class="btn btn-gold btn-sm" href="complaint.html?firm=' + encodeURIComponent(c.name) + '">' + T("comp.modal.complain") + '</a>' +
      '</div>';

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    overlay.querySelector(".modal-close").addEventListener("click", closeModal);
  }
  function detail(k, v) {
    return '<div class="detail"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>';
  }
  function closeModal() {
    var overlay = document.getElementById("companyModal");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    openId = null;
  }
  window.FMC_closeCompanyModal = closeModal;

  function applyFilters(resetPage) {
    var q = (document.getElementById("compSearch").value || "").toLowerCase().trim();
    var cat = document.getElementById("compCategory").value;
    var st = document.getElementById("compStatus").value;
    var filtered = COMPANIES.filter(function (c) {
      var matchQ = !q || c.name.toLowerCase().indexOf(q) !== -1 || c.id.toLowerCase().indexOf(q) !== -1 || c.country.toLowerCase().indexOf(q) !== -1 || c.city.toLowerCase().indexOf(q) !== -1;
      var matchCat = !cat || c.category === cat;
      var matchSt = !st || (st === "complaints" ? c.complaints > 0 : c.status === st);
      return matchQ && matchCat && matchSt;
    });
    lastList = filtered;
    if (resetPage !== false) page = 1;
    render(filtered);
    var count = document.getElementById("compCount");
    if (count) count.textContent = countText(filtered.length);
  }

  function countText(n) {
    return n + " " + T("comp.of") + " " + COMPANIES.length + " " + T("comp.firms");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("companiesGrid");
    if (!grid) return;

    ["compSearch", "compCategory", "compStatus"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", function () { applyFilters(true); });
      if (el) el.addEventListener("change", function () { applyFilters(true); });
    });
    var overlay = document.getElementById("companyModal");
    if (overlay) overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
    document.addEventListener("fmc:langchange", function () {
      applyFilters(false);
      if (openId) openModal(openId);
    });

    /* Load DB companies first, then render */
    loadDbCompanies(function () {
      lastList = COMPANIES;
      render(COMPANIES);
      var cnt = document.getElementById("compCount");
      if (cnt) {
        cnt.textContent = countText(COMPANIES.length);
        cnt.style.display = "";
      }
    });
  });
})();
