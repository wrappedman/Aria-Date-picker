
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
