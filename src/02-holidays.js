
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
