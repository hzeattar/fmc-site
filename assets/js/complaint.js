/* =========================================================
   FMC — Complaint wizard
   3 steps: (1) personal info, (2) case details, (3) evidence.
   Saves to localStorage and shows a success popup with a
   reference number that can be tracked.
   ========================================================= */
(function () {
  var current = 1;
  var TOTAL = 3;
  var files = { idDoc: null, transfer: null, platform: null };
  var otherOption = null;

  function T(k) { return (window.FMC_I18N && window.FMC_I18N.t) ? window.FMC_I18N.t(k) : k; }

  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  // ---------- Populate firm dropdown from DB API (fallback to window.FMC_COMPANIES) ----------
  function populateFirms() {
    var sel = $("#firmName");
    if (!sel) return;

    function fillSel(companies) {
      // Clear all existing options
      while (sel.options.length > 0) sel.remove(0);
      companies.forEach(function (c) {
        var o = document.createElement("option");
        o.value = c.name;
        o.textContent = c.name + "  (" + c.id + ")";
        sel.appendChild(o);
      });
      var other = document.createElement("option");
      other.value = "__other__";
      other.textContent = T("cf.f.firm.other");
      otherOption = other;
      sel.appendChild(other);

      // pre-select firm from query string (?firm=...)
      var params = new URLSearchParams(location.search);
      var firm = params.get("firm");
      if (firm) {
        var match = companies.filter(function (c) { return c.name === firm; })[0];
        if (match) sel.value = match.name;
        else { sel.value = "__other__"; toggleOther(); var fo = $("#firmOther"); if (fo) fo.value = firm; }
      }
    }

    // Try DB API first, fallback to static window.FMC_COMPANIES
    fetch("/api/companies.php")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        fillSel((data.ok && data.companies && data.companies.length) ? data.companies : (window.FMC_COMPANIES || []));
      })
      .catch(function () {
        fillSel(window.FMC_COMPANIES || []);
      });
  }
  function toggleOther() {
    var sel = $("#firmName");
    var wrap = $("#firmOtherWrap");
    if (!sel || !wrap) return;
    wrap.style.display = sel.value === "__other__" ? "flex" : "none";
  }

  // ---------- Step UI ----------
  function showStep(n) {
    current = n;
    $all(".fstep").forEach(function (s) { s.classList.remove("active"); });
    $("#fstep" + n).classList.add("active");
    $all(".steps .step").forEach(function (s, i) {
      s.classList.remove("active", "done");
      var idx = i + 1;
      if (idx < n) s.classList.add("done");
      else if (idx === n) s.classList.add("active");
    });
    window.scrollTo({ top: $(".wizard").offsetTop - 90, behavior: "smooth" });
    if (n === TOTAL) buildReview();
    saveDraftSafe();
  }

  // safe wrapper called from showStep before the saveDraft def loads
  function saveDraftSafe() { try { saveDraft(); } catch (e) {} }

  // ---------- Validation ----------
  function validateStep(n) {
    var ok = true;
    var firstBad = null;
    $all("#fstep" + n + " [data-required]").forEach(function (el) {
      var group = el.closest(".field-group");
      var valid = true;
      if (el.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      else valid = el.value.trim() !== "";
      // special case: firmOther required only when "other" chosen
      if (el.id === "firmOther" && $("#firmName").value !== "__other__") valid = true;
      if (group) group.classList.toggle("invalid", !valid);
      if (!valid && !firstBad) firstBad = el;
      if (!valid) ok = false;
    });

    // Step 3: require ID type + ID document
    if (n === 3) {
      var idType = $("input[name=idType]:checked");
      var idErr = $("#idTypeError");
      if (!idType) { idErr.style.display = "block"; ok = false; if (!firstBad) firstBad = $(".idtype-options"); }
      else idErr.style.display = "none";

      var docBlock = $("#uploadId");
      if (!files.idDoc) { docBlock.classList.add("invalid-upload"); $("#idDocError").style.display = "block"; ok = false; if (!firstBad) firstBad = docBlock; }
      else { docBlock.classList.remove("invalid-upload"); $("#idDocError").style.display = "none"; }

      var consent = $("#consent");
      if (consent && !consent.checked) { $("#consentError").style.display = "block"; ok = false; }
      else $("#consentError").style.display = "none";
    }

    if (firstBad) firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
    return ok;
  }

  // ---------- Review summary (step 3) ----------
  function val(id) { var e = $("#" + id); return e ? (e.value || "").trim() : ""; }
  function firmValue() {
    var sel = $("#firmName");
    if (!sel) return "";
    return sel.value === "__other__" ? val("firmOther") : sel.value;
  }
  function buildReview() {
    var box = $("#reviewBox");
    if (!box) return;
    box.innerHTML =
      reviewSection(T("cf.r.complainant"), [
        [T("cf.f.fullName"), val("fullName")],
        [T("cf.f.nationality"), val("nationality")],
        [T("cf.f.email"), val("email")],
        [T("cf.f.phone"), val("phone")],
        [T("cf.f.residence"), val("residence")]
      ]) +
      reviewSection(T("cf.r.case"), [
        [T("cf.r.firm"), firmValue()],
        [T("cf.r.amount"), val("amountDeposited") ? (val("currency") + " " + val("amountDeposited")) : "—"],
        [T("cf.r.balance"), val("lastBalance") ? (val("currency") + " " + val("lastBalance")) : "—"],
        [T("cf.r.contact"), val("lastContact") || "—"],
        [T("cf.r.reason"), (val("reason") || "—").substring(0, 120) + (val("reason").length > 120 ? "…" : "")]
      ]);
  }
  function reviewSection(title, rows) {
    return '<div class="review-box"><h4>' + title + '</h4>' +
      rows.map(function (r) { return '<div class="r"><span class="k">' + r[0] + '</span><span class="v">' + (r[1] || "—") + '</span></div>'; }).join("") +
      '</div>';
  }

  // ---------- File upload wiring ----------
  function wireUpload(blockId, inputId, key) {
    var block = $("#" + blockId);
    var input = $("#" + inputId);
    if (!block || !input) return;
    block.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      if (input.files && input.files[0]) {
        var f = input.files[0];
        files[key] = { name: f.name, size: f.size };
        block.classList.add("has-file");
        $(".filename", block).textContent = "\u2713 " + f.name + " (" + Math.round(f.size / 1024) + " KB)";
        $(".filename", block).style.display = "block";
        if (key === "idDoc") { block.classList.remove("invalid-upload"); $("#idDocError").style.display = "none"; }
      }
    });
  }

  // ---------- Submit ----------
  function genRef() {
    var n = Math.floor(100000 + Math.random() * 900000);
    return "FMC-CMP-" + n;
  }
  function submit() {
    if (!validateStep(3)) return;
    var idType = $("input[name=idType]:checked");
    var nowIso = new Date().toISOString();
    var record = {
      createdAt: nowIso,
      status: "received",
      state: "received",
      stateHistory: [{ state: "received", at: nowIso, by: "system" }],
      officer: null,
      appointment: null,
      infoRequest: null,
      decision: null,
      messages: [],
      extraFiles: [],
      applicantUnread: 0,
      complainant: {
        fullName: val("fullName"),
        nationality: val("nationality"),
        dob: val("dob"),
        email: val("email"),
        phone: val("phone"),
        residence: val("residence"),
        address: val("address")
      },
      case: {
        firm: firmValue(),
        currency: val("currency"),
        amountDeposited: val("amountDeposited"),
        lastBalance: val("lastBalance"),
        lastContact: val("lastContact"),
        reason: val("reason")
      },
      evidence: {
        idType: idType ? idType.value : "",
        idDoc: files.idDoc ? files.idDoc.name : null,
        transfer: files.transfer ? files.transfer.name : null,
        platform: files.platform ? files.platform.name : null
      }
    };

    var btn = $("#submitComplaint");
    if (btn) btn.disabled = true;

    fetch("/api/submit_complaint.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (btn) btn.disabled = false;
      if (data.ok) {
        clearDraft();
        showSuccess(data.ref || data.reference);
      } else {
        alert(data.error || "Failed to submit complaint. Please try again.");
      }
    })
    .catch(function() {
      if (btn) btn.disabled = false;
      alert("Network error. Please check your connection and try again.");
    });
  }

  function showSuccess(ref) {
    var overlay = $("#successModal");
    $("#successRef").textContent = ref;
    var trackBtn = $("#goTrack");
    trackBtn.setAttribute("href", "track.html?ref=" + encodeURIComponent(ref));
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  // ---------- Draft persistence (resume where the user left off) ----------
  var DRAFT_KEY = "fmc_complaint_draft";
  var draftTimer = null;

  function collectDraft() {
    var d = { step: current, fields: {}, idType: null, ts: Date.now() };
    $all(".wizard input, .wizard select, .wizard textarea").forEach(function (el) {
      if (!el.id) return;
      if (el.type === "file") return;
      if (el.name === "idType") return; // handled separately
      if (el.type === "checkbox") d.fields[el.id] = el.checked;
      else d.fields[el.id] = el.value;
    });
    var idChk = $("input[name=idType]:checked");
    if (idChk) d.idType = idChk.value;
    return d;
  }

  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft())); } catch (e) {}
  }
  function saveDraftDebounced() {
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 250);
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }

  function applyDraft(opts) {
    var raw;
    try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { return; }
    if (!raw) return;
    var d;
    try { d = JSON.parse(raw); } catch (e) { return; }
    if (!d || !d.fields) return;

    Object.keys(d.fields).forEach(function (id) {
      // skip firm if URL forces a specific firm
      if (id === "firmName" && opts && opts.skipFirm) return;
      if (id === "firmOther" && opts && opts.skipFirm) return;
      var el = document.getElementById(id);
      if (!el) return;
      if (el.type === "checkbox") el.checked = !!d.fields[id];
      else el.value = d.fields[id];
    });

    toggleOther();

    if (d.idType) {
      var rad = $("input[name=idType][value='" + d.idType + "']");
      if (rad) {
        rad.checked = true;
        var wrap = rad.closest(".idtype");
        if (wrap) {
          $all(".idtype").forEach(function (o) { o.classList.remove("selected"); });
          wrap.classList.add("selected");
        }
      }
    }

    if (d.step && d.step >= 1 && d.step <= TOTAL) showStep(d.step);
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", function () {
    if (!$(".wizard")) return;
    populateFirms();
    var firmSel = $("#firmName");
    if (firmSel) firmSel.addEventListener("change", toggleOther);

    $all(".idtype").forEach(function (opt) {
      opt.addEventListener("click", function () {
        $all(".idtype").forEach(function (o) { o.classList.remove("selected"); });
        opt.classList.add("selected");
        opt.querySelector("input").checked = true;
        $("#idTypeError").style.display = "none";
        saveDraft();
      });
    });

    wireUpload("uploadId", "idDocInput", "idDoc");
    wireUpload("uploadTransfer", "transferInput", "transfer");
    wireUpload("uploadPlatform", "platformInput", "platform");

    $all("[data-next]").forEach(function (b) {
      b.addEventListener("click", function () { if (validateStep(current)) showStep(current + 1); });
    });
    $all("[data-prev]").forEach(function (b) {
      b.addEventListener("click", function () { showStep(current - 1); });
    });
    var submitBtn = $("#submitComplaint");
    if (submitBtn) submitBtn.addEventListener("click", submit);

    document.addEventListener("fmc:langchange", function () {
      if (otherOption) otherOption.textContent = T("cf.f.firm.other");
      if (current === TOTAL) buildReview();
    });

    // Draft auto-save: any user edit inside the wizard updates localStorage
    var wiz = $(".wizard");
    if (wiz) {
      wiz.addEventListener("input", saveDraftDebounced);
      wiz.addEventListener("change", saveDraftDebounced);
    }

    // Typed date inputs (dd/mm/yyyy) — auto-insert slashes, digits only
    document.querySelectorAll("input[data-date-input]").forEach(function (el) {
      el.addEventListener("input", function (ev) {
        var d = (el.value || "").replace(/\D+/g, "").slice(0, 8);
        var out = d;
        if (d.length > 4)      out = d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4);
        else if (d.length > 2) out = d.slice(0, 2) + "/" + d.slice(2);
        if (out !== el.value) el.value = out;
      });
      el.addEventListener("blur", function () {
        var v = (el.value || "").trim();
        if (!v) return;
        var m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!m) { el.setCustomValidity("Use format dd/mm/yyyy"); return; }
        var dd = +m[1], mm = +m[2], yy = +m[3];
        if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yy < 1900 || yy > 2100) {
          el.setCustomValidity("Invalid date");
        } else {
          el.setCustomValidity("");
        }
      });
    });
    // Best-effort save when the user navigates away or refreshes
    window.addEventListener("beforeunload", saveDraft);
    window.addEventListener("pagehide", saveDraft);

    // Restore previous draft (if any) — URL ?firm=... still wins for the firm field
    var hasFirmInURL = !!new URLSearchParams(location.search).get("firm");
    var draftRaw = null;
    try { draftRaw = localStorage.getItem(DRAFT_KEY); } catch (e) {}
    if (draftRaw) {
      applyDraft({ skipFirm: hasFirmInURL });
    } else {
      showStep(1);
    }
  });
})();
