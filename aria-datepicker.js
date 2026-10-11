/*! Aria Date Picker v1.2.0 | تقویم شمسی و میلادی | GPL-3.0 | 2026-10-11 */
/* ===== 01-core.js ===== */
/*!
 * ============================================================================
 *  Aria Date Picker  (ADP)
 * ----------------------------------------------------------------------------
 *  یک دیت‌پیکر کامل و تک‌فایلی برای تقویم شمسی (جلالی) و میلادی (گرگوری)
 *  A single-file, dependency-free Jalali (Persian) & Gregorian date picker.
 *
 *  @version   1.2.0
 *  @author    Aria
 *  @license   GPL-3.0
 *  @file      aria-datepicker.js   (این فایل به تنهایی و بدون هیچ وابستگی کار می‌کند)
 *
 *  استفاده سریع / Quick start:
 *      <script src="aria-datepicker.js"></script>
 *      <script>
 *        AriaDatePicker.create('#my-input', {
 *          calendar : 'jalali',      // 'jalali' | 'gregorian' | 'both'
 *          range    : true,          // حالت «از تاریخ تا تاریخ»
 *          limits   : { mode: 'free' } // یا { mode: 'range', from: '1405/01/01', to: '1405/12/29' }
 *        });
 *      </script>
 *
 *  تمام پیشوند کلاس‌های CSS به صورت پیش‌فرض «adp-» است و از طریق گزینه‌ی
 *  classPrefix قابل تغییر است؛ بنابراین هیچ تداخلی با استایل‌های برنامه‌ی
 *  میزبان ایجاد نمی‌شود.
 * ============================================================================
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.AriaDatePicker = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis
  : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  var VERSION = '1.2.0';
  var STYLE_ID = 'aria-datepicker-styles-v1';
  var DEFAULT_PREFIX = 'adp-';

  /* ==========================================================================
   *  0) ابزارهای پایه  /  Base helpers
   * ========================================================================== */

  function isFn(v) { return typeof v === 'function'; }
  function isStr(v) { return typeof v === 'string'; }
  function isNum(v) { return typeof v === 'number' && !isNaN(v); }
  function isEl(v) { return !!v && v.nodeType === 1; }
  function isArr(v) { return Object.prototype.toString.call(v) === '[object Array]'; }
  function isPlainObj(v) {
    return !!v && typeof v === 'object' && Object.prototype.toString.call(v) !== '[object Array]' && !v.nodeType;
  }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  /** ادغام سطحی چند شیء (فقط مقادیر undefined نادیده گرفته می‌شوند) */
  function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (!isPlainObj(src)) continue;
      for (var k in src) {
        if (has(src, k) && src[k] !== undefined) target[k] = src[k];
      }
    }
    return target;
  }

  /** کپی عمیق سبک (برای آبجکت‌های داده‌ای) */
  function cloneDeep(v) {
    if (isArr(v)) return v.map(cloneDeep);
    if (isPlainObj(v)) {
      var out = {};
      for (var k in v) if (has(v, k)) out[k] = cloneDeep(v[k]);
      return out;
    }
    return v;
  }

  function pad2(n) { n = parseInt(n, 10) || 0; return (n < 10 ? '0' : '') + n; }

  var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  var AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

  /** تبدیل ارقام فارسی/عربی به لاتین */
  function toEnDigits(str) {
    return String(str == null ? '' : str)
      .replace(/[۰-۹]/g, function (d) { return String(FA_DIGITS.indexOf(d)); })
      .replace(/[٠-٩]/g, function (d) { return String(AR_DIGITS.indexOf(d)); });
  }

  function toFaDigits(str) {
    return String(str == null ? '' : str).replace(/\d/g, function (d) { return FA_DIGITS.charAt(+d); });
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function trim(s) { return String(s == null ? '' : s).replace(/^\s+|\s+$/g, ''); }

  /** فرار دادن کاراکترهای ویژه‌ی عبارت باقاعده */
  function escapeRegExp(str) {
    return String(str == null ? '' : str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** عبارت باقاعده برای پیدا کردن ریشه‌ی پلاگین از روی جنس‌گویی (className / id) */
  function normalizeList(v) {
    if (v == null) return [];
    return isArr(v) ? v.slice() : [v];
  }

  function noop() {}

  /* ==========================================================================
   *  1) موتور تقویم‌ها  /  Calendar engines
   *  ------------------------------------------------------------------------
   *  هر تاریخ به صورت داخلی با «شماره‌ی روز جولیَن (JDN)» نمایش داده می‌شود تا
   *  مقایسه و تبدیل بین دو تقویم ساده و بدون خطا باشد.
   * ========================================================================== */

  function idiv(a, b) { return Math.trunc(a / b); }
  function imod(a, b) { return a - Math.trunc(a / b) * b; }

  /* -------------------------------------------------------------------------
   *  1-1) الگوریتم تبدیل تقویم جلالی (بر پایه‌ی الگوریتم مشهور jalaali-js)
   * ---------------------------------------------------------------------- */
  var JALALI_BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
    1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

  function jalCal(jy, withoutLeap) {
    var bl = JALALI_BREAKS.length;
    var gy = jy + 621;
    var leapJ = -14;
    var jp = JALALI_BREAKS[0];
    var jm, jump = 0, leap = 0, leapG, march, n, i;

    if (jy < jp || jy >= JALALI_BREAKS[bl - 1]) {
      throw new Error('ADP: سال جلالی نامعتبر است / Invalid Jalaali year: ' + jy);
    }

    for (i = 1; i < bl; i += 1) {
      jm = JALALI_BREAKS[i];
      jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + idiv(jump, 33) * 8 + idiv(imod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;

    leapJ = leapJ + idiv(n, 33) * 8 + idiv(imod(n, 33) + 3, 4);
    if (imod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

    leapG = idiv(gy, 4) - idiv((idiv(gy, 100) + 1) * 3, 4) - 150;
    march = 20 + leapJ - leapG;

    if (!withoutLeap) {
      if (jump - n < 6) n = n - jump + idiv(jump + 4, 33) * 33;
      leap = imod(imod(n + 1, 33) - 1, 4);
      if (leap === -1) leap = 4;
    }

    return { leap: leap, gy: gy, march: march };
  }

  /** کبیسه بودن بر پایه‌ی الگوریتم بورکفسکی (بدون احتساب قاعده‌ی فعال) */
  function isLeapJalaliYearBorkowski(jy) {
    return jalCalSafe(jy, false).leap === 0;
  }

  /** کبیسه بودن بر اساس قاعده‌ی فعال (auto / astronomical / arithmetic / table / custom) */
  function isLeapJalaliYear(jy) {
    return isLeapJalaliYearRule(jy);
  }

  /** تبدیل تاریخ میلادی به شماره‌ی روز جولیَن */
  function g2d(gy, gm, gd) {
    var d = idiv((gy + idiv(gm - 8, 6) + 100100) * 1461, 4) +
      idiv(153 * imod(gm + 9, 12) + 2, 5) + gd - 34840408;
    d = d - idiv(idiv(gy + 100100 + idiv(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }

  /** تبدیل شماره‌ی روز جولیَن به تاریخ میلادی */
  function d2g(jdn) {
    var j, i, gd, gm, gy;
    j = 4 * jdn + 139361631;
    j = j + idiv(idiv(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    i = idiv(imod(j, 1461), 4) * 5 + 308;
    gd = idiv(imod(i, 153), 5) + 1;
    gm = imod(idiv(i, 153), 12) + 1;
    gy = idiv(j, 1461) - 100100 + idiv(8 - gm, 6);
    return { gy: gy, gm: gm, gd: gd };
  }

  /** jalCal ایمن: خارج از بازه‌ی جدولی از محاسبه‌ی نجومی استفاده می‌کند (بدون خطا) */
  function jalCalSafe(jy, withoutLeap) {
    try {
      return jalCal(jy, withoutLeap);
    } catch (e) {
      var n1 = nowruzJdnAstro(jy + 621);
      var g = d2g(n1);
      var march = g.gm === 3 ? g.gd : (g.gm === 4 ? 32 + g.gd : 20);
      var leap = (nowruzJdnAstro(jy + 622) - n1) === 366 ? 0 : 1;
      return { leap: leap, gy: jy + 621, march: march };
    }
  }

  /** تبدیل تاریخ جلالی به شماره‌ی روز جولیَن */
  function j2d(jy, jm, jd) {
    var r = jalCalSafe(jy, true);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - idiv(jm, 7) * (jm - 7) + jd - 1;
  }

  /** تبدیل شماره‌ی روز جولیَن به تاریخ جلالی */
  function d2j(jdn) {
    var gy = d2g(jdn).gy;
    var jy = gy - 621;
    var r = jalCalSafe(jy, false);
    var jdn1f = g2d(gy, 3, r.march);
    var jd, jm, k;
    k = jdn - jdn1f;
    if (k >= 0) {
      if (k <= 185) {
        jm = 1 + idiv(k, 31);
        jd = imod(k, 31) + 1;
        return { jy: jy, jm: jm, jd: jd };
      }
      k -= 186;
    } else {
      jy -= 1;
      k += 179;
      if (r.leap === 1) k += 1;
    }
    jm = 7 + idiv(k, 30);
    jd = imod(k, 30) + 1;
    return { jy: jy, jm: jm, jd: jd };
  }

  function jalaaliMonthLength(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isLeapJalaliYear(jy) ? 30 : 29;
  }

  /* -------------------------------------------------------------------------
   *  1-2) تاریخ میلادی
   * ---------------------------------------------------------------------- */
  function gregorianMonthLength(gy, gm) {
    return [31, (isLeapGregorian(gy) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][gm - 1];
  }
  function isLeapGregorian(gy) {
    return (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  }

  /* -------------------------------------------------------------------------
   *  1-3) نام‌ها و ترتیب هفته (فارسی / انگلیسی)
   * ---------------------------------------------------------------------- */
  var NAMES = {
    fa: {
      jalaliMonths: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
      gregorianMonths: ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'],
      gregorianMonthsShort: ['ژان', 'فور', 'مار', 'آپر', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپت', 'اکت', 'نوا', 'دسا'],
      weekdays: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
      weekdaysShort: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
      weekdaysMin: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
      today: 'امروز', clear: 'پاک کردن', confirm: 'تأیید', cancel: 'انصراف',
      month: 'ماه', year: 'سال', holiday: 'تعطیل', from: 'از', to: 'تا',
      pickDate: 'انتخاب تاریخ', pickRange: 'انتخاب بازه', holidayList: 'مناسبت‌های ماه',
      nextMonth: 'ماه بعد', prevMonth: 'ماه قبل', nextYear: 'سال بعد', prevYear: 'سال قبل',
      selectMonth: 'انتخاب ماه', selectYear: 'انتخاب سال', close: 'بستن',
      hour: 'ساعت', minute: 'دقیقه', second: 'ثانیه', online: 'برخط', offline: 'آفلاین'
    },
    en: {
      jalaliMonths: ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'],
      gregorianMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      gregorianMonthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      weekdaysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      today: 'Today', clear: 'Clear', confirm: 'OK', cancel: 'Cancel',
      month: 'Month', year: 'Year', holiday: 'Holiday', from: 'From', to: 'To',
      pickDate: 'Select date', pickRange: 'Select range', holidayList: 'Holidays',
      nextMonth: 'Next month', prevMonth: 'Previous month', nextYear: 'Next year', prevYear: 'Previous year',
      selectMonth: 'Select month', selectYear: 'Select year', close: 'Close',
      hour: 'Hour', minute: 'Minute', second: 'Second', online: 'Online', offline: 'Offline'
    }
  };

  /**
   * توصیف تقویم‌ها؛ نقطه‌ی واحد دسترسی برنامه به هر تقویم.
   *  weekStart : ایندکس شروع هفته بر اساس getDay() جاوااسکریپت (0=یکشنبه ... 6=شنبه)
   */
  var CALENDARS = {
    jalali: {
      key: 'jalali',
      label: 'شمسی',
      labelEn: 'Jalali (Shamsi)',
      lang: 'fa',
      dir: 'rtl',
      weekStart: 6,           // شنبه
      months: NAMES.fa.jalaliMonths,
      monthsShort: NAMES.fa.jalaliMonths,
      dateFormat: 'YYYY/MM/DD',
      altFormat: 'YYYY-MM-DD',
      jdn: function (y, m, d) { return j2dRule(y, m, d); },
      fromJdn: function (jdn) { var o = d2jRule(jdn); return { y: o.jy, m: o.jm, d: o.jd }; },
      monthLength: function (y, m) { return monthLengthRule(y, m); },
      isLeap: function (y) { return isLeapJalaliYearRule(y); },
      minYear: 1178,
      maxYear: 2500
    },
    gregorian: {
      key: 'gregorian',
      label: 'میلادی',
      labelEn: 'Gregorian',
      lang: 'en',
      dir: 'ltr',
      weekStart: 1,           // دوشنبه (ISO) - قابل تغییر با گزینه‌ی gregorianWeekStart
      months: NAMES.fa.gregorianMonths,
      monthsShort: NAMES.fa.gregorianMonthsShort,
      dateFormat: 'YYYY/MM/DD',
      altFormat: 'YYYY-MM-DD',
      jdn: function (y, m, d) { return g2d(y, m, d); },
      fromJdn: function (jdn) { var o = d2g(jdn); return { y: o.gy, m: o.gm, d: o.gd }; },
      monthLength: gregorianMonthLength,
      isLeap: isLeapGregorian,
      minYear: 1,
      maxYear: 9999
    }
  };

  /** تاریخ امروز بر حسب تقویم درخواستی */
  function todayIn(calKey) {
    var n = new Date();
    var jdn = g2d(n.getFullYear(), n.getMonth() + 1, n.getDate());
    var o = CALENDARS[calKey].fromJdn(jdn);
    return { y: o.y, m: o.m, d: o.d, jdn: jdn };
  }

  /** نام‌های روز هفته برای تنظیم آخر هفته (فارسی، انگلیسی و کوتاه‌نوشت‌ها) */
  var WEEKDAY_NAMES = {
    0: ['یکشنبه', 'يكشنبه', 'یک‌شنبه', 'sun', 'sunday', 'su', 'y'],
    1: ['دوشنبه', 'دوشنبه', 'mon', 'monday', 'mo', 'd'],
    2: ['سه‌شنبه', 'سه شنبه', 'سه\u200cشنبه', 'tue', 'tuesday', 'tu', 's'],
    3: ['چهارشنبه', 'چهار‌شنبه', 'wed', 'wednesday', 'we', 'ch', 'c'],
    4: ['پنجشنبه', 'پنج‌شنبه', 'پنج شنبه', 'thu', 'thursday', 'th', 'p'],
    5: ['جمعه', 'fri', 'friday', 'fr', 'j'],
    6: ['شنبه', 'sat', 'saturday', 'sa', 'sh']
  };

  /** تبدیل نام/عدد روز هفته به ایندکس (0=یکشنبه ... 6=شنبه)؛ در صورت نامعتبر بودن null */
  function weekdayIndex(value) {
    if (value == null || value === '') return null;
    if (isNum(value)) return (value >= 0 && value <= 6) ? Math.round(value) : null;
    var v = toEnDigits(trim(String(value))).toLowerCase();
    if (/^[0-6]$/.test(v)) return +v;
    var normalized = v.replace(/[\u200c\s_-]+/g, '');
    for (var idx in WEEKDAY_NAMES) {
      if (!has(WEEKDAY_NAMES, idx)) continue;
      var names = WEEKDAY_NAMES[idx];
      for (var i = 0; i < names.length; i++) {
        var n = names[i].replace(/[\u200c\s_-]+/g, '');
        if (normalized === n) return +idx;
      }
    }
    return null;
  }

  /** نرمال‌سازی فهرست روزهای آخر هفته: ورودی هر شکلی → آرایه‌ی ایندکس‌ها */
  function normalizeWeekendDays(value) {
    if (value == null) return null;
    var list = isArr(value) ? value : [value];
    var out = [];
    list.forEach(function (item) {
      if (isArr(item)) { item.forEach(function (x) { var i = weekdayIndex(x); if (i != null && out.indexOf(i) === -1) out.push(i); }); return; }
      var idx = weekdayIndex(item);
      if (idx != null && out.indexOf(idx) === -1) out.push(idx);
    });
    return out.length ? out.sort(function (a, b) { return a - b; }) : null;
  }

  /** شماره‌ی روز هفته (0=یکشنبه ... 6=شنبه) از روی JDN */
  function weekdayFromJdn(jdn) { return imod(jdn + 1, 7); }

  /** تبدیل آبجکت تاریخ به آبجکت Date جاوااسکریپت (با حفظ ساعت) */
  function toJsDate(calKey, y, m, d, hh, mm, ss) {
    var jdn = CALENDARS[calKey].jdn(y, m, d);
    var g = d2g(jdn);
    return new Date(g.gy, g.gm - 1, g.gd, hh || 0, mm || 0, ss || 0, 0);
  }

  function fromJsDate(date, calKey) {
    var jdn = g2d(date.getFullYear(), date.getMonth() + 1, date.getDate());
    var o = CALENDARS[calKey].fromJdn(jdn);
    return { y: o.y, m: o.m, d: o.d, jdn: jdn, hh: date.getHours(), mm: date.getMinutes(), ss: date.getSeconds() };
  }

  /* -------------------------------------------------------------------------
   *  1-4) تحلیل و قالب‌بندی رشته‌ی تاریخ
   * ---------------------------------------------------------------------- */

  var FORMAT_TOKENS = /\[[^\]]*\]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|A|a|ZZ|Z/g;

  /**
   * قالب‌بندی یک تاریخ.
   *  YYYY سال چهاررقمی | YY دو رقمی | MM ماه دورقمی | M ماه
   *  MMMM نام ماه    | MMM نام کوتاه ماه
   *  DD روز دورقمی   | D روز
   *  dddd نام روز هفته | dd نام کوتاه روز | d ایندکس روز هفته
   *  HH:mm(:ss) ساعت 24 ساعته | hh با AM/PM | A/a معادل فارسی
   *  متن داخل [] عیناً چاپ می‌شود.
   */
  function formatDate(parts, fmt, opts) {
    opts = opts || {};
    var cal = CALENDARS[parts.calendar];
    var lang = opts.lang || 'fa';
    var names = NAMES[lang] || NAMES.fa;
    var dow = weekdayFromJdn(parts.jdn);
    var out = '';
    var weekdayNames = (lang === 'en' && parts.calendar === 'gregorian') ? NAMES.en.weekdays : names.weekdays;
    var weekdayShort = (lang === 'en' && parts.calendar === 'gregorian') ? NAMES.en.weekdaysShort : names.weekdaysShort;

    out = String(fmt).replace(FORMAT_TOKENS, function (tok) {
      switch (tok) {
        case 'YYYY': return String(parts.y);
        case 'YY': return pad2(parts.y % 100);
        case 'MMMM': return cal.months[parts.m - 1];
        case 'MMM': return (cal.monthsShort || cal.months)[parts.m - 1];
        case 'MM': return pad2(parts.m);
        case 'M': return String(parts.m);
        case 'DD': return pad2(parts.d);
        case 'D': return String(parts.d);
        case 'dddd': return weekdayNames[dow];
        case 'ddd': return weekdayShort[dow];
        case 'dd': return weekdayShort[dow].slice(0, 2);
        case 'd': return String(dow);
        case 'HH': return pad2(parts.hh || 0);
        case 'H': return String(parts.hh || 0);
        case 'hh': return pad2((parts.hh || 0) % 12 === 0 ? 12 : (parts.hh || 0) % 12);
        case 'h': return String((parts.hh || 0) % 12 === 0 ? 12 : (parts.hh || 0) % 12);
        case 'mm': return pad2(parts.mm || 0);
        case 'm': return String(parts.mm || 0);
        case 'ss': return pad2(parts.ss || 0);
        case 's': return String(parts.ss || 0);
        case 'A': return (parts.hh || 0) < 12 ? 'ق.ظ' : 'ب.ظ';
        case 'a': return (parts.hh || 0) < 12 ? 'قبل از ظهر' : 'بعد از ظهر';
        default:
          if (tok.charAt(0) === '[') return tok.slice(1, -1);
          return tok;
      }
    });
    if (opts.persianDigits) out = toFaDigits(out);
    return out;
  }

  /**
   * تحلیل رشته‌ی تاریخ. خروجی: {calendar, y, m, d, hh, mm, ss, jdn} یا null
   *  از فرمت‌های «YYYY/MM/DD»، «YYYY-MM-DD»، «YY/MM/DD» و همچنین خروجی
   *  قالب دلخواه کاربر (با توکن‌های YYYY, MM, DD) پشتیبانی می‌کند.
   */
  function parseDateStr(input, calendar, pattern) {
    if (input == null) return null;
    var cal = CALENDARS[calendar || 'jalali'];
    var str = trim(toEnDigits(input)).replace(/[.\u0660-\u0669]/g, function (c) { return c === '.' ? '/' : c; });
    if (!str) return null;
    var y, m, d, hh = 0, mm = 0, ss = 0, mt;

    // ساعت (در صورت وجود)
    mt = str.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (mt) {
      hh = +mt[1]; mm = +mt[2]; ss = +(mt[3] || 0);
      str = trim(str.replace(mt[0], ' '));
    }
    str = trim(str.replace(/\s+/g, ' '));

    // YYYY/MM/DD یا YYYY-MM-DD (با پشتیبانی از نام ماه)
    mt = str.match(/^(\d{2,4})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,2})$/);
    if (mt) {
      y = +mt[1]; m = +mt[2]; d = +mt[3];
    } else {
      // DD/MM/YYYY  یا  DD-MM-YYYY (وقتی سال در انتها باشد)
      mt = str.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{2,4})$/);
      if (mt) {
        d = +mt[1]; m = +mt[2]; y = +mt[3];
      }
    }
    // قالب دلخواه
    if (y == null && pattern) {
      var re = '', keys = [];
      String(pattern).replace(/\[[^\]]*\]|YYYY|YY|MM|DD|HH|mm|ss/g, function (tok) {
        keys.push(tok);
        re += '\\s*(\\d{1,4})\\s*';
        return '';
      });
      // الگوی بالا برای قالب‌های ساده کافی است
      if (keys.length >= 3) {
        var pm = str.match(new RegExp('^' + re.trim() + '$'));
        if (pm) {
          for (var i = 0; i < keys.length; i++) {
            if (keys[i] === 'YYYY' || keys[i] === 'YY') y = +pm[i + 1];
            else if (keys[i] === 'MM') m = +pm[i + 1];
            else if (keys[i] === 'DD') d = +pm[i + 1];
          }
        }
      }
    }
    if (y == null || m == null || d == null) return null;
    if (y < 100) y = calendar === 'jalali' ? 1400 + y : 2000 + y;
    if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return null;
    if (d > cal.monthLength(y, m)) return null;
    var jdn = cal.jdn(y, m, d);
    return { calendar: calendar, y: y, m: m, d: d, hh: hh, mm: mm, ss: ss, jdn: jdn };
  }

  /** تشخیص خودکار تقویم از روی شکل رشته */
  function guessCalendar(str) {
    var s = trim(toEnDigits(str));
    var mt = s.match(/^(\d{2,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
    if (!mt) return null;
    var y = +mt[1];
    if (y > 1700) return 'gregorian';
    if (y >= 1100 && y <= 1700) return 'jalali';
    return null;
  }

  /* ==========================================================================
   *  1-5) موتور دقیق کبیسه  /  Precise leap-year engine
   *  ------------------------------------------------------------------------
   *  قاعده‌های پشتیبانی‌شده (گزینه‌ی leapRule):
   *    'auto'         : الگوریتم بورکفسکی در بازه‌ی رسمی ۱۱۷۸ تا ۱۶۳۳ و
   *                     محاسبه‌ی نجومی خارج از آن بازه (پیش‌فرض)
   *    'borkowski'    : فقط الگوریتم جدولی/ریاضی بورکفسکی
   *    'astronomical' : محاسبه‌ی مستقیم لحظه‌ی اعتدال بهاری (روش میوس) و
   *                     قاعده‌ی رسمی ایران: اگر اعتدال پیش از ظهر به وقت
   *                     تهران (UTC+3:30) باشد، همان روز، وگرنه روز بعد
   *    'arithmetic'   : چرخه‌ی حسابی ۳۳ساله (سازگار با کتابخانه‌های قدیمی)
   *    'table'        : فهرست دستی سال‌های کبیسه‌ی کاربر (کنترل کامل و دقیق)
   *    تابع دلخواه    : (year) => boolean
   * ========================================================================== */

  /* --- جدول جملات تناوبی اعتدال بهاری (Meeus, Astronomical Algorithms, ch. 27) --- */
  var EQUINOX_TERMS = [
    [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186],
    [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443],
    [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513],
    [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
    [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417],
    [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029],
    [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756],
    [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074]
  ];

  var D2R = Math.PI / 180;

  /** اختلاف زمانی TT-UT بر حسب ثانیه (اسپناک و میوس) */
  function deltaTSeconds(year) {
    var t, u;
    if (year < 948) {
      u = (year - 2000) / 100;
      return 2177 + 497 * u + 44.1 * u * u;
    }
    if (year < 1600) {
      u = (year - 1000) / 100;
      return 1574.2 - 556.01 * u + 71.23472 * u * u + 0.319781 * u * u * u -
        0.8503463 * u * u * u * u - 0.005050998 * Math.pow(u, 5) + 0.0083572073 * Math.pow(u, 6);
    }
    if (year < 1700) {
      t = year - 1600;
      return 120 - 0.9808 * t - 0.01532 * t * t + t * t * t / 7129;
    }
    if (year < 1800) {
      t = year - 1700;
      return 8.83 + 0.1603 * t - 0.0059285 * t * t + 0.00013336 * t * t * t - t * t * t * t / 1174000;
    }
    if (year < 1860) {
      t = year - 1800;
      return 13.72 - 0.332447 * t + 0.0068612 * t * t + 0.0041116 * t * t * t -
        0.00037436 * Math.pow(t, 4) + 0.0000121272 * Math.pow(t, 5) -
        0.0000001699 * Math.pow(t, 6) + 0.000000000875 * Math.pow(t, 7);
    }
    if (year < 1900) {
      t = year - 1860;
      return 7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t * t * t -
        0.0004473624 * Math.pow(t, 4) + Math.pow(t, 5) / 233174;
    }
    if (year < 1920) {
      t = year - 1900;
      return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t * t * t - 0.000197 * Math.pow(t, 4);
    }
    if (year < 1941) {
      t = year - 1920;
      return 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t * t * t;
    }
    if (year < 1961) {
      t = year - 1950;
      return 29.07 + 0.407 * t - t * t / 233 + t * t * t / 2547;
    }
    if (year < 1986) {
      t = year - 1975;
      return 45.45 + 1.067 * t - t * t / 260 - t * t * t / 718;
    }
    if (year < 2005) {
      t = year - 2000;
      return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t * t * t +
        0.000651814 * Math.pow(t, 4) + 0.00002373599 * Math.pow(t, 5);
    }
    if (year < 2050) {
      t = year - 2000;
      return 62.92 + 0.32217 * t + 0.005589 * t * t;
    }
    if (year < 2150) {
      u = (year - 1820) / 100;
      return -20 + 32 * u * u - 0.5628 * (2150 - year);
    }
    u = (year - 1820) / 100;
    return -20 + 32 * u * u;
  }

  /** لحظه‌ی اعتدال بهاری (روز جولیَن، مبنا TT و نیم‌روز) */
  function marchEquinoxJde(year) {
    var Y = (year - 2000) / 1000;
    var jde0 = 2451623.80984 + 365242.37404 * Y + 0.05169 * Y * Y - 0.00411 * Y * Y * Y - 0.00057 * Math.pow(Y, 4);
    var T = (jde0 - 2451545.0) / 36525;
    var W = (35999.373 * T - 2.47) * D2R;
    var dl = 1 + 0.0334 * Math.cos(W) + 0.0007 * Math.cos(2 * W);
    var S = 0;
    for (var i = 0; i < EQUINOX_TERMS.length; i++) {
      var term = EQUINOX_TERMS[i];
      S += term[0] * Math.cos((term[1] + term[2] * T) * D2R);
    }
    return jde0 + (0.00001 * S) / dl;
  }

  /**
   * روز جولیَن نوروز بر اساس قاعده‌ی رسمی ایران:
   * اگر لحظه‌ی اعتدال پیش از ظهر به وقت ایران (UTC+3:30) باشد همان روز، وگرنه روز بعد.
   */
  var _nowruzCache = {};
  function nowruzJdnAstro(gy) {
    if (_nowruzCache[gy] !== undefined) return _nowruzCache[gy];
    var jde = marchEquinoxJde(gy);
    var local = jde - deltaTSeconds(gy) / 86400 + 3.5 / 24;   // به وقت رسمی ایران
    var dayNumber = Math.floor(local + 0.5);                  // روز جولیَنِ شامل لحظه
    var fraction = (local + 0.5) - dayNumber;                 // کسری از نیمه‌شب
    var hour = fraction * 24;
    var jdn = hour < 12 ? dayNumber : dayNumber + 1;          // قاعده‌ی ظهر
    _nowruzCache[gy] = jdn;
    return jdn;
  }

  /* --- قاعده‌ی حسابی ۳۳ساله --- */
  var ARITH_EPOCH_JDN = 1948320;      // ۱ فروردین سال ۱
  function arithNowruzJdn(jy) {
    return ARITH_EPOCH_JDN + 365 * (jy - 1) + Math.floor((8 * jy + 21) / 33);
  }
  function arithIsLeap(jy) { return ((25 * jy + 11) % 33) < 8; }

  /* --- وضعیت قاعده‌ی فعال --- */
  var _leapRule = { mode: 'auto', list: null, add: null, remove: null, fn: null, label: 'auto' };
  var _yearStartCache = {};

  function normalizeLeapRule(rule) {
    var out = { mode: 'auto', list: null, add: null, remove: null, fn: null, label: 'auto' };
    if (rule == null) return out;
    if (typeof rule === 'function') {
      out.mode = 'custom'; out.fn = rule; out.label = 'custom';
      return out;
    }
    if (isArr(rule)) {
      out.mode = 'table';
      out.list = rule.map(Number).filter(function (y) { return !isNaN(y); });
      out.label = 'table';
      return out;
    }
    if (typeof rule === 'string') {
      var key = rule.toLowerCase();
      if (key === 'astronomical' || key === 'najoomi' || key === 'equinox') { out.mode = 'astronomical'; out.label = 'astronomical'; }
      else if (key === 'arithmetic' || key === 'hesabi' || key === '33') { out.mode = 'arithmetic'; out.label = 'arithmetic'; }
      else if (key === 'borkowski') { out.mode = 'borkowski'; out.label = 'borkowski'; }
      else { out.mode = 'auto'; out.label = 'auto'; }
      return out;
    }
    if (isPlainObj(rule)) {
      var mode = rule.mode || (rule.leapYears ? 'table' : 'auto');
      out.mode = ['auto', 'borkowski', 'astronomical', 'arithmetic', 'table', 'custom'].indexOf(mode) !== -1 ? mode : 'auto';
      out.label = mode + (rule.add || rule.remove ? '+overrides' : '');
      if (rule.leapYears) out.list = normalizeList(rule.leapYears).map(Number);
      if (rule.list) out.list = normalizeList(rule.list).map(Number);
      if (rule.add) out.add = normalizeList(rule.add).map(Number);
      if (rule.remove) out.remove = normalizeList(rule.remove).map(Number);
      if (isFn(rule.fn)) { out.mode = 'custom'; out.fn = rule.fn; }
      return out;
    }
    return out;
  }

  /** تنظیم قاعده‌ی کبیسه (سراسری) */
  function setLeapRule(rule) {
    _leapRule = normalizeLeapRule(rule);
    _yearStartCache = {};
    _nowruzCache = {};
    return _leapRule.label;
  }
  function getLeapRule() {
    return {
      mode: _leapRule.mode, label: _leapRule.label, leapYears: _leapRule.list,
      add: _leapRule.add, remove: _leapRule.remove, hasCustomFn: !!_leapRule.fn
    };
  }

  /** آیا این سال کبیسه است؟ (بر اساس قاعده‌ی فعال، بدون هیچ خطایی) */
  function isLeapJalaliYearRule(jy) {
    jy = Math.round(jy);
    var base;
    switch (_leapRule.mode) {
      case 'astronomical':
        base = (yearStartAstro(jy + 1) - yearStartAstro(jy)) === 366;
        break;
      case 'arithmetic':
        base = arithIsLeap(jy);
        break;
      case 'table':
        base = !!(_leapRule.list && _leapRule.list.indexOf(jy) !== -1);
        break;
      case 'custom':
        try { base = !!_leapRule.fn(jy); } catch (e) { base = borkowskiIsLeap(jy); }
        break;
      case 'borkowski':
        base = borkowskiIsLeap(jy);
        break;
      default: // auto
        base = (jy >= 1178 && jy <= 1633) ? borkowskiIsLeap(jy) : ((yearStartAstro(jy + 1) - yearStartAstro(jy)) === 366);
    }
    if (_leapRule.add && _leapRule.add.indexOf(jy) !== -1) base = true;
    if (_leapRule.remove && _leapRule.remove.indexOf(jy) !== -1) base = false;
    return base;
  }

  function borkowskiIsLeap(jy) { return isLeapJalaliYearBorkowski(jy); }

  /* --- شروع سال جلالی بر پایه‌ی هر قاعده (JDN) --- */
  function yearStartBorkowski(jy) {
    var r = jalCalSafe(jy, true);
    return g2d(r.gy, 3, r.march);
  }
  function yearStartAstro(jy) {
    var gy = jy + 621;
    // انتخاب نوروزی که واقعاً به این سال جلالی تعلق دارد (تحمل اختلاف یک‌روزه‌ی مرزها)
    var candidates = [nowruzJdnAstro(gy - 1), nowruzJdnAstro(gy), nowruzJdnAstro(gy + 1)];
    for (var i = 0; i < candidates.length; i++) {
      if (d2j(candidates[i]).jy === jy) return candidates[i];
    }
    return nowruzJdnAstro(gy);
  }
  function yearStartArithmetic(jy) { return arithNowruzJdn(jy); }

  /** شروع سال با قاعده‌ی فعال (با جدول دستی، انحراف تجمعی هم لحاظ می‌شود) */
  function yearStartFor(jy, rule) {
    rule = rule || _leapRule;
    var key = rule.label + ':' + jy;
    if (_yearStartCache[key] !== undefined) return _yearStartCache[key];
    var base;
    switch (rule.mode) {
      case 'astronomical': base = yearStartAstro(jy); break;
      case 'arithmetic': base = yearStartArithmetic(jy); break;
      case 'table':
      case 'custom':
        if (rule.mode === 'custom' && rule.fn) {
          // با تابع دلخواه: از مبدأ بورکفسکی + مجموع انحراف کبیسه‌ها
          base = yearStartBorkowski(jy) + leapShift(jy, rule);
        } else {
          base = yearStartBorkowski(jy) + leapShift(jy, rule);
        }
        break;
      case 'borkowski': base = yearStartBorkowski(jy); break;
      default:
        base = (jy >= 1178 && jy <= 1633) ? yearStartBorkowski(jy) : yearStartAstro(jy);
        if (rule.add || rule.remove) base += leapShift(jy, rule);
    }
    _yearStartCache[key] = base;
    return base;
  }

  /** مجموع انحراف تعداد کبیسه‌ها نسبت به مبنا (برای قواعد دستی/دلخواه) */
  function leapShift(jy, rule) {
    if (!rule) return 0;
    var diff = 0, y;
    var lo = 1178, hi = Math.max(jy, 1179);
    // برای بازه‌های بزرگ، محاسبه‌ی تجمعی مستقیم هزینه‌بر است؛ از اختلاف قاعده‌ها استفاده می‌کنیم
    if (rule.mode === 'table' || rule.mode === 'custom') {
      for (y = Math.min(lo, jy); y < jy; y++) {
        var declared = rule.mode === 'table'
          ? !!(rule.list && rule.list.indexOf(y) !== -1)
          : (rule.fn ? !!rule.fn(y) : borkowskiIsLeap(y));
        var actual = (y >= 1178 && y <= 1633) ? borkowskiIsLeap(y) : ((yearStartAstro(y + 1) - yearStartAstro(y)) === 366);
        if (declared !== actual) diff += declared ? 1 : -1;
      }
    }
    if (rule.add) rule.add.forEach(function (y2) { if (y2 < jy) diff += 1; });
    if (rule.remove) rule.remove.forEach(function (y2) { if (y2 < jy) diff -= 1; });
    return diff;
  }

  /* --- تبدیل‌های عمومی مبتنی بر قاعده --- */
  function j2dRule(jy, jm, jd) {
    return yearStartFor(jy) + (jm - 1) * 31 - idiv(jm, 7) * (jm - 7) + jd - 1;
  }
  function d2jRule(jdn) {
    var jy = d2j(jdn).jy;                       // تخمین اولیه
    while (yearStartFor(jy + 1) <= jdn) jy += 1;
    while (yearStartFor(jy) > jdn) jy -= 1;
    var doy = jdn - yearStartFor(jy);
    var jm = doy < 186 ? 1 + idiv(doy, 31) : 7 + idiv(doy - 186, 30);
    var jd = doy - ((jm - 1) * 31 - idiv(jm, 7) * (jm - 7)) + 1;
    return { jy: jy, jm: jm, jd: jd };
  }
  function monthLengthRule(jy, jm) {
    var start = yearStartFor(jy) + (jm - 1) * 31 - idiv(jm, 7) * (jm - 7);
    var nextStart = jm === 12 ? yearStartFor(jy + 1) : yearStartFor(jy) + (jm) * 31 - idiv(jm + 1, 7) * (jm + 1 - 7);
    return nextStart - start;
  }

  /** فهرست سال‌های کبیسه در یک بازه */
  function jalaliLeapYears(from, to) {
    var out = [];
    var a = Math.min(from, to), b = Math.max(from, to);
    for (var y = a; y <= b; y++) if (isLeapJalaliYearRule(y)) out.push(y);
    return out;
  }

  /** طول سال جلالی بر اساس قاعده‌ی فعال */
  function jalaliYearLength(jy) { return isLeapJalaliYearRule(jy) ? 366 : 365; }

  /** مقایسه‌ی دو قاعده و برگرداندن سال‌های متفاوت (برای اطمینان از دقت) */
  function compareLeapRules(ruleA, ruleB, from, to) {
    var save = _leapRule;
    var out = [];
    var a = Math.min(from, to), b = Math.max(from, to);
    setLeapRule(ruleA);
    var listA = {};
    for (var y = a; y <= b; y++) listA[y] = isLeapJalaliYearRule(y);
    setLeapRule(ruleB);
    for (var y2 = a; y2 <= b; y2++) {
      if (isLeapJalaliYearRule(y2) !== listA[y2]) out.push(y2);
    }
    _leapRule = save;
    _yearStartCache = {};
    return out;
  }

/* ===== 02-holidays.js ===== */

  /* ==========================================================================
   *  2) مدیریت تعطیلات و مناسبت‌ها  /  Holiday manager
   *  ------------------------------------------------------------------------
   *  - بارگذاری از فایل/آدرس JSON شخصی کاربر (کاملاً آفلاین)
   *  - دریافت خودکار از اینترنت و ذخیره‌سازی در کش (localStorage)
   *  - خروجی گرفتن به صورت فایل JSON قابل ذخیره (downloadHolidays)
   * ========================================================================== */

  var CACHE_KEY_DEFAULT = 'aria-datepicker-holidays-cache-v1';

  /** چند تاریخ معروف به عنوان نمونه‌ی داخلی (در صورت نبود داده‌ی بیرونی) */
  function buildCalendarKey(calendar, y, m, d) {
    return calendar.charAt(0).toUpperCase() + ':' + y + '-' + pad2(m) + '-' + pad2(d);
  }

  /** تحلیل یک کلید تاریخ با جداکننده‌های / یا - (و ارقام فارسی) */
  function parseKeyDate(str) {
    var s = trim(toEnDigits(str));
    var mt = s.match(/^(\d{2,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (!mt) return null;
    return { y: +mt[1], m: +mt[2], d: +mt[3] };
  }

  function HolidayManager(options) {
    options = options || {};
    this.options = extend({
      calendar: 'jalali',
      countryCode: 'IR',
      cache: true,
      cacheKey: CACHE_KEY_DEFAULT,
      ttl: 7 * 24 * 60 * 60 * 1000,   // یک هفته
      lang: 'fa',
      fetchTimeout: 12000,
      providers: null,
      onLoad: null,
      onError: null,
      onLog: null
    }, options);

    this.holidays = { jalali: {}, gregorian: {}, events: { jalali: {}, gregorian: {} } };
    this.fetched = { jalali: {}, gregorian: {} };
    this.loading = {};
    this.lastError = null;
    this._writeTimer = null;
  }

  /* -------------------------------------------------------------------------
   *  شرکت‌دهندگان پیش‌فرض (سرویس‌های عمومی اینترنت)
   *  خروجی هر parser : آرایه‌ای از {date, title, type, calendar}
   * ---------------------------------------------------------------------- */
  var DEFAULT_PROVIDERS = {
    jalali: [
      {
        name: 'holidayapi.ir',
        url: function (year) { return 'https://holidayapi.ir/jalali/' + year; },
        parse: function (json) {
          var out = [];
          var list = (json && (json.holidays || json.data || json.events)) || (isArr(json) ? json : []);
          normalizeList(list).forEach(function (item) {
            if (!isPlainObj(item)) return;
            if (item.is_holiday === false) return;
            var date = item.date || item.jalali_date || item.jalaali || item.day;
            if (!date) return;
            out.push({
              date: date,
              title: trim(item.description || item.title || item.name || item.holiday_title || ''),
              type: item.is_religious ? 'religious' : 'public',
              calendar: 'jalali'
            });
          });
          return out;
        }
      },
      {
        name: 'persiancalapi.ir',
        url: function (year) { return 'https://persiancalapi.ir/jalali/' + year; },
        parse: function (json) {
          var out = [];
          var days = (json && json.days) || [];
          normalizeList(days).forEach(function (day) {
            if (!isPlainObj(day) || !day.is_holiday) return;
            var y = day.year || (json && json.year);
            var m = day.month || (json && json.month);
            var dt = day.date ? parseKeyDate(day.date) : null;
            if (dt) { y = dt.y; m = dt.m; day.day = dt.d; }
            if (!y || !m || !day.day) return;
            out.push({
              date: y + '/' + pad2(m) + '/' + pad2(day.day),
              title: trim(day.holiday_title || (isArr(day.events) ? day.events.join('، ') : '') || 'تعطیل رسمی'),
              type: 'public',
              calendar: 'jalali'
            });
          });
          return out;
        }
      },
      {
        name: 'keybit.ir',
        url: function (year) { return 'https://api.keybit.ir/calendar/year?y=' + year; },
        parse: function (json) {
          var out = [];
          var root = (json && json.data) || json || {};
          var months = root.months || root.jalali || [];
          normalizeList(months).forEach(function (mon) {
            var days = (mon && mon.days) || [];
            normalizeList(days).forEach(function (day) {
              if (!isPlainObj(day)) return;
              var isHol = day.is_holiday || day.holiday || (day.holidays && day.holidays.length);
              if (!isHol) return;
              var y = (mon.year || root.year || '');
              var m = (mon.month || mon.index || '');
              var dayN = day.day || day.number || day.day_of_month;
              if (!y || !m || !dayN) return;
              out.push({
                date: y + '/' + pad2(m) + '/' + pad2(dayN),
                title: trim((isArr(day.holidays) && day.holidays.join('، ')) || day.holiday_title || 'تعطیل رسمی'),
                type: 'public',
                calendar: 'jalali'
              });
            });
          });
          return out;
        }
      }
    ],
    gregorian: [
      {
        name: 'holidayapi.ir',
        url: function (year) { return 'https://holidayapi.ir/gregorian/' + year; },
        parse: function (json) {
          var out = [];
          var list = (json && (json.holidays || json.data)) || (isArr(json) ? json : []);
          normalizeList(list).forEach(function (item) {
            if (!isPlainObj(item)) return;
            if (item.is_holiday === false) return;
            var dt = parseKeyDate(item.date || item.gregorian_date || '');
            if (!dt) return;
            out.push({
              date: dt.y + '/' + pad2(dt.m) + '/' + pad2(dt.d),
              title: trim(item.description || item.title || item.name || ''),
              type: 'public',
              calendar: 'gregorian'
            });
          });
          return out;
        }
      },
      {
        name: 'date.nager.at',
        url: function (year, countryCode) {
          return 'https://date.nager.at/api/v3/PublicHolidays/' + year + '/' + (countryCode || 'DE');
        },
        parse: function (json) {
          var out = [];
          normalizeList(isArr(json) ? json : []).forEach(function (item) {
            if (!isPlainObj(item) || !item.date) return;
            out.push({
              date: item.date,
              title: trim(item.localName || item.name || ''),
              type: 'public',
              calendar: 'gregorian'
            });
          });
          return out;
        }
      }
    ]
  };

  HolidayManager.prototype = {

    /* -------------------------- داده‌ها -------------------------- */

    /** درج یک رکورد تعطیلی/مناسبت در انبار */
    add: function (calendar, y, m, d, title, type, source) {
      if (!this.holidays[calendar]) this.holidays[calendar] = {};
      var key = y + '-' + pad2(m) + '-' + pad2(d);
      var prev = this.holidays[calendar][key];
      var isHoliday = type !== 'event' && type !== 'occasion';
      if (prev) {
        if (!prev.title && title) prev.title = title;
        if (isHoliday) prev.type = 'public';
        return prev;
      }
      this.holidays[calendar][key] = {
        title: title || '',
        type: isHoliday ? (type || 'public') : 'event',
        source: source || 'local'
      };
      return this.holidays[calendar][key];
    },

    /**
     * تحلیل و درج داده‌ی JSON در انبار.
     * قالب‌های پشتیبانی‌شده:
     *  1) { "jalali": { "1405-01-01": "نوروز" }, "gregorian": { "2026-12-25": "کریسمس" } }
     *  2) { "jalali": { "1405": { "01-01": {...} } } }
     *  3) { "holidays": [ { "date": "1405/01/01", "calendar": "jalali", "title": "نوروز", "type": "public" } ] }
     *  4) [ "1405/01/01", "1405/01/02" ]  (روزهای تعطیل بدون عنوان)
     */
    normalize: function (data, opts) {
      opts = opts || {};
      var self = this;
      var silent = !!opts.silent;
      var added = 0;
      var source = opts.source || 'json';

      function pushEntry(calendar, rawDate, value) {
        var dt = parseKeyDate(rawDate);
        if (!dt) return;
        var title = '', type = 'public';
        if (isStr(value)) {
          title = value;
        } else if (isPlainObj(value)) {
          title = value.title || value.name || value.description || value.holiday_title || '';
          type = value.type || value.kind || (value.is_holiday === false ? 'event' : 'public');
          if (value.is_holiday === false) type = 'event';
          if (!title && isArr(value.events)) title = value.events.join('، ');
        }
        self.add(calendar, dt.y, dt.m, dt.d, trim(title), type, source);
        added++;
      }

      function walkCalendarMap(calendar, map) {
        if (!isPlainObj(map)) return;
        for (var key in map) {
          if (!has(map, key)) continue;
          var value = map[key];
          if (parseKeyDate(key)) {                       // حالت تخت: 1405/01/01
            pushEntry(calendar, key, value);
          } else if (/^\d{2,4}$/.test(key) && isPlainObj(value)) { // حالت سال‌بندی‌شده: 1405
            for (var sub in value) {
              if (!has(value, sub)) continue;
              pushEntry(calendar, key + '/' + sub, value[sub]);
            }
          }
        }
      }

      if (isArr(data)) {
        data.forEach(function (item) {
          if (isStr(item)) {
            var cal = guessCalendar(item) || opts.calendar || this.options.calendar;
            pushEntry(cal, item, '');
          } else if (isPlainObj(item)) {
            var d = item.date || item.datetime || item.day;
            var c = item.calendar || item.type_calendar || guessCalendar(d) || opts.calendar || this.options.calendar;
            pushEntry(c, d, item);
          }
        }, this);
      } else if (isPlainObj(data)) {
        if (data.holidays) this.normalize(data.holidays, { silent: true, source: source, calendar: opts.calendar });
        if (data.events) this.normalize(data.events, { silent: true, source: source, calendar: opts.calendar });
        if (data.data && isArr(data.data)) this.normalize(data.data, { silent: true, source: source, calendar: opts.calendar });
        walkCalendarMap('jalali', data.jalali || data.shamsi || data.persian);
        walkCalendarMap('gregorian', data.gregorian || data.miladi || data.greg);
        if (data.weekends) this.options.weekends = extend({}, this.options.weekends, data.weekends);
        if (data.country) this.options.countryCode = data.country;
      }

      if (!silent) {
        this._saveCache();
        if (isFn(this.options.onLoad)) {
          this.options.onLoad({ added: added, source: source, holidays: this.holidays });
        }
      }
      return added;
    },

    /* ------------------------ پرس‌وجو ------------------------ */

    entry: function (calendar, y, m, d) {
      var map = this.holidays[calendar];
      if (!map) return null;
      return map[y + '-' + pad2(m) + '-' + pad2(d)] || null;
    },

    isHoliday: function (calendar, y, m, d) {
      var e = this.entry(calendar, y, m, d);
      return !!(e && e.type !== 'event');
    },

    titleOf: function (calendar, y, m, d) {
      var e = this.entry(calendar, y, m, d);
      return e ? e.title : '';
    },

    /** آیا این روز هفته تعطیل است؟  jsDow: 0=یکشنبه ... 6=شنبه */
    isWeekend: function (calendar, jsDow) {
      var map = (this.options.weekends && this.options.weekends[calendar]) || null;
      if (!map) map = calendar === 'jalali' ? [5] : [0, 6];
      return map.indexOf(jsDow) !== -1;
    },

    /** فهرست تعطیلات یک ماه مشخص */
    monthHolidays: function (calendar, y, m, limit) {
      var out = [], days = CALENDARS[calendar].monthLength(y, m);
      for (var d = 1; d <= days; d++) {
        var e = this.entry(calendar, y, m, d);
        if (e && e.type !== 'event') {
          out.push({ y: y, m: m, d: d, jdn: CALENDARS[calendar].jdn(y, m, d), title: e.title, type: e.type });
        }
      }
      if (limit && out.length > limit) out = out.slice(0, limit);
      return out;
    },

    /** همه‌ی تعطیلات یک سال مشخص */
    yearHolidays: function (calendar, y) {
      var out = [], map = this.holidays[calendar] || {}, prefix = y + '-';
      for (var key in map) {
        if (!has(map, key) || key.indexOf(prefix) !== 0) continue;
        var dt = key.split('-');
        out.push({ y: +dt[0], m: +dt[1], d: +dt[2], jdn: CALENDARS[calendar].jdn(+dt[0], +dt[1], +dt[2]), title: map[key].title, type: map[key].type });
      }
      out.sort(function (a, b) { return a.jdn - b.jdn; });
      return out;
    },

    hasYear: function (calendar, y) {
      var map = this.holidays[calendar] || {}, prefix = y + '-';
      for (var key in map) if (has(map, key) && key.indexOf(prefix) === 0) return true;
      return false;
    },

    /* --------------------- کش محلی (localStorage) --------------------- */

    _storage: function () {
      try {
        if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
      } catch (e) { /* دسترسی مسدود است */ }
      return null;
    },

    _saveCache: function () {
      if (!this.options.cache) return;
      var store = this._storage();
      if (!store) return;
      var self = this;
      clearTimeout(this._writeTimer);
      this._writeTimer = setTimeout(function () {
        try {
          store.setItem(self.options.cacheKey, JSON.stringify(self.toJSON(true)));
        } catch (e) { /* حجم بیش از حد */ }
      }, 30);
    },

    /** خواندن داده‌ی ذخیره‌شده از کش */
    loadCache: function () {
      if (!this.options.cache) return false;
      var store = this._storage();
      if (!store) return false;
      var raw = null;
      try { raw = store.getItem(this.options.cacheKey); } catch (e) { raw = null; }
      if (!raw) return false;
      try {
        var data = JSON.parse(raw);
        if (data && data.holidays) {
          this.holidays = extend({ jalali: {}, gregorian: {}, events: {} }, data.holidays);
          this.fetched = extend({ jalali: {}, gregorian: {} }, data.fetched || {});
          return true;
        }
      } catch (e) { /* داده‌ی خراب */ }
      return false;
    },

    clearCache: function () {
      var store = this._storage();
      if (store) { try { store.removeItem(this.options.cacheKey); } catch (e) { } }
      this.holidays = { jalali: {}, gregorian: {}, events: {} };
      this.fetched = { jalali: {}, gregorian: {} };
    },

    /* --------------------------- اینترنت --------------------------- */

    _log: function (msg) { if (isFn(this.options.onLog)) this.options.onLog(msg); },

    _error: function (err) {
      this.lastError = err;
      this._log(err && err.message ? err.message : String(err));
      if (isFn(this.options.onError)) this.options.onError(err);
    },

    isOnline: function () {
      try {
        if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) return false;
      } catch (e) { }
      return true;
    },

    providersFor: function (calendar) {
      var custom = this.options.providers;
      if (custom && custom[calendar] && custom[calendar].length) return custom[calendar];
      return DEFAULT_PROVIDERS[calendar] || [];
    },

    /** آیا اطلاعات این سال تازه است؟ */
    isFresh: function (calendar, year) {
      var ts = this.fetched[calendar] && this.fetched[calendar][year];
      if (!ts) return false;
      return (Date.now() - ts) < this.options.ttl;
    },

    fetchJSON: function (url) {
      var self = this;
      if (typeof fetch !== 'function') {
        return Promise.reject(new Error('ADP: مرورگر از fetch پشتیبانی نمی‌کند'));
      }
      var controller = null;
      var timer = null;
      try {
        if (typeof AbortController === 'function') {
          controller = new AbortController();
          timer = setTimeout(function () { controller.abort(); }, this.options.fetchTimeout || 12000);
        }
      } catch (e) { controller = null; }

      return fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'default',
        signal: controller ? controller.signal : undefined,
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error('ADP: پاسخ نامعتبر (' + res.status + ') از ' + url);
        return res.json();
      })['catch'](function (err) {
        if (timer) clearTimeout(timer);
        throw err;
      });
    },

    /** بارگذاری فایل JSON کاربر از یک آدرس */
    loadFromUrl: function (url) {
      var self = this;
      return this.fetchJSON(url).then(function (json) {
        self.normalize(json, { source: url });
        return json;
      })['catch'](function (err) {
        self._error(err);
        return null;
      });
    },

    /**
     * دریافت تعطیلات از اینترنت.
     *  years: { jalali: [1404, 1405], gregorian: [2025, 2026] } یا آرایه‌ی سال
     */
    fetchHolidays: function (years, force) {
      var self = this;
      years = years || {};
      if (!this.isOnline() && !force) {
        this._log('ADP: اتصال به اینترنت برقرار نیست؛ از داده‌ی ذخیره‌شده استفاده می‌شود.');
        return Promise.resolve({ offline: true, jalali: 0, gregorian: 0 });
      }
      var plan = [];
      ['jalali', 'gregorian'].forEach(function (calKey) {
        var list = years[calKey] || [];
        normalizeList(list).forEach(function (y) {
          if (!y) return;
          if (!force && self.isFresh(calKey, y)) return;
          plan.push({ calendar: calKey, year: y });
        });
      });
      if (!plan.length) return Promise.resolve({ cached: true, jalali: 0, gregorian: 0 });

      var result = { jalali: 0, gregorian: 0 };
      var tasks = plan.map(function (job) {
        var providers = self.providersFor(job.calendar);
        var loadingKey = job.calendar + '-' + job.year;
        self.loading[loadingKey] = true;

        var chain = Promise.reject(new Error('start'));
        providers.forEach(function (provider) {
          chain = chain['catch'](function () {
            return self.fetchJSON(provider.url(job.year, self.options.countryCode, job.calendar)).then(function (json) {
              var list = provider.parse(json, job.year, self.options.countryCode) || [];
              list.forEach(function (item) {
                var dt = parseKeyDate(item.date);
                if (!dt) return;
                self.add(job.calendar, dt.y, dt.m, dt.d, item.title, item.type || 'public', provider.name);
                result[job.calendar]++;
              });
              if (!list.length) throw new Error('ADP: داده‌ای از ' + provider.name + ' دریافت نشد');
              return provider.name;
            });
          });
        });

        return chain.then(function (usedProvider) {
          self.fetched[job.calendar][job.year] = Date.now();
          delete self.loading[loadingKey];
          self._log('ADP: تعطیلات ' + job.calendar + ' سال ' + job.year + ' از ' + usedProvider + ' دریافت شد.');
          return true;
        })['catch'](function (err) {
          delete self.loading[loadingKey];
          self._log('ADP: دریافت تعطیلات ' + job.calendar + ' سال ' + job.year + ' ناموفق بود (' + (err && err.message) + ')');
          return false;
        });
      });

      return Promise.all(tasks).then(function () {
        self._saveCache();
        if (isFn(self.options.onLoad)) {
          self.options.onLoad({ added: result.jalali + result.gregorian, source: 'internet', result: result, holidays: self.holidays });
        }
        return result;
      });
    },

    /**
     * دریافت هوشمند: اگر داده‌ی سال مورد نیاز موجود/تازه نبود، از اینترنت می‌گیرد.
     * years: آرایه‌ی اعداد به تفکیک هر تقویم
     */
    ensure: function (req) {
      var self = this;
      var plan = { jalali: [], gregorian: [] };
      ['jalali', 'gregorian'].forEach(function (calKey) {
        normalizeList((req && req[calKey]) || []).forEach(function (y) {
          if (!y) return;
          if (!self.isFresh(calKey, y) || !self.hasYear(calKey, y)) plan[calKey].push(y);
        });
      });
      if (!plan.jalali.length && !plan.gregorian.length) return Promise.resolve({ cached: true });
      return this.fetchHolidays(plan);
    },

    /* --------------------------- خروجی --------------------------- */

    /** ساخت آبجکت قابل ذخیره (همان ساختار فایل JSON) */
    toJSON: function (compact) {
      var out = {
        generatedAt: new Date().toISOString(),
        generator: 'Aria Date Picker v' + VERSION,
        country: this.options.countryCode,
        weekends: this.options.weekends || { jalali: [5], gregorian: [0, 6] },
        jalali: {},
        gregorian: {}
      };
      ['jalali', 'gregorian'].forEach(function (calKey) {
        var map = this.holidays[calKey] || {};
        var keys = Object.keys(map).sort();
        keys.forEach(function (key) {
          var dt = parseKeyDate(key);
          if (!dt) return;
          var item = map[key];
          if (compact && isFn(JSON) === false) return;
          out[calKey][key] = compact ? (item.title || '') : { title: item.title, type: item.type };
        });
      }, this);
      return out;
    },

    toJSONString: function (pretty) {
      return JSON.stringify(this.toJSON(false), null, pretty === false ? 0 : 2);
    },

    /** دانلود فایل JSON به‌روزشده (کاربر می‌تواند آن را به عنوان فایل تعطیلات ذخیره کند) */
    download: function (filename) {
      var name = filename || 'holidays.json';
      var text = this.toJSONString(true);
      try {
        if (typeof document === 'undefined' || typeof Blob === 'undefined' || !URL || !URL.createObjectURL) {
          return null;
        }
        var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.setAttribute('data-adp-download', '1');
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          if (a.parentNode) a.parentNode.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1200);
        return text;
      } catch (e) {
        return text;
      }
    }
  };

/* ===== 03-styles.js ===== */

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
.{{P}}theme-dark,
.{{P}}popup.{{P}}theme-dark,
.{{P}}inline.{{P}}theme-dark,
.{{P}}wrap.{{P}}theme-dark,
.{{P}}modal-bg.{{P}}theme-dark,
.{{P}}theme-dark .{{P}}popup,
.{{P}}theme-dark .{{P}}inline,
.{{P}}theme-dark .{{P}}field {
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
  background-color: #1b2130;
  color: #e7ecf6;
}
.{{P}}popup.{{P}}theme-dark, .{{P}}inline.{{P}}theme-dark, .{{P}}theme-dark .{{P}}popup, .{{P}}theme-dark .{{P}}inline {
  background: #1b2130;
  border-color: #2c3549;
}
.{{P}}theme-dark .{{P}}day, .{{P}}theme-dark .{{P}}wd, .{{P}}theme-dark .{{P}}cell, .{{P}}theme-dark .{{P}}cal-label,
.{{P}}theme-dark .{{P}}btn, .{{P}}theme-dark .{{P}}switch, .{{P}}theme-dark .{{P}}list-item { color: #e7ecf6; }
.{{P}}theme-dark .{{P}}cell, .{{P}}theme-dark .{{P}}switch, .{{P}}theme-dark .{{P}}nav { background-color: #222a3b; }
.{{P}}theme-dark .{{P}}nav { background-color: transparent; }
.{{P}}theme-dark select, .{{P}}theme-dark .{{P}}time select { background: #222a3b; color: #e7ecf6; border-color: #2c3549; }
.{{P}}theme-dark .{{P}}day.{{P}}out { opacity: .45; }
.{{P}}theme-dark .{{P}}day.{{P}}in-range { background: var(--{{P}}accent-soft); }
.{{P}}theme-dark .{{P}}day:hover:not(:disabled) { background: var(--{{P}}accent-hover); }
.{{P}}theme-dark .{{P}}modal-bg { background: rgba(0, 0, 0, .62); }

/* --- تم خودکار بر اساس تنظیمات سیستم --- */
@media (prefers-color-scheme: dark) {
  .{{P}}theme-auto,
  .{{P}}popup.{{P}}theme-auto,
  .{{P}}inline.{{P}}theme-auto,
  .{{P}}wrap.{{P}}theme-auto,
  .{{P}}theme-auto .{{P}}popup,
  .{{P}}theme-auto .{{P}}inline,
  .{{P}}theme-auto .{{P}}field {
    --{{P}}bg: #1b2130;
    --{{P}}bg-alt: #222a3b;
    --{{P}}fg: #e7ecf6;
    --{{P}}muted: #97a3ba;
    --{{P}}border: #2c3549;
    --{{P}}accent: #4f86ff;
    --{{P}}accent-soft: rgba(79, 134, 255, .22);
    --{{P}}accent-hover: rgba(79, 134, 255, .14);
    --{{P}}holiday: #ff6b6f;
    --{{P}}holiday-soft: rgba(255, 107, 111, .16);
    --{{P}}today: #38c98b;
    color: #e7ecf6;
  }
  .{{P}}popup.{{P}}theme-auto, .{{P}}inline.{{P}}theme-auto, .{{P}}theme-auto .{{P}}popup, .{{P}}theme-auto .{{P}}inline {
    background: #1b2130;
    border-color: #2c3549;
  }
  .{{P}}theme-auto .{{P}}cell, .{{P}}theme-auto .{{P}}switch { background-color: #222a3b; }
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

/* ---------- نوار سوییچ تقویم ---------- */
.{{P}}switchbar {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 2px 4px 8px; margin-bottom: 6px;
  border-bottom: 1px dashed var(--{{P}}border);
}
.{{P}}switch {
  font: inherit; font-size: 12px; line-height: 1.6; padding: 3px 12px;
  border-radius: 999px; border: 1px solid var(--{{P}}border);
  background: var(--{{P}}bg-alt); color: var(--{{P}}muted); cursor: pointer;
  transition: all .15s;
}
.{{P}}switch:hover { border-color: var(--{{P}}accent); color: var(--{{P}}accent); }
.{{P}}switch.{{P}}active {
  background: var(--{{P}}accent); border-color: var(--{{P}}accent);
  color: var(--{{P}}accent-fg); font-weight: 700;
}
.{{P}}switch-hint { font-size: 11px; color: var(--{{P}}muted); margin-inline-start: auto; }

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
  display: inline-flex; align-items: baseline; gap: 2px; white-space: nowrap;
}
.{{P}}cal-label:hover { background: var(--{{P}}accent-hover); color: var(--{{P}}accent); }
.{{P}}cal-key {
  font-size: 11px; font-weight: 500; color: var(--{{P}}muted);
  margin-inline-start: 7px;          /* فاصله‌ی کوچک از تاریخ و سال */
  padding-inline-start: 6px;
  border-inline-start: 1px solid var(--{{P}}border);   /* جداکننده‌ی نازک و ملایم */
  line-height: 1.5;
}

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
/* روز تعطیل/جمعه‌ای که انتخاب می‌شود، به‌جای آبی، قرمز می‌شود */
.{{P}}day.{{P}}sel-holiday,
.{{P}}day.{{P}}sel-holiday.{{P}}range-start,
.{{P}}day.{{P}}sel-holiday.{{P}}range-end,
.{{P}}day.{{P}}sel-holiday.{{P}}selected { background: var(--{{P}}holiday); color: #ffffff; }
.{{P}}day.{{P}}sel-holiday.{{P}}in-range { background: var(--{{P}}holiday-soft); }
.{{P}}day.{{P}}sel-holiday .{{P}}day-sub, .{{P}}day.{{P}}sel-holiday .{{P}}day-num { color: inherit; }
.{{P}}day.{{P}}sel-holiday .{{P}}dot, .{{P}}day.{{P}}sel-holiday .{{P}}event-dot { background: #ffffff; }
.{{P}}day.{{P}}range-start.{{P}}rtl-edge { border-start-end-radius: 3px; border-end-end-radius: 3px; }
.{{P}}day.{{P}}selected { background: var(--{{P}}accent); color: var(--{{P}}accent-fg); font-weight: 700; }
.{{P}}day.{{P}}selected.{{P}}off, .{{P}}day.{{P}}selected .{{P}}dot { color: var(--{{P}}accent-fg); }
.{{P}}day:disabled, .{{P}}day[aria-disabled="true"] { color: var(--{{P}}muted); opacity: .45; cursor: not-allowed; background: transparent; }
/* جلوگیری قطعی از کلیک (حتی روی span داخل دکمه‌ی غیرفعال) */
.{{P}}day:disabled, .{{P}}day[aria-disabled="true"] { pointer-events: none; }
.{{P}}day:disabled:hover, .{{P}}day[aria-disabled="true"]:hover { background: transparent; }
.{{P}}day:focus-visible { outline: 2px solid var(--{{P}}accent); outline-offset: 1px; }
.{{P}}day-num { line-height: 1.1; }
.{{P}}day-sub { font-size: 9px; color: var(--{{P}}muted); line-height: 1; margin-top: 2px; }
.{{P}}selected .{{P}}day-sub { color: inherit; opacity: .85; }
.{{P}}dot { position: absolute; bottom: 4px; width: 4px; height: 4px; border-radius: 50%; background: var(--{{P}}holiday); }
.{{P}}event-dot {
  position: absolute; bottom: 4px; inset-inline-start: 5px;
  width: 4px; height: 4px; border-radius: 50%; background: var(--{{P}}accent);
}
.{{P}}selected .{{P}}event-dot { background: var(--{{P}}accent-fg); }
.{{P}}has-event .{{P}}day-num { font-weight: 700; }
.{{P}}list-item-event .{{P}}list-day { color: var(--{{P}}accent); }
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

/* ===== 04-picker.js ===== */

  /* ==========================================================================
   *  4) کلاس اصلی دیت‌پیکر  /  Main picker class
   * ========================================================================== */

  var _uidSeq = 0;

  var DEFAULTS = {
    /* --- تقویم --- */
    calendar: 'jalali',            // 'jalali' | 'gregorian' | 'both' | ['jalali','gregorian']
    primaryCalendar: null,         // اگر 'both' بود، کدام تقویم اصلی/نمایشی باشد
    lang: 'fa',                    // زبان برچسب‌ها: 'fa' | 'en'
    gregorianLang: null,           // زبان نام ماه‌های میلادی (پیش‌فرض = lang)
    gregorianDir: null,            // جهت پنل میلادی: 'ltr' | 'rtl' (پیش‌فرض: بر اساس زبان)
    weekStart: null,               // ایندکس شروع هفته بر اساس getDay()؛ پیش‌فرض هر تقویم
    persianDigits: 'auto',         // 'auto' | true | false | { jalali: true, gregorian: false }
    leapRule: null,                // قاعده‌ی کبیسه (سراسری): 'auto' | 'astronomical' | 'arithmetic' | فهرست | تابع
    dualDigits: false,             // نمایش عدد روزِ معادل در تقویم دیگر زیر عدد اصلی (true) یا همان عدد با ارقام دیگر ('same')

    /* --- مقدار و نمایش --- */
    format: null,                  // 'YYYY/MM/DD' یا {jalali:'...', gregorian:'...'}
    displayFormat: null,           // مترادف format
    dualDisplay: false,            // نمایش هر دو تقویم در کادر (۱۴۰۵/... — 2026/...)
    rangeSeparator: ' تا ',
    labels: null,
    initialDate: 'today',          // 'today' | 'now' | Date | '1405/01/01' | {y,m,d} | 'selected'
    defaultDate: null,             // مقدار پیش‌فرض انتخاب‌شده
    defaultRange: null,            // [{...}, {...}] یا '1404/01/01 - 1404/01/10'
    initialView: 'days',           // 'days' | 'months' | 'years'
    placeholder: null,             // متن جای‌خالی
    dir: null,                     // 'rtl' | 'ltr' (پیش‌فرض: خودکار)
    theme: 'light',                // 'light' | 'dark' | 'auto' (بر اساس تنظیمات سیستم)
    size: 'md',                    // 'sm' | 'md' | 'lg'
    accent: null,                  // رنگ اصلی، مثلاً '#7c3aed'
    zIndex: null,

    /* --- حالت انتخاب --- */
    range: false,                  // حالت «از تاریخ تا تاریخ»
    selectMode: 'single',          // مترادف: 'single' | 'range'
    confirmMode: false,            // اعمال مقادیر فقط با دکمه‌ی تأیید
    closeOnSelect: true,           // بستن خودکار پس از انتخاب (در حالت تک‌تاریخی)
    showConfirmButton: null,       // پیش‌فرض: در حالت رنج true
    closeOnSelectRange: null,      // بستن پنل پس از انتخاب تاریخ دوم (پیش‌فرض: مقدار closeOnSelect)
    showCloseButton: false,
    monthsPerPanel: 1,             // تعداد ماه نمایش‌داده‌شده در هر پنل (1 یا 2)
    syncViews: true,               // هماهنگی ماه پنل‌ها با تاریخ انتخاب‌شده و با ناوبری
    strictLimits: true,            // تاریخ‌های غیرفعال حتی با API هم انتخاب/تنظیم نشوند
    calendarSwitch: null,          // نمایش دکمه‌ی سوییچ تقویم: null (خودکار) | true | false
    switchToCalendar: null,        // تقویم دیگری که با دکمه در دسترس قرار می‌گیرد (مثلاً 'gregorian')
    switchMode: 'both',            // 'both' = نمایش هم‌زمان در کنار هم، 'swap' = تعویض کامل تقویم
    showOutsideDays: true,
    timePicker: false,
    timeStep: 5,
    showSeconds: false,
    rangeCloseOnSelect: true,
    emitNativeChange: false,
    showTodayButton: true,
    showClearButton: true,
    highlightWeekends: true,       // رنگ قرمز برای جمعه‌ها و تعطیلات
    holidayStyle: 'red',           // 'red' | 'dot' | 'both' | 'none'
    holidaySelectedStyle: 'red',   // 'red' = روز تعطیل انتخاب‌شده قرمز شود | 'accent' = آبی بماند

    /* --- محدودیت‌ها --- */
    limits: null,                  // {mode:'free'|'range'|'before'|'after', from, to, min, max, minDays, maxDays}
    limitsCalendar: null,          // تقویم مقادیر محدودیت (پیش‌فرض: تشخیص خودکار)
    disableWeekends: false,
    disableHolidays: false,
    disabledDays: null,            // آرایه‌ی ایندکس روزهای هفته مثل [5]
    disabledRanges: null,          // [{from:'1405/01/01', to:'1405/01/10'}, ...]
    disabled: false,               // غیرفعال کردن کل دیت‌پیکر
    disabledDates: null,           // ['1405/01/13', ...]
    blackout: null,                // تابع (date) => true|false
    dayEvents: null,               // رویدادهای شخصی روی روزهای مشخص (تابع + آرگومان‌ها)

    /* --- تعطیلات --- */
    holidays: null,                // آبجکت JSON تعطیلات
    holidayJson: null,             // آدرس فایل JSON تعطیلات
    weekend: null,                 // روز(های) آخر هفته: 'جمعه' | 5 | ['پنجشنبه','جمعه'] | {jalali:[5], gregorian:[0,6]}
    weekends: null,                // مترادف پیشرفته: {jalali:[5], gregorian:[0,6]}
    countryCode: 'IR',             // فقط برای فراخوانی دستی fetchHolidays()
    holidayCache: true,
    holidayCacheKey: null,
    holidayTtl: 7 * 24 * 60 * 60 * 1000,
    holidayProviders: null,        // سرویس‌های سفارشی دریافت تعطیلات
    showHolidayList: true,         // فهرست مناسبت‌های ماه
    holidayListLimit: 6,
    showExportButton: false,       // دکمه‌ی «JSON» برای ذخیره‌ی تعطیلات
    holidayJsonName: 'holidays.json',

    /* --- چیدمان --- */
    inline: false,                 // نمایش همیشه‌باز (بدون پاپ‌آپ)
    input: null,                   // عنصر input جداگانه برای هدف‌های غیر ورودی
    name: null,                    // نام فیلد مخفی برای ارسال در فرم
    editable: false,               // امکان تایپ دستی در ورودی
    readOnly: null,                // مترادف editable (معکوس)
    required: false,
    label: null,                   // aria-label
    ariaLabelledby: null,
    mobileModal: true,             // نمایش به شکل مودال در صفحه‌های کوچک
    mobileBreakpoint: 560,
    autoApply: null,               // مترادف confirmMode (معکوس)
    minWidth: null,

    /* --- کلاس و شناسه --- */
    prefix: DEFAULT_PREFIX,
    className: null,
    block: false,
    id: null,

    /* --- رویدادها --- */
    onChange: null,
    onDayEvent: null,              // فراخوانی سراسری پس از هر رویداد شخصی روز
    onCalendarChange: null,        // تغییر تقویم با دکمه‌ی سوییچ
    onWeekendChange: null,         // تغییر روزهای آخر هفته
    onOpen: null,
    onClose: null,
    onSelect: null,
    onMonthChange: null,
    onHolidaysLoaded: null,
    onError: null,
    onLog: null
  };

  /** نرمال‌سازی گزینه‌ها (نام‌های جایگزین و مقادیر منطقی) */
  function resolveOptions(options) {
    var o = extend({}, DEFAULTS, options || {});

    // مترادف‌ها
    if (o.displayFormat && !options.format) o.format = o.displayFormat;
    if (options.selectMode && !options.range) o.range = (options.selectMode === 'range');
    if (options.autoApply !== null && options.autoApply !== undefined && !options.confirmMode) {
      o.confirmMode = !options.autoApply;
    }
    if (options.readOnly !== null && options.readOnly !== undefined && options.editable === DEFAULTS.editable) {
      o.editable = !options.readOnly;
    }
    if (o.showConfirmButton === null) o.showConfirmButton = !!o.range || !!o.confirmMode;
    // آخر هفته: پیش‌فرض جمعه برای شمسی و شنبه/یکشنبه برای میلادی
    var defaultWeekends = { jalali: [5], gregorian: [0, 6] };
    var wk = o.weekends || {};
    var wend = normalizeWeekendDays(o.weekend);
    o.weekends = {
      jalali: normalizeWeekendDays(wk.jalali) || (wend ? wend.slice() : defaultWeekends.jalali.slice()),
      gregorian: normalizeWeekendDays(wk.gregorian) || (wend ? wend.slice() : defaultWeekends.gregorian.slice())
    };
    o.weekendInput = o.weekend;
    if (o.size !== 'sm' && o.size !== 'lg') o.size = 'md';
    if (o.theme !== 'dark' && o.theme !== 'auto') o.theme = 'light';
    if (o.holidaySelectedStyle !== 'accent') o.holidaySelectedStyle = 'red';
    if (o.dualDigits !== true && o.dualDigits !== 'same') o.dualDigits = false;
    if (o.strictLimits === undefined) o.strictLimits = true;
    // ارقام فارسی/لاتین: true | false | 'auto' | { jalali: bool, gregorian: bool }
    var pd = o.persianDigits;
    if (pd === true || pd === false || isPlainObj(pd)) {
      /* مقدار معتبر */
    } else if (pd === 'fa' || pd === 'farsi' || pd === 'persian' || pd === 'auto') {
      o.persianDigits = 'auto';
    } else if (pd === 'en' || pd === 'latin' || pd === 'ltr' || pd === 'english') {
      o.persianDigits = false;
    } else {
      o.persianDigits = 'auto';
    }
    if (o.closeOnSelectRange == null) o.closeOnSelectRange = o.closeOnSelect !== false;
    if (o.calendarSwitch === null || o.calendarSwitch === undefined) o.calendarSwitch = null;
    if (o.switchMode !== 'swap') o.switchMode = 'both';
    if (!o.prefix) o.prefix = DEFAULT_PREFIX;
    if (o.format && isStr(o.format)) o.format = { '*': o.format };

    // محدودیت‌ها
    o.limits = extend({
      mode: 'free', from: null, to: null, min: null, max: null,
      minDays: null, maxDays: null, allowWeekends: true, allowHolidays: true
    }, o.limits || {});
    if (o.limits.mode === 'between' || o.limits.mode === 'bounded') o.limits.mode = 'range';
    if (o.limits.mode === 'past') o.limits.mode = 'after';
    if (o.limits.mode === 'future') o.limits.mode = 'before';
    return o;
  }

  /** تعیین لیست تقویم‌های فعال */
  function resolveCalendars(input) {
    var list = [];
    if (isArr(input)) list = input.slice();
    else if (isStr(input) && (trim(input) === 'both' || input === 'dual')) list = ['jalali', 'gregorian'];
    else list = [input || 'jalali'];
    list = list.filter(function (c) { return !!CALENDARS[c]; });
    if (!list.length) list = ['jalali'];
    if (list.length > 1) list = ['jalali', 'gregorian'];
    return list;
  }

  /** پیدا کردن عنصر هدف از سلکتور یا خود عنصر */
  function resolveTarget(target) {
    if (isEl(target)) return target;
    if (isStr(target)) {
      var el = document.querySelector(target);
      if (el) return el;
      throw new Error('ADP: عنصر هدف پیدا نشد / Target element not found: ' + target);
    }
    throw new Error('ADP: هدف نامعتبر است / Invalid target');
  }

  function closest(el, selector) {
    if (!el) return null;
    if (el.closest) return el.closest(selector);
    // جایگزین برای مرورگرهای قدیمی
    var node = el;
    while (node && node.nodeType === 1) {
      if (matches(node, selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  function matches(el, selector) {
    var fn = el.matches || el.msMatchesSelector || el.webkitMatchesSelector;
    return fn ? fn.call(el, selector) : false;
  }

  /* ==========================================================================
   *  سازنده
   * ========================================================================== */

  function Picker(target, options) {
    if (!(this instanceof Picker)) return new Picker(target, options);

    this.options = resolveOptions(options);
    // قاعده‌ی کبیسه: سراسری است (چون طول سال را تعیین می‌کند)
    if (this.options.leapRule != null) {
      this._appliedLeapRule = setLeapRule(this.options.leapRule);
    }
    this.prefix = this.options.prefix;
    this.uid = 'adp' + (++_uidSeq) + Math.floor(Math.random() * 1e4);
    injectStyles(this.prefix);

    this.calendars = resolveCalendars(this.options.calendar);
    // فهرست تقویم‌های در دسترس (برای دکمه‌ی سوییچ تقویم)
    this.availableCalendars = (function (list, off, swap) {
      var out = [];
      ['jalali', 'gregorian'].forEach(function (c) {   // ترتیب ثابت: شمسی سپس میلادی
        if (list.indexOf(c) !== -1 || c === off || swap) out.push(c);
      });
      return out;
    }(this.calendars, this.options.switchToCalendar, this.options.switchMode === 'swap'));
    this.primary = CALENDARS[this.options.primaryCalendar] && this.calendars.indexOf(this.options.primaryCalendar) !== -1
      ? this.options.primaryCalendar : this.calendars[0];
    this.calLang = this.options.lang === 'en' ? 'en' : 'fa';
    this.labels = extend({}, NAMES[this.calLang]);
    if (isPlainObj(this.options.labels)) extend(this.labels, this.options.labels);
    this.dir = this.options.dir || CALENDARS[this.primary].dir;

    this.target = resolveTarget(target);
    this.isInput = String(this.target.tagName || '').toUpperCase() === 'INPUT';
    this.isTextarea = String(this.target.tagName || '').toUpperCase() === 'TEXTAREA';
    this.inline = !!this.options.inline;

    this.state = {
      open: false,
      from: null,
      to: null,
      hover: null,
      hoverCal: null,
      draftFrom: null,
      draftTo: null,
      view: {},
      viewMode: {},
      active: this.primary,
      focusJdn: null,
      loading: 0,
      time: null,
      lastDayEvent: null
    };
    this.calendars.forEach(function (c) { this.state.viewMode[c] = this.options.initialView; }, this);

    this.output = null;         // عنصر ورودی متنی (input کاربر یا input مخفی)
    this.fieldEl = null;        // فیلد اختصاصی (وقتی هدف div باشد)
    this.panelEl = null;
    this.overlayEl = null;
    this.hiddenEl = null;
    this._uidOpenToken = 0;

    this._dayEvents = this._normalizeDayEvents(this.options.dayEvents);
    this._initHolidays();
    this._buildDom();
    this._applyInitialState();
    this._confirmed = { from: this.state.from, to: this.state.to };
    this._bindGlobalEvents();
    this.render();
    this._loadInitialHolidays();

    Picker.instances.push(this);
  }

  Picker.instances = [];

  Picker.prototype = {

    constructor: Picker,

    /* =====================================================================
     *  ابزارهای داخلی
     * =================================================================== */

    /** ساخت نام کلاس با پیشوند اختصاصی */
    cls: function (name) {
      return isArr(name)
        ? name.map(function (n) { return this.prefix + n; }, this).join(' ')
        : this.prefix + name;
    },

    /** کوتاه‌نویسی انتخاب عنصر داخل پنل */
    $: function (sel, ctx) {
      return (ctx || this.panelEl).querySelector(sel);
    },

    $$: function (sel, ctx) {
      return Array.prototype.slice.call((ctx || this.panelEl).querySelectorAll(sel));
    },

    /** پنل‌های یک تقویم خاص */
    panelOf: function (cal) {
      if (!this.panelEl) return null;
      return this.panelEl.querySelector('[' + 'data-cal="' + cal + '"]');
    },

    /** آیا در این تقویم ارقام فارسی نمایش داده شود؟ */
    usePersianDigits: function (cal) {
      var pd = this.options.persianDigits;
      if (isPlainObj(pd)) {
        if (pd[cal] !== undefined && pd[cal] !== null) return !!pd[cal];
        if (pd.default !== undefined) return !!pd.default;
        return cal === 'jalali';
      }
      if (pd === true) return true;
      if (pd === false) return false;
      return cal === 'jalali';   // 'auto'
    },

    num: function (n, cal) {
      var s = String(n);
      return this.usePersianDigits(cal) ? toFaDigits(s) : s;
    },

    fmt: function (parts, cal) {
      var fmt = this.options.format || {};
      var pattern = fmt[cal] || fmt['*'] || CALENDARS[cal].dateFormat;
      return formatDate(parts, pattern, { lang: this.calLang, persianDigits: this.usePersianDigits(cal) });
    },

    /** ساخت آبجکت تاریخ داخلی */
    mkDate: function (cal, y, m, d, hh, mm, ss) {
      return {
        calendar: cal,
        y: y, m: m, d: d,
        jdn: CALENDARS[cal].jdn(y, m, d),
        hh: hh || 0, mm: mm || 0, ss: ss || 0
      };
    },

    /** تبدیل هر ورودی به آبجکت تاریخ داخلی */
    toDateObj: function (input, cal) {
      if (input == null || input === '') return null;
      var calendar = cal || this.primary;
      if (isPlainObj(input) && !(input instanceof Date)) {
        if (input.jdn) {
          var p = CALENDARS[input.calendar || calendar].fromJdn(input.jdn);
          return this.mkDate(input.calendar || calendar, p.y, p.m, p.d, input.hh, input.mm, input.ss);
        }
        if (input.y && input.m && (input.d || input.day)) {
          var c = CALENDARS[input.calendar] ? input.calendar : calendar;
          var p2 = CALENDARS[c].fromJdn(CALENDARS[c].jdn(input.y, input.m, input.d || input.day));
          return this.mkDate(c, p2.y, p2.m, p2.d, input.hh, input.mm, input.ss);
        }
        return null;
      }
      if (input instanceof Date) {
        var f = fromJsDate(input, calendar);
        return this.mkDate(calendar, f.y, f.m, f.d, f.hh, f.mm, f.ss);
      }
      if (isNum(input)) {   // timestamp
        return this.toDateObj(new Date(input), calendar);
      }
      if (isStr(input)) {
        // برای رشته‌ها، تقویم از روی شکل تاریخ تشخیص داده می‌شود
        // (مثلاً «2026/03/21» میلادی و «1405/01/01» شمسی)
        var guess = guessCalendar(input);
        var c2 = guess || cal || this.primary;
        var parsed = parseDateStr(input, c2, null);
        if (!parsed) {
          // شاید تاریخ میلادی وارد شده و تقویم تشخیص داده نشده است
          parsed = parseDateStr(input, c2 === 'jalali' ? 'gregorian' : 'jalali', null);
          if (!parsed) return null;
          c2 = parsed.calendar;
        }
        return this.mkDate(c2, parsed.y, parsed.m, parsed.d, parsed.hh, parsed.mm, parsed.ss);
      }
      return null;
    },

    /** توصیف کامل یک تاریخ برای خروجی‌های عمومی */
    describe: function (dobj) {
      if (!dobj) return null;
      var self = this;
      function pack(cal, jdn, hh, mm, ss) {
        var p = CALENDARS[cal].fromJdn(jdn);
        return {
          calendar: cal,
          y: p.y, m: p.m, d: p.d,
          jdn: jdn,
          hh: hh || 0, mm: mm || 0, ss: ss || 0,
          weekday: weekdayFromJdn(jdn),
          text: self.fmt({ calendar: cal, y: p.y, m: p.m, d: p.d, jdn: jdn, hh: hh, mm: mm, ss: ss }, cal),
          jsDate: toJsDate(cal, p.y, p.m, p.d, hh, mm, ss)
        };
      }
      var jal = pack('jalali', dobj.jdn, dobj.hh, dobj.mm, dobj.ss);
      var greg = pack('gregorian', dobj.jdn, dobj.hh, dobj.mm, dobj.ss);
      var main = dobj.calendar === 'jalali' ? jal : greg;
      main.jalali = jal;
      main.gregorian = greg;
      main.isHoliday = this.holiday.isHoliday(dobj.calendar, dobj.y, dobj.m, dobj.d);
      main.holidayTitle = this.holiday.titleOf(dobj.calendar, dobj.y, dobj.m, dobj.d);
      main.isWeekend = this.holiday.isWeekend(dobj.calendar, weekdayFromJdn(dobj.jdn));
      return main;
    },

    /* =====================================================================
     *  تعطیلات
     * =================================================================== */

    _initHolidays: function () {
      var self = this;
      this.holiday = new HolidayManager({
        calendar: this.primary,
        countryCode: this.options.countryCode,
        cache: this.options.holidayCache,
        cacheKey: this.options.holidayCacheKey || (CACHE_KEY_DEFAULT + '-' + this.prefix),
        ttl: this.options.holidayTtl,
        weekends: this.options.weekends,
        lang: this.calLang,
        providers: this.options.holidayProviders,
        onLoad: function (info) {
          if (isFn(self.options.onHolidaysLoaded)) self.options.onHolidaysLoaded(info, self);
          self.render();
        },
        onError: function (err) {
          if (isFn(self.options.onError)) self.options.onError(err, self);
        },
        onLog: function (msg) { if (isFn(self.options.onLog)) self.options.onLog(msg, self); }
      });
      this.holiday.loadCache();
      if (this.options.holidays) this.holiday.normalize(this.options.holidays, { source: 'options' });
    },

    /**
     * بارگذاری اولیه‌ی تعطیلات.
     *  توجه: هیچ دانلود خودکاری از اینترنت انجام نمی‌شود؛ تعطیلات فقط از
     *  فایل JSON نمونه/محلی (holidayJson) یا آبجکت holidays خوانده می‌شود.
     *  برای دریافت دستی و اختیاری از اینترنت از dp.fetchHolidays() استفاده کنید.
     */
    _loadInitialHolidays: function () {
      var self = this;
      if (this.options.holidayJson) {
        this.holiday.loadFromUrl(this.options.holidayJson).then(function () { self.render(); });
      }
    },

    /** سال‌های موردنیاز برای نمایش جاری (به تفکیک تقویم) */
    _yearsForView: function () {
      var out = { jalali: [], gregorian: [] };
      var self = this;
      this.calendars.forEach(function (cal) {
        var v = self.state.view[cal];
        if (!v) return;
        var span = Math.max(1, this.options.monthsPerPanel | 0);
        for (var i = 0; i < span; i++) {
          var jdn = CALENDARS[cal].jdn(v.y, Math.min(12, v.m + i), 1);
          var p = CALENDARS[cal].fromJdn(jdn);
          if (out[cal].indexOf(p.y) === -1) out[cal].push(p.y);
        }
      }, this);
      return out;
    },

    /** دریافت تعطیلات (فقط با فراخوانی دستی) */
    _ensureHolidays: function (years, force) {
      var self = this;
      this.state.loading++;
      this._updateStatus();
      return this.holiday.fetchHolidays(years, force)['catch'](function () { return null; })
        .then(function (res) {
          self.state.loading = Math.max(0, self.state.loading - 1);
          self._updateStatus();
          if (res && (res.jalali || res.gregorian)) self.render();
          return res;
        });
    },

    /** بارگذاری تعطیلات از اینترنت برای سال‌های نمایان */
    fetchHolidays: function (force) {
      return this._ensureHolidays(this._yearsForView(), !!force);
    },

    /* =====================================================================
     *  ساخت DOM
     * =================================================================== */

    _buildDom: function () {
      var self = this;
      var o = this.options;
      var cls = function (n) { return self.cls(n); };

      // پنل اصلی
      this.panelEl = document.createElement('div');
      this.panelEl.className = cls('popup') + ' ' + cls(this.dir === 'ltr' ? 'ltr' : 'rtl') +
        (this.inline ? ' ' + cls('inline') : '') +
        (o.theme === 'dark' ? ' ' + cls('theme-dark') : (o.theme === 'auto' ? ' ' + cls('theme-auto') : '')) +
        (o.size === 'sm' ? ' ' + cls('size-sm') : (o.size === 'lg' ? ' ' + cls('size-lg') : '')) +
        (o.className ? ' ' + o.className : '');
      this.panelEl.setAttribute('data-adp', this.uid);
      this.panelEl.setAttribute('role', 'dialog');
      this.panelEl.setAttribute('aria-modal', 'false');
      this.panelEl.setAttribute('aria-label', o.label || (o.range ? this.labels.pickRange : this.labels.pickDate));
      if (o.ariaLabelledby) this.panelEl.setAttribute('aria-labelledby', o.ariaLabelledby);
      if (o.id) this.panelEl.id = o.id;
      if (o.zIndex) this.panelEl.style.zIndex = o.zIndex;
      if (o.accent) this.panelEl.style.setProperty('--' + this.prefix + 'accent', o.accent);
      if (o.minWidth) this.panelEl.style.minWidth = o.minWidth;

      if (this.inline) {
        // حالت همیشه‌باز
        if (this.isInput) {
          var host = document.createElement('div');
          host.className = cls('inline-host');
          host.style.display = 'inline-block';
          this.target.parentNode.insertBefore(host, this.target);
          host.appendChild(this.target);
          host.appendChild(this.panelEl);
          this.hostEl = host;
          this.output = this.target;
          this.target.classList.add(cls('input'));
          this._prepareInput();
        } else {
          this.target.classList.add(cls('inline'));
          this.target.appendChild(this.panelEl);
          this.hostEl = this.target;
        }
      } else {
        if (this.isInput) {
          this.output = this.target;
          this.target.classList.add(cls('input'));
          if (this.dir === 'ltr') this.target.classList.add(cls('ltr-icon'));
          this._prepareInput();
        } else {
          // یک فیلد اختصاصی می‌سازیم
          this.fieldEl = document.createElement('div');
          this.fieldEl.className = cls('field') + (o.block ? ' ' + cls('block') : '');
          this.fieldEl.setAttribute('tabindex', '0');
          this.fieldEl.setAttribute('role', 'button');
          this.fieldEl.setAttribute('aria-haspopup', 'dialog');
          this.fieldEl.innerHTML =
            '<span class="' + cls('field-icon') + '">' + CAL_ICON_SVG + '</span>' +
            '<span class="' + cls('field-text') + ' ' + cls('placeholder') + '"></span>' +
            '<span class="' + cls('field-clear') + '" role="button" aria-label="' + escapeHtml(this.labels.clear) + '">✕</span>';
          this.target.appendChild(this.fieldEl);
          this.target.classList.add(cls('wrap'));
          this.hostEl = this.target;
          if (o.input) {
            this.output = isEl(o.input) ? o.input : document.querySelector(o.input);
          } else if (o.name) {
            this.hiddenEl = document.createElement('input');
            this.hiddenEl.type = 'hidden';
            this.hiddenEl.name = o.name;
            if (o.required) this.hiddenEl.required = true;
            this.target.appendChild(this.hiddenEl);
            this.output = this.hiddenEl;
          }
        }
      }

      // حالت پاپ‌آپ
      if (!this.inline) {
        this.overlayEl = document.createElement('div');
        this.overlayEl.className = cls('modal-bg') + ' ' + cls('hidden');
        this.panelEl.setAttribute('aria-modal', 'true');
        document.body.appendChild(this.panelEl);
      }
      this._applyMode();
    },

    _prepareInput: function () {
      var o = this.options;
      if (this.isTextarea) {
        if (!o.editable) this.output.setAttribute('readonly', 'readonly');
      } else {
        if (!o.editable) {
          this.output.setAttribute('readonly', 'readonly');
          this.output.setAttribute('autocomplete', 'off');
        } else {
          this.output.removeAttribute('readonly');
        }
        if (o.name) this.output.setAttribute('name', o.name);
        if (o.required) this.output.setAttribute('required', 'required');
        if (this.options.placeholder) this.output.setAttribute('placeholder', this.options.placeholder);
      }
      var self = this;
      this.output.addEventListener('focus', function () { self._setFieldFocus(true); });
      this.output.addEventListener('blur', function () { self._setFieldFocus(false); });
      if (this.isTextarea) this.output.addEventListener('click', function () { self.open(); });
    },

    _setFieldFocus: function (on) {
      if (this.fieldEl) this.fieldEl.classList[on ? 'add' : 'remove'](this.cls('focus'));
    },

    /** تعیین حالت نمایش (پاپ‌آپ معمولی یا مودال موبایل) */
    /** اعمال کلاس‌های ظاهری (تم، اندازه، جهت) — قابل فراخوانی در زمان اجرا */
    _applyLook: function () {
      if (!this.panelEl) return this;
      var o = this.options;
      var cls = this.cls.bind(this);
      ['theme-dark', 'theme-auto', 'size-sm', 'size-lg', 'ltr', 'rtl'].forEach(function (n) {
        this.panelEl.classList.remove(this.prefix + n);
      }, this);
      this.panelEl.classList.add(this.dir === 'ltr' ? cls('ltr') : cls('rtl'));
      if (o.theme === 'dark') this.panelEl.classList.add(cls('theme-dark'));
      else if (o.theme === 'auto') this.panelEl.classList.add(cls('theme-auto'));
      if (o.size === 'sm') this.panelEl.classList.add(cls('size-sm'));
      else if (o.size === 'lg') this.panelEl.classList.add(cls('size-lg'));
      if (o.accent) this.panelEl.style.setProperty('--' + this.prefix + 'accent', o.accent);
      if (this.fieldEl) {
        this.fieldEl.classList.remove(cls('theme-dark'));
        if (o.theme === 'dark') this.fieldEl.classList.add(cls('theme-dark'));
      }
      return this;
    },

    _applyMode: function () {
      if (this.inline) return;
      var small = this.options.mobileModal && typeof window !== 'undefined' &&
        window.innerWidth < (this.options.mobileBreakpoint || 560);
      this._modalMode = small;
      if (small) {
        if (this.panelEl.parentNode !== this.overlayEl) this.overlayEl.appendChild(this.panelEl);
        if (this.overlayEl.parentNode !== document.body) document.body.appendChild(this.overlayEl);
        if (this.options.zIndex) this.overlayEl.style.zIndex = this.options.zIndex;
        this.panelEl.style.position = 'static';
        this.panelEl.style.top = this.panelEl.style.left = this.panelEl.style.right = this.panelEl.style.bottom = 'auto';
      } else {
        if (this.panelEl.parentNode !== document.body) document.body.appendChild(this.panelEl);
        this.panelEl.style.position = 'fixed';
      }
    },

    /* =====================================================================
     *  مقدار اولیه
     * =================================================================== */

    _applyInitialState: function () {
      var o = this.options;
      var self = this;

      // انتخاب تقویم پیش‌فرض برای نمایش
      var initial = o.initialDate;
      var base = null;
      if (initial === 'today' || initial === 'now' || initial === null) {
        base = null; // از امروز استفاده می‌شود
      } else if (initial === 'selected' && o.defaultDate) {
        base = this.toDateObj(o.defaultDate);
      } else {
        base = this.toDateObj(initial);
      }
      var now = new Date();
      var todayJdn = g2d(now.getFullYear(), now.getMonth() + 1, now.getDate());
      var seedJdn = base ? base.jdn : todayJdn;

      this.calendars.forEach(function (cal) {
        var p = CALENDARS[cal].fromJdn(seedJdn);
        self.state.view[cal] = { y: p.y, m: p.m };
      });

      // مقدار پیش‌فرض کادر
      if (o.defaultRange) {
        this.setRange(o.defaultRange, null, true);
      } else if (o.defaultDate != null) {
        var d = this.toDateObj(o.defaultDate);
        if (d) this.setDate(d, true);
      } else {
        this._parseInputValue();
      }

      // اگر initialDate صریحاً تعیین شده باشد، نمای شروع را روی آن تنظیم می‌کند
      if (base && CALENDARS[base.calendar]) {
        this.calendars.forEach(function (cal) {
          var p = CALENDARS[cal].fromJdn(base.jdn);
          self.state.view[cal] = { y: p.y, m: p.m };
        });
      }
      // ساعت پیش‌فرض
      var nowDate = new Date();
      var step = Math.max(1, this.options.timeStep || 5);
      this.state.time = {
        hh: (o.initialDate === 'now' ? nowDate.getHours() : 0),
        mm: (o.initialDate === 'now' ? Math.floor(nowDate.getMinutes() / step) * step : 0),
        ss: (o.initialDate === 'now' ? nowDate.getSeconds() : 0)
      };
      if ((o.initialDate === 'now' || o.initialDate === 'today') && o.timePicker) {
        this.state.time.hh = this.state.time.hh || nowDate.getHours();
        this.state.time.mm = this.state.time.mm || Math.floor(nowDate.getMinutes() / step) * step;
      }
      this._syncOutputs();
    },

    /** خواندن مقدار اولیه از خود input (اگر مقدار داشته باشد) */
    _parseInputValue: function () {
      if (!this.output || this.isTextarea || this.hiddenEl === this.output) return;
      var v = this.output.value;
      if (!v) return;
      var cal = guessCalendar(v);
      if (cal) {
        var d = this.toDateObj(trim(toEnDigits(v)).split(this.options.rangeSeparator)[0], cal);
        if (d) {
          this.state.from = d;
          this.state.to = null;
          this.state.view[cal] = { y: d.y, m: d.m };
        }
      }
    },

    /** تحلیل متنی که کاربر در ورودی تایپ کرده است (editable: true) */
    _applyTypedValue: function () {
      if (!this.options.editable || !this.output || !isStr(this.output.value)) return this;
      var txt = trim(this.output.value);
      if (!txt) { this.clear(); return this; }
      var sepRe = new RegExp('\\s*(?:\\.\\.|—|–|\\s+تا\\s+|' + escapeRegExp(trim(this.options.rangeSeparator) || 'تا') + ')\\s*');
      if (this._isRange() && sepRe.test(txt)) {
        var parts = txt.split(sepRe);
        var a = this.toDateObj(parts[0]), b = this.toDateObj(parts[1]);
        if (a) { this.setRange(a, b || null); return this; }
      }
      var d = this.toDateObj(txt);
      if (d && !this.isDisabled(d)) {
        this.setDate(d);
      } else {
        this._syncOutputs();   // بازگردانی مقدار قبلی در صورت نامعتبر بودن متن
      }
      return this;
    },

    /* =====================================================================
     *  انتخاب و مقدار
     * =================================================================== */

    _isRange: function () { return !!this.options.range; },

    /** انتخاب یک روز (منطق کلیک روی روز) */
    selectDate: function (dobj, opts) {
      opts = opts || {};
      if (!dobj) return this;
      if (this.isDisabled(dobj) && !opts.force) return this;

      var o = this.options;
      var complete = false;

      if (!this._isRange()) {
        this.state.from = dobj;
        this.state.to = null;
        if (o.timePicker) {
          this.state.time = this.state.time || { hh: 0, mm: 0, ss: 0 };
          dobj.hh = this.state.time.hh;
          dobj.mm = this.state.time.mm;
          dobj.ss = this.state.time.ss;
        }
        complete = true;
      } else {
        var from = this.state.from, to = this.state.to;
        if (!from || (from && to)) {
          // شروع یک انتخاب تازه
          this.state.from = dobj;
          this.state.to = null;
          this.state.hover = this.state.hover === dobj.jdn ? null : this.state.hover;
        } else if (dobj.jdn < from.jdn) {
          // کلیک پیش از تاریخ شروع => جابه‌جایی
          this.state.to = from;
          this.state.from = dobj;
        } else {
          this.state.to = dobj;
        }
        complete = !!(this.state.from && this.state.to);
        if (complete) this.state.hover = null;
      }

      this._emitSelect(dobj);

      // اجرای رویدادهای شخصی متصل به این روز (در حالت تأییدی، هنگام تأیید اجرا می‌شوند)
      if (!o.confirmMode) this._fireDayEvents(dobj, { committed: true });

      // هماهنگی پنل‌های دیگر با تاریخ انتخاب‌شده
      this._syncViewsTo(dobj.jdn, dobj.calendar);

      this.render();

      if (complete && !o.confirmMode) {
        this._commit(true);
        var shouldClose = this._isRange()
          ? (o.closeOnSelectRange !== false)
          : (o.closeOnSelect !== false);
        if (shouldClose) this.close();
      }
      return this;
    },

    /** اعمال انتخاب‌های انجام‌شده (مخصوص حالت تأییدی) */
    applySelection: function () {
      if (this._isRange() && this.state.from && !this.state.to) this.state.to = this.state.from;
      if (this._isRange() && !this.state.from) return this;
      this._commit(true);
      if (this.state.from) this._fireDayEvents(this.state.from, { committed: true });
      this.close();
      return this;
    },

    /** لغو انتخاب‌های تأییدنشده */
    cancelSelection: function () {
      this.close();
      return this;
    },

    clear: function (silent) {
      this.state.from = null;
      this.state.to = null;
      this.state.hover = null;
      if (!silent) {
        this.render();
        this._commit(true);
      }
      return this;
    },

    /** هماهنگ کردن ماهِ پنل‌های دیگر با یک تاریخ مشخص */
    _syncViewsTo: function (jdn, exceptCal) {
      if (this.options.syncViews === false || this.calendars.length < 2 || jdn == null) return this;
      var self = this;
      this.calendars.forEach(function (cal) {
        if (cal === exceptCal) return;
        var p = CALENDARS[cal].fromJdn(jdn);
        self.state.view[cal] = { y: p.y, m: p.m };
      });
      return this;
    },

    /** رفتن به امروز و انتخاب آن */
    goToday: function () {
      var now = new Date();
      var jdn = g2d(now.getFullYear(), now.getMonth() + 1, now.getDate());
      var p = CALENDARS[this.primary].fromJdn(jdn);
      var d = this.mkDate(this.primary, p.y, p.m, p.d, now.getHours(), now.getMinutes(), now.getSeconds());
      if (this.isDisabled(d)) return this;
      this.gotoMonth(jdn);
      return this.selectDate(d);
    },

    /** بردن نمای هر پنل به ماه تاریخ مشخص */
    gotoMonth: function (jdn) {
      var self = this;
      this.calendars.forEach(function (cal) {
        var p = CALENDARS[cal].fromJdn(jdn);
        self.state.view[cal] = { y: p.y, m: p.m };
        if (isFn(self.options.onMonthChange)) self.options.onMonthChange({ calendar: cal, y: p.y, m: p.m }, self);
      });
      this.render();
      return this;
    },

    /** پرش نمای پنل‌ها بر اساس تعداد ماه (در صورت فعال بودن syncViews همه با هم) */
    shift: function (cal, monthDelta, yearDelta) {
      var months = monthDelta + yearDelta * 12;
      var targets = (this.options.syncViews !== false && this.calendars.length > 1) ? this.calendars : [cal];
      var self = this;
      targets.forEach(function (c) { self._shiftOne(c, months); });
      this.render();
      return this;
    },

    /** جابه‌جایی ماهِ یک پنل مشخص */
    _shiftOne: function (cal, months) {
      var v = this.state.view[cal];
      if (!v) {
        var t = CALENDARS[cal].fromJdn(this.todayJdn || this._todayJdn());
        v = { y: t.y, m: t.m };
      }
      var total = (v.y * 12 + (v.m - 1)) + months;
      var ny = Math.floor(total / 12);
      var nm = ((total % 12) + 12) % 12 + 1;
      if (ny < CALENDARS[cal].minYear) { ny = CALENDARS[cal].minYear; nm = 1; }
      if (ny > CALENDARS[cal].maxYear) { ny = CALENDARS[cal].maxYear; nm = 12; }
      this.state.view[cal] = { y: ny, m: nm };
      if (isFn(this.options.onMonthChange)) this.options.onMonthChange({ calendar: cal, y: ny, m: nm }, this);
      return this;
    },

    /* =====================================================================
     *  محدودیت‌ها
     * =================================================================== */

    /** تحلیل تاریخ‌های محدودیت به JDN */
    _limitJdn: function (value) {
      if (value == null) return null;
      var d = this.toDateObj(value, this.options.limitsCalendar || this.primary);
      return d ? d.jdn : null;
    },

    _limits: function () {
      var l = this.options.limits;
      if (!this._limitCache || this._limitCacheSrc !== l) {
        this._limitCacheSrc = l;
        this._limitCache = {
          mode: l.mode,
          min: this._limitJdn(l.min != null ? l.min : l.from),
          max: this._limitJdn(l.max != null ? l.max : l.to),
          minDays: l.minDays, maxDays: l.maxDays,
          allowWeekends: l.allowWeekends !== false,
          allowHolidays: l.allowHolidays !== false
        };
      }
      return this._limitCache;
    },

    /** آیا این تاریخ غیرقابل انتخاب است؟ */
    isDisabled: function (dobj) {
      if (!dobj) return true;
      var lim = this._limits();
      var jdn = dobj.jdn;
      var cal = dobj.calendar;
      var dow = weekdayFromJdn(jdn);

      // بازه‌ی مجاز
      if (lim.mode === 'range' || lim.mode === 'free') {
        if (lim.min != null && jdn < lim.min) return true;
        if (lim.max != null && jdn > lim.max) return true;
      }
      if (lim.mode === 'before' && lim.max != null && jdn > lim.max) return true;
      if (lim.mode === 'after' && lim.min != null && jdn < lim.min) return true;

      // طول بازه در حالت انتخاب بازه
      if (this._isRange() && this.state.from && !this.state.to && (lim.minDays || lim.maxDays)) {
        var diff = Math.abs(jdn - this.state.from.jdn);
        if (lim.minDays > 1 && diff < lim.minDays && diff !== 0) return true;
        if (lim.maxDays && diff > lim.maxDays) return true;
      }

      // روزهای هفته‌ی غیرفعال
      if (this.options.disabledDays && this.options.disabledDays.indexOf(dow) !== -1) return true;

      // تعطیلات و آخر هفته
      if (!lim.allowWeekends && this.holiday.isWeekend(cal, dow)) return true;
      if (this.options.disableWeekends && this.holiday.isWeekend(cal, dow)) return true;
      if (this.options.disableHolidays && this.holiday.isHoliday(cal, dobj.y, dobj.m, dobj.d)) return true;

      // تاریخ‌های مشخص غیرفعال
      var list = this.options.disabledDates;
      if (list && list.length) {
        var keys = this._disabledJdns();
        if (keys.indexOf(jdn) !== -1) return true;
      }

      // بازه‌های غیرفعال سفارشی
      var ranges = this.options.disabledRanges;
      if (ranges && ranges.length) {
        for (var i = 0; i < ranges.length; i++) {
          var r = ranges[i];
          var a = this._limitJdn(isArr(r) ? r[0] : r.from);
          var b = this._limitJdn(isArr(r) ? r[1] : r.to);
          if (a != null && b != null && jdn >= Math.min(a, b) && jdn <= Math.max(a, b)) return true;
        }
      }

      // رویدادهای شخصی که با نوع disabled مشخص شده‌اند
      if (this._dayEvents && this._dayEvents.length) {
        var evs = this._eventsFor(dobj);
        for (var ei = 0; ei < evs.length; ei++) if (evs[ei].disabled) return true;
      }

      // تابع دلخواه کاربر
      if (isFn(this.options.blackout)) {
        try { if (this.options.blackout(this.describe(dobj), this)) return true; } catch (e) { }
      }

      // غیرفعال بودن کل تقویم
      if (this.options.disabled) return true;
      return false;
    },

    _disabledJdns: function () {
      var list = this.options.disabledDates || [];
      if (this._disabledCacheList === list) return this._disabledCache;
      var out = [];
      var self = this;
      list.forEach(function (item) {
        var d = self.toDateObj(item);
        if (d) out.push(d.jdn);
      });
      this._disabledCacheList = list;
      this._disabledCache = out;
      return out;
    },

    /* =====================================================================
     *  خروجی‌ها و رویدادها
     * =================================================================== */

    /** متن نمایشی مقدار جاری */
    text: function () {
      var o = this.options, out = '';
      if (!this.state.from) return '';
      var t1 = this.fmt(this.state.from, this.state.from.calendar);
      if (this._isRange()) {
        // وقتی فقط تاریخ شروع انتخاب شده باشد، به‌جای جداکننده‌ی خالی، «…» نمایش داده می‌شود
        out = t1 + o.rangeSeparator + (this.state.to ? this.fmt(this.state.to, this.state.to.calendar) : '…');
      } else {
        out = t1;
      }
      if (o.dualDisplay) {
        var alt = this.state.from.calendar === 'jalali' ? 'gregorian' : 'jalali';
        var altParts = CALENDARS[alt].fromJdn(this.state.from.jdn);
        var a1 = this.fmt({ calendar: alt, y: altParts.y, m: altParts.m, d: altParts.d, jdn: this.state.from.jdn }, alt);
        out += ' — ' + a1;
        if (this._isRange() && this.state.to) {
          var alt2 = CALENDARS[alt].fromJdn(this.state.to.jdn);
          out += ' ' + this.labels.to + ' ' +
            this.fmt({ calendar: alt, y: alt2.y, m: alt2.m, d: alt2.d, jdn: this.state.to.jdn }, alt);
        }
      }
      return out;
    },

    placeholder: function () {
      var o = this.options;
      if (o.placeholder) return o.placeholder;
      return this._isRange() ? this.labels.pickRange : this.labels.pickDate;
    },

    /** مقدار عمومی جاری */
    value: function () {
      var main = this.describe(this.state.from);
      return {
        calendar: this.primary,
        range: this._isRange(),
        text: this.text(),
        from: main,
        to: this.describe(this.state.to),
        date: main,
        jalali: main ? main.jalali : null,
        gregorian: main ? main.gregorian : null
      };
    },

    _commit: function (fire) {
      var text = this.text();
      this._syncOutputs(text);
      this._confirmed = { from: this.state.from, to: this.state.to };
      if (fire !== false) this._emitChange();
      return this;
    },

    _syncOutputs: function (text) {
      text = text == null ? this.text() : text;
      if (this.output && (this.isInput || this.isTextarea)) {
        this.output.value = text;
      } else if (this.output && this.output.type === 'hidden') {
        var v = '';
        if (this.state.from) {
          var g = CALENDARS.gregorian.fromJdn(this.state.from.jdn);
          v = g.y + '-' + pad2(g.m) + '-' + pad2(g.d);
          if (this._isRange() && this.state.to) {
            var g2 = CALENDARS.gregorian.fromJdn(this.state.to.jdn);
            v += ',' + g2.y + '-' + pad2(g2.m) + '-' + pad2(g2.d);
          }
        }
        this.output.value = v;
      }
      if (this.fieldEl) {
        var txt = this.fieldEl.querySelector('.' + this.cls('field-text'));
        txt.textContent = text || this.placeholder();
        txt.classList[(text ? 'remove' : 'add')]('' + this.cls('placeholder'));
        this.fieldEl.classList[(text ? 'add' : 'remove')](this.cls('has-value'));
      }
    },

    /** لاگ پیام‌های داخلی (قابل مشاهده با گزینه‌ی onLog) */
    _log: function (msg) {
      if (isFn(this.options.onLog)) this.options.onLog(msg, this);
      return this;
    },

    _emitChange: function () {
      var v = this.value();
      if (isFn(this.options.onChange)) this.options.onChange(v, this);
      // رویداد سفارشی روی عنصر هدف
      try {
        var ev;
        if (typeof CustomEvent === 'function') {
          ev = new CustomEvent('adp:change', { bubbles: true, detail: v });
        } else {
          ev = document.createEvent('CustomEvent');
          ev.initCustomEvent('adp:change', true, false, v);
        }
        this.target.dispatchEvent(ev);
        if (this.options.emitNativeChange && typeof Event === 'function') {
          this.target.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } catch (e) { }
      return this;
    },

    _emitSelect: function (dobj) {
      if (isFn(this.options.onSelect)) this.options.onSelect(this.describe(dobj), this);
    },

    _emitOpen: function (isOpen) {
      var fn = isOpen ? this.options.onOpen : this.options.onClose;
      if (isFn(fn)) fn(this);
      try {
        var name = isOpen ? 'adp:open' : 'adp:close';
        if (typeof CustomEvent === 'function') {
          this.target.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { picker: this } }));
        }
      } catch (e) { }
    },

    /* =====================================================================
     *  باز و بسته کردن
     * =================================================================== */

    open: function () {
      if (this.inline || this.state.open) return this;
      this.state.open = true;
      this._applyMode();
      if (this._modalMode) {
        this.overlayEl.classList.remove(this.cls('hidden'));
        if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
      } else {
        this.panelEl.classList.remove(this.cls('hidden'));
        this._position();
      }
      this.render();
      this._bindDocumentEvents(true);
      var self = this;
      setTimeout(function () {
        if (!self.state.open) return;
        var focusTarget = self.panelEl.querySelector('[data-day="' + (self.state.from ? self.state.from.jdn : self._todayJdn()) + '"]') ||
          self.panelEl.querySelector('.' + self.cls('day')) || self.panelEl;
        if (focusTarget && focusTarget.focus) {
          try { focusTarget.focus({ preventScroll: true }); } catch (e) { focusTarget.focus(); }
        }
      }, 20);
      this._emitOpen(true);
      return this;
    },

    close: function () {
      if (this.inline || !this.state.open) return this;
      this.state.open = false;
      this._bindDocumentEvents(false);
      if (this._modalMode) {
        this.overlayEl.classList.add(this.cls('hidden'));
        if (typeof document !== 'undefined') document.body.style.overflow = '';
      } else {
        this.panelEl.classList.add(this.cls('hidden'));
      }
      if (this.options.confirmMode) this.cancelSelectionSilently();
      this._emitOpen(false);
      return this;
    },

    /** بازگرداندن مقادیر تأییدنشده (حالت تأییدی) */
    cancelSelectionSilently: function () {
      if (this.options.confirmMode && this._confirmed) {
        var c = this._confirmed;
        this.state.from = c.from;
        this.state.to = c.to;
      }
      return this;
    },

    /** تغییر وضعیت باز/بسته */
    toggle: function () {
      return this.state.open ? this.close() : this.open();
    },

    isOpen: function () { return !!this.state.open; },

    _todayJdn: function () {
      var n = new Date();
      return g2d(n.getFullYear(), n.getMonth() + 1, n.getDate());
    },

    /* =====================================================================
     *  رویدادهای عمومی
     * =================================================================== */

    _bindGlobalEvents: function () {
      var self = this;
      this._onResize = function () {
        clearTimeout(self._resizeTimer);
        self._resizeTimer = setTimeout(function () {
          if (!self.inline) {
            var wasModal = self._modalMode;
            self._applyMode();
            if (self.state.open) {
              if (self._modalMode) self.overlayEl.classList.remove(self.cls('hidden'));
              else self._position();
            }
            if (wasModal !== self._modalMode) self.render();
          }
        }, 120);
      };
      this._onScroll = function () {
        if (self.state.open && !self._modalMode) self._position();
      };
      this._onKeydownDoc = function (e) {
        if (e.key === 'Escape' && self.state.open) {
          if (self.options.confirmMode) self.cancelSelectionSilently();
          self.close();
          if (self.output && self.output.focus) {
            try { self.output.focus({ preventScroll: true }); } catch (err) { self.output.focus(); }
          }
        }
      };
      window.addEventListener('resize', this._onResize);
      window.addEventListener('scroll', this._onScroll, true);
      document.addEventListener('keydown', this._onKeydownDoc);

      if (this.options.editable && this.output && (this.isInput || this.isTextarea)) {
        this._onInputChange = function () { self._applyTypedValue(); };
        this.output.addEventListener('change', this._onInputChange);
        this.output.addEventListener('blur', this._onInputChange);
      }
      if (this.isInput && !this.inline) {
        this._onInputClick = function () { self.open(); };
        this.output.addEventListener('click', this._onInputClick);
        this._onInputKeydown = function (e) {
          if (e.key === 'ArrowDown' || (e.key === 'Enter' && !self.state.open)) {
            e.preventDefault();
            self.open();
          }
        };
        this.output.addEventListener('keydown', this._onInputKeydown);
      }
      if (this.fieldEl) {
        this._onFieldClick = function (e) {
          if (closest(e.target, '.' + self.cls('field-clear'))) {
            e.preventDefault();
            self.clear();
            return;
          }
          self.toggle();
        };
        this._onFieldKeydown = function (e) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            self.open();
          }
        };
        this.fieldEl.addEventListener('click', this._onFieldClick);
        this.fieldEl.addEventListener('keydown', this._onFieldKeydown);
      }
      if (this._modalMode || this.overlayEl) {
        this._onOverlayClick = function (e) {
          if (e.target === self.overlayEl) self.close();
        };
        this.overlayEl.addEventListener('click', this._onOverlayClick);
      }
    },

    _bindDocumentEvents: function (on) {
      var self = this;
      if (on) {
        if (this._docClick) return;
        this._docClick = function (e) {
          if (!self.state.open) return;
          if (self._modalMode) return;
          if (self.panelEl.contains(e.target)) return;
          if (self.output === e.target || self.target === e.target) return;
          if (self.fieldEl && self.fieldEl.contains(e.target)) return;
          self.close();
        };
        setTimeout(function () { document.addEventListener('mousedown', self._docClick, true); }, 0);
        this._docFocus = function (e) {
          if (!self.state.open || self._modalMode) return;
          if (self.panelEl.contains(e.target)) return;
          if (self.output === e.target || self.target.contains(e.target)) return;
          self.close();
        };
        document.addEventListener('focusin', this._docFocus, true);
      } else {
        if (this._docClick) document.removeEventListener('mousedown', this._docClick, true);
        if (this._docFocus) document.removeEventListener('focusin', this._docFocus, true);
        this._docClick = this._docFocus = null;
      }
      return this;
    },

    /* =====================================================================
     *  موقعیت‌دهی پاپ‌آپ
     * =================================================================== */

    _position: function () {
      if (this.inline || this._modalMode || !this.panelEl) return;
      var anchor = (this.fieldEl || this.output || this.target);
      var r = anchor.getBoundingClientRect();
      var panel = this.panelEl;
      panel.classList.remove(this.cls('hidden'));
      panel.style.visibility = 'hidden';
      panel.style.top = '-9999px';
      panel.style.left = '0px';
      var pw = panel.offsetWidth, ph = panel.offsetHeight;
      var vw = window.innerWidth, vh = window.innerHeight;
      var gap = 8, margin = 8;
      var below = r.bottom + gap, above = r.top - ph - gap;
      var top = (below + ph > vh - margin && above > margin) ? above : below;
      if (top + ph > vh - margin) top = Math.max(margin, vh - ph - margin);
      var left;
      if (this.dir === 'rtl') {
        left = r.right - pw;                 // هم‌ترازی با لبه‌ی راست
      } else {
        left = r.left;
      }
      if (left + pw > vw - margin) left = vw - pw - margin;
      if (left < margin) left = margin;
      panel.style.top = Math.max(margin, top) + 'px';
      panel.style.left = left + 'px';
      panel.setAttribute('data-pos', top < r.top ? 'top' : 'bottom');
      panel.style.visibility = '';
    },

    /* =====================================================================
     *  تخریب
     * =================================================================== */

    destroy: function () {
      this.close();
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('scroll', this._onScroll, true);
      document.removeEventListener('keydown', this._onKeydownDoc);
      this._bindDocumentEvents(false);
      if (this._onInputClick) this.output.removeEventListener('click', this._onInputClick);
      if (this._onInputKeydown) this.output.removeEventListener('keydown', this._onInputKeydown);
      if (this._onInputChange) {
        this.output.removeEventListener('change', this._onInputChange);
        this.output.removeEventListener('blur', this._onInputChange);
      }
      if (this.fieldEl) {
        this.fieldEl.removeEventListener('click', this._onFieldClick);
        this.fieldEl.removeEventListener('keydown', this._onFieldKeydown);
      }
      if (this.overlayEl && this._onOverlayClick) this.overlayEl.removeEventListener('click', this._onOverlayClick);
      if (this.panelEl && this.panelEl.parentNode) this.panelEl.parentNode.removeChild(this.panelEl);
      if (this.overlayEl && this.overlayEl.parentNode) this.overlayEl.parentNode.removeChild(this.overlayEl);
      if (this.fieldEl && this.fieldEl.parentNode) this.fieldEl.parentNode.removeChild(this.fieldEl);
      if (this.hostEl && !this.isInput) { /* محتوای ما حذف شد */ }
      if (this.isInput) {
        this.target.classList.remove(this.cls('input'), this.cls('ltr-icon'));
        if (this.output) this.output.removeAttribute('readonly');
      }
      var idx = Picker.instances.indexOf(this);
      if (idx !== -1) Picker.instances.splice(idx, 1);
      if (typeof document !== 'undefined') document.body.style.overflow = '';
      this.destroyed = true;
      return null;
    }
  };

/* ===== 05-render.js ===== */

  /* ==========================================================================
   *  5) رندر پنل تقویم و رویدادهای آن  /  Panel rendering & events
   * ========================================================================== */

  var SVG_CHEV_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  var SVG_CHEV_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var SVG_CHEV_RR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 5l7 7-7 7M13 5l7 7-7 7"/></svg>';
  var SVG_CHEV_LL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 5l-7 7 7 7M11 5l-7 7 7 7"/></svg>';
  var CAL_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 3v3M16 3v3M3 9.5h18"/><circle cx="8.5" cy="14" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="14" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14" r="1.1" fill="currentColor" stroke="none"/></svg>';

  extend(Picker.prototype, {

    /* =====================================================================
     *  تنظیم مقدار (عمومی)
     * =================================================================== */

    /**
     * تعیین تاریخ انتخاب‌شده
     *  silent : بدون رندر/رویداد
     *  force  : حتی اگر تاریخ غیرفعال باشد هم تنظیم شود (نقض strictLimits)
     */
    setDate: function (input, silent, force) {
      var d = this.toDateObj(input, isStr(input) && guessCalendar(input) ? null : this.primary);
      if (!d) return this;
      if (!force && this.options.strictLimits !== false && this.isDisabled(d)) {
        this._log('ADP: تاریخ «' + this.fmt(d, d.calendar) + '» غیرفعال است و تنظیم نشد.');
        return this;
      }
      if (this._isRange()) this.state.to = null;
      this.state.from = d;
      this.state.view[d.calendar] = { y: d.y, m: d.m };
      this._syncViewsTo(d.jdn, d.calendar);
      if (!silent) { this.render(); this._commit(true); }
      return this;
    },

    /** تعیین بازه‌ی انتخابی (force برای نادیده گرفتن محدودیت‌ها) */
    setRange: function (from, to, silent, force) {
      if (isStr(from) && to == null) {
        var parts = String(from).split(/\s*(?:,|;|\u060C|—|–|\s+تا\s+|\s+to\s+|\s+-\s+|\s*\.\.\s*)\s*/i);
        if (parts.length >= 2) { to = parts[1]; from = parts[0]; }
      }
      var f = this.toDateObj(from, isStr(from) && guessCalendar(from) ? null : this.primary);
      var t = to == null ? null : this.toDateObj(to, isStr(to) && guessCalendar(to) ? null : this.primary);
      if (!f && !t) return this;
      if (!force && this.options.strictLimits !== false) {
        if (f && this.isDisabled(f)) {
          this._log('ADP: تاریخ شروع غیرفعال است و بازه تنظیم نشد.');
          return this;
        }
        if (t && this.isDisabled(t)) {
          this._log('ADP: تاریخ پایان غیرفعال است و بازه تنظیم نشد.');
          return this;
        }
      }
      if (!this._isRange()) this.options.range = true;
      this.state.from = f;
      this.state.to = t;
      if (f) {
        this.state.view[f.calendar] = { y: f.y, m: f.m };
        this._syncViewsTo(f.jdn, f.calendar);
      }
      if (!silent) { this.render(); this._commit(true); }
      return this;
    },

    /** تغییر تنظیمات در زمان اجرا */
    setOptions: function (patch) {
      this.options = extend(this.options, resolveOptions(extend({}, this.options, patch || {})));
      if (patch && patch.range !== undefined) this._isRangeValue = !!patch.range;
      if (patch && (patch.limits || patch.disabledDates || patch.disabledDays)) {
        this._limitCache = null;
        this._limitCacheSrc = null;
      }
      if (patch && patch.holidays) this.holiday.normalize(patch.holidays, { source: 'options' });
      if (patch && (patch.calendar || patch.primaryCalendar)) {
        this.calendars = resolveCalendars(this.options.calendar);
        this.primary = this.calendars.indexOf(this.options.primaryCalendar) !== -1 ? this.options.primaryCalendar : this.calendars[0];
      }
      if (patch && (patch.theme || patch.size || patch.accent || patch.dir)) {
        this.dir = this.options.dir || CALENDARS[this.primary].dir;
        this._applyLook();
      }
      if (patch && patch.syncViews !== undefined) this.options.syncViews = patch.syncViews !== false;
      if (patch && patch.strictLimits !== undefined) this.options.strictLimits = patch.strictLimits !== false;
      if (patch && patch.holidaySelectedStyle) this.options.holidaySelectedStyle = patch.holidaySelectedStyle;
      if (patch && patch.dayEvents) this.setDayEvents(patch.dayEvents);
      if (patch && (patch.persianDigits !== undefined || patch.dualDigits !== undefined)) {
        this.options.persianDigits = resolveOptions({ persianDigits: patch.persianDigits === undefined ? this.options.persianDigits : patch.persianDigits }).persianDigits;
        this.options.dualDigits = patch.dualDigits === undefined ? this.options.dualDigits
          : (patch.dualDigits === 'same' ? 'same' : !!patch.dualDigits);
        if (this.output && (this.isInput || this.isTextarea)) this._syncOutputs(this.text());
      }
      this.render();
      return this;
    },

    /* =====================================================================
     *  رندر
     * =================================================================== */

    render: function () {
      if (this.destroyed || !this.panelEl) return this;
      var self = this;
      this.todayJdn = this._todayJdn();
      if (this.options.disabled) {
        this.panelEl.classList.add(this.cls('hidden'));
        return this;
      }
      var html = this.renderSwitchBar();
      html += '<div class="' + this.cls('cals') + '">';
      this.calendars.forEach(function (cal) { html += self.renderPanel(cal); });
      html += '</div>';
      html += this.renderFooter();
      this.panelEl.innerHTML = html;
      this._bindPanelEvents();
      // در حالت تأییدی، متن کادر تا زدن دکمه‌ی «تأیید» تغییر نمی‌کند
      if (!(this.options.confirmMode && this.state.open)) this._syncOutputs();
      if (this.state.open && !this._modalMode && !this.inline) this._position();
      return this;
    },

    /** نوار سوییچ تقویم (نمایش هم‌زمان یا تعویض تقویم با یک دکمه) */
    renderSwitchBar: function () {
      var self = this;
      var cls = function (n) { return self.cls(n); };
      var avail = this.availableCalendars || this.calendars;
      if (avail.length < 2) return '';
      if (this.options.calendarSwitch === false) return '';
      var lang = this.calLang === 'en' ? 'en' : 'fa';
      var html = '<div class="' + cls('switchbar') + '" role="group" aria-label="' +
        escapeHtml(lang === 'en' ? 'Calendar' : 'انتخاب تقویم') + '">';
      avail.forEach(function (cal) {
        var active = self.calendars.indexOf(cal) !== -1;
        html += '<button type="button" class="' + cls('switch') + (active ? ' ' + cls('active') : '') + '"' +
          ' data-switch="' + cal + '" aria-pressed="' + (active ? 'true' : 'false') + '"' +
          ' title="' + escapeHtml(self.calLang === 'en' ? CALENDARS[cal].labelEn : CALENDARS[cal].label) + '">' +
          escapeHtml(self.calLang === 'en' ? CALENDARS[cal].labelEn : CALENDARS[cal].label) + '</button>';
      });
      html += '<span class="' + cls('switch-hint') + '">' + escapeHtml(this.calLang === 'en'
        ? (this.options.switchMode === 'swap' ? 'switch calendar' : 'show side by side')
        : (this.options.switchMode === 'swap' ? 'تعویض تقویم' : 'نمایش هم‌زمان')) + '</span>';
      html += '</div>';
      return html;
    },

    /** جهت و زبان هر پنل */
    panelDir: function (cal) {
      if (cal === 'jalali') return 'rtl';
      if (this.options.gregorianDir) return this.options.gregorianDir;
      return (this.options.gregorianLang || this.calLang) === 'en' ? 'ltr' : 'rtl';
    },

    panelLang: function (cal) {
      if (cal === 'jalali') return this.calLang;
      return this.options.gregorianLang || this.calLang;
    },

    /** شروع هفته برای هر تقویم */
    weekStartOf: function (cal) {
      var ws = this.options.weekStart;
      if (isPlainObj(ws)) return ws[cal] != null ? ws[cal] : CALENDARS[cal].weekStart;
      if (isNum(ws)) return ws;
      if (typeof ws === 'string' && ws === 'saturday') return 6;
      if (typeof ws === 'string' && ws === 'monday') return 1;
      return CALENDARS[cal].weekStart;
    },

    /* ---------------------------------------------------------------- */
    /*  یک پنل (یک تقویم)                                                */
    /* ---------------------------------------------------------------- */

    renderPanel: function (cal) {
      var self = this;
      var cls = function (n) { return self.cls(n); };
      var dir = this.panelDir(cal);
      var labels = this.labels;
      var view = this.state.view[cal] || (function () {
        var p = CALENDARS[cal].fromJdn(self.todayJdn);
        return { y: p.y, m: p.m };
      }());
      var monthsCount = Math.max(1, Math.min(3, this.options.monthsPerPanel | 0 || 1));
      var mode = this.state.viewMode[cal] || 'days';
      var prevIcon = dir === 'rtl' ? SVG_CHEV_R : SVG_CHEV_L;
      var nextIcon = dir === 'rtl' ? SVG_CHEV_L : SVG_CHEV_R;
      var prevYearIcon = dir === 'rtl' ? SVG_CHEV_RR : SVG_CHEV_LL;
      var nextYearIcon = dir === 'rtl' ? SVG_CHEV_LL : SVG_CHEV_RR;

      var html = '<div class="' + cls('cal') + ' ' + cls(dir === 'rtl' ? 'rtl' : 'ltr') + '" data-cal="' + cal + '"' +
        (mode === 'days' ? '' : ' data-viewmode="' + mode + '"') + '>';

      // --- سربرگ ---
      html += '<div class="' + cls('head') + '">';
      html += '<div class="' + cls('title') + '">';
      html += '<button type="button" class="' + cls('nav') + '" data-nav="prev-year" data-cal="' + cal + '" title="' + escapeHtml(labels.prevYear) + '" aria-label="' + escapeHtml(labels.prevYear) + '">' + prevYearIcon + '</button>';
      html += '<button type="button" class="' + cls('nav') + '" data-nav="prev-month" data-cal="' + cal + '" title="' + escapeHtml(labels.prevMonth) + '" aria-label="' + escapeHtml(labels.prevMonth) + '">' + prevIcon + '</button>';
      html += '</div>';
      html += '<button type="button" class="' + cls('cal-label') + '" data-view="toggle" data-cal="' + cal + '">' +
        this.panelTitle(cal, view, mode) +
        '<span class="' + cls('cal-key') + '">' + escapeHtml(this.calLang === 'en' ? CALENDARS[cal].labelEn : CALENDARS[cal].label) + '</span>' +
        '</button>';
      html += '<div class="' + cls('title') + '">';
      html += '<button type="button" class="' + cls('nav') + '" data-nav="next-month" data-cal="' + cal + '" title="' + escapeHtml(labels.nextMonth) + '" aria-label="' + escapeHtml(labels.nextMonth) + '">' + nextIcon + '</button>';
      html += '<button type="button" class="' + cls('nav') + '" data-nav="next-year" data-cal="' + cal + '" title="' + escapeHtml(labels.nextYear) + '" aria-label="' + escapeHtml(labels.nextYear) + '">' + nextYearIcon + '</button>';
      html += '</div>';
      html += '</div>';

      if (mode === 'months') html += this.renderMonthsView(cal, view);
      else if (mode === 'years') html += this.renderYearsView(cal, view);
      else {
        for (var i = 0; i < monthsCount; i++) {
          var jdn = CALENDARS[cal].jdn(view.y, Math.min(12, view.m + i), 1);
          var p = CALENDARS[cal].fromJdn(jdn);
          html += this.renderMonthGrid(cal, p.y, p.m, i, monthsCount);
        }
        html += this.renderHolidayList(cal, view);
      }

      if (this.options.timePicker && cal === this.primary) html += this.renderTime(cal);
      html += '</div>';
      return html;
    },

    panelTitle: function (cal, view, mode) {
      var lang = this.panelLang(cal);
      if (mode === 'years') {
        var start = view.y - (view.y % 12);
        return '<b>' + this.num(start, cal) + ' — ' + this.num(start + 11, cal) + '</b>';
      }
      var monNames = this.calMonthNames(cal, lang);
      return '<b>' + monNames[view.m - 1] + '</b>&nbsp;' + this.num(view.y, cal);
    },

    calMonthNames: function (cal, lang) {
      if (lang === 'en') {
        return cal === 'jalali' ? NAMES.en.jalaliMonths : NAMES.en.gregorianMonths;
      }
      return cal === 'jalali' ? NAMES.fa.jalaliMonths : NAMES.fa.gregorianMonths;
    },

    /* ---------------------------------------------------------------- */
    /*  شبکه‌ی روزها                                                     */
    /* ---------------------------------------------------------------- */

    renderMonthGrid: function (cal, y, m, index, count) {
      var self = this;
      var cls = function (n) { return self.cls(n); };
      var lang = this.panelLang(cal);
      var names = NAMES[lang] || NAMES.fa;
      var weekStart = this.weekStartOf(cal);
      var daysInMonth = CALENDARS[cal].monthLength(y, m);
      var firstJdn = CALENDARS[cal].jdn(y, m, 1);
      var offset = (weekdayFromJdn(firstJdn) - weekStart + 7) % 7;
      var startJdn = firstJdn - offset;
      var cells = 42;
      var html = '<div class="' + cls('month') + '" data-month-of="' + cal + '" data-ym="' + y + '-' + m + '">';

      // نام روزهای هفته
      html += '<div class="' + cls('wd-row') + '" role="row">';
      for (var c = 0; c < 7; c++) {
        var dow = (weekStart + c) % 7;
        var isOff = this.holiday.isWeekend(cal, dow);
        html += '<div class="' + cls('wd') + (isOff && this.options.highlightWeekends ? ' ' + cls('off') : '') + '" role="columnheader">' +
          escapeHtml((names.weekdaysShort || names.weekdaysMin)[dow]) + '</div>';
      }
      html += '</div>';

      // روزها
      html += '<div class="' + cls('days') + '" role="grid">';
      for (var i = 0; i < cells; i++) {
        var jdn = startJdn + i;
        var p = CALENDARS[cal].fromJdn(jdn);
        var inMonth = (p.m === m && p.y === y);
        if (!inMonth && this.options.showOutsideDays === false) {
          html += '<span class="' + cls('day') + ' ' + cls('out') + '" aria-hidden="true"></span>';
          continue;
        }
        html += this.renderDayCell(cal, p.y, p.m, p.d, jdn, inMonth);
      }
      html += '</div></div>';
      return html;
    },

    renderDayCell: function (cal, y, m, d, jdn, inMonth) {
      var self = this;
      var cls = function (n) { return self.cls(n); };
      var o = this.options;
      var dobj = { calendar: cal, y: y, m: m, d: d, jdn: jdn, hh: 0, mm: 0, ss: 0 };
      var dow = weekdayFromJdn(jdn);
      var isWeekend = this.holiday.isWeekend(cal, dow);
      var hol = this.holiday.entry(cal, y, m, d);
      var isHoliday = !!(hol && hol.type !== 'event');
      var title = hol ? hol.title : '';
      var dayEvts = this._eventsFor(dobj);
      for (var ei = 0; ei < dayEvts.length; ei++) {
        if (dayEvts[ei].title) title = (title ? title + ' — ' : '') + dayEvts[ei].title;
      }
      var disabled = this.isDisabled(dobj);
      var isToday = jdn === this.todayJdn;

      // وضعیت انتخاب
      var className = cls('day');
      if (!inMonth) className += ' ' + cls('out');
      var start = null, end = null;
      if (this._isRange()) {
        var f = this.state.from, t = this.state.to;
        var hov = this.state.hover;
        var a = f ? f.jdn : null, b = t ? t.jdn : null;
        if (a != null && b == null && hov != null) b = hov;
        if (a != null && b != null) {
          start = Math.min(a, b); end = Math.max(a, b);
        } else if (a != null) { start = end = a; }
      } else if (this.state.from) {
        start = end = this.state.from.jdn;
      }
      var inRange = (start != null && end != null && jdn > start && jdn < end);
      var isStart = (start != null && jdn === start);
      var isEnd = (end != null && jdn === end && end !== start);
      if (inRange) className += ' ' + cls('in-range');
      if (isStart) className += ' ' + cls('range-start') + ' ' + cls('selected');
      if (isEnd) className += ' ' + cls('range-end') + ' ' + cls('selected');
      // روز تعطیل/جمعه‌ای که انتخاب شده باشد، قرمز نمایش داده می‌شود
      var isOffDay = isHoliday || (isWeekend && o.highlightWeekends);
      if (o.holidaySelectedStyle !== 'accent' && isOffDay) {
        if (isStart || isEnd) className += ' ' + cls('sel-holiday');
        else if (inRange) className += ' ' + cls('sel-holiday');
      }

      // رنگ تعطیلات و جمعه
      var style = o.holidayStyle || 'red';
      if (style !== 'none' && (isHoliday || (isWeekend && o.highlightWeekends))) {
        className += ' ' + cls('off');
      }
      if (style === 'red' || style === 'both') {
        if (isHoliday && !(isStart || isEnd)) className += ' ' + cls('holiday');
      }
      if (isToday) className += ' ' + cls('today');
      if (disabled) className += ' ' + cls('disabled');
      if (dayEvts.length) {
        className += ' ' + cls('has-event');
        dayEvts.forEach(function (spec) {
          if (spec.className) className += ' ' + spec.className;
        });
      }

      var label = formatDate({ calendar: cal, y: y, m: m, d: d, jdn: jdn }, 'dddd D MMMM YYYY',
        { lang: this.panelLang(cal), persianDigits: this.usePersianDigits(cal) });
      if (o.dualDigits) {
        var otherCal = cal === 'jalali' ? 'gregorian' : 'jalali';
        var op = CALENDARS[otherCal].fromJdn(jdn);
        label += ' — ' + formatDate({ calendar: otherCal, y: op.y, m: op.m, d: op.d, jdn: jdn }, 'D MMMM YYYY',
          { lang: this.panelLang(otherCal), persianDigits: this.usePersianDigits(otherCal) });
      }
      if (title) label += ' — ' + title;
      if (disabled) label += ' (' + (this.calLang === 'en' ? 'unavailable' : 'غیرقابل انتخاب') + ')';

      var html = '<button type="button" class="' + className + '" data-day="' + jdn + '" data-cal="' + cal + '" role="gridcell"' +
        ' tabindex="' + (this.state.focusJdn === jdn ? '0' : '-1') + '"' +
        ' aria-selected="' + ((isStart || isEnd) ? 'true' : 'false') + '"' +
        (inRange ? ' aria-inrange="true"' : '') +
        ' aria-label="' + escapeHtml(label) + '"' +
        (title ? ' title="' + escapeHtml(title) + '"' : '') +
        (disabled ? ' disabled aria-disabled="true"' : '') + '>';
      html += '<span class="' + cls('day-num') + '">' + this.num(d, cal) + '</span>';
      if (o.dualDigits) {
        var subCal = cal === 'jalali' ? 'gregorian' : 'jalali';
        var subDay;
        if (o.dualDigits === 'same') {
          subDay = this.num(d, subCal);            // همان عدد با ارقام تقویم دیگر
        } else {
          subDay = this.num(CALENDARS[subCal].fromJdn(jdn).d, subCal);   // عدد روزِ معادل در تقویم دیگر
        }
        html += '<span class="' + cls('day-sub') + '" aria-hidden="true">' + subDay + '</span>';
      }
      if (style === 'dot' || style === 'both') {
        if ((isHoliday || isWeekend) && o.highlightWeekends) html += '<span class="' + cls('dot') + '"></span>';
      }
      if (dayEvts.length) html += '<span class="' + cls('event-dot') + '"></span>';
      html += '</button>';
      return html;
    },

    /* ---------------------------------------------------------------- */
    /*  نمای ماه / سال                                                   */
    /* ---------------------------------------------------------------- */

    renderMonthsView: function (cal, view) {
      var self = this;
      var cls = function (n) { return self.cls(n); };
      var monNames = this.calMonthNames(cal, this.panelLang(cal));
      var html = '<div class="' + cls('grid3') + '" role="grid">';
      for (var i = 0; i < 12; i++) {
        var jdnS = CALENDARS[cal].jdn(view.y, i + 1, 1);
        var jdnE = CALENDARS[cal].jdn(view.y, i + 1, CALENDARS[cal].monthLength(view.y, i + 1));
        var lim = this._limits();
        var out = (lim.min != null && jdnE < lim.min) || (lim.max != null && jdnS > lim.max);
        var active = (view.m === i + 1);
        html += '<button type="button" class="' + cls('cell') + (active ? ' ' + cls('active') : '') + '"' +
          ' data-month="' + (i + 1) + '" data-cal="' + cal + '"' + (out ? ' disabled' : '') + '>' +
          escapeHtml(monNames[i]) + '</button>';
      }
      html += '</div>';
      return html;
    },

    renderYearsView: function (cal, view) {
      var self = this;
      var cls = function (n) { return self.cls(n); };
      var start = view.y - (view.y % 12);
      var lim = this._limits();
      var html = '<div class="' + cls('years-bar') + '">';
      html += '<button type="button" class="' + cls('nav') + '" data-yearpage="-1" data-cal="' + cal + '" aria-label="' + escapeHtml(this.labels.prevYear) + '">' + SVG_CHEV_LL + '</button>';
      html += '<b>' + this.num(start, cal) + ' — ' + this.num(start + 11, cal) + '</b>';
      html += '<button type="button" class="' + cls('nav') + '" data-yearpage="1" data-cal="' + cal + '" aria-label="' + escapeHtml(this.labels.nextYear) + '">' + SVG_CHEV_RR + '</button>';
      html += '</div><div class="' + cls('grid4') + '">';
      for (var i = 0; i < 12; i++) {
        var y = start + i;
        if (y < CALENDARS[cal].minYear || y > CALENDARS[cal].maxYear) { html += '<span></span>'; continue; }
        var jdnS = CALENDARS[cal].jdn(y, 1, 1);
        var jdnE = CALENDARS[cal].jdn(y, 12, CALENDARS[cal].monthLength(y, 12));
        var out = (lim.min != null && jdnE < lim.min) || (lim.max != null && jdnS > lim.max);
        html += '<button type="button" class="' + cls('cell') + (view.y === y ? ' ' + cls('active') : '') + '"' +
          ' data-year="' + y + '" data-cal="' + cal + '"' + (out ? ' disabled' : '') + '>' + this.num(y, cal) + '</button>';
      }
      html += '</div>';
      return html;
    },

    /* ---------------------------------------------------------------- */
    /*  فهرست مناسبت‌ها                                                  */
    /* ---------------------------------------------------------------- */

    renderHolidayList: function (cal, view) {
      var o = this.options;
      if (o.showHolidayList === false || o.showHolidayList === 'none') return '';
      if (o.showHolidayList === 'primary' || o.showHolidayList === true) {
        if (cal !== this.primary) return '';
      }
      var self = this;
      var cls = function (n) { return self.cls(n); };
      var limit = o.holidayListLimit || 6;
      var items = this.holiday.monthHolidays(cal, view.y, view.m).slice();
      // افزودن رویدادهای شخصی دارای عنوان به فهرست
      var self2 = this;
      var monthLen = CALENDARS[cal].monthLength(view.y, view.m);
      for (var dd = 1; dd <= monthLen; dd++) {
        var evs = this._eventsFor({ calendar: cal, y: view.y, m: view.m, d: dd, jdn: CALENDARS[cal].jdn(view.y, view.m, dd) });
        evs.forEach(function (spec) {
          if (!spec.title) return;
          var isHolidayItem = spec.type === 'holiday';
          items.push({
            y: view.y, m: view.m, d: dd, jdn: CALENDARS[cal].jdn(view.y, view.m, dd),
            title: spec.title, type: isHolidayItem ? 'public' : 'event', custom: true
          });
        });
      }
      items.sort(function (a, b) { return a.jdn - b.jdn; });
      var html = '<div class="' + cls('list') + '">';
      html += '<div class="' + cls('list-title') + '">' + escapeHtml(this.labels.holidayList) + '</div>';
      if (!items.length) {
        html += '<div class="' + cls('list-empty') + '">' +
          (this.calLang === 'en' ? 'No holiday loaded for this month' : 'مناسبتی برای این ماه ثبت نشده است') + '</div>';
      } else {
        html += '<div class="' + cls('list-items') + '">';
        items.slice(0, limit).forEach(function (it) {
          var monName = self.calMonthNames(cal, self.panelLang(cal))[it.m - 1];
          html += '<button type="button" class="' + cls('list-item') + (it.custom ? ' ' + cls('list-item-event') : '') + '" data-holiday-item="' + it.jdn + '" data-cal="' + cal + '">' +
            '<span class="' + cls('list-day') + '">' + self.num(it.d, cal) + ' ' + escapeHtml(monName) + '</span>' +
            '<span>' + escapeHtml(it.title || self.labels.holiday) + '</span></button>';
        });
        if (items.length > limit) {
          html += '<div class="' + cls('list-empty') + '">' + (this.calLang === 'en' ? 'and ' + (items.length - limit) + ' more…' : 'و ' + toFaDigits(items.length - limit) + ' مورد دیگر…') + '</div>';
        }
        html += '</div>';
      }
      html += '</div>';
      return html;
    },

    /* ---------------------------------------------------------------- */
    /*  انتخاب ساعت                                                      */
    /* ---------------------------------------------------------------- */

    renderTime: function (cal) {
      var self = this;
      var cls = function (n) { return self.cls(n); };
      var o = this.options;
      var t = this.state.time || { hh: 0, mm: 0, ss: 0 };
      var step = o.timeStep || 5;
      var html = '<div class="' + cls('time') + '">';
      html += '<label>' + escapeHtml(this.labels.hour) + '</label><select data-time="hh">';
      for (var h = 0; h < 24; h++) html += '<option value="' + h + '"' + (h === t.hh ? ' selected' : '') + '>' + this.num(pad2(h), cal) + '</option>';
      html += '</select>';
      html += '<label>' + escapeHtml(this.labels.minute) + '</label><select data-time="mm">';
      for (var mi = 0; mi < 60; mi += step) html += '<option value="' + mi + '"' + (mi === t.mm ? ' selected' : '') + '>' + this.num(pad2(mi), cal) + '</option>';
      html += '</select>';
      if (o.showSeconds) {
        html += '<label>' + escapeHtml(this.labels.second) + '</label><select data-time="ss">';
        for (var s = 0; s < 60; s++) html += '<option value="' + s + '"' + (s === t.ss ? ' selected' : '') + '>' + this.num(pad2(s), cal) + '</option>';
        html += '</select>';
      }
      html += '</div>';
      return html;
    },

    /* ---------------------------------------------------------------- */
    /*  پاصفحه                                                           */
    /* ---------------------------------------------------------------- */

    renderFooter: function () {
      var self = this;
      var cls = function (n) { return self.cls(n); };
      var o = this.options;
      var html = '<div class="' + cls('foot') + '">';
      html += '<div class="' + cls('foot-info') + '">' + this.renderFooterInfo() + '</div>';
      html += '<div class="' + cls('btns') + '">';
      if (o.showTodayButton !== false) {
        html += '<button type="button" class="' + cls('btn') + '" data-foot="today">' + escapeHtml(this.labels.today) + '</button>';
      }
      if (o.showClearButton !== false) {
        var hasValue = !!(this.state.from || this.state.to);
        html += '<button type="button" class="' + cls('btn') + ' ' + cls('btn-ghost-danger') + '" data-foot="clear"' + (hasValue ? '' : ' disabled') + '>' + escapeHtml(this.labels.clear) + '</button>';
      }
      if (o.showExportButton) {
        html += '<button type="button" class="' + cls('btn') + '" data-foot="export" title="' + escapeHtml(o.holidayJsonName || 'holidays.json') + '">JSON</button>';
      }
      if (o.showCloseButton) {
        html += '<button type="button" class="' + cls('btn') + '" data-foot="close">' + escapeHtml(this.labels.close) + '</button>';
      }
      if (o.showConfirmButton) {
        html += '<button type="button" class="' + cls('btn') + ' ' + cls('btn-primary') + '" data-foot="apply">' + escapeHtml(this.labels.confirm) + '</button>';
      }
      html += '</div></div>';
      return html;
    },

    renderFooterInfo: function () {
      var self = this;
      var cls = function (n) { return self.cls(n); };
      var html = '';
      if (this.state.loading > 0) {
        html += '<span class="' + cls('loading') + '"><span class="' + cls('spinner') + '"></span>' +
          (this.calLang === 'en' ? 'Loading holidays…' : 'در حال دریافت تعطیلات…') + '</span>';
      } else {
        var txt = this.text();
        html += '<span>' + (txt ? escapeHtml(txt) : escapeHtml(this.placeholder())) + '</span>';
      }
      return html;
    },

    _updateStatus: function () {
      var info = this.$('.' + this.cls('foot-info'));
      if (info) info.innerHTML = this.renderFooterInfo();
    },

    /* =====================================================================
     *  رویدادهای پنل
     * =================================================================== */

    _bindPanelEvents: function () {
      if (this._panelBound) return this;
      this._panelBound = true;
      var self = this;
      var cls = function (n) { return self.cls(n); };

      this.panelEl.addEventListener('click', function (e) {
        var t = e.target;

        var sw = closest(t, '[data-switch]');
        if (sw) {
          e.preventDefault();
          self.switchCalendar(sw.getAttribute('data-switch'));
          return;
        }
        var nav = closest(t, '[data-nav]');
        if (nav) {
          e.preventDefault();
          self._handleNav(nav);
          return;
        }
        var yearPage = closest(t, '[data-yearpage]');
        if (yearPage) {
          e.preventDefault();
          self._handleYearPage(yearPage);
          return;
        }
        var dayBtn = closest(t, '[data-day]');
        if (dayBtn) {
          e.preventDefault();
          if (self._isCellDisabled(dayBtn)) return;      // روزهای غیرفعال هرگز انتخاب نمی‌شوند
          var jdn = +dayBtn.getAttribute('data-day');
          self._selectByJdn(jdn, dayBtn.getAttribute('data-cal'));
          return;
        }
        var monthBtn = closest(t, '[data-month]');
        if (monthBtn) {
          e.preventDefault();
          var cal = monthBtn.getAttribute('data-cal');
          self.state.view[cal] = { y: self.state.view[cal].y, m: +monthBtn.getAttribute('data-month') };
          self.state.viewMode[cal] = 'days';
          self.render();
          return;
        }
        var yearBtn = closest(t, '[data-year]');
        if (yearBtn) {
          e.preventDefault();
          var calY = yearBtn.getAttribute('data-cal');
          self.state.view[calY] = { y: +yearBtn.getAttribute('data-year'), m: self.state.view[calY].m };
          self.state.viewMode[calY] = 'months';
          self.render();
          return;
        }
        var viewBtn = closest(t, '[data-view]');
        if (viewBtn) {
          e.preventDefault();
          var calV = viewBtn.getAttribute('data-cal');
          var mode = self.state.viewMode[calV] || 'days';
          self.state.viewMode[calV] = mode === 'days' ? 'months' : (mode === 'months' ? 'years' : 'days');
          self.render();
          return;
        }
        var holItem = closest(t, '[data-holiday-item]');
        if (holItem) {
          e.preventDefault();
          self._selectByJdn(+holItem.getAttribute('data-holiday-item'), holItem.getAttribute('data-cal'));
          return;
        }
        var foot = closest(t, '[data-foot]');
        if (foot) {
          e.preventDefault();
          var action = foot.getAttribute('data-foot');
          if (action === 'today') self.goToday();
          else if (action === 'clear') { self.clear(); }
          else if (action === 'apply') { self._confirmed = { from: self.state.from, to: self.state.to }; self.applySelection(); }
          else if (action === 'close') self.close();
          else if (action === 'export') self.holiday.download(self.options.holidayJsonName || 'holidays.json');
          return;
        }
      });

      this.panelEl.addEventListener('change', function (e) {
        var sel = closest(e.target, '[data-time]');
        if (!sel) return;
        var kind = sel.getAttribute('data-time');
        self.state.time = self.state.time || { hh: 0, mm: 0, ss: 0 };
        self.state.time[kind] = +sel.value;
        if (self.state.from) {
          self.state.from.hh = self.state.time.hh;
          self.state.from.mm = self.state.time.mm;
          self.state.from.ss = self.state.time.ss;
        }
        if (!self.options.confirmMode) self._commit(true);
        else self._updateStatus();
      });

      // پیش‌نمایش بازه با حرکت ماوس
      this.panelEl.addEventListener('mouseover', function (e) {
        if (!self._isRange()) return;
        var dayBtn = closest(e.target, '[data-day]');
        if (!dayBtn) return;
        var jdn = +dayBtn.getAttribute('data-day');
        if (self.state.hover === jdn) return;
        self.state.hover = jdn;
        self._updateRangePreview();
      });
      this.panelEl.addEventListener('mouseleave', function () {
        if (!self._isRange()) return;
        if (self.state.hover === null) return;
        self.state.hover = null;
        self._updateRangePreview();
      });

      // سفر با کیبورد
      this.panelEl.addEventListener('keydown', function (e) { self._handleKeydown(e); });
    },

    /** به‌روزرسانی کلاس‌های پیش‌نمایش بازه بدون رندر کامل */
    _updateRangePreview: function () {
      var self = this;
      var f = this.state.from, t = this.state.to, hov = this.state.hover;
      var a = f ? f.jdn : null, b = t ? t.jdn : null;
      if (a != null && b == null && hov != null) b = hov;
      var start = (a != null && b != null) ? Math.min(a, b) : null;
      var end = (a != null && b != null) ? Math.max(a, b) : null;
      this.$$('[data-day]').forEach(function (el) {
        var jdn = +el.getAttribute('data-day');
        var inRange = (start != null && jdn > start && jdn < end);
        el.classList[inRange ? 'add' : 'remove'](self.cls('in-range'));
        el.classList[(start != null && jdn === start) ? 'add' : 'remove'](self.cls('range-start'));
        el.classList[(end != null && jdn === end && end !== start) ? 'add' : 'remove'](self.cls('range-end'));
        el.classList[(start != null && (jdn === start || jdn === end)) ? 'add' : 'remove'](self.cls('selected'));
      });
    },

    _handleNav: function (btn) {
      var cal = btn.getAttribute('data-cal') || this.primary;
      var nav = btn.getAttribute('data-nav');
      var monthsCount = Math.max(1, Math.min(3, this.options.monthsPerPanel | 0 || 1));
      if (nav === 'prev-month') this.shift(cal, -monthsCount, 0);
      else if (nav === 'next-month') this.shift(cal, monthsCount, 0);
      else if (nav === 'prev-year') this.shift(cal, 0, -1);
      else if (nav === 'next-year') this.shift(cal, 0, 1);
    },

    _handleYearPage: function (btn) {
      var cal = btn.getAttribute('data-cal') || this.primary;
      var delta = +btn.getAttribute('data-yearpage') * 12;
      var v = this.state.view[cal];
      var y = Math.max(CALENDARS[cal].minYear, Math.min(CALENDARS[cal].maxYear, v.y + delta));
      this.state.view[cal] = { y: y, m: v.m };
      this.render();
    },

    /** آیا این خانه‌ی روز غیرفعال است؟ */
    _isCellDisabled: function (el) {
      if (!el) return true;
      return el.disabled === true || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
    },

    /**
     * انتخاب روز از روی JDN
     *  cal : تقویمِ پنلی که کاربر روی آن کلیک کرده است (برای ارزیابی درست
     *        محدودیت‌های وابسته به تقویم مثل تعطیلات و روزهای غیرفعال)
     */
    _selectByJdn: function (jdn, cal) {
      var calendar = CALENDARS[cal] ? cal : (this.state.active || this.primary);
      var p = CALENDARS[calendar].fromJdn(jdn);
      var dobj = {
        calendar: calendar, y: p.y, m: p.m, d: p.d, jdn: jdn,
        hh: this.state.time ? this.state.time.hh : 0,
        mm: this.state.time ? this.state.time.mm : 0,
        ss: this.state.time ? this.state.time.ss : 0
      };
      if (this.isDisabled(dobj)) return this;   // روز غیرفعال در این تقویم انتخاب نمی‌شود
      this.selectDate(dobj);
      return this;
    },

    /* ---------------------------------------------------------------- */
    /*  کیبورد                                                           */
    /* ---------------------------------------------------------------- */

    _handleKeydown: function (e) {
      var key = e.key;
      if (key === 'Escape') { this.close(); return; }
      var dayBtn = closest(e.target, '[data-day]');
      var calEl = closest(e.target, '[data-cal]');
      var cal = calEl ? calEl.getAttribute('data-cal') : this.primary;
      var dir = this.panelDir(cal);
      var cur;
      if (dayBtn) cur = +dayBtn.getAttribute('data-day');
      else cur = this.state.focusJdn != null ? this.state.focusJdn : (this.state.from ? this.state.from.jdn : this.todayJdn);

      var delta = 0;
      switch (key) {
        case 'ArrowLeft': delta = dir === 'rtl' ? 1 : -1; break;
        case 'ArrowRight': delta = dir === 'rtl' ? -1 : 1; break;
        case 'ArrowUp': delta = -7; break;
        case 'ArrowDown': delta = 7; break;
        case 'PageUp': e.preventDefault(); this.shift(cal, e.shiftKey ? 0 : -1, e.shiftKey ? -1 : 0); return;
        case 'PageDown': e.preventDefault(); this.shift(cal, e.shiftKey ? 0 : 1, e.shiftKey ? 1 : 0); return;
        case 'Home': delta = 'home'; break;
        case 'End': delta = 'end'; break;
        default: return;
      }
      e.preventDefault();
      if (delta === 'home') { this.focusJdn(cur - ((weekdayFromJdn(cur) - this.weekStartOf(cal) + 7) % 7)); return; }
      if (delta === 'end') { this.focusJdn(cur - ((weekdayFromJdn(cur) - this.weekStartOf(cal) + 7) % 7) + 6); return; }
      if (!delta) return;
      this.focusJdn(this._nextEnabledJdn(cur + delta, delta > 0 ? 1 : -1));
    },

    /** نزدیک‌ترین روز قابل انتخاب در جهت حرکت (پرش از روی روزهای غیرفعال) */
    _nextEnabledJdn: function (jdn, step) {
      var cal = this.state.active || this.primary;
      for (var i = 0; i < 90; i++) {
        var p = CALENDARS[cal].fromJdn(jdn);
        var dobj = { calendar: cal, y: p.y, m: p.m, d: p.d, jdn: jdn, hh: 0, mm: 0, ss: 0 };
        if (!this.isDisabled(dobj)) return jdn;
        jdn += step;
      }
      return jdn;
    },

    /** انتقال فوکوس به روز مشخص (با تغییر ماه در صورت نیاز) */
    focusJdn: function (jdn) {
      var cal = this.state.active || this.primary;
      var p = CALENDARS[cal].fromJdn(jdn);
      var view = this.state.view[cal];
      var monthsCount = Math.max(1, Math.min(3, this.options.monthsPerPanel | 0 || 1));
      var needRender = false;
      if (!view) { this.state.view[cal] = { y: p.y, m: p.m }; needRender = true; }
      else {
        var firstJdn = CALENDARS[cal].jdn(view.y, view.m, 1);
        var lastP = CALENDARS[cal].fromJdn(CALENDARS[cal].jdn(view.y, Math.min(12, view.m + monthsCount - 1), 1));
        var lastJdn = CALENDARS[cal].jdn(lastP.y, lastP.m, CALENDARS[cal].monthLength(lastP.y, lastP.m));
        if (jdn < firstJdn || jdn > lastJdn) {
          this.state.view[cal] = { y: p.y, m: p.m };
          needRender = true;
        }
      }
      this.state.focusJdn = jdn;
      this.state.viewMode[cal] = 'days';
      if (needRender) {
        this._syncViewsTo(jdn, cal);
        this.render();
      }
      var el = this.$('[data-day="' + jdn + '"]');
      if (el) {
        this.$$('[data-day]').forEach(function (d) { d.setAttribute('tabindex', '-1'); });
        el.setAttribute('tabindex', '0');
        try { el.focus({ preventScroll: false }); } catch (err) { el.focus(); }
      }
      return this;
    }
  });

/* ===== 06-picker-api.js ===== */

  /* ==========================================================================
   *  6) متدهای عمومی دیت‌پیکر  /  Public picker methods
   * ========================================================================== */

  extend(Picker.prototype, {

    /* ---------------------------------------------------------------- */
    /*  خواندن مقدار                                                     */
    /* ---------------------------------------------------------------- */

    /** تاریخ انتخاب‌شده: شیء کامل شامل معادل شمسی و میلادی */
    getDate: function () {
      return this.describe(this.state.from);
    },

    /** بازه‌ی انتخاب‌شده */
    getRange: function () {
      return {
        from: this.describe(this.state.from),
        to: this.describe(this.state.to),
        text: this.text()
      };
    },

    /** متن نمایش‌داده‌شده در کادر */
    getText: function () { return this.text(); },

    /** متن بازه (مترادف getText) */
    getRangeText: function () { return this.text(); },

    /** مقدار کامل به همراه متن و هر دو تقویم */
    getValue: function () { return this.value(); },

    /** آبجکت Date جاوااسکریپت بر اساس تاریخ انتخاب‌شده */
    getGregorianDate: function () {
      if (!this.state.from) return null;
      var d = this.state.from;
      return toJsDate(d.calendar, d.y, d.m, d.d, d.hh, d.mm, d.ss);
    },

    /** تاریخ انتخاب‌شده بر حسب تقویم شمسی */
    getJalali: function () {
      var d = this.state.from;
      if (!d) return null;
      var p = CALENDARS.jalali.fromJdn(d.jdn);
      return { y: p.y, m: p.m, d: p.d, jdn: d.jdn };
    },

    /** تاریخ انتخاب‌شده بر حسب تقویم میلادی */
    getGregorian: function () {
      var d = this.state.from;
      if (!d) return null;
      var p = CALENDARS.gregorian.fromJdn(d.jdn);
      return { y: p.y, m: p.m, d: p.d, jdn: d.jdn };
    },

    /** مقدار تاریخ به شکل ایزو میلادی (مناسب ارسال به سرور) */
    getISO: function () {
      var g = this.getGregorian();
      if (!g) return '';
      return g.y + '-' + pad2(g.m) + '-' + pad2(g.d);
    },

    /** آیا مقداری انتخاب شده است؟ */
    hasValue: function () { return !!this.state.from; },

    /* ---------------------------------------------------------------- */
    /*  تنظیمات                                                          */
    /* ---------------------------------------------------------------- */

    /** تعیین محدودیت‌های انتخاب در زمان اجرا */
    setLimits: function (limits) {
      this.options.limits = extend({
        mode: 'free', from: null, to: null, min: null, max: null,
        minDays: null, maxDays: null, allowWeekends: true, allowHolidays: true
      }, limits || {});
      this._limitCache = null;
      this._limitCacheSrc = null;
      this.render();
      return this;
    },

    /** خواندن محدودیت‌های فعلی */
    getLimits: function () { return cloneDeep(this.options.limits); },

    /** تغییر تقویم فعال در زمان اجرا */
    setCalendar: function (calendar, primary) {
      this.options.calendar = calendar;
      this.calendars = resolveCalendars(calendar);
      this.primary = (primary && this.calendars.indexOf(primary) !== -1) ? primary : this.calendars[0];
      this.dir = this.options.dir || CALENDARS[this.primary].dir;
      this.state.viewMode[this.primary] = this.state.viewMode[this.primary] || 'days';
      this.render();
      return this;
    },

    /** تقویم اصلی فعلی */
    getCalendar: function () { return this.primary; },

    /** فهرست تقویم‌های فعال */
    getCalendars: function () { return this.calendars.slice(); },

    /** فعال/غیرفعال کردن دیت‌پیکر */
    setDisabled: function (flag) {
      this.options.disabled = !!flag;
      if (this.options.disabled) this.close();
      if (this.fieldEl) this.fieldEl.style.opacity = this.options.disabled ? '.6' : '';
      if (this.output) this.output.disabled = this.options.disabled;
      this.render();
      return this;
    },

    /** بازسازی پنل */
    refresh: function () { return this.render(); },

    /** تغییر تم در زمان اجرا: 'light' | 'dark' | 'auto' */
    setTheme: function (theme) {
      this.options.theme = (theme === 'dark' || theme === 'auto') ? theme : 'light';
      this._applyLook();
      this.render();
      return this;
    },

    /** خواندن تم فعلی */
    getTheme: function () { return this.options.theme; },

    /** تنظیم نمایش عدد معادل تقویم دیگر زیر روزها */
    setDualDigits: function (value) {
      this.options.dualDigits = (value === 'same') ? 'same' : !!value;
      this.render();
      return this;
    },

    /** فعال/غیرفعال کردن هماهنگی ماهِ پنل‌ها */
    setSyncViews: function (flag) {
      this.options.syncViews = flag !== false;
      return this;
    },

    /** تنظیم تاریخ نمایش‌داده‌شده در پنل (بدون تغییر مقدار انتخاب‌شده) */
    setViewDate: function (input, calendar) {
      var d = this.toDateObj(input, calendar || this.primary);
      if (!d) return this;
      this.state.view[d.calendar] = { y: d.y, m: d.m };
      this.render();
      return this;
    },

    /** نمای فعلی پنل‌ها */
    getViewDate: function () { return cloneDeep(this.state.view); },

    /* ---------------------------------------------------------------- */
    /*  تعطیلات                                                          */
    /* ---------------------------------------------------------------- */

    /**
     * فهرست تعطیلات
     *  getHolidays()               => همه‌ی تعطیلات تقویم اصلی
     *  getHolidays(1405)           => تعطیلات یک سال
     *  getHolidays('gregorian')    => همه‌ی تعطیلات یک تقویم
     *  getHolidays(1405, 'jalali') => تعطیلات سال مشخص در تقویم مشخص
     */
    getHolidays: function (year, calendar) {
      if (isStr(year) && CALENDARS[year]) { calendar = year; year = null; }
      var cal = CALENDARS[calendar] ? calendar : this.primary;
      if (year != null) return this.holiday.yearHolidays(cal, +year);
      var map = this.holiday.holidays[cal] || {};
      var out = [];
      for (var key in map) {
        if (!has(map, key)) continue;
        var p = parseKeyDate(key);
        if (!p) continue;
        out.push({
          calendar: cal, y: p.y, m: p.m, d: p.d,
          jdn: CALENDARS[cal].jdn(p.y, p.m, p.d),
          title: map[key].title, type: map[key].type
        });
      }
      out.sort(function (a, b) { return a.jdn - b.jdn; });
      return out;
    },

    /** آیا این تاریخ (یا مقدار انتخاب‌شده‌ی فعلی) تعطیل است؟ */
    isHoliday: function (input, calendar) {
      if (input == null) {
        var d = this.state.from;
        if (!d) return false;
        return this.holiday.isHoliday(d.calendar, d.y, d.m, d.d);
      }
      var dobj = this.toDateObj(input, calendar || this.primary);
      if (!dobj) return false;
      return this.holiday.isHoliday(dobj.calendar, dobj.y, dobj.m, dobj.d);
    },

    /** عنوان مناسبت یک تاریخ */
    getHolidayTitle: function (input, calendar) {
      var dobj = input == null ? this.state.from : this.toDateObj(input, calendar || this.primary);
      if (!dobj) return '';
      return this.holiday.titleOf(dobj.calendar, dobj.y, dobj.m, dobj.d);
    },

    /** افزودن دستی تعطیلات/مناسبت‌ها (JSON یا آرایه) */
    addHolidays: function (data, options) {
      this.holiday.normalize(data, extend({ source: 'api' }, options || {}));
      this.render();
      return this;
    },

    /** بارگذاری تعطیلات از آدرس فایل JSON (Promise) */
    loadHolidays: function (url) {
      var self = this;
      var p = this.holiday.loadFromUrl(url);
      if (p && p.then) p.then(function () { self.render(); });
      return p;
    },

    /** دریافت مجدد تعطیلات از اینترنت (Promise) */
    syncHolidays: function (force) { return this._ensureHolidays(this._yearsForView(), force !== false); },

    /** پاک کردن کش و داده‌های تعطیلات */
    clearHolidays: function () {
      this.holiday.clearCache();
      this.render();
      return this;
    },

    /** خروجی JSON از تعطیلات به‌صورت رشته */
    exportHolidays: function (pretty) {
      return this.holiday.toJSONString(pretty === false ? false : true);
    },

    /** ذخیره‌ی تعطیلات در فایل JSON (دانلود برای کاربر) */
    downloadHolidays: function (filename) {
      return this.holiday.download(filename || this.options.holidayJsonName || 'holidays.json');
    },

    /** دسترسی به شیء مدیر تعطیلات (برای کارهای پیشرفته) */
    getHolidayManager: function () { return this.holiday; },

    /* ---------------------------------------------------------------- */
    /*  کبیسه                                                            */
    /* ---------------------------------------------------------------- */

    /** قاعده‌ی کبیسه‌ی فعال (سراسری) */
    getLeapRule: function () { return getLeapRule(); },

    /** تغییر قاعده‌ی کبیسه (سراسری برای همه‌ی نمونه‌ها) */
    setLeapRule: function (rule) {
      setLeapRule(rule);
      this.render();
      return this;
    },

    /** فهرست سال‌های کبیسه در یک بازه */
    getLeapYears: function (from, to) { return jalaliLeapYears(from, to); },

    /** طول سال جلالی (۳۶۵ یا ۳۶۶) */
    getYearLength: function (jy) { return jalaliYearLength(jy); },

    /** آیا سال جلالی کبیسه است؟ */
    isLeapYear: function (jy) { return isLeapJalaliYearRule(jy); },
  });

  /* ==========================================================================
   *  6-2) رویدادهای شخصی روزها  /  Custom day events
   *  ------------------------------------------------------------------------
   *  کاربر می‌تواند برای روزهای مشخص، تابع دلخواه خود را با ورودی‌های مشخص
   *  تعریف کند؛ با انتخاب آن روز (یا کامل شدن بازه) تابع اجرا می‌شود.
   * ========================================================================== */

  extend(Picker.prototype, {

    /** نرمال‌سازی تعریف رویدادهای شخصی */
    _normalizeDayEvents: function (spec) {
      if (!spec) return [];
      var list = isArr(spec) ? spec.slice() : [spec];
      var out = [];
      list.forEach(function (raw, index) {
        if (!isPlainObj(raw)) return;
        var handler = null;
        if (isFn(raw.handler)) handler = raw.handler;
        else if (isFn(raw.fn)) handler = raw.fn;
        else if (isFn(raw.onSelect)) handler = raw.onSelect;
        else if (isFn(raw.callback)) handler = raw.callback;
        var lim = raw.rangeDays != null ? raw.rangeDays : raw.daysInRange;
        out.push({
          id: raw.id != null ? String(raw.id) : ('dayEvent' + (index + 1)),
          days: raw.days != null ? normalizeList(raw.days) : (raw.dates != null ? normalizeList(raw.dates) : null),
          range: raw.range != null ? normalizeList(raw.range) : null,
          months: raw.months != null ? normalizeList(raw.months).map(Number) : null,
          monthDays: raw.monthDays != null ? normalizeList(raw.monthDays).map(Number) : null,
          weekdays: raw.weekdays != null ? normalizeList(raw.weekdays).map(Number) : null,
          calendar: raw.calendar || null,
          title: raw.title || raw.label || '',
          className: raw.className || raw.cls || '',
          color: raw.color || null,
          once: !!raw.once,
          disabled: !!raw.disabled,
          rangeDays: lim != null ? {
            min: lim.min != null ? lim.min : (isArr(lim) ? lim[0] : null),
            max: lim.max != null ? lim.max : (isArr(lim) ? lim[1] : null)
          } : null,
          handler: handler,
          args: has(raw, 'args') ? (isArr(raw.args) ? raw.args.slice() : [raw.args]) : null
        });
      });
      return out;
    },

    /** آیا این رویداد به این روز مربوط است؟ */
    _eventMatches: function (spec, dobj) {
      if (spec._used) return false;
      if (spec.calendar && spec.calendar !== dobj.calendar) return false;
      var cal = spec.calendar || dobj.calendar;
      var i, d;
      if (spec.days && spec.days.length) {
        for (i = 0; i < spec.days.length; i++) {
          d = this.toDateObj(spec.days[i], cal);
          if (d && d.jdn === dobj.jdn) return true;
        }
      }
      if (spec.range && spec.range.length >= 2) {
        var a = this.toDateObj(spec.range[0], cal);
        var b = this.toDateObj(spec.range[1], cal);
        if (a && b && dobj.jdn >= Math.min(a.jdn, b.jdn) && dobj.jdn <= Math.max(a.jdn, b.jdn)) return true;
      }
      if (spec.months && spec.months.indexOf(dobj.m) !== -1) return true;
      if (spec.monthDays && spec.monthDays.indexOf(dobj.d) !== -1) return true;
      if (spec.weekdays && spec.weekdays.indexOf(weekdayFromJdn(dobj.jdn)) !== -1) return true;
      return false;
    },

    /** رویدادهای متصل به یک روز */
    _eventsFor: function (dobj) {
      if (!this._dayEvents || !this._dayEvents.length || !dobj) return [];
      var out = [];
      for (var i = 0; i < this._dayEvents.length; i++) {
        if (this._eventMatches(this._dayEvents[i], dobj)) out.push(this._dayEvents[i]);
      }
      return out;
    },

    /** فراخوانی handler یک رویداد شخصی با ورودی‌های تعیین‌شده */
    _invokeDayEvent: function (spec, payload) {
      if (!spec) return null;
      var self = this;
      var info = extend({}, payload || {});
      info.event = { id: spec.id, title: spec.title, className: spec.className, color: spec.color };
      info.picker = self;
      info.args = spec.args;
      var ret = null;
      try {
        if (isFn(spec.handler)) {
          if (spec.args && spec.args.length) {
            // ورودی‌های دلخواه کاربر؛ جای‌نگهدارهای $date/$range/... با مقدار واقعی پر می‌شوند
            var resolved = spec.args.map(function (a) {
              switch (a) {
                case '$date': case '{date}': return info.date;
                case '$text': case '{text}': return info.text;
                case '$range': case '{range}': return info.range;
                case '$info': case '{info}': return info;
                case '$picker': case '{picker}': return self;
                case '$jdn': case '{jdn}': return info.jdn;
                case '$jalali': case '{jalali}': return info.jalali;
                case '$gregorian': case '{gregorian}': return info.gregorian;
                case '$target': case '{target}': return self.target;
                case '$event': case '{event}': return info.event;
                default: return a;
              }
            });
            ret = spec.handler.apply(self, resolved);
          } else {
            ret = spec.handler.call(self, info, self);
          }
        }
        if (isFn(self.options.onDayEvent)) ret = self.options.onDayEvent.call(self, info, self) || ret;
        try {
          if (typeof CustomEvent === 'function') {
            self.target.dispatchEvent(new CustomEvent('adp:dayevent', { bubbles: true, detail: info }));
          }
        } catch (e) { }
      } catch (err) {
        if (isFn(self.options.onError)) self.options.onError(err, self);
        else if (typeof console !== 'undefined' && console.error) console.error('ADP: خطا در اجرای رویداد روز', err);
      }
      if (spec.once) spec._used = true;
      self.state.lastDayEvent = info;
      return ret;
    },

    /** اجرای رویدادهای روزِ انتخاب‌شده (+ رویدادهای بازه‌ای در صورت کامل بودن بازه) */
    _fireDayEvents: function (dobj, opts) {
      opts = opts || {};
      if (!this._dayEvents || !this._dayEvents.length || !dobj) return this;
      var rangeInfo = null;
      if (this.state.from && this.state.to) {
        rangeInfo = {
          from: this.describe(this.state.from),
          to: this.describe(this.state.to),
          lengthDays: Math.abs(this.state.to.jdn - this.state.from.jdn) + 1,
          text: this.text()
        };
      }
      var dateInfo = this.describe(dobj);
      var payload = {
        date: dateInfo,
        jdn: dobj.jdn,
        calendar: dobj.calendar,
        text: this.fmt(dobj, dobj.calendar),
        jalali: dateInfo ? dateInfo.jalali : null,
        gregorian: dateInfo ? dateInfo.gregorian : null,
        range: rangeInfo,
        committed: !!opts.committed,
        isHoliday: this.holiday.isHoliday(dobj.calendar, dobj.y, dobj.m, dobj.d),
        holidayTitle: this.holiday.titleOf(dobj.calendar, dobj.y, dobj.m, dobj.d)
      };
      var specs = this._eventsFor(dobj);
      for (var i = 0; i < specs.length; i++) this._invokeDayEvent(specs[i], payload);

      // رویدادهای مبتنی بر طول بازه‌ی انتخابی
      if (rangeInfo) {
        for (var j = 0; j < this._dayEvents.length; j++) {
          var spec = this._dayEvents[j];
          if (spec._used || !spec.rangeDays) continue;
          var min = spec.rangeDays.min, max = spec.rangeDays.max;
          if (min != null && rangeInfo.lengthDays < min) continue;
          if (max != null && rangeInfo.lengthDays > max) continue;
          this._invokeDayEvent(spec, payload);
        }
      }
      return this;
    },

    /* ------------------------------------------------------------------ */
    /*  API رویدادهای شخصی                                                */
    /* ------------------------------------------------------------------ */

    /**
     * تعریف رویدادهای شخصی روزها
     *   dp.setDayEvents({
     *     days: ['1405/01/01', '1405/01/13'],
     *     title: 'روز مهم',
     *     handler: function (info, picker) { ... },
     *     args: ['$date']        // در صورت تعیین، handler فقط با همین ورودی‌ها صدا زده می‌شود
     *   });
     */
    setDayEvents: function (spec) {
      this._dayEvents = this._normalizeDayEvents(spec);
      this.options.dayEvents = spec;
      this.render();
      return this;
    },

    /** افزودن رویداد شخصی به فهرست موجود */
    addDayEvent: function (spec) {
      var list = this._dayEvents.slice();
      var added = this._normalizeDayEvents(spec);
      added.forEach(function (a) {
        a.id = a.id + '-' + (list.length + 1);
        list.push(a);
      });
      this._dayEvents = list;
      this.render();
      return this;
    },

    /** حذف رویداد شخصی (با id) یا پاک کردن همه */
    removeDayEvent: function (id) {
      if (id == null) this._dayEvents = [];
      else {
        this._dayEvents = this._dayEvents.filter(function (s) { return s.id !== String(id); });
      }
      this.render();
      return this;
    },

    /** فهرست رویدادهای شخصی تعریف‌شده */
    getDayEvents: function () {
      return this._dayEvents.map(function (s) {
        return {
          id: s.id, title: s.title, days: s.days, range: s.range, months: s.months,
          monthDays: s.monthDays, weekdays: s.weekdays, calendar: s.calendar,
          className: s.className, color: s.color, once: s.once, disabled: s.disabled,
          rangeDays: s.rangeDays, hasHandler: isFn(s.handler), args: s.args, used: !!s._used
        };
      });
    },
    setDayEvent: function (spec) { return this.setDayEvents(spec); },

    /** اجرای دستی رویدادهای یک روز مشخص */
    triggerDayEvents: function (input, calendar) {
      var dobj = this.toDateObj(input == null ? this.state.from : input, calendar || this.primary);
      if (!dobj) return this;
      this._fireDayEvents(dobj, { committed: false });
      return this;
    },

    /** اطلاعات آخرین رویداد اجراشده */
    getLastDayEvent: function () { return this.state.lastDayEvent; },

    /* =====================================================================
     *  6-2-2) روز(های) آخر هفته  /  Weekend configuration
     * =================================================================== */

    /**
     * تعیین روزهای آخر هفته
     *   dp.setWeekend('جمعه')                        → فقط جمعه (هر دو تقویم)
     *   dp.setWeekend(['پنجشنبه', 'جمعه'])           → پنجشنبه و جمعه
     *   dp.setWeekend('friday', 'gregorian')         → فقط برای تقویم میلادی
     *   dp.setWeekend({ jalali: [5], gregorian: [0, 6] })
     * روزهای مجاز: 0=یکشنبه، 1=دوشنبه، 2=سه‌شنبه، 3=چهارشنبه، 4=پنجشنبه، 5=جمعه، 6=شنبه
     */
    setWeekend: function (days, calendar) {
      if (isPlainObj(days) && !isArr(days)) {
        if (days.jalali !== undefined) this.options.weekends.jalali = normalizeWeekendDays(days.jalali) || [];
        if (days.gregorian !== undefined) this.options.weekends.gregorian = normalizeWeekendDays(days.gregorian) || [];
      } else {
        var normalized = normalizeWeekendDays(days);
        if (normalized) {
          if (calendar && CALENDARS[calendar]) this.options.weekends[calendar] = normalized;
          else {
            this.options.weekends.jalali = normalized.slice();
            this.options.weekends.gregorian = normalized.slice();
          }
        }
      }
      if (this.holiday) {
        this.holiday.options.weekends = this.options.weekends;
        this.holiday.options.cacheKey = this.options.holidayCacheKey || (CACHE_KEY_DEFAULT + '-' + this.prefix);
      }
      this.render();
      if (isFn(this.options.onWeekendChange)) this.options.onWeekendChange(this.getWeekend(), this);
      return this;
    },

    /** روزهای آخر هفته‌ی فعلی */
    getWeekend: function (calendar) {
      if (calendar && CALENDARS[calendar]) return (this.options.weekends[calendar] || []).slice();
      return {
        jalali: (this.options.weekends.jalali || []).slice(),
        gregorian: (this.options.weekends.gregorian || []).slice()
      };
    },

    /** آیا این روز (یا تاریخ داده‌شده) آخر هفته است؟ */
    isWeekend: function (input, calendar) {
      var cal = CALENDARS[calendar] ? calendar : this.primary;
      var jdn;
      if (input == null) {
        if (!this.state.from) return false;
        jdn = this.state.from.jdn;
        cal = this.state.from.calendar;
      } else if (isNum(input) && input >= 0 && input <= 6) {
        jdn = null;
        return (this.options.weekends[cal] || []).indexOf(input) !== -1;
      } else {
        var d = this.toDateObj(input, cal);
        if (!d) return false;
        jdn = d.jdn;
        cal = d.calendar;
      }
      return this.holiday.isWeekend(cal, weekdayFromJdn(jdn));
    },

    /** نام روزهای آخر هفته به فارسی/انگلیسی */
    getWeekendNames: function (calendar) {
      var cal = CALENDARS[calendar] ? calendar : this.primary;
      var list = this.getWeekend(cal);
      var names = NAMES[this.panelLang(cal)] || NAMES.fa;
      return (isArr(list) ? list : []).map(function (i) { return names.weekdays[i]; });
    },

    /** نام روزهای آخر هفته برای هر دو تقویم */
    getWeekendNamesAll: function () {
      var self = this;
      var out = {};
      this.calendars.forEach(function (cal) { out[cal] = self.getWeekendNames(cal); });
      return out;
    },

    /* =====================================================================
     *  6-3) سوییچ تقویم  /  Calendar switching
     * =================================================================== */

    /** تقویم‌های در دسترس برای دکمه‌ی سوییچ */
    getAvailableCalendars: function () { return (this.availableCalendars || this.calendars).slice(); },

    /** تقویم اصلی فعلی (مبنای قالب‌بندی مقدار) */
    getPrimaryCalendar: function () { return this.primary; },

    /** تعیین دستی تقویم اصلی بدون تغییر پنل‌های فعال */
    setPrimaryCalendar: function (cal) {
      if (CALENDARS[cal]) { this.primary = cal; this.render(); }
      return this;
    },

    /** آیا این تقویم در حال نمایش است؟ */
    isCalendarActive: function (cal) { return this.calendars.indexOf(cal) !== -1; },

    /**
     * سوییچ تقویم با یک دکمه:
     *  - حالت 'both' (پیش‌فرض): تقویم دیگر در کنار تقویم فعلی نمایش داده می‌شود (نمایش هم‌زمان)
     *  - حالت 'swap'  : تقویم فعال به‌طور کامل تعویض می‌شود
     */
    switchCalendar: function (target) {
      if (!CALENDARS[target]) return this;
      var self = this;
      if (!this.availableCalendars) this.availableCalendars = this.calendars.slice();
      if (this.availableCalendars.indexOf(target) === -1) this.availableCalendars.push(target);
      // در حالت «تعویض تقویم» همیشه هر دو تقویم در دسترس هستند
      if (this.options.switchMode === 'swap') {
        var selfAvail = this;
        ['jalali', 'gregorian'].forEach(function (c) {
          if (selfAvail.availableCalendars.indexOf(c) === -1) selfAvail.availableCalendars.push(c);
        });
      }

      var active = this.calendars.indexOf(target) !== -1;
      var next;
      if (this.options.switchMode === 'swap') {
        next = [target];
      } else if (active && this.calendars.length > 1) {
        next = this.calendars.filter(function (c) { return c !== target; });
      } else if (!active) {
        next = this.availableCalendars.filter(function (c) {
          return c === target || self.calendars.indexOf(c) !== -1;
        });
      } else {
        next = this.calendars.slice();
      }
      if (!next.length) next = [target];

      this.calendars = next;
      if (this.calendars.indexOf(target) !== -1) this.primary = target;

      // اطمینان از وجود نمای هر تقویم تازه‌افزوده‌شده
      var todayJdn = this.todayJdn || this._todayJdn();
      this.calendars.forEach(function (cal) {
        if (!self.state.view[cal]) {
          var p = CALENDARS[cal].fromJdn(todayJdn);
          self.state.view[cal] = { y: p.y, m: p.m };
        }
        if (!self.state.viewMode[cal]) self.state.viewMode[cal] = self.options.initialView;
      });

      this.state.active = this.primary;
      this.render();
      if (this.state.open && !this._modalMode && !this.inline) this._position();

      var info = { calendars: this.calendars.slice(), primary: this.primary, target: target, mode: this.options.switchMode };
      if (isFn(this.options.onCalendarChange)) this.options.onCalendarChange(info, this);
      try {
        if (typeof CustomEvent === 'function') {
          this.target.dispatchEvent(new CustomEvent('adp:calendarchange', { bubbles: true, detail: info }));
        }
      } catch (e) { }
      return this;
    },

    /** نمایش هم‌زمان تقویم میلادی در کنار شمسی (idempotent) */
    showGregorian: function () {
      if (this.calendars.indexOf('jalali') === -1) this.calendars = ['jalali'].concat(this.calendars);
      if (this.calendars.indexOf('gregorian') !== -1) {
        this.primary = 'gregorian';
        this.render();
        return this;
      }
      return this.switchCalendar('gregorian');
    },

    /** پنهان کردن پنل میلادی */
    hideGregorian: function () {
      if (this.calendars.length > 1 && this.calendars.indexOf('gregorian') !== -1) {
        this.calendars = this.calendars.filter(function (c) { return c !== 'gregorian'; });
        if (this.primary === 'gregorian') this.primary = this.calendars[0];
        this.render();
      }
      return this;
    },

    /** نمایش هم‌زمان هر دو تقویم */
    showBothCalendars: function () {
      this.calendars = ['jalali', 'gregorian'];
      this.render();
      return this;
    },

    /** تنظیم حالت سوییچ تقویم: 'both' (نمایش هم‌زمان) یا 'swap' (تعویض با یک دکمه) */
    setSwitchMode: function (mode) {
      this.options.switchMode = mode === 'swap' ? 'swap' : 'both';
      this.render();
      return this;
    }
  });

/* ===== 07-api.js ===== */

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
    /* ---- قاعده‌ی کبیسه ---- */
    /**
     * تعیین قاعده‌ی کبیسه (سراسری برای همه‌ی دیت‌پیکرها)
     *   'auto' (پیش‌فرض) | 'borkowski' | 'astronomical' | 'arithmetic'
     *   [1403, 1408, ...]                      فهرست دقیق سال‌های کبیسه
     *   { mode:'auto', add:[1404], remove:[] } اصلاح موردی
     *   function (year) { return true/false; } قاعده‌ی دلخواه
     */
    setLeapRule: function (rule) {
      var label = setLeapRule(rule);
      Picker.instances.slice().forEach(function (pk) {
        pk._yearStartCacheDirty = true;
        pk.render();
      });
      return label;
    },
    /** قاعده‌ی کبیسه‌ی فعلی */
    getLeapRule: getLeapRule,
    /** فهرست سال‌های کبیسه در یک بازه */
    leapYears: function (from, to) { return jalaliLeapYears(from, to); },
    /** مقایسه‌ی دو قاعده و سال‌های متفاوت (برای اطمینان از دقت) */
    compareLeapRules: compareLeapRules,
    /** تاریخ نوروز یک سال میلادی بر اساس محاسبه‌ی نجومی */
    astronomicalNowruz: function (gregorianYear) {
      var jdn = nowruzJdnAstro(gregorianYear);
      var g = d2g(jdn);
      return { jdn: jdn, gy: g.gy, gm: g.gm, gd: g.gd };
    },

    utils: {
      toFaDigits: toFaDigits,
      jalaliLeapYears: jalaliLeapYears,
      jalaliYearLength: jalaliYearLength,
      isLeapJalaliYearBorkowski: isLeapJalaliYearBorkowski,
      weekdayIndex: weekdayIndex,
      normalizeWeekendDays: normalizeWeekendDays,
      weekendNames: WEEKDAY_NAMES,
      marchEquinoxJde: marchEquinoxJde,
      nowruzJdnAstronomical: nowruzJdnAstro,
      compareLeapRules: compareLeapRules,
      toEnDigits: toEnDigits,
      jdnFromGregorian: g2d,
      gregorianFromJdn: d2g,
      jdnFromJalali: j2d,
      jalaliFromJdn: d2j,
      isLeapJalaliYear: function (y) { return isLeapJalaliYearRule(y); },
      isLeapGregorian: isLeapGregorian,
      jalaliMonthLength: function (y, m) { return CALENDARS.jalali.monthLength(y, m); },
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
