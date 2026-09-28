/* KAMOD Tutorials — interactive lesson cards (watch, download, check yourself).
 * Shared by kamod.io/tutorials and the GitHub Pages site (timuran1/kamod-tutorials).
 *
 *   KamodTutorials.mount(el, { base, tryBase, lang })
 *     base    — where lessons.json and the videos live (ends with "/")
 *     tryBase — prefix for "Try it" links ("" on kamod.io, "https://kamod.io" elsewhere)
 *     lang    — "en" | "ru" | "uz" (lesson language; the user can switch)
 * Progress lives in localStorage — no account needed.
 */
(function () {
  "use strict";
  const STORE = "kamod_tutorials_v1";
  const LANGS = ["en", "ru", "uz"];
  const UI = {
    en: { title: "Tutorials", sub: "16 short lessons — watch, try it in KAMOD, then check what you learned.",
      done: "{d} of {t} lessons completed", all: "All", todo: "To do", finished: "Completed", lesson: "Lesson",
      watch: "Watch", download: "Download", check: "Check", learn: "Check the lesson — I can…",
      tryIt: "Try it in KAMOD", prev: "Previous", next: "Next lesson", close: "Close", completed: "Completed",
      watched: "Watched", allDone: "Lesson complete — nice work!", tick: "Tick what you can do now.",
      lessonLang: "Lesson language", reset: "Reset progress", resetQ: "Reset all lesson progress?",
      downloading: "Downloading…", empty: "Nothing here yet.", min: "min", loadErr: "Could not load the lessons. Check your connection and try again." },
    ru: { title: "Уроки", sub: "16 коротких уроков — смотрите, пробуйте в KAMOD и проверяйте себя.",
      done: "Пройдено уроков: {d} из {t}", all: "Все", todo: "Не пройдены", finished: "Пройдены", lesson: "Урок",
      watch: "Смотреть", download: "Скачать", check: "Проверка", learn: "Проверьте себя — я умею…",
      tryIt: "Попробовать в KAMOD", prev: "Назад", next: "Следующий урок", close: "Закрыть", completed: "Пройден",
      watched: "Просмотрен", allDone: "Урок пройден — отлично!", tick: "Отметьте то, что уже умеете.",
      lessonLang: "Язык урока", reset: "Сбросить прогресс", resetQ: "Сбросить прогресс всех уроков?",
      downloading: "Скачиваем…", empty: "Здесь пока пусто.", min: "мин", loadErr: "Не удалось загрузить уроки. Проверьте интернет и попробуйте снова." },
    uz: { title: "Darsliklar", sub: "16 ta qisqa dars — tomosha qiling, KAMODda sinab ko‘ring va o‘zingizni tekshiring.",
      done: "{t} ta darsdan {d} tasi o‘tildi", all: "Barchasi", todo: "O‘tilmagan", finished: "O‘tilgan", lesson: "Dars",
      watch: "Ko‘rish", download: "Yuklab olish", check: "Tekshirish", learn: "O‘zingizni tekshiring — men bilaman…",
      tryIt: "KAMODda sinab ko‘rish", prev: "Oldingi", next: "Keyingi dars", close: "Yopish", completed: "O‘tildi",
      watched: "Ko‘rildi", allDone: "Dars o‘tildi — barakalla!", tick: "Endi qila oladigan narsalarni belgilang.",
      lessonLang: "Dars tili", reset: "Natijani tozalash", resetQ: "Barcha darslar bo‘yicha natija tozalansinmi?",
      downloading: "Yuklanmoqda…", empty: "Hozircha bo‘sh.", min: "daq", loadErr: "Darslarni yuklab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring." },
  };

  const CSS = `
  .kt{--kt-accent:#FF6B35;--kt-bg:#0A0A0F;--kt-surface:rgba(255,255,255,.04);--kt-line:rgba(255,255,255,.09);--kt-ink:#f4f4f6;--kt-dim:rgba(244,244,246,.62);
    color:var(--kt-ink);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;letter-spacing:-.01em}
  .kt *{box-sizing:border-box}
  .kt-head{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-end;justify-content:space-between;margin-bottom:24px}
  .kt-h1{font-size:clamp(34px,5vw,56px);line-height:1.02;margin:0 0 10px;letter-spacing:-.03em;font-weight:800}
  .kt-h1 b{background:linear-gradient(120deg,#FF6B35,#ffb08f);-webkit-background-clip:text;background-clip:text;color:transparent}
  .kt-sub{margin:0;color:var(--kt-dim);font-size:15px;max-width:560px;line-height:1.5}
  .kt-progress{min-width:260px;flex:0 1 340px;padding:16px 18px;border:1px solid var(--kt-line);border-radius:16px;background:linear-gradient(160deg,rgba(255,107,53,.12),rgba(255,255,255,.02))}
  .kt-progress .lbl{font-size:13px;font-weight:600;margin-bottom:10px;display:flex;justify-content:space-between;gap:8px}
  .kt-bar{height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
  .kt-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#FF6B35,#ffb08f);border-radius:99px;transition:width .5s ease;box-shadow:0 0 14px rgba(255,107,53,.6)}
  .kt-reset{background:none;border:0;color:var(--kt-dim);font:inherit;font-size:12px;cursor:pointer;padding:0;text-decoration:underline}
  .kt-bar-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:20px}
  .kt-seg{display:inline-flex;padding:4px;gap:2px;border-radius:12px;background:var(--kt-surface);border:1px solid var(--kt-line)}
  .kt-seg button{border:0;background:transparent;color:var(--kt-dim);font:600 13px/1 inherit;padding:9px 14px;border-radius:9px;cursor:pointer}
  .kt-seg button[aria-pressed=true]{background:rgba(255,107,53,.16);color:var(--kt-ink);box-shadow:inset 0 0 0 1px rgba(255,107,53,.45)}
  .kt-seg .cap{font-size:12px;color:var(--kt-dim);align-self:center;padding:0 8px 0 6px}
  .kt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:20px}
  .kt-card{position:relative;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));border:1px solid var(--kt-line);transition:transform .2s ease,border-color .2s,box-shadow .2s}
  .kt-card:hover{transform:translateY(-3px);border-color:rgba(255,107,53,.45);box-shadow:0 18px 40px rgba(0,0,0,.45),0 0 0 1px rgba(255,107,53,.15)}
  .kt-card.is-done{border-color:rgba(74,222,128,.35)}
  .kt-thumb{position:relative;aspect-ratio:16/9;background:#000;border:0;padding:0;cursor:pointer;display:block;width:100%}
  .kt-thumb img{width:100%;height:100%;object-fit:cover;display:block;opacity:.92;transition:opacity .2s,transform .4s}
  .kt-card:hover .kt-thumb img{opacity:1;transform:scale(1.03)}
  .kt-play{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:flex-start;padding:12px}
  .kt-play span{width:44px;height:44px;border-radius:50%;background:rgba(255,107,53,.92);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(255,107,53,.55);transition:transform .2s}
  .kt-card:hover .kt-play span{transform:scale(1.1)}
  .kt-play svg{width:18px;height:18px;margin-left:3px;fill:#111}
  .kt-badge{position:absolute;top:10px;padding:5px 9px;border-radius:8px;font:700 11px/1 inherit;background:rgba(10,10,15,.78);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12)}
  .kt-badge.n{left:10px}.kt-badge.t{right:10px;font-variant-numeric:tabular-nums}
  .kt-badge.ok{left:auto;right:10px;top:auto;bottom:10px;background:rgba(22,101,52,.85);border-color:rgba(74,222,128,.5);color:#dcfce7}
  .kt-body{padding:18px 20px 20px;display:flex;flex-direction:column;gap:8px;flex:1}
  .kt-title{margin:0;font-size:16px;line-height:1.3;font-weight:700;letter-spacing:-.015em}
  .kt-brief{margin:0;font-size:13.5px;line-height:1.5;color:var(--kt-dim);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .kt-meter{display:flex;gap:4px;margin-top:4px}
  .kt-meter i{flex:1;height:4px;border-radius:9px;background:rgba(255,255,255,.1)}
  .kt-meter i.on{background:#4ade80}
  .kt-actions{display:flex;gap:8px;margin-top:auto;padding-top:10px}
  .kt-btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 10px;border-radius:11px;border:1px solid var(--kt-line);background:rgba(255,255,255,.035);color:var(--kt-ink);font:600 12.5px/1 inherit;cursor:pointer;text-decoration:none;white-space:nowrap;transition:background .15s,border-color .15s}
  .kt-btn:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}
  .kt-btn.primary{background:linear-gradient(135deg,#FF6B35,#ff8a5c);color:#111;border-color:transparent;box-shadow:0 6px 20px rgba(255,107,53,.35)}
  .kt-btn.primary:hover{filter:brightness(1.06)}
  .kt-btn small{opacity:.65;font-weight:500}
  .kt-btn.slim{flex:0 0 auto;padding-left:12px;padding-right:12px}
  .kt-empty,.kt-err{padding:40px;text-align:center;color:var(--kt-dim);border:1px dashed var(--kt-line);border-radius:16px}
  .kt-modal{position:fixed;inset:0;z-index:100000;background:rgba(5,5,10,.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px}
  .kt-dialog{width:min(1180px,100%);max-height:calc(100vh - 32px);overflow:auto;display:grid;grid-template-columns:minmax(0,1fr) 340px;border-radius:18px;background:linear-gradient(180deg,#14141c,#0c0c12);border:1px solid rgba(255,255,255,.1);box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 60px rgba(255,107,53,.08)}
  .kt-dialog video{width:100%;display:block;background:#000;aspect-ratio:16/9}
  .kt-side{padding:22px;display:flex;flex-direction:column;gap:14px;border-left:1px solid var(--kt-line)}
  .kt-side h2{margin:0;font-size:19px;line-height:1.3;letter-spacing:-.02em}
  .kt-side .k{font:700 11px/1 inherit;letter-spacing:.08em;text-transform:uppercase;color:var(--kt-accent)}
  .kt-side p{margin:0;font-size:13.5px;line-height:1.55;color:var(--kt-dim)}
  .kt-check{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
  .kt-check label{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border-radius:12px;border:1px solid var(--kt-line);background:var(--kt-surface);cursor:pointer;font-size:13.5px;line-height:1.4;transition:border-color .15s,background .15s}
  .kt-check label:hover{border-color:rgba(255,255,255,.2)}
  .kt-check input{appearance:none;flex:0 0 20px;width:20px;height:20px;margin:0;border-radius:6px;border:1.5px solid rgba(255,255,255,.35);display:grid;place-content:center;cursor:pointer}
  .kt-check input:checked{background:#4ade80;border-color:#4ade80}
  .kt-check input:checked::after{content:"";width:10px;height:6px;border:2.5px solid #052e16;border-top:0;border-right:0;transform:rotate(-45deg) translate(1px,-1px)}
  .kt-check input:focus-visible{outline:2px solid var(--kt-accent);outline-offset:2px}
  .kt-check label.on{border-color:rgba(74,222,128,.45);background:rgba(74,222,128,.07)}
  .kt-cheer{padding:12px;border-radius:12px;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.4);color:#bbf7d0;font-weight:600;font-size:13.5px;text-align:center}
  .kt-row{display:flex;gap:8px;flex-wrap:wrap}
  .kt-x{position:absolute;top:14px;right:16px;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(10,10,15,.7);color:#fff;font-size:20px;cursor:pointer}
  @media (max-width:860px){.kt-dialog{grid-template-columns:1fr}.kt-side{border-left:0;border-top:1px solid var(--kt-line)}.kt-progress{flex-basis:100%}}
  @media (prefers-reduced-motion:reduce){.kt-card,.kt-thumb img,.kt-bar i{transition:none}}`;

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function load() { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (_e) { return {}; } }
  function save(s) { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (_e) {} }
  function mmss(sec) { sec = Math.round(sec || 0); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }
  function mb(bytes) { return (bytes / 1048576).toFixed(1) + " MB"; }
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function mount(root, opts) {
    if (!root) return;
    if (!document.getElementById("kt-style")) {
      const st = document.createElement("style"); st.id = "kt-style"; st.textContent = CSS; document.head.appendChild(st);
    }
    const base = opts.base || "./";
    const tryBase = opts.tryBase || "";
    let lang = LANGS.includes(opts.lang) ? opts.lang : "en";
    let filter = "all";
    let lessons = [];
    let state = load();
    root.classList.add("kt");

    const url = rel => new URL(rel, new URL(base, location.href)).href;
    const T = () => UI[lang];
    const entry = n => (state[n] = state[n] || { watched: false, checks: [] });
    const isDone = l => { const s = state[l.n]; const need = l.langs[lang].learn.length; return !!s && s.checks.filter(Boolean).length >= need; };

    function render() {
      const t = T();
      const done = lessons.filter(isDone).length;
      const list = lessons.filter(l => filter === "all" || (filter === "done" ? isDone(l) : !isDone(l)));
      root.innerHTML = `
        <div class="kt-head">
          <div><h1 class="kt-h1"><b>${esc(t.title)}</b></h1><p class="kt-sub">${esc(t.sub)}</p></div>
          <div class="kt-progress" aria-live="polite">
            <div class="lbl"><span>${esc(t.done.replace("{d}", done).replace("{t}", lessons.length))}</span>
              ${done ? `<button type="button" class="kt-reset" data-reset>${esc(t.reset)}</button>` : ""}</div>
            <div class="kt-bar"><i style="width:${lessons.length ? (100 * done / lessons.length) : 0}%"></i></div>
          </div>
        </div>
        <div class="kt-bar-row">
          <div class="kt-seg" role="group">${[["all", t.all], ["todo", t.todo], ["done", t.finished]].map(([k, v]) =>
            `<button type="button" data-filter="${k}" aria-pressed="${filter === k}">${esc(v)}</button>`).join("")}</div>
          <div class="kt-seg" role="group" aria-label="${esc(t.lessonLang)}"><span class="cap">${esc(t.lessonLang)}</span>${LANGS.map(l =>
            `<button type="button" data-lang="${l}" aria-pressed="${lang === l}">${l.toUpperCase()}</button>`).join("")}</div>
        </div>
        ${list.length ? `<div class="kt-grid">${list.map(card).join("")}</div>` : `<div class="kt-empty">${esc(t.empty)}</div>`}`;
    }

    function card(l) {
      const t = T(), d = l.langs[lang], s = state[l.n] || { checks: [] };
      const ticked = s.checks.filter(Boolean).length;
      return `<article class="kt-card${isDone(l) ? " is-done" : ""}" data-n="${l.n}">
        <button type="button" class="kt-thumb" data-open="${l.n}" aria-label="${esc(t.watch + ": " + d.title)}">
          <img src="${esc(url(d.poster))}" alt="" loading="lazy">
          <span class="kt-play"><span>${PLAY}</span></span>
          <span class="kt-badge n">${esc(t.lesson)} ${l.n}</span>
          <span class="kt-badge t">${mmss(d.seconds)}</span>
          ${isDone(l) ? `<span class="kt-badge ok">✓ ${esc(t.completed)}</span>` : s.watched ? `<span class="kt-badge ok" style="background:rgba(10,10,15,.78);border-color:rgba(255,255,255,.2);color:#fff">👁 ${esc(t.watched)}</span>` : ""}
        </button>
        <div class="kt-body">
          <h3 class="kt-title">${esc(d.title)}</h3>
          <p class="kt-brief">${esc(d.brief)}</p>
          <div class="kt-meter" title="${ticked}/${d.learn.length}">${d.learn.map((_, i) => `<i class="${s.checks[i] ? "on" : ""}"></i>`).join("")}</div>
          <div class="kt-actions">
            <button type="button" class="kt-btn primary" data-open="${l.n}">▶ ${esc(t.watch)}</button>
            <button type="button" class="kt-btn slim" data-dl="${l.n}" title="${esc(t.download)} · ${mb(d.bytes)}" aria-label="${esc(t.download)} · ${mb(d.bytes)}">⬇ <small>${mb(d.bytes)}</small></button>
            <button type="button" class="kt-btn slim" data-open="${l.n}" data-focus-check="1" title="${esc(t.check)}" aria-label="${esc(t.check)} ${ticked}/${d.learn.length}">✓ ${ticked}/${d.learn.length}</button>
          </div>
        </div>
      </article>`;
    }

    async function download(l, btn) {
      const d = l.langs[lang];
      const name = `KAMOD-lesson-${String(l.n).padStart(2, "0")}-${lang}.mp4`;
      const label = btn ? btn.innerHTML : "";
      if (btn) { btn.disabled = true; btn.textContent = T().downloading; }
      try {
        const blob = await fetch(url(d.video)).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      } catch (_e) {
        window.open(url(d.video), "_blank", "noopener");
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
      }
    }

    let modal = null;
    function closeModal() { if (!modal) return; modal.querySelector("video")?.pause(); modal.remove(); modal = null; render(); }

    function open(n, focusCheck) {
      const i = lessons.findIndex(l => l.n === n);
      const l = lessons[i]; if (!l) return;
      const t = T(), d = l.langs[lang];
      if (modal) modal.remove();
      modal = document.createElement("div");
      modal.className = "kt kt-modal";
      modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-label", d.title);
      const s = entry(l.n);
      modal.innerHTML = `
        <div class="kt-dialog" style="position:relative">
          <div><video controls playsinline preload="metadata" poster="${esc(url(d.poster))}" src="${esc(url(d.video))}"></video></div>
          <div class="kt-side">
            <span class="k">${esc(t.lesson)} ${l.n} · ${mmss(d.seconds)}</span>
            <h2>${esc(d.title)}</h2>
            <p>${esc(d.brief)}</p>
            <div>
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">${esc(t.learn)}</div>
              <p style="font-size:12.5px;margin-bottom:10px">${esc(t.tick)}</p>
              <ul class="kt-check">${d.learn.map((item, k) => `<li><label class="${s.checks[k] ? "on" : ""}"><input type="checkbox" data-k="${k}" ${s.checks[k] ? "checked" : ""}> <span>${esc(item)}</span></label></li>`).join("")}</ul>
            </div>
            <div class="kt-cheer" ${isDone(l) ? "" : "hidden"}>🎉 ${esc(t.allDone)}</div>
            <a class="kt-btn primary" href="${esc(tryBase + l.try)}" ${tryBase ? 'target="_blank" rel="noopener"' : ""}>${esc(t.tryIt)} →</a>
            <div class="kt-row">
              <button type="button" class="kt-btn" data-dl="${l.n}">⬇ ${esc(t.download)} <small>${mb(d.bytes)}</small></button>
            </div>
            <div class="kt-row">
              ${i > 0 ? `<button type="button" class="kt-btn" data-go="${lessons[i - 1].n}">← ${esc(t.prev)}</button>` : ""}
              ${i < lessons.length - 1 ? `<button type="button" class="kt-btn" data-go="${lessons[i + 1].n}">${esc(t.next)} →</button>` : ""}
            </div>
          </div>
          <button type="button" class="kt-x" aria-label="${esc(t.close)}">×</button>
        </div>`;
      document.body.appendChild(modal);
      const video = modal.querySelector("video");
      video.addEventListener("timeupdate", () => {
        if (!s.watched && video.duration && video.currentTime / video.duration > 0.9) { s.watched = true; save(state); }
      });
      modal.addEventListener("click", e => {
        if (e.target === modal || e.target.closest(".kt-x")) return closeModal();
        const go = e.target.closest("[data-go]"); if (go) return open(Number(go.dataset.go));
        const dl = e.target.closest("[data-dl]"); if (dl) return download(l, dl);
      });
      modal.addEventListener("change", e => {
        const box = e.target.closest("input[data-k]"); if (!box) return;
        s.checks[Number(box.dataset.k)] = box.checked;
        box.closest("label").classList.toggle("on", box.checked);
        save(state);
        modal.querySelector(".kt-cheer").hidden = !isDone(l);
      });
      if (focusCheck) modal.querySelector(".kt-check input")?.focus();
      else modal.querySelector(".kt-x").focus();
      video.play().catch(() => {});
    }

    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
    root.addEventListener("click", e => {
      const f = e.target.closest("[data-filter]"); if (f) { filter = f.dataset.filter; return render(); }
      const lg = e.target.closest("[data-lang]"); if (lg) { lang = lg.dataset.lang; try { localStorage.setItem(STORE + "_lang", lang); } catch (_e) {} return render(); }
      if (e.target.closest("[data-reset]")) { if (confirm(T().resetQ)) { state = {}; save(state); render(); } return; }
      const dl = e.target.closest("[data-dl]"); if (dl) return download(lessons.find(l => l.n === Number(dl.dataset.dl)), dl);
      const o = e.target.closest("[data-open]"); if (o) return open(Number(o.dataset.open), !!o.dataset.focusCheck);
    });

    try { const saved = localStorage.getItem(STORE + "_lang"); if (!opts.lang && LANGS.includes(saved)) lang = saved; } catch (_e) {}
    root.innerHTML = `<div class="kt-empty">…</div>`;
    fetch(url("lessons.json"))
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => { lessons = data.lessons || []; render(); })
      .catch(() => { root.innerHTML = `<div class="kt-err">${esc(T().loadErr)}</div>`; });
  }

  window.KamodTutorials = { mount };
})();
