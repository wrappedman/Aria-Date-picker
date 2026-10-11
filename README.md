# Aria Date Picker — دیت‌پیکر شمسی و میلادی (تک‌فایلی)

یک دیت‌پیکر کامل، سبک و بدون وابستگی برای تقویم **شمسی (جلالی)** و **میلادی (گرگوری)** که تمام ظاهر و منطق آن داخل **یک فایل جاوااسکریپت** قرار دارد.

```html
<input id="birthday" placeholder="تاریخ تولد">
<script src="aria-datepicker.js"></script>
<script>
  AriaDatePicker.create('#birthday', { calendar: 'jalali' });
</script>
```

> نسخه: `1.0.0` — مجوز: GPL-3.0 — حجم: ~۱۵۵ کیلوبایت (غیرفشرده) / ~۸۴ کیلوبایت (min)

---

## فهرست

- [ویژگی‌ها](#ویژگیها)
- [نصب و اجرای دمو](#نصب-و-اجرای-دمو)
- [نمونه‌های سریع](#نمونههای-سریع)
- [مرجع گزینه‌ها](#مرجع-گزینهها)
- [متدها و API](#متدها-و-api)
- [رویدادها](#رویدادها)
- [قالب فایل تعطیلات (JSON)](#قالب-فایل-تعطیلات-json)
- [دریافت تعطیلات از اینترنت](#دریافت-تعطیلات-از-اینترنت)
- [قالب‌بندی و تحلیل تاریخ](#قالببندی-و-تحلیل-تاریخ)
- [کلاس‌های CSS و جلوگیری از تداخل](#کلاسهای-css-و-جلوگیری-از-تداخل)
- [دسترسی‌پذیری و کیبورد](#دسترسیپذیری-و-کیبورد)
- [پشتیبانی مرورگرها](#پشتیبانی-مرورگرها)
- [توسعه و ساخت مجدد](#توسعه-و-ساخت-مجدد)

---

## ویژگی‌ها

| ویژگی | توضیح |
| --- | --- |
| تک‌فایلی | تنها یک فایل `aria-datepicker.js`؛ استایل‌ها هم داخل همان فایل تزریق می‌شوند |
| بدون وابستگی | جاوااسکریپت خالص (Vanilla)، بدون jQuery/React/Vue و بدون فایل CSS |
| دو تقویم | شمسی، میلادی یا نمایش هم‌زمان هر دو در یک پنل (`calendar: 'both'`) |
| حالت بازه | انتخاب «از تاریخ تا تاریخ» با پیش‌نمایش زنده‌ی بازه (`range: true`) |
| محدودسازی | انتخاب آزاد یا محدود به بازه/قبل از تاریخ/بعد از تاریخ + حداقل و حداکثر طول بازه |
| تعطیلات سفارشی | معرفی تعطیلات با فایل JSON یا آبجکت جاوااسکریپت (`holidayJson` / `holidays`) |
| تعطیلات آنلاین | دریافت خودکار (شامل تعطیلات قمری) و ذخیره در حافظه‌ی مرورگر + امکان دانلود فایل JSON |
| تاریخ پیش‌فرض | تعیین نمای شروع (`initialDate`) و مقدار پیش‌فرض کادر (`defaultDate`) |
| رنگ‌بندی تعطیلات | جمعه‌ها و تعطیلات رسمی به‌صورت پیش‌فرض قرمز |
| یونیک‌سازی کلاس‌ها | همه‌ی کلاس‌ها با پیشوند `adp-` و قابل تغییر با گزینه‌ی `prefix` |
| امکانات کامل | ناوبری ماه/سال، دکمه‌ی امروز/پاک کردن، تأیید، انتخاب ساعت، تم تاریک، حالت inline، مودال موبایل، پشتیبانی کیبورد و ARIA |

---

## نصب و اجرای دمو

۱. فایل‌ها را از حالت فشرده خارج کنید. ساختار پوشه:

```
├── aria-datepicker.js      ← تنها فایل لازم برای اجرا
├── aria-datepicker.min.js  ← نسخه‌ی فشرده (اختیاری)
├── index.html              ← صفحه‌ی دمو و راهنمای زنده
├── holidays-sample.json    ← نمونه‌ی فایل تعطیلات
└── README.md
```

۲. فایل را در پروژه‌ی خود قرار دهید و اسکریپت را وارد کنید:

```html
<script src="aria-datepicker.js"></script>
```

۳. برای دیدن دمو، صفحه را با یک وب‌سرور ساده سرو کنید (خواندن فایل JSON با `fetch` از `file://` مجاز نیست):

```bash
python -m http.server 8000     # یا: npx serve
# سپس: http://localhost:8000
```

نصب با CDN:

```html
<script src="aria-datepicker.js"></script>
<!-- یا از طریق jsDelivr پس از انتشار روی گیت‌هاب -->
```

---

## نمونه‌های سریع

### ۱) انتخاب تاریخ شمسی

```js
AriaDatePicker.create('#input', {
  calendar: 'jalali',        // 'jalali' | 'gregorian' | 'both'
  format: 'YYYY/MM/DD',
  initialDate: 'today',      // پنل روی امروز باز شود
  defaultDate: '1404/01/01'  // مقدار پیش‌فرض کادر
});
```

### ۲) انتخاب بازه (از تاریخ تا تاریخ)

```js
AriaDatePicker.create('#range', {
  calendar: 'jalali',
  range: true,
  monthsPerPanel: 2,
  closeOnSelect: false,
  onChange: function (v) {
    console.log(v.from.text, 'تا', v.to && v.to.text);
  }
});
```

### ۳) محدود کردن بازه‌ی انتخابی

```js
AriaDatePicker.create('#limited', {
  calendar: 'jalali',
  range: true,
  limits: {
    mode: 'range',          // 'free' | 'range' | 'before' | 'after'
    from: '1404/01/01',
    to:   '1404/06/31',
    minDays: 2,             // حداقل طول بازه
    maxDays: 20             // حداکثر طول بازه
  },
  disabledDates: ['1404/01/13'],   // روزهای مشخص غیرفعال
  disabledDays: [],                // مثلاً [5] برای تعطیل کردن همه‌ی جمعه‌ها
  blackout: function (date) {      // منطق دلخواه
    return date.jalali.m === 1 && date.jalali.d === 13;
  }
});
```

### ۴) نمایش هم‌زمان شمسی و میلادی

```js
AriaDatePicker.create('#both', {
  calendar: 'both',
  primaryCalendar: 'jalali',
  dualDisplay: true     // نمایش هر دو تقویم در کادر ورودی
});
```

### ۵) معرفی تعطیلات با فایل JSON

```js
AriaDatePicker.create('#holidays', {
  calendar: 'both',
  holidayJson: 'holidays-sample.json',   // یا: holidays: { jalali: { '1405/01/01': 'نوروز' } }
  showHolidayList: true,
  showExportButton: true
});
```

### ۶) دریافت تعطیلات از اینترنت

```js
var dp = AriaDatePicker.create('#online', {
  calendar: 'both',
  autoFetch: 'today',    // 'off' | 'today' | 'visible'
  countryCode: 'IR',
  onHolidaysLoaded: function (info) { console.log(info.source, info.added); }
});

dp.fetchHolidays();               // دریافت مجدد (Promise)
dp.downloadHolidays('holidays.json');  // ذخیره‌ی داده‌های دریافت‌شده در فایل JSON
```

### ۷) پنل همیشه‌باز (inline) و تم تاریک

```js
AriaDatePicker.create('#panel', {
  calendar: 'jalali',
  inline: true,
  theme: 'dark',
  accent: '#7c3aed',
  size: 'lg'
});
```

### ۸) انتخاب تاریخ و ساعت

```js
AriaDatePicker.create('#datetime', {
  calendar: 'jalali',
  timePicker: true,
  timeStep: 5,
  showSeconds: false,
  format: 'YYYY/MM/DD [ساعت] HH:mm'
});
```

### ۹) استفاده در فرم (فیلد مخفی میلادی)

```js
AriaDatePicker.create('#box', { calendar: 'jalali', name: 'trip_date' });
// <input type="hidden" name="trip_date" value="2026-10-11">
```

### ۱۰) راه‌اندازی خودکار با خصوصیت HTML

```html
<script src="aria-datepicker.js" data-auto-init="{}"></script>

<input data-aria-datepicker='{"calendar":"both","range":true}' type="text">
<div data-aria-datepicker="inline" data-calendar="jalali"></div>
```

---

## مرجع گزینه‌ها

### تقویم و نمایش

| گزینه | پیش‌فرض | توضیح |
| --- | --- | --- |
| `calendar` | `'jalali'` | `'jalali'`، `'gregorian'`، `'both'` یا آرایه‌ی تقویم‌ها |
| `primaryCalendar` | اولین تقویم | تقویم اصلی (مبنای مقدار خروجی) |
| `lang` | `'fa'` | زبان برچسب‌ها: `'fa'` یا `'en'` |
| `gregorianLang` | `lang` | زبان نام ماه‌های میلادی |
| `gregorianDir` | خودکار | جهت پنل میلادی: `'ltr'` یا `'rtl'` |
| `weekStart` | هر تقویم | ایندکس شروع هفته (0=یکشنبه … 6=شنبه) یا `{jalali:6, gregorian:1}` |
| `persianDigits` | `'auto'` | ارقام فارسی: `'auto'` (شمسی فارسی، میلادی لاتین)، `true`، `false` |
| `dualDigits` | `false` | نمایش هم‌زمان دو شکل عدد (۱۲ و 12) در هر خانه |
| `format` / `displayFormat` | `'YYYY/MM/DD'` | قالب نمایش تاریخ؛ می‌تواند به تفکیک تقویم باشد |
| `dualDisplay` | `false` | نمایش هر دو تقویم در کادر ورودی |
| `rangeSeparator` | `' تا '` | جداکننده‌ی دو تاریخ در حالت بازه |
| `initialDate` | `'today'` | نمای شروع پنل: `'today'`، `'now'`، `'selected'`، تاریخ یا `Date` |
| `defaultDate` / `defaultRange` | `null` | مقدار پیش‌فرض انتخاب‌شده |
| `initialView` | `'days'` | نمای شروع هر پنل: `'days'`، `'months'`، `'years'` |
| `placeholder` | خودکار | متن جای‌خالی کادر |
| `dir`, `theme`, `size`, `accent`, `zIndex`, `className`, `minWidth` | — | ظاهر و چیدمان |

### انتخاب و محدودیت

| گزینه | پیش‌فرض | توضیح |
| --- | --- | --- |
| `range` / `selectMode` | `false` | فعال‌سازی حالت «از تاریخ تا تاریخ» |
| `limits.mode` | `'free'` | `'free'` (آزاد)، `'range'` (بین دو تاریخ)، `'before'`، `'after'` |
| `limits.from` / `limits.to` / `limits.min` / `limits.max` | `null` | مرزهای مجاز |
| `limits.minDays` / `limits.maxDays` | `null` | حداقل/حداکثر طول بازه (در حالت رنج) |
| `limits.allowWeekends` / `limits.allowHolidays` | `true` | اجازه‌ی انتخاب در آخر هفته/تعطیلات |
| `disableWeekends` | `false` | غیرقابل انتخاب شدن روزهای تعطیل هفتگی |
| `disableHolidays` | `false` | غیرقابل انتخاب شدن روزهای تعطیل رسمی |
| `disabledDays` | `null` | آرایه‌ی ایندکس روزهای هفته، مثل `[5]` |
| `disabledDates` | `null` | آرایه‌ی تاریخ‌ها، مثل `['1405/01/13']` |
| `disabledRanges` | `null` | آرایه‌ی بازه‌های غیرفعال `[{from, to}]` |
| `blackout` | `null` | تابع `(date) => true/false` برای منطق دلخواه |
| `confirmMode` / `autoApply` | `false` | ثبت مقدار فقط با دکمه‌ی «تأیید» |
| `closeOnSelect` / `rangeCloseOnSelect` | `true` | بستن خودکار پنل پس از انتخاب |
| `monthsPerPanel` | `1` | تعداد ماه نمایش‌داده‌شده در هر پنل (۱ تا ۳) |
| `showOutsideDays` | `true` | نمایش روزهای ماه‌های مجاور |
| `highlightWeekends` | `true` | رنگ قرمز برای جمعه‌ها |
| `holidayStyle` | `'red'` | `'red'`، `'dot'`، `'both'`، `'none'` |
| `showTodayButton` / `showClearButton` / `showConfirmButton` / `showCloseButton` | خودکار | دکمه‌های پاصفحه |

### تعطیلات

| گزینه | پیش‌فرض | توضیح |
| --- | --- | --- |
| `holidays` | `null` | آبجکت JSON تعطیلات |
| `holidayJson` | `null` | آدرس فایل JSON تعطیلات |
| `weekends` | `{jalali:[5], gregorian:[0,6]}` | روزهای تعطیل هفتگی |
| `autoFetch` | `'today'` | دریافت خودکار از اینترنت: `'off'`، `'today'`، `'visible'` |
| `countryCode` | `'IR'` | کد کشور برای سرویس‌های میلادی |
| `holidayCache` / `holidayCacheKey` / `holidayTtl` | `true` / خودکار / ۷ روز | کش محلی (localStorage) |
| `holidayProviders` | `null` | سرویس‌های سفارشی دریافت تعطیلات |
| `showHolidayList` | `true` | نمایش فهرست مناسبت‌های ماه زیر تقویم |
| `holidayListLimit` | `6` | حداکثر تعداد مناسبت در فهرست |
| `showOnlineStatus` | `true` | نمایش وضعیت برخط/آفلاین |
| `showExportButton` | `false` | دکمه‌ی `JSON` برای دانلود فایل تعطیلات |
| `holidayJsonName` | `'holidays.json'` | نام فایل خروجی |

### چیدمان و دسترسی‌پذیری

| گزینه | پیش‌فرض | توضیح |
| --- | --- | --- |
| `inline` | `false` | نمایش همیشه‌باز بدون پاپ‌آپ |
| `input` | `null` | عنصر ورودی جداگانه (وقتی هدف یک `div` است) |
| `name` | `null` | نام فیلد مخفی برای ارسال در فرم (قالب `YYYY-MM-DD` میلادی) |
| `editable` / `readOnly` | `false` | امکان تایپ دستی در ورودی |
| `mobileModal` / `mobileBreakpoint` | `true` / `560` | نمایش مودال در صفحه‌های کوچک |
| `label` / `ariaLabelledby` | `null` | برچسب دسترسی‌پذیری |
| `prefix` | `'adp-'` | پیشوند کلاس‌های CSS |

---

## متدها و API

```js
var dp = AriaDatePicker.create('#el', { calendar: 'jalali', range: true });

dp.open();  dp.close();  dp.toggle();  dp.isOpen();
dp.getDate();             // تاریخ انتخاب‌شده + معادل هر دو تقویم + وضعیت تعطیلات
dp.getRange();            // { from, to, text }
dp.getValue();            // { calendar, range, text, from, to, jalali, gregorian }
dp.getText();             // متن نمایش‌داده‌شده در کادر
dp.getGregorianDate();    // آبجکت Date جاوااسکریپت
dp.getJalali(); dp.getGregorian(); dp.getISO();
dp.hasValue();
dp.setDate('1405/01/01'); dp.setRange('1405/01/01', '1405/01/13');
dp.clear(); dp.goToday(); dp.applySelection();
dp.setLimits({ mode: 'range', from: '1405/01/01', to: '1405/06/31' }); dp.getLimits();
dp.setCalendar('gregorian'); dp.getCalendar(); dp.getCalendars();
dp.setOptions({ theme: 'dark' }); dp.setViewDate('1405/07/01'); dp.getViewDate();
dp.setDisabled(true); dp.refresh();
dp.getHolidays(1405, 'jalali');  dp.isHoliday();  dp.getHolidayTitle();
dp.addHolidays({...}); dp.loadHolidays('holidays.json'); dp.syncHolidays(true);
dp.exportHolidays(); dp.downloadHolidays('holidays.json'); dp.clearHolidays();
dp.destroy();
```

توابع مستقل:

```js
AriaDatePicker.version;                       // '1.0.0'
AriaDatePicker.instances;                     // همه‌ی نمونه‌های فعال
AriaDatePicker.get(element);                  // یافتن نمونه از روی عنصر
AriaDatePicker.autoInit(document, options);   // راه‌اندازی خودکار
AriaDatePicker.destroyAll();
AriaDatePicker.format('1405/01/01', 'dddd D MMMM YYYY', 'jalali');   // «جمعه ۱ فروردین ۱۴۰۵»
AriaDatePicker.convert('1405/01/01', 'jalali', 'gregorian');         // { y: 2026, m: 3, d: 21 }
AriaDatePicker.parse('۱۴۰۵/۰۱/۰۱');                                  // { calendar, y, m, d, jdn }
AriaDatePicker.toDate('1405/01/01', 'jalali');                       // Date
AriaDatePicker.registerLanguage('ar', { today: 'اليوم', ... });
AriaDatePicker.addProvider('jalali', { name, url, parse });
AriaDatePicker.getCSS();                     // رشته‌ی CSS کامل (برای تزریق دستی)
AriaDatePicker.injectStyles('my-prefix-');
AriaDatePicker.utils;                        // توابع تبدیل تقویم، ارقام فارسی و ...
```

---

## رویدادها

```js
AriaDatePicker.create('#el', {
  onChange: function (value, picker) {},   // تغییر مقدار
  onSelect: function (date, picker) {},    // کلیک روی یک روز
  onOpen: function (picker) {},
  onClose: function (picker) {},
  onMonthChange: function (info, picker) {},
  onHolidaysLoaded: function (info, picker) {},
  onError: function (err, picker) {},
  onLog: function (message, picker) {}
});
```

رویدادهای DOM روی عنصر هدف:

```js
document.querySelector('#el').addEventListener('adp:change', function (e) {
  console.log(e.detail);   // { calendar, range, text, from, to, jalali, gregorian }
});
// همچنین: adp:open و adp:close
```

---

## قالب فایل تعطیلات (JSON)

پنج قالب زیر پشتیبانی می‌شود (تاریخ‌ها با `/` یا `-` و ارقام فارسی یا لاتین):

```json
{
  "weekends": { "jalali": [5], "gregorian": [0, 6] },
  "jalali": {
    "1405/01/01": "جشن نوروز",
    "1405/01/13": { "title": "روز طبیعت", "type": "holiday" }
  },
  "gregorian": { "2026-12-25": "کریسمس" }
}
```

```json
{ "jalali": { "1405": { "01-01": "نوروز" } } }
```

```json
{ "holidays": [ { "date": "1405/01/01", "calendar": "jalali", "title": "نوروز", "type": "holiday" } ] }
```

```json
{ "jalali": { "1405/01/01": { "title": "نوروز", "is_holiday": true } } }
```

```json
{ "events": [ { "date": "1405/07/01", "title": "مناسبت" } ] }
```

نکته‌ها:

- `type: "holiday"` (یا `public`) روز را قرمز می‌کند؛ `type: "event"` فقط به فهرست مناسبت‌ها اضافه می‌شود.
- `weekends` روزهای تعطیل هفتگی را تعیین می‌کند (0=یکشنبه … 6=شنبه).
- خروجی `dp.exportHolidays()` و `dp.downloadHolidays()` دقیقاً در همین قالب است؛ بنابراین می‌توانید داده‌ی دریافت‌شده از اینترنت را ذخیره و بعداً به‌عنوان فایل محلی استفاده کنید.

---

## دریافت تعطیلات از اینترنت

- سرویس‌های پیش‌فرض تقویم شمسی: `holidayapi.ir`، `persiancalapi.ir`، `api.keybit.ir`
- سرویس‌های پیش‌فرض تقویم میلادی: `holidayapi.ir`، `date.nager.at`
- اگر سرویس اول پاسخ ندهد، سرویس بعدی در زنجیره امتحان می‌شود؛ در صورت آفلاین بودن، داده‌ی ذخیره‌شده‌ی قبلی در `localStorage` استفاده می‌شود.
- داده‌ی دریافت‌شده در کلید `aria-datepicker-holidays-cache-v1-adp-` ذخیره و طبق `holidayTtl` (پیش‌فرض ۷ روز) تازه‌سازی می‌شود.
- مجوز CORS سرویس‌ها بیرون از کنترل کتابخانه است؛ در صورت مسدود بودن، کافی است سرویس خودتان را اضافه کنید:

```js
AriaDatePicker.addProvider('jalali', {
  name: 'my-api',
  url: function (year, country, calendar) { return 'https://api.example.com/holidays/' + year; },
  parse: function (json, year) {
    return json.items.map(function (i) {
      return { date: i.date, title: i.title, type: i.isHoliday ? 'holiday' : 'event' };
    });
  }
});
```

---

## قالب‌بندی و تحلیل تاریخ

توکن‌های پشتیبانی‌شده در گزینه‌ی `format` و `AriaDatePicker.format`:

| توکن | خروجی | توکن | خروجی |
| --- | --- | --- | --- |
| `YYYY` | ۱۴۰۵ | `DD` | ۰۱ |
| `YY` | ۰۵ | `D` | ۱ |
| `MMMM` | فروردین / January | `dddd` | جمعه / Friday |
| `MMM` | فروردین / Jan | `ddd` | ج / Fri |
| `MM` | ۰۱ | `HH:mm:ss` | ۱۴:۳۰:۰۰ |
| `M` | ۱ | `A` / `a` | ب.ظ / بعد از ظهر |
| `[متن]` | متن ثابت | `Z` | نادیده گرفته می‌شود |

نمونه:

```js
AriaDatePicker.format('1405/01/01', '[امروز] dddd D MMMM YYYY');  // امروز جمعه ۱ فروردین ۱۴۰۵
```

---

## کلاس‌های CSS و جلوگیری از تداخل

- همه‌ی کلاس‌ها با پیشوند `adp-` ساخته می‌شوند: `.adp-wrap`، `.adp-popup`، `.adp-cal`، `.adp-day`، `.adp-btn`، `.adp-inline` و ...
- متغیرهای رنگ فقط با پیشوند `--adp-` تعریف شده‌اند: `--adp-accent`، `--adp-holiday`، `--adp-bg`، `--adp-fg` و ...
- کتابخانه هیچ استایل سراسری (body، input، button و ...) تعریف نمی‌کند و CSS آن داخل `<style id="aria-datepicker-styles-v1">` تزریق می‌شود.
- برای اختصاصی‌سازی کامل، پیشوند را تغییر دهید:

```js
AriaDatePicker.injectStyles('myapp-picker-');
AriaDatePicker.create('#el', { prefix: 'myapp-picker-' });
```

تغییر رنگ‌ها از بیرون:

```css
/* روی پنل یک دیت‌پیکر خاص */
#el .adp-popup { --adp-accent: #7c3aed; --adp-holiday: #d6336c; }
```

---

## دسترسی‌پذیری و کیبورد

| کلید | عملکرد |
| --- | --- |
| `Enter` / `Space` / `↓` | باز کردن پنل، انتخاب روز |
| `←` `→` `↑` `↓` | حرکت بین روزها (متناسب با جهت تقویم) |
| `Page Up` / `Page Down` | ماه قبل / بعد |
| `Shift + Page Up/Down` | سال قبل / بعد |
| `Home` / `End` | ابتدا و انتهای هفته |
| `Esc` | بستن پنل (در حالت تأییدی: بازگشت به مقدار قبلی) |
| `Tab` | حرکت بین دکمه‌ها و فیلدها |

پنل با `role="dialog"`، شبکه‌ی روزها با `role="grid"`/`gridcell`، هر روز با `aria-label` فارسی
(«جمعه ۱ فروردین ۱۴۰۵ — جشن نوروز») و `aria-selected` مشخص شده است.

---

## پشتیبانی مرورگرها

- Chrome/Edge 79+، Firefox 70+، Safari 12+، Opera 66+ و همه‌ی مرورگرهای موبایل مدرن.
- از `fetch`، `Promise`، `localStorage` و CSS Variables استفاده می‌شود (همه از سال ‎۲۰۱۹ پشتیبانی عمومی دارند).
- در مرورگرهای بسیار قدیمی (مانند IE11) که از Template Literal پشتیبانی نمی‌کنند، از نسخه‌ی `aria-datepicker.js` استفاده کنید؛ منطق کتابخانه با ES5 نوشته شده است.

---

## توسعه و ساخت مجدد

سورس پروژه برای نگهداری راحت‌تر به بخش‌های شماره‌دار در پوشه‌ی `src/` تقسیم شده و با یک اسکریپت ساده به فایل نهایی می‌چسبد:

```
src/01-core.js        موتور تقویم جلالی/میلادی، تبدیل JDN، قالب‌بندی و تحلیل تاریخ
src/02-holidays.js    مدیر تعطیلات (JSON، کش، سرویس‌های اینترنتی، خروجی فایل)
src/03-styles.js      تمام CSS به صورت رشته (تزریق خودکار با پیشوند adp-)
src/04-picker.js      کلاس اصلی: DOM، مقدار، محدودیت‌ها، رویدادها، موقعیت‌دهی
src/05-render.js      رندر پنل، ماه/سال، ساعت، فهرست مناسبت‌ها، کیبورد
src/06-picker-api.js  متدهای عمومی (get/set/تعطیلات/تنظیمات)
src/07-api.js         API عمومی، autoInit، تابع‌های کمکی و UMD
```

دستورها:

```bash
npm run build     # ساخت aria-datepicker.js و dist/aria-datepicker.min.js
npm test          # ۹۴ تست موتور تقویم، انتخاب، محدودیت‌ها و تعطیلات + ۲۴ تست صفحه‌ی دمو (jsdom)
```

> خروجی نهایی همان `aria-datepicker.js` است؛ می‌توانید فایل ساخته‌شده را مستقیم در پروژه‌ی خود استفاده کنید.

---

## مجوز

GPL-3.0 — استفاده، تغییر و انتشار آزاد است؛ ذکر منبع الزامی است.
