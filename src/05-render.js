
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

    /** تعیین تاریخ انتخاب‌شده */
    setDate: function (input, silent) {
      var d = this.toDateObj(input, isStr(input) && guessCalendar(input) ? null : this.primary);
      if (!d) return this;
      if (this._isRange()) {
        this.state.to = null;
      }
      this.state.from = d;
      this.state.view[d.calendar] = { y: d.y, m: d.m };
      if (!silent) { this.render(); this._commit(true); }
      return this;
    },

    /** تعیین بازه‌ی انتخابی */
    setRange: function (from, to, silent) {
      if (isStr(from) && to == null) {
        var parts = String(from).split(/\s*(?:,|;|\u060C|—|–|\s+تا\s+|\s+to\s+|\s+-\s+|\s*\.\.\s*)\s*/i);
        if (parts.length >= 2) { to = parts[1]; from = parts[0]; }
      }
      var f = this.toDateObj(from, isStr(from) && guessCalendar(from) ? null : this.primary);
      var t = to == null ? null : this.toDateObj(to, isStr(to) && guessCalendar(to) ? null : this.primary);
      if (!f && !t) return this;
      if (!this._isRange()) this.options.range = true;
      this.state.from = f;
      this.state.to = t;
      if (f) this.state.view[f.calendar] = { y: f.y, m: f.m };
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
      if (patch && patch.accent) this.panelEl.style.setProperty('--' + this.prefix + 'accent', patch.accent);
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

      var label = formatDate({ calendar: cal, y: y, m: m, d: d, jdn: jdn }, 'dddd D MMMM YYYY', { lang: this.panelLang(cal) });
      if (title) label += ' — ' + title;
      if (disabled) label += ' (' + (this.calLang === 'en' ? 'unavailable' : 'غیرقابل انتخاب') + ')';

      var html = '<button type="button" class="' + className + '" data-day="' + jdn + '" role="gridcell"' +
        ' tabindex="' + (this.state.focusJdn === jdn ? '0' : '-1') + '"' +
        ' aria-selected="' + ((isStart || isEnd) ? 'true' : 'false') + '"' +
        (inRange ? ' aria-inrange="true"' : '') +
        ' aria-label="' + escapeHtml(label) + '"' +
        (title ? ' title="' + escapeHtml(title) + '"' : '') +
        (disabled ? ' disabled aria-disabled="true"' : '') + '>';
      html += '<span class="' + cls('day-num') + '">' + this.num(d, cal) + '</span>';
      if (o.dualDigits) {
        html += '<span class="' + cls('day-sub') + '">' + (cal === 'jalali' ? d : toFaDigits(d)) + '</span>';
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
          var jdn = +dayBtn.getAttribute('data-day');
          self._selectByJdn(jdn);
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
          self._selectByJdn(+holItem.getAttribute('data-holiday-item'));
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

    /** انتخاب روز از روی JDN */
    _selectByJdn: function (jdn) {
      var cal = this.state.active || this.primary;
      var p = CALENDARS[cal].fromJdn(jdn);
      var dobj = { calendar: cal, y: p.y, m: p.m, d: p.d, jdn: jdn, hh: this.state.time ? this.state.time.hh : 0, mm: this.state.time ? this.state.time.mm : 0, ss: this.state.time ? this.state.time.ss : 0 };
      this.selectDate(dobj);
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
      this.focusJdn(cur + delta);
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
      if (needRender) this.render();
      var el = this.$('[data-day="' + jdn + '"]');
      if (el) {
        this.$$('[data-day]').forEach(function (d) { d.setAttribute('tabindex', '-1'); });
        el.setAttribute('tabindex', '0');
        try { el.focus({ preventScroll: false }); } catch (err) { el.focus(); }
      }
      return this;
    }
  });
