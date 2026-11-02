/*
 * Shared checklist progress for every guide in this repo.
 *
 * How saving works:
 *   - Each guide page sets <body data-guide="..." data-storage-key="..."> .
 *   - Every checkbox with a data-task="..." attribute is saved in the
 *     visitor's own browser (localStorage) under that storage key.
 *   - Nothing is sent to a server. Each visitor, browser and device has
 *     its own progress. Use Export / Import to move progress elsewhere.
 *
 * Load this script AFTER the page has rendered its checkboxes.
 */
(function () {
  "use strict";

  var body = document.body;
  var guide = body.dataset.guide || "guide";
  var key = body.dataset.storageKey || "wow-forever-" + guide;
  var metaKey = key + ":meta";
  var title = body.dataset.guideTitle || document.title;
  var boxes = Array.prototype.slice.call(document.querySelectorAll("input[data-task]"));

  function read(k) {
    try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }

  var saved = read(key) || {};
  var storageOk = write(key + ":probe", 1);
  try { localStorage.removeItem(key + ":probe"); } catch (e) {}

  function countDone() { return boxes.filter(function (b) { return b.checked; }).length; }

  function persist() {
    write(key, saved);
    // Small summary the start page (index.html) reads to show progress bars.
    write(metaKey, { title: title, done: countDone(), total: boxes.length, updated: new Date().toISOString() });
  }

  function render() {
    var n = countDone();
    var fill = document.getElementById("progressfill");
    var label = document.getElementById("progresslabel");
    if (fill) fill.style.width = (boxes.length ? (n / boxes.length) * 100 : 0).toFixed(1) + "%";
    if (label) label.textContent = n + " / " + boxes.length + " tasks completed";
  }

  function apply() {
    boxes.forEach(function (b) { b.checked = !!saved[b.dataset.task]; });
    render();
  }

  boxes.forEach(function (b) {
    b.addEventListener("change", function () {
      if (b.checked) saved[b.dataset.task] = true; else delete saved[b.dataset.task];
      persist();
      render();
    });
  });
  apply();
  if (boxes.length) persist();

  // Keep two open tabs of the same guide in step.
  window.addEventListener("storage", function (e) {
    if (e.key === key) { saved = read(key) || {}; apply(); }
  });

  // Reset (two clicks, so a stray tap can't wipe everything).
  var resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    var fresh = resetBtn.cloneNode(true); // drop any old inline handler
    resetBtn.parentNode.replaceChild(fresh, resetBtn);
    var armed = null, original = fresh.textContent;
    fresh.addEventListener("click", function () {
      if (!armed) {
        fresh.textContent = "Click again to reset";
        armed = setTimeout(function () { armed = null; fresh.textContent = original; }, 4000);
        return;
      }
      clearTimeout(armed); armed = null;
      saved = {}; apply(); persist();
      fresh.textContent = "Checks reset";
      setTimeout(function () { fresh.textContent = original; }, 2000);
    });
  }

  // ---------- Backup panel: export / import ----------
  function payload() {
    return { app: "wow-forever-guides", guide: guide, key: key, exported: new Date().toISOString(), tasks: saved };
  }
  function encode() {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload()))));
  }
  function decode(text) {
    text = (text || "").trim();
    var data;
    try { data = JSON.parse(text); } catch (e) {
      try { data = JSON.parse(decodeURIComponent(escape(atob(text)))); } catch (e2) { return { error: "That isn't a progress file or code from these guides." }; }
    }
    if (!data || data.app !== "wow-forever-guides" || typeof data.tasks !== "object") return { error: "That isn't a progress file or code from these guides." };
    if (data.guide !== guide) return { error: "That backup belongs to the " + data.guide + " guide. Open that guide to import it." };
    return { data: data };
  }

  var panel = document.createElement("section");
  panel.id = "progress-backup";
  panel.innerHTML =
    '<style>' +
    '#progress-backup{margin-top:40px;border:1px solid rgba(127,127,127,.35);border-radius:12px;padding:18px 20px;font-size:15px}' +
    '#progress-backup h2{margin:0 0 6px;font-size:20px;font-weight:600}' +
    '#progress-backup p{margin:0 0 12px;opacity:.8;max-width:70ch}' +
    '#progress-backup .pb-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}' +
    '#progress-backup button,#progress-backup label.pb-file{font:inherit;font-size:14px;cursor:pointer;border:1px solid rgba(127,127,127,.5);background:transparent;color:inherit;border-radius:7px;padding:7px 12px}' +
    '#progress-backup button:hover,#progress-backup label.pb-file:hover{border-color:currentColor}' +
    '#progress-backup textarea{width:100%;min-height:70px;font:12px ui-monospace,Consolas,monospace;background:transparent;color:inherit;border:1px solid rgba(127,127,127,.5);border-radius:7px;padding:8px;box-sizing:border-box}' +
    '#progress-backup .pb-msg{min-height:1.4em;font-size:14px;margin:6px 0 0}' +
    '#progress-backup input[type=file]{position:absolute;width:1px;height:1px;opacity:0}' +
    '</style>' +
    '<h2>Save or move your progress</h2>' +
    '<p>Your checkmarks are stored only in this browser on this device. Export a backup to move them to another device or browser, or to keep them safe if you clear your browsing data.</p>' +
    '<div class="pb-row">' +
    '<button type="button" id="pb-download">Download backup file</button>' +
    '<button type="button" id="pb-copy">Copy backup code</button>' +
    '<label class="pb-file" for="pb-file">Import backup file</label><input type="file" id="pb-file" accept=".json,application/json">' +
    '</div>' +
    '<textarea id="pb-code" placeholder="…or paste a backup code here" aria-label="Backup code"></textarea>' +
    '<div class="pb-row" style="margin-top:8px"><button type="button" id="pb-import">Import pasted code</button></div>' +
    '<p class="pb-msg" id="pb-msg" role="status"></p>';

  var anchor = document.querySelector(".footer");
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor);
  else (document.querySelector("main") || body).appendChild(panel);

  var msg = document.getElementById("pb-msg");
  function say(t) { msg.textContent = t; }
  if (!storageOk) say("This browser is blocking site storage (private mode or blocked cookies), so checkmarks won't be remembered after you close the tab. Use a backup to keep them.");

  function importData(data) {
    saved = {};
    Object.keys(data.tasks).forEach(function (k) { if (data.tasks[k]) saved[k] = true; });
    apply(); persist();
    say("Imported " + countDone() + " completed tasks from " + (data.exported ? data.exported.slice(0, 10) : "the backup") + ".");
  }

  document.getElementById("pb-download").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(payload(), null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = guide + "-progress-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    say("Backup file downloaded (" + countDone() + " tasks).");
  });

  document.getElementById("pb-copy").addEventListener("click", function () {
    var code = encode(), ta = document.getElementById("pb-code");
    ta.value = code;
    function fallback() { ta.focus(); ta.select(); say("Code is in the box below; copy it with Ctrl+C / long-press."); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(function () { say("Backup code copied. Paste it into the same guide on your other device."); }, fallback);
    } else fallback();
  });

  document.getElementById("pb-file").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () { var res = decode(r.result); res.error ? say(res.error) : importData(res.data); };
    r.readAsText(f);
    e.target.value = "";
  });

  document.getElementById("pb-import").addEventListener("click", function () {
    var res = decode(document.getElementById("pb-code").value);
    res.error ? say(res.error) : importData(res.data);
  });
})();
