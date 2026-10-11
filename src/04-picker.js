
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
    persianDigits: 'auto',         // 'auto' | true | false
    dualDigits: false,             // نمایش عدد به هر دو شکل (۱۲ و 12)

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
    theme: 'light',                // 'light' | 'dark'
    size: 'md',                    // 'sm' | 'md' | 'lg'
    accent: null,                  // رنگ اصلی، مثلاً '#7c3aed'
    zIndex: null,

    /* --- حالت انتخاب --- */
    range: false,                  // حالت «از تاریخ تا تاریخ»
    selectMode: 'single',          // مترادف: 'single' | 'range'
    confirmMode: false,            // اعمال مقادیر فقط با دکمه‌ی تأیید
    closeOnSelect: true,           // بستن خودکار پس از انتخاب (در حالت تک‌تاریخی)
    showConfirmButton: null,       // پیش‌فرض: در حالت رنج true
    showCloseButton: false,
    monthsPerPanel: 1,             // تعداد ماه نمایش‌داده‌شده در هر پنل (1 یا 2)
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

    /* --- تعطیلات --- */
    holidays: null,                // آبجکت JSON تعطیلات
    holidayJson: null,             // آدرس فایل JSON تعطیلات
    weekends: null,                // {jalali:[5], gregorian:[0,6]}
    autoFetch: 'today',            // 'off' | 'today' | 'visible'
    countryCode: 'IR',
    holidayCache: true,
    holidayCacheKey: null,
    holidayTtl: 7 * 24 * 60 * 60 * 1000,
    holidayProviders: null,        // سرویس‌های سفارشی دریافت تعطیلات
    showHolidayList: true,         // فهرست مناسبت‌های ماه
    holidayListLimit: 6,
    showOnlineStatus: true,
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
    if (!o.weekends) o.weekends = { jalali: [5], gregorian: [0, 6] };
    if (o.size !== 'sm' && o.size !== 'lg') o.size = 'md';
    if (o.theme !== 'dark') o.theme = 'light';
    if (o.persianDigits !== true && o.persianDigits !== false) o.persianDigits = 'auto';
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
    this.prefix = this.options.prefix;
    this.uid = 'adp' + (++_uidSeq) + Math.floor(Math.random() * 1e4);
    injectStyles(this.prefix);

    this.calendars = resolveCalendars(this.options.calendar);
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
      time: null
    };
    this.calendars.forEach(function (c) { this.state.viewMode[c] = this.options.initialView; }, this);

    this.output = null;         // عنصر ورودی متنی (input کاربر یا input مخفی)
    this.fieldEl = null;        // فیلد اختصاصی (وقتی هدف div باشد)
    this.panelEl = null;
    this.overlayEl = null;
    this.hiddenEl = null;
    this._uidOpenToken = 0;

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

    usePersianDigits: function (cal) {
      if (this.options.persianDigits === true) return true;
      if (this.options.persianDigits === false) return false;
      return cal === 'jalali';
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

    _loadInitialHolidays: function () {
      var self = this;
      if (this.options.holidayJson) {
        this.holiday.loadFromUrl(this.options.holidayJson).then(function () { self.render(); });
      }
      if (this.options.autoFetch && this.options.autoFetch !== 'off') {
        this._ensureHolidays(this._yearsForView());
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

    /** درخواست دریافت تعطیلات (اگر لازم باشد) */
    _ensureHolidays: function (years, force) {
      var self = this;
      if (this.options.autoFetch === 'off' && !force) return Promise.resolve(null);
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
        (o.theme === 'dark' ? ' ' + cls('theme-dark') : '') +
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
      this.render();

      if (complete && !o.confirmMode) {
        this._commit(true);
        if (o.closeOnSelect && (!this._isRange() || o.rangeCloseOnSelect !== false)) this.close();
      }
      return this;
    },

    /** اعمال انتخاب‌های انجام‌شده (مخصوص حالت تأییدی) */
    applySelection: function () {
      if (this._isRange() && this.state.from && !this.state.to) this.state.to = this.state.from;
      if (this._isRange() && !this.state.from) return this;
      this._commit(true);
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

    /** پرش نمای یک تقویم بر اساس تعداد ماه */
    shift: function (cal, monthDelta, yearDelta) {
      var v = this.state.view[cal] || { y: CALENDARS[cal].minYear, m: 1 };
      var months = monthDelta + yearDelta * 12;
      var total = (v.y * 12 + (v.m - 1)) + months;
      var ny = Math.floor(total / 12);
      var nm = (total % 12) + 1;
      if (ny < CALENDARS[cal].minYear) { ny = CALENDARS[cal].minYear; nm = 1; }
      if (ny > CALENDARS[cal].maxYear) { ny = CALENDARS[cal].maxYear; nm = 12; }
      this.state.view[cal] = { y: ny, m: nm };
      if (isFn(this.options.onMonthChange)) this.options.onMonthChange({ calendar: cal, y: ny, m: nm }, this);
      this.render();
      this._maybeFetchForView();
      return this;
    },

    _maybeFetchForView: function () {
      if (this.options.autoFetch !== 'visible') return;
      this._ensureHolidays(this._yearsForView());
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
        out = t1 + o.rangeSeparator + (this.state.to ? this.fmt(this.state.to, this.state.to.calendar) : '');
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
