/*!
 * ============================================================================
 *  Aria Date Picker  (ADP)
 * ----------------------------------------------------------------------------
 *  یک دیت‌پیکر کامل و تک‌فایلی برای تقویم شمسی (جلالی) و میلادی (گرگوری)
 *  A single-file, dependency-free Jalali (Persian) & Gregorian date picker.
 *
 *  @version   1.0.0
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

  var VERSION = '1.0.0';
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

  function isLeapJalaliYear(jy) {
    var r = jalCal(jy, false);
    return r.leap === 0;
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

  /** تبدیل تاریخ جلالی به شماره‌ی روز جولیَن */
  function j2d(jy, jm, jd) {
    var r = jalCal(jy, true);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - idiv(jm, 7) * (jm - 7) + jd - 1;
  }

  /** تبدیل شماره‌ی روز جولیَن به تاریخ جلالی */
  function d2j(jdn) {
    var gy = d2g(jdn).gy;
    var jy = gy - 621;
    var r = jalCal(jy, false);
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
      jdn: function (y, m, d) { return j2d(y, m, d); },
      fromJdn: function (jdn) { var o = d2j(jdn); return { y: o.jy, m: o.jm, d: o.jd }; },
      monthLength: jalaaliMonthLength,
      isLeap: isLeapJalaliYear,
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
