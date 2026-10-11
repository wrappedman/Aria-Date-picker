
  /* ==========================================================================
   *  6) API عمومی  /  Public API
   * ========================================================================== */

  /** ثبت زبان/برچسب سفارشی */
  function registerLanguage(code, labels) {
    if (!code) return NAMES;
    NAMES[code] = extend({}, NAMES[code] || NAMES.fa, labels || {});
    return NAMES[code];
  }

  /** افزودن سرویس سفارشی دریافت تعطیلات */
  function addProvider(calendar, provider) {
    if (!DEFAULT_PROVIDERS[calendar]) DEFAULT_PROVIDERS[calendar] = [];
    DEFAULT_PROVIDERS[calendar].push(provider);
    return DEFAULT_PROVIDERS[calendar];
  }

  function parseInputToJdn(input, calendar) {
    var cal = CALENDARS[calendar] ? calendar : 'jalali';
    if (input == null) return null;
    if (input instanceof Date) {
      return { jdn: g2d(input.getFullYear(), input.getMonth() + 1, input.getDate()), hh: input.getHours(), mm: input.getMinutes(), ss: input.getSeconds() };
    }
    if (isNum(input)) return parseInputToJdn(new Date(input), cal);
    if (isPlainObj(input)) {
      var c = CALENDARS[input.calendar] ? input.calendar : cal;
      if (input.jdn) return { jdn: input.jdn, hh: input.hh || 0, mm: input.mm || 0, ss: input.ss || 0 };
      if (input.y && input.m && (input.d || input.day)) {
        return { jdn: CALENDARS[c].jdn(input.y, input.m, input.d || input.day), hh: input.hh || 0, mm: input.mm || 0, ss: input.ss || 0 };
      }
      return null;
    }
    if (isStr(input)) {
      var guessed = guessCalendar(input) || cal;
      var p = parseDateStr(input, guessed, null);
      if (!p) return null;
      return { jdn: p.jdn, hh: p.hh, mm: p.mm, ss: p.ss };
    }
    return null;
  }

  /** قالب‌بندی یک تاریخ با توکن‌های YYYY, MM, DD, MMMM, dddd, HH ... */
  function apiFormat(input, pattern, calendar, opts) {
    var cal = CALENDARS[calendar] ? calendar : 'jalali';
    var j = parseInputToJdn(input, cal);
    if (!j) return '';
    var p = CALENDARS[cal].fromJdn(j.jdn);
    return formatDate(
      { calendar: cal, y: p.y, m: p.m, d: p.d, jdn: j.jdn, hh: j.hh, mm: j.mm, ss: j.ss },
      pattern || CALENDARS[cal].dateFormat,
      extend({ lang: 'fa', persianDigits: cal === 'jalali' }, opts || {})
    );
  }

  /** تبدیل تاریخ بین تقویم‌ها */
  function apiConvert(input, fromCalendar, toCalendar, pattern) {
    var from = CALENDARS[fromCalendar] ? fromCalendar : (guessCalendar(input) || 'jalali');
    var to = CALENDARS[toCalendar] ? toCalendar : (from === 'jalali' ? 'gregorian' : 'jalali');
    var j = parseInputToJdn(input, from);
    if (!j) return null;
    var p = CALENDARS[to].fromJdn(j.jdn);
    var out = { calendar: to, y: p.y, m: p.m, d: p.d, jdn: j.jdn, hh: j.hh, mm: j.mm, ss: j.ss };
    if (pattern) out.text = apiFormat(out, pattern, to);
    return out;
  }

  /** یافتن نمونه‌ی متناظر با یک عنصر */
  function getInstance(el) {
    for (var i = 0; i < Picker.instances.length; i++) {
      var p = Picker.instances[i];
      if (p.target === el || p.output === el || (p.fieldEl && p.fieldEl.contains(el)) ||
        (p.panelEl && p.panelEl.contains(el))) return p;
    }
    return null;
  }

  /**
   * راه‌اندازی خودکار روی همه‌ی عناصر دارای ویژگی data-aria-datepicker
   *  مقدار ویژگی می‌تواند خالی، 'inline' یا یک شیء JSON از تنظیمات باشد.
   */
  function autoInit(scope, defaults) {
    var root = scope || (typeof document !== 'undefined' ? document : null);
    if (!root || !root.querySelectorAll) return [];
    var els = root.querySelectorAll('[data-aria-datepicker]');
    var out = [];
    Array.prototype.forEach.call(els, function (el) {
      if (getInstance(el)) return;
      var raw = trim(el.getAttribute('data-aria-datepicker'));
      var opts = extend({}, defaults || {});
      if (raw === 'inline') opts.inline = true;
      else if (raw && raw.charAt(0) === '{') {
        try { extend(opts, JSON.parse(raw)); } catch (e) { }
      }
      if (!has(opts, 'calendar')) {
        var cAttr = el.getAttribute('data-calendar');
        if (cAttr) opts.calendar = cAttr;
      }
      out.push(new Picker(el, opts));
    });
    return out;
  }

  /** افزودن رویداد سراسری برای نمونه‌ها */
  function each(fn) { Picker.instances.slice().forEach(fn); }

  var AriaDatePicker = {
    version: VERSION,
    Picker: Picker,
    HolidayManager: HolidayManager,

    /** ساخت یک دیت‌پیکر جدید */
    create: function (target, options) { return new Picker(target, options); },
    /** مترادف create */
    init: function (target, options) { return new Picker(target, options); },
    /** راه‌اندازی خودکار بر اساس ویژگی data-aria-datepicker */
    autoInit: autoInit,
    /** یافتن نمونه بر اساس عنصر */
    get: getInstance,
    /** همه‌ی نمونه‌های فعال */
    instances: Picker.instances,
    each: each,
    /** تخریب همه‌ی نمونه‌ها */
    destroyAll: function () { Picker.instances.slice().forEach(function (p) { p.destroy(); }); },

    /* ابزارها */
    injectStyles: injectStyles,
    getCSS: getCSS,
    registerLanguage: registerLanguage,
    addProvider: addProvider,
    format: apiFormat,
    convert: apiConvert,
    parse: function (str, calendar) {
      var cal = CALENDARS[calendar] ? calendar : (guessCalendar(str) || 'jalali');
      var p = parseDateStr(str, cal, null);
      if (!p) return null;
      return apiConvert(p, cal, cal, null) || { calendar: cal, y: p.y, m: p.m, d: p.d, jdn: p.jdn };
    },
    /** تبدیل رشته‌ی تاریخ به آبجکت Date جاوااسکریپت */
    toDate: function (str, calendar) {
      var j = parseInputToJdn(str, CALENDARS[calendar] ? calendar : (guessCalendar(str) || 'jalali'));
      if (!j) return null;
      var g = d2g(j.jdn);
      return new Date(g.gy, g.gm - 1, g.gd, j.hh || 0, j.mm || 0, j.ss || 0, 0);
    },
    calendars: CALENDARS,
    languages: NAMES,
    holidayProviders: DEFAULT_PROVIDERS,
    utils: {
      toFaDigits: toFaDigits,
      toEnDigits: toEnDigits,
      jdnFromGregorian: g2d,
      gregorianFromJdn: d2g,
      jdnFromJalali: j2d,
      jalaliFromJdn: d2j,
      isLeapJalaliYear: isLeapJalaliYear,
      isLeapGregorian: isLeapGregorian,
      jalaliMonthLength: jalaaliMonthLength,
      gregorianMonthLength: gregorianMonthLength,
      weekdayFromJdn: weekdayFromJdn,
      todayIn: todayIn,
      escapeHtml: escapeHtml,
      extend: extend
    },

    /** ساخت یک مدیر تعطیلات مستقل (برای استفاده‌های جانبی) */
    holidays: function (options) { return new HolidayManager(options || {}); }
  };

  /* -------------------------------------------------------------------------
   *  راه‌اندازی خودکار اختیاری:
   *  اگر اسکریپت با ویژگی data-auto-init بارگذاری شده باشد، پس از آماده شدن
   *  DOM، عناصر دارای data-aria-datepicker ساخته می‌شوند.
   * ---------------------------------------------------------------------- */
  (function autoBootstrap() {
    if (typeof document === 'undefined') return;
    function run() {
      var scripts = document.querySelectorAll('script[src*="aria-datepicker"], script[data-aria-datepicker]');
      var enabled = false, defaults = null;
      Array.prototype.forEach.call(scripts, function (s) {
        if (s.getAttribute('data-auto-init') !== null) {
          enabled = true;
          var raw = s.getAttribute('data-auto-init');
          if (raw && raw.charAt(0) === '{') { try { defaults = JSON.parse(raw); } catch (e) { } }
        }
      });
      if (enabled) autoInit(document, defaults);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  }());

  return AriaDatePicker;
}));
