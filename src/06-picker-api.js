
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
    getHolidayManager: function () { return this.holiday; }
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
