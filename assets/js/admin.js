/* =========================================================
   FMC — Admin dashboard
   Tabs: Complaints / Licensed firms / Officers
   Storage keys:
     fmc_admin_session   -> { logged: true }
     fmc_complaints      -> { ref: caseRecord }
     fmc_admin_firms     -> { id: firmOverride }   // edits + new firms
     fmc_hidden_firms    -> [id, ...]              // hidden built-ins
     fmc_officers        -> [{id, name, title, photo}]
   ========================================================= */
(function () {
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]; }); }
  function uid(p) { return p + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6); }
  function fmtDateTime(iso) {
    if (!iso) return "—";
    try { var d = new Date(iso); return d.toLocaleDateString() + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return iso; }
  }
  function initials(name) { return (name || "?").split(/\s+/).map(function (w) { return w[0] || ""; }).join("").slice(0, 2).toUpperCase(); }

  /* ---------- Auth (API session) ---------- */
  var _adminLoggedIn = false;
  function isLogged() { return _adminLoggedIn; }
  function setLogged(b) { _adminLoggedIn = !!b; }

  /* ---------- Complaints cache (from API) ---------- */
  var _casesCache = {};
  function loadCases() { return _casesCache; }
  function saveCases(o) { _casesCache = o || {}; }
  function saveCase(rec) {
    _casesCache[rec.ref] = rec;
    fetch("/api/admin_save_complaint.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(rec)
    }).catch(function(){});
  }
  function fetchCasesFromApi(done) {
    fetch("/api/admin_complaints.php", { credentials: "include" })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok && Array.isArray(data.complaints)) {
          var m = {};
          data.complaints.forEach(function(c) { if (c && c.ref) m[c.ref] = c; });
          _casesCache = m;
        }
        if (done) done();
      })
      .catch(function() { if (done) done(); });
  }

  /* ---------- Companies cache (from DB API) ---------- */
  var _firmsCache = [];
  function effectiveFirms() { return _firmsCache; }
  function fetchFirmsFromApi(done) {
    fetch("/api/admin_companies.php", { credentials: "include" })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok && Array.isArray(data.companies)) _firmsCache = data.companies;
        if (done) done();
      })
      .catch(function() { if (done) done(); });
  }

  /* ---------- Keep these for non-firms localStorage (officers, payment) ---------- */
  function loadFirmOverrides() { return {}; }
  function saveFirmOverrides() {}
  function loadHiddenFirms() { return []; }
  function saveHiddenFirms() {}

  function loadOfficers() {
    try { var raw = localStorage.getItem("fmc_officers"); if (raw) return JSON.parse(raw); } catch (e) {}
    var seeded = [
      { id: uid("of"), name: "Olivia Hartwell",  title: "Senior Investigations Officer", photo: "" },
      { id: uid("of"), name: "Daniel Whitfield", title: "Lead Case Officer",             photo: "" },
      { id: uid("of"), name: "Amira Bennett",    title: "Investigations Officer",        photo: "" },
      { id: uid("of"), name: "Marcus Tanaka",    title: "Compliance Investigator",       photo: "" }
    ];
    try { localStorage.setItem("fmc_officers", JSON.stringify(seeded)); } catch (e) {}
    return seeded;
  }
  function saveOfficers(arr) { try { localStorage.setItem("fmc_officers", JSON.stringify(arr)); } catch (e) {} }

  /* ---------- Payment settings (DB-backed via API) ---------- */
  var PAYMENT_DEFAULTS = {
    bank: {
      accountName: "Financial Monitoring Commission",
      bankName: "Bank of England",
      iban: "", swift: "", sort: "", accountNumber: "", address: "",
      reference: "Use your case reference (e.g. FMC-CMP-XXXXXX) as the payment reference."
    },
    crypto: { asset: "USDT", network: "TRC20", address: "", qr: "" }
  };
  var _paySettingsCache = null;
  function loadPaymentSettings() {
    return _paySettingsCache || JSON.parse(JSON.stringify(PAYMENT_DEFAULTS));
  }
  function fetchPaymentSettings(done) {
    fetch("/api/payment_settings.php", { credentials: "include" })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok && data.settings) _paySettingsCache = data.settings;
        if (done) done();
      })
      .catch(function() { if (done) done(); });
  }
  function savePaymentSettings(o) {
    _paySettingsCache = o;
    fetch("/api/payment_settings.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(o)
    }).catch(function(){});
  }

  /* ---------- Effective firms list (from DB cache) ---------- */
  /* effectiveFirms() and fetchFirmsFromApi() defined above */

  /* ===========================================================
     LOGIN
     =========================================================== */
  function doLogin() {
    var u = $("#adminUser").value.trim();
    var p = $("#adminPass").value;
    if (!u || !p) { $("#adminLoginErr").style.display = "block"; return; }
    var btn = $("#adminLoginBtn");
    if (btn) btn.disabled = true;
    fetch("/api/admin_login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: u, password: p })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (btn) btn.disabled = false;
      if (data.ok) { setLogged(true); showShell(); }
      else { $("#adminLoginErr").style.display = "block"; }
    })
    .catch(function() {
      if (btn) btn.disabled = false;
      $("#adminLoginErr").style.display = "block";
    });
  }
  function logout() {
    fetch("/api/admin_logout.php", { method: "POST", credentials: "include" }).catch(function(){});
    setLogged(false);
    _casesCache = {};
    $("#adminShell").style.display = "none";
    $("#adminLogin").style.display = "";
    $("#adminUser").value = "";
    $("#adminPass").value = "";
  }
  function showShell() {
    $("#adminLogin").style.display = "none";
    $("#adminShell").style.display = "";
    renderAll();
  }
  function renderAll() {
    fetchCasesFromApi(renderComplaintsList);
    fetchFirmsFromApi(renderFirms);
    fetchPaymentSettings(renderPaymentSettings);
    renderOfficers();
  }

  /* ===========================================================
     TABS
     =========================================================== */
  function switchTab(name) {
    $all(".admin-tab").forEach(function (b) { b.classList.toggle("active", b.dataset.tab === name); });
    $all(".admin-tab-panel").forEach(function (p) { p.classList.toggle("active", p.id === "tab-" + name); });
  }

  /* ===========================================================
     COMPLAINTS — list + detail
     =========================================================== */
  var STATES = ["received", "review", "call", "info", "decision", "closed"];
  var STATE_LABEL = {
    received: "Received", review: "Under review", call: "Call scheduled",
    info: "Info requested", decision: "Decision", closed: "Closed"
  };
  var selectedRef = null;

  function listComplaints() {
    var all = loadCases();
    var arr = Object.keys(all).map(function (k) { return all[k]; });
    arr.sort(function (a, b) { return (b.createdAt || "").localeCompare(a.createdAt || ""); });
    return arr;
  }

  function renderComplaintsList() {
    var arr = listComplaints();
    var q = ($("#cmpSearch").value || "").trim().toLowerCase();
    var filt = $("#cmpFilter").value;
    if (q) {
      arr = arr.filter(function (r) {
        var hay = [r.ref, r.complainant && r.complainant.fullName, r.case && r.case.firm, r.complainant && r.complainant.email].join(" ").toLowerCase();
        return hay.indexOf(q) >= 0;
      });
    }
    if (filt) arr = arr.filter(function (r) { return (r.state || "received") === filt; });

    var ul = $("#cmpList");
    if (!arr.length) {
      ul.innerHTML = '<li class="empty-row muted small">No complaints match.</li>';
      return;
    }
    ul.innerHTML = arr.map(function (r) {
      var s = r.state || "received";
      var name = (r.complainant && r.complainant.fullName) || "—";
      var firm = (r.case && r.case.firm) || "—";
      return '<li class="cmp-row ' + (selectedRef === r.ref ? "active" : "") + '" data-ref="' + esc(r.ref) + '">' +
        '<div class="cmp-row-h"><span class="cmp-ref">' + esc(r.ref) + '</span>' +
          '<span class="status-pill ' + esc(s) + '">' + esc(STATE_LABEL[s] || s) + '</span></div>' +
        '<div class="cmp-row-name">' + esc(name) + '</div>' +
        '<div class="cmp-row-firm muted small">' + esc(firm) + '</div>' +
        '<div class="cmp-row-date muted small">' + esc(fmtDateTime(r.createdAt)) + '</div>' +
        '</li>';
    }).join("");

    $all(".cmp-row", ul).forEach(function (li) {
      li.addEventListener("click", function () {
        selectedRef = li.dataset.ref;
        $all(".cmp-row", ul).forEach(function (n) { n.classList.toggle("active", n === li); });
        renderCaseDetail();
      });
    });

    if (selectedRef && !arr.some(function (r) { return r.ref === selectedRef; })) {
      selectedRef = null;
      $("#cmpDetail").innerHTML = $("#cmpDetail").innerHTML; // keep empty
    }
  }

  function kvBlock(rows) {
    return '<div class="kv-grid">' + rows.map(function (r) {
      return '<div class="kv"><div class="kv-k">' + esc(r[0]) + '</div><div class="kv-v">' + esc(r[1] || "—") + '</div></div>';
    }).join("") + '</div>';
  }

  function renderCaseDetail() {
    var pane = $("#cmpDetail");
    if (!selectedRef) return;
    var rec = loadCases()[selectedRef];
    if (!rec) {
      pane.innerHTML = '<div class="empty-pane"><h3>Case not found</h3></div>';
      return;
    }
    var c = rec.complainant || {};
    var k = rec.case || {};
    var ev = rec.evidence || {};
    var officers = loadOfficers();
    var officerOpts = '<option value="">— Assign an officer —</option>' +
      officers.map(function (o) { return '<option value="' + esc(o.id) + '"' + (rec.officer && rec.officer.id === o.id ? " selected" : "") + '>' + esc(o.name) + ' — ' + esc(o.title) + '</option>'; }).join("");

    pane.innerHTML =
      '<div class="cd-head">' +
        '<div><div class="muted small upcase">Reference</div><div class="ref-big">' + esc(rec.ref) + '</div>' +
          '<div class="muted small">Filed ' + esc(fmtDateTime(rec.createdAt)) + '</div></div>' +
        '<div><span class="status-pill ' + esc(rec.state || "received") + '">' + esc(STATE_LABEL[rec.state || "received"]) + '</span></div>' +
      '</div>' +

      '<section class="cd-section">' +
        '<h3>Information submitted by complainant</h3>' +
        kvBlock([
          ["Full name", c.fullName], ["Nationality", c.nationality], ["Date of birth", c.dob],
          ["Email", c.email], ["Phone", c.phone], ["Country of residence", c.residence],
          ["Address", c.address], ["ID document type", ev.idType]
        ]) +
      '</section>' +

      '<section class="cd-section">' +
        '<h3>Case details</h3>' +
        kvBlock([
          ["Firm complained about", k.firm],
          ["Currency", k.currency],
          ["Amount deposited", k.amountDeposited ? (k.currency + " " + k.amountDeposited) : ""],
          ["Last balance shown", k.lastBalance ? (k.currency + " " + k.lastBalance) : ""],
          ["Last contact with firm", k.lastContact],
          ["Identity document", ev.idDoc],
          ["Proof of transfer", ev.transfer],
          ["Platform screenshot", ev.platform]
        ]) +
        (k.reason ? '<div class="case-reason"><div class="kv-k upcase">Problem</div><p>' + esc(k.reason) + '</p></div>' : "") +
      '</section>' +

      '<section class="cd-section">' +
        '<h3>Assign case officer</h3>' +
        '<div class="of-assign">' +
          '<select id="cdOfficerSel">' + officerOpts + '</select>' +
          '<button class="btn btn-outline btn-sm" id="cdOfficerSave">Update officer</button>' +
        '</div>' +
        (rec.officer ? '<div class="of-card" style="margin-top:10px">' +
          (rec.officer.photo ? '<img class="of-avatar" src="' + esc(rec.officer.photo) + '" alt="">' :
            '<div class="of-avatar of-avatar-init">' + esc(initials(rec.officer.name)) + '</div>') +
          '<div class="of-meta"><div class="of-name">' + esc(rec.officer.name) + '</div>' +
          '<div class="muted small">' + esc(rec.officer.title || "") + '</div></div></div>' : "") +
      '</section>' +

      '<section class="cd-section">' +
        '<h3>Case state</h3>' +
        '<div class="state-stepper">' +
          STATES.map(function (s, i) {
            var cur = STATES.indexOf(rec.state || "received");
            var cls = i < cur ? "done" : (i === cur ? "current" : "");
            return '<button class="state-step ' + cls + '" data-state="' + s + '">' +
              '<span class="ss-num">' + (i + 1) + '</span>' +
              '<span class="ss-label">' + esc(STATE_LABEL[s]) + '</span></button>';
          }).join("") +
        '</div>' +
        renderStateForm(rec) +
      '</section>' +

      '<section class="cd-section">' +
        '<h3>Messages with complainant</h3>' +
        '<div class="chat-box" id="adChatBox"></div>' +
        '<div class="chat-input">' +
          '<textarea id="adChatText" rows="2" placeholder="Reply to complainant…"></textarea>' +
          '<button class="btn btn-gold btn-sm" id="adChatSend">Send</button>' +
        '</div>' +
      '</section>' +

      '<section class="cd-section">' +
        '<h3>Files</h3>' +
        '<div class="files-list">' +
          fileLine("Identity document", ev.idDoc) +
          fileLine("Proof of transfer", ev.transfer) +
          fileLine("Platform screenshot", ev.platform) +
        '</div>' +
        '<h4 style="margin-top:14px;font-size:.78rem;letter-spacing:.08em;color:var(--gold);text-transform:uppercase">Additional uploads from complainant</h4>' +
        '<ul class="extra-list" id="adExtraList"></ul>' +
      '</section>';

    // Wire interactions
    $("#cdOfficerSave").addEventListener("click", function () {
      var id = $("#cdOfficerSel").value;
      var rec2 = loadCases()[selectedRef];
      if (!rec2) return;
      if (!id) { rec2.officer = null; }
      else {
        var o = loadOfficers().filter(function (x) { return x.id === id; })[0];
        if (o) rec2.officer = { id: o.id, name: o.name, title: o.title, photo: o.photo };
      }
      saveCase(rec2);
      renderCaseDetail();
    });

    $all(".state-step", pane).forEach(function (b) {
      b.addEventListener("click", function () { setState(b.dataset.state); });
    });

    wireStateForms(rec);
    renderAdminChat(rec);
    renderAdminExtras(rec);

    $("#adChatSend").addEventListener("click", sendAdminMessage);
    $("#adChatText").addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendAdminMessage(); }
    });
  }

  function fileLine(label, value) {
    if (!value) return '<div class="file-row muted small">' + esc(label) + ': <em>not provided</em></div>';
    /* value may be a URL (/uploads/...) or just a filename */
    var isUrl = value.indexOf('/') === 0 || value.indexOf('http') === 0;
    var display = value.split('/').pop() || value;
    var link = isUrl
      ? ' <a class="btn btn-sm btn-outline" href="' + esc(value) + '" target="_blank" rel="noopener" download>&#8681; Download</a>' +
        ' <a class="btn btn-sm btn-outline" href="' + esc(value) + '" target="_blank" rel="noopener">&#128065; View</a>'
      : '';
    return '<div class="file-row"><span>' + esc(label) + ':</span> <strong>' + esc(display) + '</strong>' + link + '</div>';
  }

  function extraFileLine(f) {
    var name = f.name || 'file';
    var url  = f.url  || '';
    var from = f.from === 'admin' ? 'Admin' : 'Complainant';
    var link = url
      ? ' <a class="btn btn-sm btn-outline" href="' + esc(url) + '" target="_blank" rel="noopener" download>&#8681; Download</a>' +
        ' <a class="btn btn-sm btn-outline" href="' + esc(url) + '" target="_blank" rel="noopener">&#128065; View</a>'
      : '';
    return '<li class="extra-item"><span class="extra-from">' + esc(from) + '</span> <strong>' + esc(name) + '</strong>' + link + '</li>';
  }

  function renderStateForm(rec) {
    var s = rec.state || "received";
    var html = '<div class="state-form">';
    if (s === "call") {
      var ap = rec.appointment || {};
      html += '<h4>Call appointment</h4>' +
        '<div class="form-grid">' +
          '<div class="field-group"><label>Call date &amp; time</label>' +
            '<input id="sfCallDate" type="text" placeholder="dd/mm/yyyy hh:mm" value="' + esc(ap.dateText || "") + '"></div>' +
          '<div class="field-group full"><label>Note (optional)</label>' +
            '<textarea id="sfCallNote" rows="2">' + esc(ap.note || "") + '</textarea></div>' +
        '</div>' +
        '<button class="btn btn-gold btn-sm" id="sfCallSave">Save appointment</button>' +
        '<p class="muted small" style="margin-top:6px">A standard reminder is shown to the complainant — if the call is missed, the case is closed.</p>';
    }
    if (s === "info") {
      var ir = rec.infoRequest || { items: [], note: "" };
      html += '<h4>Information requested</h4>' +
        '<div class="info-items">' +
          (ir.items.length ? ir.items : [""]).map(function (it, i) {
            return '<div class="info-item-row"><input type="text" data-info-item value="' + esc(it) + '" placeholder="e.g. Bank statement for January"><button class="btn-link" data-info-rm>×</button></div>';
          }).join("") +
        '</div>' +
        '<button class="btn btn-outline btn-sm" id="sfInfoAdd">+ Add another item</button>' +
        '<div class="field-group full" style="margin-top:10px"><label>Note (optional)</label>' +
          '<textarea id="sfInfoNote" rows="2">' + esc(ir.note || "") + '</textarea></div>' +
        '<button class="btn btn-gold btn-sm" id="sfInfoSave">Save info request</button>';
    }
    if (s === "decision") {
      var d = rec.decision || { text: "", payment: { enabled: false, amount: "", currency: "GBP", status: "awaiting" } };
      var pay = d.payment || { enabled: false, amount: "", currency: "GBP", status: "awaiting" };
      // Backward-compat: map old paid:true → status:"received"
      if (!pay.status) pay.status = pay.paid ? "received" : "awaiting";
      var statusOpts = [
        { v: "awaiting",  l: "Awaiting payment" },
        { v: "reviewing", l: "Payment under review" },
        { v: "received",  l: "Payment received — file under final review" }
      ];
      html += '<h4>Committee decision</h4>' +
        '<div class="field-group full"><label>Decision text</label>' +
          '<textarea id="sfDecText" rows="4" placeholder="Outcome, reasoning and next steps for the complainant…">' + esc(d.text || "") + '</textarea></div>' +

        '<div class="pay-toggle"><label><input type="checkbox" id="sfPayEnabled" ' + (pay.enabled ? "checked" : "") + '> Require payment to the FMC</label></div>' +
        '<div class="pay-fields" id="sfPayFields" style="' + (pay.enabled ? "" : "display:none") + '">' +
          '<div class="form-grid">' +
            '<div class="field-group"><label>Amount</label>' +
              '<input id="sfPayAmount" type="number" min="0" step="any" value="' + esc(pay.amount || "") + '"></div>' +
            '<div class="field-group"><label>Currency</label>' +
              '<select id="sfPayCurrency">' + ["GBP","USD","EUR"].map(function (cc) { return '<option' + (pay.currency === cc ? " selected" : "") + '>' + cc + '</option>'; }).join("") + '</select></div>' +
            '<div class="field-group full"><label>Payment status</label>' +
              '<select id="sfPayStatus">' + statusOpts.map(function (o) { return '<option value="' + o.v + '"' + (pay.status === o.v ? " selected" : "") + '>' + o.l + '</option>'; }).join("") + '</select></div>' +
          '</div>' +
        '</div>' +

        '<button class="btn btn-gold btn-sm" id="sfDecSave" style="margin-top:8px">Save decision</button>';
    }
    if (s === "closed") {
      html += '<p class="muted small">The case is closed. No further actions can be taken from the complainant side.</p>';
    }
    html += '</div>';
    return html;
  }

  function wireStateForms(rec) {
    // Call
    var btn = $("#sfCallSave");
    if (btn) {
      btn.addEventListener("click", function () {
        var dt = $("#sfCallDate").value.trim();
        var note = $("#sfCallNote").value.trim();
        var iso = parseDt(dt);
        var rec2 = loadCases()[selectedRef]; if (!rec2) return;
        rec2.appointment = { dateText: dt, at: iso || null, note: note };
        saveCase(rec2);
        renderCaseDetail();
        renderComplaintsList();
      });
    }
    // Info
    var add = $("#sfInfoAdd");
    if (add) {
      add.addEventListener("click", function (e) {
        e.preventDefault();
        var wrap = $(".info-items");
        var row = document.createElement("div");
        row.className = "info-item-row";
        row.innerHTML = '<input type="text" data-info-item placeholder="e.g. Additional document"><button class="btn-link" data-info-rm>×</button>';
        wrap.appendChild(row);
      });
    }
    document.addEventListener("click", function (e) {
      if (e.target && e.target.matches("[data-info-rm]")) {
        e.preventDefault();
        var row = e.target.closest(".info-item-row");
        if (row) row.remove();
      }
    });
    var infoSave = $("#sfInfoSave");
    if (infoSave) {
      infoSave.addEventListener("click", function () {
        var items = $all("[data-info-item]").map(function (i) { return i.value.trim(); }).filter(Boolean);
        var note = $("#sfInfoNote").value.trim();
        var rec2 = loadCases()[selectedRef]; if (!rec2) return;
        rec2.infoRequest = { items: items, note: note };
        saveCase(rec2);
        renderCaseDetail();
      });
    }
    // Decision
    var payCk = $("#sfPayEnabled");
    if (payCk) {
      payCk.addEventListener("change", function () {
        $("#sfPayFields").style.display = payCk.checked ? "" : "none";
      });
    }
    var dSave = $("#sfDecSave");
    if (dSave) {
      dSave.addEventListener("click", function () {
        var rec2 = loadCases()[selectedRef]; if (!rec2) return;
        var prev = (rec2.decision && rec2.decision.payment) || {};
        var newStatus = ($("#sfPayStatus") && $("#sfPayStatus").value) || "awaiting";
        var statusChangedAt = prev.statusChangedAt || null;
        if (prev.status !== newStatus) statusChangedAt = new Date().toISOString();
        rec2.decision = {
          text: $("#sfDecText").value.trim(),
          payment: {
            enabled: $("#sfPayEnabled").checked,
            amount: $("#sfPayAmount") ? $("#sfPayAmount").value : "",
            currency: $("#sfPayCurrency") ? $("#sfPayCurrency").value : "GBP",
            status: newStatus,
            statusChangedAt: statusChangedAt
          }
        };
        saveCase(rec2);
        renderCaseDetail();
      });
    }
  }
  function parseDt(s) {
    var m = (s || "").match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
    if (!m) return null;
    var d = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  function setState(state) {
    var rec = loadCases()[selectedRef]; if (!rec) return;
    rec.state = state;
    rec.status = state; // legacy mirror
    rec.stateHistory = rec.stateHistory || [];
    rec.stateHistory.push({ state: state, at: new Date().toISOString(), by: "admin" });
    saveCase(rec);
    renderCaseDetail();
    renderComplaintsList();
  }

  function adVerifiedBadge() {
    return '<span class="verified-badge" title="Verified" aria-label="Verified">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path class="vb-bg" d="M12 2.6l2.4 1.7 2.9-.4 1.4 2.6 2.6 1.4-.4 2.9L22.6 12l-1.7 2.4.4 2.9-2.6 1.4-1.4 2.6-2.9-.4L12 22.6l-2.4-1.7-2.9.4-1.4-2.6-2.6-1.4.4-2.9L1.4 12l1.7-2.4-.4-2.9 2.6-1.4L6.7 2.7l2.9.4z"/>' +
        '<path class="vb-tick" d="M8 12.4l2.6 2.6L16.2 9.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></span>';
  }
  function adOfficerAvatarSm(o) {
    if (o && o.photo) return '<img class="of-avatar sm" src="' + esc(o.photo) + '" alt="">';
    var nm = (o && o.name) || "?";
    return '<div class="of-avatar sm of-avatar-init">' + esc(initials(nm)) + '</div>';
  }
  function renderAdminChat(rec) {
    var box = $("#adChatBox");
    var msgs = rec.messages || [];
    if (!msgs.length) {
      box.innerHTML = '<div class="chat-empty muted small">No messages yet.</div>';
      return;
    }
    var officer = rec.officer || null;
    box.innerHTML = msgs.map(function (m, idx) {
      var isOfficer = m.from === "officer";
      var side = isOfficer ? "officer" : "applicant";
      if (isOfficer) {
        var who = m.author || (officer && officer.name) || "Case officer";
        var role = (officer && officer.title) || "Case officer";
        var avatar = adOfficerAvatarSm({ name: who, photo: officer && officer.photo });
        var actions = '<div class="chat-actions">' +
          '<button class="chat-action-btn" data-act="edit" data-idx="' + idx + '" title="Edit">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>' +
          '</button>' +
          '<button class="chat-action-btn danger" data-act="del" data-idx="' + idx + '" title="Delete">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>' +
          '</button>' +
        '</div>';
        return '<div class="chat-msg ' + side + '" data-idx="' + idx + '">' +
          '<div class="chat-avatar">' + avatar + adVerifiedBadge() + '</div>' +
          '<div class="chat-body">' +
            '<div class="chat-meta">' +
              '<span class="chat-who">' + esc(who) + '</span>' +
              '<span class="chat-role muted small">' + esc(role) + '</span>' +
              '<span class="chat-time muted small">' + esc(fmtDateTime(m.at)) + '</span>' +
            '</div>' +
            '<div class="chat-bubble">' + esc(m.text) + '</div>' +
            actions +
          '</div>' +
        '</div>';
      }
      var whoApp = (rec.complainant && rec.complainant.fullName) || "Complainant";
      return '<div class="chat-msg ' + side + '">' +
        '<div class="chat-body">' +
          '<div class="chat-meta">' +
            '<span class="chat-who">' + esc(whoApp) + '</span>' +
            '<span class="chat-time muted small">' + esc(fmtDateTime(m.at)) + '</span>' +
          '</div>' +
          '<div class="chat-bubble">' + esc(m.text) + '</div>' +
        '</div>' +
      '</div>';
    }).join("");
    box.scrollTop = box.scrollHeight;

    // Wire edit/delete handlers
    $all(".chat-action-btn", box).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var act = btn.dataset.act;
        var idx = parseInt(btn.dataset.idx, 10);
        if (isNaN(idx)) return;
        if (act === "edit")  editAdminMessage(idx);
        if (act === "del")   deleteAdminMessage(idx);
      });
    });
  }
  function editAdminMessage(idx) {
    var rec = loadCases()[selectedRef]; if (!rec) return;
    var m = (rec.messages || [])[idx]; if (!m) return;
    var current = m.text || "";
    var next = window.prompt("Edit message:", current);
    if (next == null) return;
    next = next.trim();
    if (!next) { deleteAdminMessage(idx); return; }
    if (next === current) return;
    m.text = next;
    m.editedAt = new Date().toISOString();
    rec.messages[idx] = m;
    saveCase(rec);
    renderAdminChat(rec);
  }
  function deleteAdminMessage(idx) {
    var rec = loadCases()[selectedRef]; if (!rec) return;
    if (!rec.messages || !rec.messages[idx]) return;
    if (!confirm("Delete this message?")) return;
    rec.messages.splice(idx, 1);
    saveCase(rec);
    renderAdminChat(rec);
  }
  function sendAdminMessage() {
    var txt = ($("#adChatText").value || "").trim();
    if (!txt) return;
    var rec = loadCases()[selectedRef]; if (!rec) return;
    rec.messages = rec.messages || [];
    var author = (rec.officer && rec.officer.name) || "Case officer";
    rec.messages.push({ from: "officer", author: author, text: txt, at: new Date().toISOString() });
    rec.applicantUnread = (parseInt(rec.applicantUnread || 0, 10) || 0) + 1;
    saveCase(rec);
    $("#adChatText").value = "";
    renderAdminChat(rec);
  }
  function renderAdminExtras(rec) {
    var ul = $("#adExtraList");
    var arr = rec.extraFiles || [];
    if (!arr.length) { ul.innerHTML = '<li class="muted small">No additional files yet.</li>'; return; }
    ul.innerHTML = arr.map(function (f) {
      return extraFileLine(f) +
        '<span class="ef-meta muted small" style="display:block;margin-left:8px">' +
        (f.from === "applicant" ? "Complainant" : "Officer") +
        ' · ' + esc(fmtDateTime(f.at)) +
        (f.size ? ' · ' + Math.round((f.size || 0) / 1024) + ' KB' : '') +
        '</span>';
    }).join("");
  }

  /* ===========================================================
     FIRMS — table + add/edit/delete
     =========================================================== */
  var editingFirmId = null;

  function renderFirms() {
    var arr = effectiveFirms();
    var q = ($("#firmSearch").value || "").trim().toLowerCase();
    var st = $("#firmStatusFilter").value;
    if (q) arr = arr.filter(function (f) { return (f.name + " " + f.id + " " + f.city + " " + f.country).toLowerCase().indexOf(q) >= 0; });
    if (st) arr = arr.filter(function (f) { return f.status === st; });

    var body = $("#firmsBody");
    if (!arr.length) { body.innerHTML = '<tr><td colspan="7" class="muted small" style="text-align:center;padding:20px">No firms match.</td></tr>'; return; }
    body.innerHTML = arr.slice(0, 200).map(function (f) {
      var stCls = f.status === "frozen" ? "frozen" : "active";
      return '<tr data-id="' + esc(f.id) + '">' +
        '<td><code class="muted small">' + esc(f.id) + '</code></td>' +
        '<td><strong>' + esc(f.name) + '</strong></td>' +
        '<td class="muted small">' + esc(f.type || "—") + '</td>' +
        '<td class="muted small">' + esc(f.city || "—") + '</td>' +
        '<td><span class="status-pill ' + stCls + '">' + esc(f.status) + '</span></td>' +
        '<td>' + (f.complaints || 0) + '</td>' +
        '<td><button class="btn-link firm-edit">Edit</button> <button class="btn-link firm-del">Delete</button></td>' +
        '</tr>';
    }).join("") +
    (arr.length > 200 ? '<tr><td colspan="7" class="muted small" style="text-align:center;padding:10px">Showing first 200 of ' + arr.length + ' — refine your search to see more.</td></tr>' : "");

    $all(".firm-edit", body).forEach(function (b) {
      b.addEventListener("click", function () { openFirmModal(b.closest("tr").dataset.id); });
    });
    $all(".firm-del", body).forEach(function (b) {
      b.addEventListener("click", function () { deleteFirm(b.closest("tr").dataset.id); });
    });
  }

  function openFirmModal(id) {
    editingFirmId = id || null;
    var f = id ? effectiveFirms().filter(function (x) { return x.id === id; })[0] : null;
    $("#firmModalTitle").textContent = f ? "Edit firm" : "Add firm";
    $("#firmModalSub").textContent = f ? f.name : "Create a new licensed firm record";
    $("#firmDelete").style.display = f ? "" : "none";
    $("#fmName").value = f ? f.name : "";
    $("#fmId").value = f ? f.id : "";
    $("#fmType").value = f ? (f.type || "") : "";
    $("#fmCity").value = f ? (f.city || "") : "";
    $("#fmCountry").value = f ? (f.country || "United Kingdom") : "United Kingdom";
    $("#fmSince").value = f ? (f.since || "") : String(new Date().getFullYear());
    $("#fmCeo").value = f ? (f.ceo || "") : "";
    $("#fmStatus").value = f ? (f.status || "active") : "active";
    $("#fmComplaints").value = f ? (f.complaints || 0) : 0;
    $("#fmCapital").value = f ? (f.regCapital || "") : "";
    $("#fmWeb").value = f ? (f.website || "") : "";
    $("#fmServices").value = f ? (f.services || []).join(", ") : "";
    $("#fmSummary").value = f ? (f.summary || "") : "";
    $("#firmModal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeFirmModal() {
    $("#firmModal").classList.remove("open");
    document.body.style.overflow = "";
    editingFirmId = null;
  }
  function saveFirm() {
    var name = ($("#fmName").value || "").trim();
    if (!name) { alert("Firm name is required."); return; }

    // Find db_id if editing existing
    var dbId = 0;
    if (editingFirmId) {
      var existing = _firmsCache.filter(function(f) { return f.id === editingFirmId; })[0];
      if (existing) dbId = existing.db_id || 0;
    }

    var payload = {
      db_id:          dbId,
      name:           name,
      license_number: $("#fmId").value.trim(),
      type:           $("#fmType").value.trim(),
      country:        $("#fmCountry").value.trim(),
      since:          parseInt($("#fmSince").value, 10) || new Date().getFullYear(),
      status:         $("#fmStatus").value,
      website:        $("#fmWeb").value.trim(),
      summary:        $("#fmSummary").value.trim()
    };

    fetch("/api/admin_companies.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) {
        closeFirmModal();
        fetchFirmsFromApi(renderFirms);
      } else {
        alert("Failed to save firm: " + (data.error || "Unknown error"));
      }
    })
    .catch(function() { alert("Network error. Please try again."); });
  }
  function deleteFirm(id) {
    if (!confirm("Delete this firm from the register?")) return;
    var existing = _firmsCache.filter(function(f) { return f.id === id; })[0];
    if (!existing || !existing.db_id) {
      alert("Cannot delete this firm.");
      return;
    }
    fetch("/api/admin_companies.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ db_id: existing.db_id })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) {
        if (editingFirmId === id) closeFirmModal();
        fetchFirmsFromApi(renderFirms);
      } else {
        alert("Failed to delete firm: " + (data.error || "Unknown error"));
      }
    })
    .catch(function() { alert("Network error. Please try again."); });
  }

  /* ===========================================================
     OFFICERS
     =========================================================== */
  var editingOfficerId = null;
  var pendingPhoto = "";

  function renderOfficers() {
    var arr = loadOfficers();
    var grid = $("#officersGrid");
    if (!arr.length) { grid.innerHTML = '<p class="muted">No officers yet.</p>'; return; }
    grid.innerHTML = arr.map(function (o) {
      return '<div class="officer-card" data-id="' + esc(o.id) + '">' +
        (o.photo ? '<img class="of-avatar lg" src="' + esc(o.photo) + '" alt="">' : '<div class="of-avatar of-avatar-init lg">' + esc(initials(o.name)) + '</div>') +
        '<div class="of-name">' + esc(o.name) + '</div>' +
        '<div class="muted small">' + esc(o.title || "") + '</div>' +
        '<div class="of-actions"><button class="btn-link of-edit">Edit</button> <button class="btn-link of-del">Delete</button></div>' +
        '</div>';
    }).join("");

    $all(".of-edit", grid).forEach(function (b) {
      b.addEventListener("click", function () { openOfficerModal(b.closest(".officer-card").dataset.id); });
    });
    $all(".of-del", grid).forEach(function (b) {
      b.addEventListener("click", function () { deleteOfficer(b.closest(".officer-card").dataset.id); });
    });
  }

  function openOfficerModal(id) {
    editingOfficerId = id || null;
    pendingPhoto = "";
    var o = id ? loadOfficers().filter(function (x) { return x.id === id; })[0] : null;
    $("#ofModalTitle").textContent = o ? "Edit officer" : "Add officer";
    $("#ofDelete").style.display = o ? "" : "none";
    $("#ofName").value = o ? o.name : "";
    $("#ofTitle").value = o ? (o.title || "") : "";
    pendingPhoto = o ? (o.photo || "") : "";
    refreshOfficerPreview(pendingPhoto, $("#ofName").value);
    $("#ofPhotoInput").value = "";
    $("#officerModal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeOfficerModal() {
    $("#officerModal").classList.remove("open");
    document.body.style.overflow = "";
    editingOfficerId = null;
    pendingPhoto = "";
  }
  function refreshOfficerPreview(photo, name) {
    var el = $("#ofPreview");
    var clear = $("#ofPhotoClear");
    if (photo) {
      el.outerHTML = '<img id="ofPreview" class="of-avatar lg" src="' + esc(photo) + '" alt="">';
      clear.style.display = "";
    } else {
      el.outerHTML = '<div id="ofPreview" class="of-avatar of-avatar-init lg pending">' + esc(initials(name) || "?") + '</div>';
      clear.style.display = "none";
    }
  }
  function saveOfficer() {
    var arr = loadOfficers();
    var name = $("#ofName").value.trim();
    var title = $("#ofTitle").value.trim();
    if (!name) { alert("Officer name is required."); return; }
    if (editingOfficerId) {
      arr = arr.map(function (o) {
        return o.id === editingOfficerId ? { id: o.id, name: name, title: title, photo: pendingPhoto } : o;
      });
    } else {
      arr.push({ id: uid("of"), name: name, title: title, photo: pendingPhoto });
    }
    saveOfficers(arr);
    closeOfficerModal();
    renderOfficers();
    // refresh case detail in case officer info changed
    if (selectedRef) renderCaseDetail();
  }
  function deleteOfficer(id) {
    if (!confirm("Delete this officer?")) return;
    saveOfficers(loadOfficers().filter(function (o) { return o.id !== id; }));
    closeOfficerModal();
    renderOfficers();
  }
  function readPhoto(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ===========================================================
     PAYMENT SETTINGS (global)
     =========================================================== */
  var pendingQr = null; // null = unchanged, ""=cleared, "data:..."=new
  function renderPaymentSettings() {
    var s = loadPaymentSettings();
    var bk = s.bank || {};
    var cr = s.crypto || {};
    if ($("#psBankName"))    $("#psBankName").value    = bk.accountName || "";
    if ($("#psBankBank"))    $("#psBankBank").value    = bk.bankName || "";
    if ($("#psBankIban"))    $("#psBankIban").value    = bk.iban || "";
    if ($("#psBankSwift"))   $("#psBankSwift").value   = bk.swift || "";
    if ($("#psBankSort"))    $("#psBankSort").value    = bk.sort || "";
    if ($("#psBankAccount")) $("#psBankAccount").value = bk.accountNumber || "";
    if ($("#psBankAddress")) $("#psBankAddress").value = bk.address || "";
    if ($("#psBankRef"))     $("#psBankRef").value     = bk.reference || "";
    if ($("#psCryptoAsset"))   $("#psCryptoAsset").value   = cr.asset || "USDT";
    if ($("#psCryptoNetwork")) $("#psCryptoNetwork").value = cr.network || "TRC20";
    if ($("#psCryptoAddress")) $("#psCryptoAddress").value = cr.address || "";
    refreshQrPreview(cr.qr || "");
    pendingQr = null;
    if ($("#psSavedNote")) $("#psSavedNote").textContent = "";
  }
  function refreshQrPreview(dataUrl) {
    var box = $("#psQrPreview");
    var clr = $("#psQrClear");
    if (!box) return;
    if (dataUrl) {
      box.innerHTML = '<img src="' + dataUrl + '" alt="QR">';
      box.classList.remove("qr-preview-empty");
      if (clr) clr.style.display = "";
    } else {
      box.textContent = "QR";
      box.classList.add("qr-preview-empty");
      if (clr) clr.style.display = "none";
    }
  }
  function savePaymentSettingsFromForm() {
    var current = loadPaymentSettings();
    var qr = pendingQr === null ? (current.crypto && current.crypto.qr) || "" : pendingQr;
    var out = {
      bank: {
        accountName:   $("#psBankName").value.trim(),
        bankName:      $("#psBankBank").value.trim(),
        iban:          $("#psBankIban").value.trim(),
        swift:         $("#psBankSwift").value.trim(),
        sort:          $("#psBankSort").value.trim(),
        accountNumber: $("#psBankAccount").value.trim(),
        address:       $("#psBankAddress").value.trim(),
        reference:     $("#psBankRef").value.trim()
      },
      crypto: {
        asset:   $("#psCryptoAsset").value.trim() || "USDT",
        network: $("#psCryptoNetwork").value.trim() || "TRC20",
        address: $("#psCryptoAddress").value.trim(),
        qr: qr
      }
    };
    savePaymentSettings(out);
    pendingQr = null;
    if ($("#psSavedNote")) {
      $("#psSavedNote").textContent = "Saved · " + new Date().toLocaleTimeString();
      setTimeout(function () { if ($("#psSavedNote")) $("#psSavedNote").textContent = ""; }, 4000);
    }
  }

  /* ===========================================================
     INIT
     =========================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    /* Check server session on page load */
    fetch("/api/admin_session.php", { credentials: "include" })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok) { setLogged(true); showShell(); }
        else { $("#adminLogin").style.display = ""; }
      })
      .catch(function() { $("#adminLogin").style.display = ""; });

    $("#adminLoginBtn").addEventListener("click", doLogin);
    $("#adminPass").addEventListener("keydown", function (e) { if (e.key === "Enter") doLogin(); });
    $("#adminLogout").addEventListener("click", logout);

    $all(".admin-tab").forEach(function (b) {
      b.addEventListener("click", function () { switchTab(b.dataset.tab); });
    });

    // complaints
    $("#cmpSearch").addEventListener("input", renderComplaintsList);
    $("#cmpFilter").addEventListener("change", renderComplaintsList);

    // firms
    $("#addFirmBtn").addEventListener("click", function () { openFirmModal(null); });
    $all("[data-close-firm]").forEach(function (b) { b.addEventListener("click", closeFirmModal); });
    $("#firmSave").addEventListener("click", saveFirm);
    $("#firmDelete").addEventListener("click", function () { if (editingFirmId) deleteFirm(editingFirmId); });
    $("#firmSearch").addEventListener("input", renderFirms);
    $("#firmStatusFilter").addEventListener("change", renderFirms);

    // officers
    $("#addOfficerBtn").addEventListener("click", function () { openOfficerModal(null); });
    $all("[data-close-officer]").forEach(function (b) { b.addEventListener("click", closeOfficerModal); });
    $("#ofSave").addEventListener("click", saveOfficer);
    $("#ofDelete").addEventListener("click", function () { if (editingOfficerId) deleteOfficer(editingOfficerId); });
    $("#ofPhotoInput").addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      readPhoto(f).then(function (data) {
        pendingPhoto = data;
        refreshOfficerPreview(pendingPhoto, $("#ofName").value);
      });
    });
    $("#ofPhotoClear").addEventListener("click", function () {
      pendingPhoto = "";
      refreshOfficerPreview(pendingPhoto, $("#ofName").value);
    });
    $("#ofName").addEventListener("input", function () {
      if (!pendingPhoto) refreshOfficerPreview("", $("#ofName").value);
    });

    // payment settings
    if ($("#psSave")) $("#psSave").addEventListener("click", savePaymentSettingsFromForm);
    if ($("#psQrInput")) $("#psQrInput").addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      readPhoto(f).then(function (data) {
        pendingQr = data;
        refreshQrPreview(data);
      });
    });
    if ($("#psQrClear")) $("#psQrClear").addEventListener("click", function () {
      pendingQr = "";
      refreshQrPreview("");
    });

    /* Periodic API sync every 10s */
    setInterval(function () {
      if (!isLogged()) return;
      fetchCasesFromApi(function() {
        renderComplaintsList();
        if (selectedRef) {
          var rec = loadCases()[selectedRef];
          if (rec) {
            if ($("#adChatBox")) renderAdminChat(rec);
            if ($("#adExtraList")) renderAdminExtras(rec);
          }
        }
      });
    }, 10000);
  });
})();
