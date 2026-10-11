
  /* ==========================================================================
   *  3) استایل‌ها  /  Styles
   *  ------------------------------------------------------------------------
   *  تمام CSS برنامه داخل همین فایل JS قرار دارد و به صورت خودکار به صفحه
   *  تزریق می‌شود؛ نیازی به فایل CSS جداگانه نیست.
   *  «{{P}}» در ابتدای پردازش با پیشوند کلاس‌ها (پیش‌فرض adp-) جایگزین می‌شود
   *  تا هیچ تداخلی با استایل‌های برنامه‌ی میزبان پیش نیاید.
   * ========================================================================== */

  var ARIA_CAL_ICON = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8a94a6" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 3v3M16 3v3M3 9.5h18"/><circle cx="8.5" cy="14" r="1.1" fill="#8a94a6" stroke="none"/><circle cx="12" cy="14" r="1.1" fill="#8a94a6" stroke="none"/><circle cx="15.5" cy="14" r="1.1" fill="#8a94a6" stroke="none"/></svg>');

  var CSS_TEMPLATE = `
.{{P}}wrap, .{{P}}popup, .{{P}}inline, .{{P}}field, .{{P}}modal-bg {
  --{{P}}font: "Vazirmatn", "IRANSans", "Sahel", "Segoe UI", Tahoma, Arial, sans-serif;
  --{{P}}bg: #ffffff;
  --{{P}}bg-alt: #f7f9fc;
  --{{P}}fg: #26303f;
  --{{P}}muted: #8a94a6;
  --{{P}}border: #e4e8ef;
  --{{P}}accent: #2f6bff;
  --{{P}}accent-fg: #ffffff;
  --{{P}}accent-soft: rgba(47, 107, 255, .12);
  --{{P}}accent-hover: rgba(47, 107, 255, .08);
  --{{P}}holiday: #e5484d;
  --{{P}}holiday-soft: rgba(229, 72, 77, .10);
  --{{P}}today: #0e9f6e;
  --{{P}}radius: 14px;
  --{{P}}radius-sm: 9px;
  --{{P}}shadow: 0 14px 44px rgba(16, 24, 40, .16), 0 2px 8px rgba(16, 24, 40, .06);
  --{{P}}z: 90000;
  font-family: var(--{{P}}font);
  box-sizing: border-box;
}
.{{P}}wrap *, .{{P}}popup *, .{{P}}inline *, .{{P}}field *, .{{P}}modal-bg * { box-sizing: border-box; }

/* ---------- تم تاریک ---------- */
.{{P}}theme-dark, .{{P}}theme-dark .{{P}}popup {
  --{{P}}bg: #1b2130;
  --{{P}}bg-alt: #222a3b;
  --{{P}}fg: #e7ecf6;
  --{{P}}muted: #97a3ba;
  --{{P}}border: #2c3549;
  --{{P}}accent: #4f86ff;
  --{{P}}accent-fg: #ffffff;
  --{{P}}accent-soft: rgba(79, 134, 255, .22);
  --{{P}}accent-hover: rgba(79, 134, 255, .14);
  --{{P}}holiday: #ff6b6f;
  --{{P}}holiday-soft: rgba(255, 107, 111, .16);
  --{{P}}today: #38c98b;
  --{{P}}shadow: 0 16px 48px rgba(0, 0, 0, .5);
}

/* ---------- فیلد ورودی (input کاربر) ---------- */
input.{{P}}input {
  background-image: url("${ARIA_CAL_ICON}");
  background-repeat: no-repeat;
  background-size: 18px 18px;
  background-position: left 10px center;
  padding-left: 36px;
  cursor: pointer;
  direction: inherit;
}
.{{P}}theme-dark input.{{P}}input, input.{{P}}input.{{P}}theme-dark {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2397a3ba' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4.5' width='18' height='16' rx='3'/%3E%3Cpath d='M8 3v3M16 3v3M3 9.5h18'/%3E%3C/svg%3E");
}
input.{{P}}input.{{P}}ltr-icon { background-position: right 10px center; padding-left: 10px; padding-right: 36px; }
input.{{P}}input:disabled { cursor: not-allowed; opacity: .6; }

/* ---------- فیلد اختصاصی (وقتی هدف یک div/span باشد) ---------- */
.{{P}}field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  min-width: 190px;
  max-width: 100%;
  padding: 6px 12px;
  background: var(--{{P}}bg);
  color: var(--{{P}}fg);
  border: 1px solid var(--{{P}}border);
  border-radius: var(--{{P}}radius-sm);
  cursor: pointer;
  user-select: none;
  transition: border-color .15s, box-shadow .15s;
}
.{{P}}field:hover { border-color: var(--{{P}}accent); }
.{{P}}field.{{P}}focus { border-color: var(--{{P}}accent); box-shadow: 0 0 0 3px var(--{{P}}accent-soft); }
.{{P}}field-icon { flex: 0 0 auto; width: 18px; height: 18px; opacity: .85; }
.{{P}}field-text { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; }
.{{P}}field-text.{{P}}placeholder { color: var(--{{P}}muted); }
.{{P}}field-clear { flex: 0 0 auto; width: 20px; height: 20px; border-radius: 50%; display: none; align-items: center; justify-content: center; color: var(--{{P}}muted); font-size: 14px; line-height: 1; }
.{{P}}field-clear:hover { background: var(--{{P}}holiday-soft); color: var(--{{P}}holiday); }
.{{P}}field.{{P}}has-value .{{P}}field-clear { display: inline-flex; }
.{{P}}field.{{P}}block { display: flex; width: 100%; }

/* ---------- پاپ‌آپ ---------- */
.{{P}}popup {
  position: fixed;
  z-index: var(--{{P}}z);
  background: var(--{{P}}bg);
  color: var(--{{P}}fg);
  border: 1px solid var(--{{P}}border);
  border-radius: var(--{{P}}radius);
  box-shadow: var(--{{P}}shadow);
  padding: 10px;
  max-width: calc(100vw - 16px);
  animation: {{P}}in .14s ease-out;
}
.{{P}}popup.{{P}}no-anim { animation: none; }
.{{P}}popup[data-pos="top"] { animation-name: {{P}}inTop; }
@keyframes {{P}}in { from { opacity: 0; transform: translateY(4px) scale(.985); } to { opacity: 1; transform: none; } }
@keyframes {{P}}inTop { from { opacity: 0; transform: translateY(-4px) scale(.985); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .{{P}}popup { animation: none; } }
.{{P}}inline { display: inline-block; background: var(--{{P}}bg); color: var(--{{P}}fg); border: 1px solid var(--{{P}}border); border-radius: var(--{{P}}radius); box-shadow: var(--{{P}}shadow); padding: 10px; max-width: 100%; }

/* ---------- سربرگ ---------- */
.{{P}}cals { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.{{P}}cal { padding: 2px 4px; }
.{{P}}cal + .{{P}}cal { border-inline-start: 1px dashed var(--{{P}}border); }
@media (max-width: 560px) { .{{P}}cal + .{{P}}cal { border-inline-start: 0; } }
.{{P}}head { display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 6px; }
.{{P}}title { display: flex; align-items: center; gap: 4px; }
.{{P}}nav {
  width: 30px; height: 30px; flex: 0 0 auto;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid transparent; background: transparent; color: var(--{{P}}fg);
  border-radius: var(--{{P}}radius-sm); cursor: pointer; padding: 0;
  transition: background .15s, color .15s;
}
.{{P}}nav:hover:not(:disabled) { background: var(--{{P}}accent-hover); color: var(--{{P}}accent); }
.{{P}}nav:disabled { opacity: .35; cursor: not-allowed; }
.{{P}}nav svg { width: 16px; height: 16px; }
.{{P}}cal-label {
  border: 0; background: transparent; color: inherit; cursor: pointer;
  font: inherit; font-size: 14px; font-weight: 700; padding: 5px 8px; border-radius: var(--{{P}}radius-sm);
}
.{{P}}cal-label:hover { background: var(--{{P}}accent-hover); color: var(--{{P}}accent); }
.{{P}}cal-key { font-size: 11px; font-weight: 500; color: var(--{{P}}muted); }

/* ---------- شبکه ---------- */
.{{P}}wd-row, .{{P}}days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.{{P}}wd { text-align: center; font-size: 11.5px; color: var(--{{P}}muted); padding: 4px 0 6px; user-select: none; }
.{{P}}wd.{{P}}off { color: var(--{{P}}holiday); font-weight: 700; }
.{{P}}wk { font-size: 10px; color: var(--{{P}}muted); text-align: center; align-self: center; }
.{{P}}day {
  position: relative; height: 36px; min-width: 32px; padding: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 0; background: transparent; color: var(--{{P}}fg);
  font: inherit; font-size: 13.5px; border-radius: var(--{{P}}radius-sm);
  cursor: pointer; transition: background .12s, color .12s, box-shadow .12s;
}
.{{P}}day:hover:not(:disabled) { background: var(--{{P}}accent-hover); }
.{{P}}day.{{P}}out { opacity: .38; }
.{{P}}day.{{P}}off { color: var(--{{P}}holiday); }
.{{P}}day.{{P}}holiday:not(.{{P}}selected) { background: var(--{{P}}holiday-soft); }
.{{P}}day.{{P}}today { box-shadow: inset 0 0 0 1.6px var(--{{P}}today); font-weight: 700; }
.{{P}}day.{{P}}in-range { background: var(--{{P}}accent-soft); border-radius: 0; }
.{{P}}day.{{P}}range-start, .{{P}}day.{{P}}range-end { background: var(--{{P}}accent); color: var(--{{P}}accent-fg); border-radius: var(--{{P}}radius-sm); }
.{{P}}day.{{P}}range-start.{{P}}rtl-edge { border-start-end-radius: 3px; border-end-end-radius: 3px; }
.{{P}}day.{{P}}selected { background: var(--{{P}}accent); color: var(--{{P}}accent-fg); font-weight: 700; }
.{{P}}day.{{P}}selected.{{P}}off, .{{P}}day.{{P}}selected .{{P}}dot { color: var(--{{P}}accent-fg); }
.{{P}}day:disabled { color: var(--{{P}}muted); opacity: .45; cursor: not-allowed; background: transparent; }
.{{P}}day:focus-visible { outline: 2px solid var(--{{P}}accent); outline-offset: 1px; }
.{{P}}day-num { line-height: 1.1; }
.{{P}}day-sub { font-size: 9px; color: var(--{{P}}muted); line-height: 1; margin-top: 2px; }
.{{P}}selected .{{P}}day-sub { color: inherit; opacity: .85; }
.{{P}}dot { position: absolute; bottom: 4px; width: 4px; height: 4px; border-radius: 50%; background: var(--{{P}}holiday); }
.{{P}}selected .{{P}}dot { background: var(--{{P}}accent-fg); }

/* ---------- حالت‌های ماه/سال ---------- */
.{{P}}grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 4px; }
.{{P}}grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 4px; }
.{{P}}cell {
  height: 34px; border: 1px solid transparent; background: var(--{{P}}bg-alt);
  color: var(--{{P}}fg); border-radius: var(--{{P}}radius-sm); cursor: pointer;
  font: inherit; font-size: 12.5px;
}
.{{P}}cell:hover { border-color: var(--{{P}}accent); color: var(--{{P}}accent); }
.{{P}}cell.{{P}}active { background: var(--{{P}}accent); color: var(--{{P}}accent-fg); font-weight: 700; }
.{{P}}cell:disabled { opacity: .35; cursor: not-allowed; }
.{{P}}years-bar { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 2px 4px 6px; }
.{{P}}years-bar b { font-size: 13px; }

/* ---------- فهرست مناسبت‌ها ---------- */
.{{P}}list { margin-top: 8px; border-top: 1px dashed var(--{{P}}border); padding-top: 6px; }
.{{P}}list-title { font-size: 11.5px; color: var(--{{P}}muted); margin-bottom: 4px; display: flex; gap: 6px; align-items: center; }
.{{P}}list-items { max-height: 84px; overflow: auto; display: flex; flex-direction: column; gap: 3px; }
.{{P}}list-item {
  display: flex; gap: 6px; align-items: baseline; font-size: 12px; padding: 3px 5px;
  border-radius: 7px; cursor: pointer; border: 0; background: transparent; color: var(--{{P}}fg); text-align: start;
}
.{{P}}list-item:hover { background: var(--{{P}}accent-hover); }
.{{P}}list-day { color: var(--{{P}}holiday); font-weight: 700; flex: 0 0 auto; }
.{{P}}list-empty { font-size: 11.5px; color: var(--{{P}}muted); }

/* ---------- پاصفحه ---------- */
.{{P}}foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
  border-top: 1px solid var(--{{P}}border); margin-top: 9px; padding-top: 8px;
}
.{{P}}foot-info { font-size: 11.5px; color: var(--{{P}}muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.{{P}}btns { display: flex; gap: 6px; flex-wrap: wrap; }
.{{P}}btn {
  height: 32px; padding: 0 12px; border-radius: var(--{{P}}radius-sm);
  border: 1px solid var(--{{P}}border); background: transparent; color: var(--{{P}}fg);
  font: inherit; font-size: 12.5px; cursor: pointer; transition: all .15s;
}
.{{P}}btn:hover:not(:disabled) { border-color: var(--{{P}}accent); color: var(--{{P}}accent); }
.{{P}}btn:disabled { opacity: .45; cursor: not-allowed; }
.{{P}}btn-primary { background: var(--{{P}}accent); border-color: var(--{{P}}accent); color: var(--{{P}}accent-fg); }
.{{P}}btn-primary:hover:not(:disabled) { background: var(--{{P}}accent); color: var(--{{P}}accent-fg); filter: brightness(1.07); }
.{{P}}btn-ghost-danger:hover { border-color: var(--{{P}}holiday); color: var(--{{P}}holiday); }

/* ---------- ساعت ---------- */
.{{P}}time { display: flex; align-items: center; gap: 6px; padding: 6px 4px 2px; border-top: 1px dashed var(--{{P}}border); margin-top: 6px; font-size: 12px; }
.{{P}}time label { color: var(--{{P}}muted); font-size: 11.5px; }
.{{P}}time select {
  font: inherit; font-size: 12.5px; padding: 4px 6px; border-radius: 8px;
  border: 1px solid var(--{{P}}border); background: var(--{{P}}bg); color: var(--{{P}}fg); cursor: pointer;
}

/* ---------- وضعیت (برخط/آفلاین) ---------- */
.{{P}}status { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--{{P}}muted); }
.{{P}}status i { width: 7px; height: 7px; border-radius: 50%; background: var(--{{P}}today); display: inline-block; }
.{{P}}status.{{P}}offline i { background: var(--{{P}}holiday); }
.{{P}}loading { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--{{P}}muted); }
.{{P}}spinner {
  width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--{{P}}accent-soft);
  border-top-color: var(--{{P}}accent); animation: {{P}}spin .7s linear infinite;
}
@keyframes {{P}}spin { to { transform: rotate(360deg); } }

/* ---------- چیدمان و اندازه ---------- */
.{{P}}rtl { direction: rtl; }
.{{P}}ltr { direction: ltr; }
.{{P}}size-sm .{{P}}day { height: 30px; font-size: 12px; min-width: 28px; }
.{{P}}size-sm .{{P}}cal { min-width: 232px; }
.{{P}}size-lg .{{P}}day { height: 42px; font-size: 15px; min-width: 38px; }
.{{P}}size-lg .{{P}}cal { min-width: 316px; }
.{{P}}cal { min-width: 264px; }
.{{P}}modal-bg {
  position: fixed; inset: 0; z-index: var(--{{P}}z); background: rgba(16, 24, 40, .45);
  display: flex; align-items: center; justify-content: center; padding: 12px; animation: {{P}}in .16s ease-out;
}
.{{P}}modal-bg .{{P}}popup { position: static; }
.{{P}}sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
.{{P}}hidden { display: none !important; }
`;

  var _injected = false;
  var _prefix = DEFAULT_PREFIX;

  /** جایگزینی پیشوند در قالب CSS */
  function compileCSS(prefix) {
    return CSS_TEMPLATE.replace(/\{\{P\}\}/g, prefix).replace(/\.adp-/g, '.' + prefix);
  }

  /** تزریق استایل‌ها به صفحه (یک‌بار برای هر پیشوند) */
  function injectStyles(prefix) {
    prefix = prefix || DEFAULT_PREFIX;
    if (typeof document === 'undefined') return;
    var id = STYLE_ID + (prefix === DEFAULT_PREFIX ? '' : '-' + prefix.replace(/[^a-z0-9_-]/gi, ''));
    if (document.getElementById(id)) return;
    var style = document.createElement('style');
    style.id = id;
    style.setAttribute('data-aria-datepicker', prefix);
    style.type = 'text/css';
    var css = compileCSS(prefix);
    if (style.styleSheet) {           // مرورگرهای قدیمی
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
    (document.head || document.getElementsByTagName('head')[0] || document.documentElement).appendChild(style);
    _injected = true;
    _prefix = prefix;
  }

  function getCSS(prefix) { return compileCSS(prefix || DEFAULT_PREFIX); }
