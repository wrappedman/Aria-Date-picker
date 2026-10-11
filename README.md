# Aria Date Picker — دیت‌پیکر شمسی و میلادی (تک‌فایلی)

یک دیت‌پیکر کامل، سبک و بدون وابستگی برای تقویم **شمسی (جلالی)** و **میلادی (گرگوری)** که تمام ظاهر و منطق آن داخل **یک فایل جاوااسکریپت** قرار دارد.

```html
<input id="birthday" placeholder="تاریخ تولد">
<script src="aria-datepicker.js"></script>
<script>
  AriaDatePicker.create('#birthday', { calendar: 'jalali' });
</script>
```

> نسخه: `1.2.0` — مجوز: GPL-3.0 — حجم: ~۱۶۵ کیلوبایت (غیرفشرده) / ~۸۸ کیلوبایت (min)

---

## فهرست

- [ویژگی‌ها](#ویژگیها)
- [نصب و اجرای دمو](#نصب-و-اجرای-دمو)
- [نمونه‌های سریع](#نمونههای-سریع)
- [ارقام فارسی/لاتین](#ارقام-فارسیلاتین)
- [رویداد شخصی با انتخاب روز](#رویداد-شخصی-با-انتخاب-روز)
- [بسته‌شدن یا بازماندن پنجره](#بستهشدن-یا-بازماندن-پنجره)
- [سوییچ تقویم با یک دکمه](#سوییچ-تقویم-با-یک-دکمه)
- [کبیسه‌ها: قاعده‌ی دقیق و قابل تنظیم](#کبیسهها-قاعدهی-دقیق-و-قابل-تنظیم)
- [آخر هفته: تعیین روز(های) دلخواه](#آخر-هفته-تعیین-روزهای-دلخواه)
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
| تعطیلات سفارشی | معرفی تعطیلات با فایل JSON یا آبجکت جاوااسکریپت (`holidayJson` / `holidays`) — بدون هیچ دانلود خودکار |
| دریافت اختیاری | `fetchHolidays()` برای دریافت دستی از اینترنت (اختیاری) + کش مرورگر + دانلود فایل JSON |
| ارقام قابل تنظیم | ارقام فارسی/لاتین جداگانه برای تقویم شمسی و میلادی (`persianDigits`) |
| رویداد شخصی روزها | اجرای تابع دلخواه با ورودی‌های مشخص، هنگام انتخاب یک روز (`dayEvents`) |
| کنترل بسته‌شدن | تعیین بسته‌شدن یا بازماندن پنجره پس از انتخاب (`closeOnSelect` / `closeOnSelectRange`) |
| سوییچ تقویم | دکمه‌ی سوییچ برای نمایش هم‌زمان میلادی یا تعویض کامل تقویم (`switchToCalendar` / `switchMode`) |
| تاریخ پیش‌فرض | تعیین نمای شروع (`initialDate`) و مقدار پیش‌فرض کادر (`defaultDate`) |
| کبیسه‌ی دقیق و قابل تنظیم | قاعده‌ی کبیسه‌ی صریح و قابل تغییر: بورکفسکی (پیش‌فرض)، نجومی (اعتدال بهاری)، حسابی ۳۳ساله، فهرست دستی یا تابع دلخواه (`leapRule`) + ابزار سنجش دقت (`compareLeapRules`) |
| آخر هفته‌ی قابل تنظیم | تعیین روز(های) آخر هفته با نام فارسی/انگلیسی یا شماره‌ی روز، تفکیکی برای هر تقویم (`weekend` / `setWeekend`) |
| رنگ‌بندی تعطیلات | جمعه‌ها و تعطیلات رسمی قرمز — و حتی پس از انتخاب هم قرمز می‌مانند |
| هماهنگی پنل‌ها | با انتخاب یک روز، پنل تقویم دیگر روی همان تاریخ می‌رود (`syncViews`) |
| نگهبان روزهای غیرفعال | روزهای غیرفعال با ماوس، کیبورد و API هم انتخاب نمی‌شوند (`strictLimits`) |
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

### ۶) دریافت دستی تعطیلات از اینترنت (اختیاری)

```js
var dp = AriaDatePicker.create('#online', {
  calendar: 'both',
  holidayJson: 'holidays-sample.json',   // منبع پیش‌فرض: فایل محلی (بدون درخواست شبکه)
  countryCode: 'IR',
  onHolidaysLoaded: function (info) { console.log(info.source, info.added); }
});

// فقط وقتی خودتان بخواهید:
dp.fetchHolidays();                    // دریافت از اینترنت (Promise)
dp.syncHolidays(true);                 // مترادف با اجبار به تازه‌سازی
dp.downloadHolidays('holidays.json');  // ذخیره‌ی نتیجه در فایل JSON
dp.clearHolidays();                    // پاک کردن کش
```

### ۶.۱) ارقام فارسی یا لاتین (به تفکیک هر تقویم)

```js
AriaDatePicker.create('#input', {
  calendar: 'both',
  persianDigits: 'auto',                                // پیش‌فرض: شمسی فارسی، میلادی لاتین
  // persianDigits: true,                               // همه‌ی ارقام فارسی
  // persianDigits: false,                              // همه‌ی ارقام لاتین
  // persianDigits: { jalali: true, gregorian: false }, // تنظیم جداگانه‌ی هر تقویم
  dualDigits: true                                      // نمایش هر دو شکل عدد در خانه‌ها
});

// تغییر در زمان اجرا
dp.setOptions({ persianDigits: { jalali: false, gregorian: true } });
```

### ۶.۲) رویداد شخصی با انتخاب روز

```js
var dp = AriaDatePicker.create('#events', {
  calendar: 'jalali',
  closeOnSelect: false,             // پنل باز می‌ماند تا چند رویداد امتحان شود
  dayEvents: [
    // الف) روزهای مشخص + ورودی پیش‌فرض (info, picker)
    {
      days: ['1405/01/05', '1405/01/07'],
      title: 'جلسه‌ی کاری',
      handler: function (info, picker) {
        alert('جلسه در ' + info.text);            // info شامل تاریخ شمسی، میلادی، تعطیلات و ...
      }
    },

    // ب) ورودی‌های دلخواه کاربر (args)
    {
      days: ['1405/02/01'],
      title: 'ارسال پیامک',
      args: ['$date', 'sms', 100],
      handler: function (dateObj, type, price) {   // ورودی‌ها دقیقاً همان‌هایی هستند که تعیین کرده‌اید
        console.log(type, dateObj.gregorian.text, price);
      }
    },

    // ج) همه‌ی جمعه‌ها، فقط یک‌بار اجرا
    { weekdays: [5], title: 'تعطیل هفتگی', once: true, handler: function (info) { /* ... */ } },

    // د) یک بازه‌ی تاریخ + کلاس CSS دلخواه
    { range: ['1405/03/01', '1405/03/10'], title: 'سفر', className: 'my-trip',
      handler: function (info) { /* ... */ } },

    // ه) رویداد مبتنی بر طول بازه‌ی انتخابی
    { rangeDays: { min: 3, max: 7 }, title: 'بازه‌ی کوتاه',
      handler: function (info) { alert(info.range.lengthDays + ' روز'); } },

    // و) غیرقابل انتخاب کردن یک روز
    { days: ['1405/01/13'], disabled: true, title: 'تعطیل رسمی' }
  ],
  onDayEvent: function (info, picker) { console.log('رویداد اجرا شد:', info.event.id); }
});

dp.setDayEvents({...});     dp.addDayEvent({...});    dp.removeDayEvent('dayEvent1');
dp.getDayEvents();          dp.triggerDayEvents('1405/01/05');   dp.getLastDayEvent();
```

ورودی‌های `<code>info</code>`: `date` (شیء کامل تاریخ شامل `jalali`/`gregorian`)، `jdn`، `calendar`،
`text`، `jalali`، `gregorian`، `range` (در حالت بازه: `from`/`to`/`lengthDays`)، `committed`،
`isHoliday`، `holidayTitle`، `event` (شناسه و عنوان رویداد) و `picker`.

جای‌نگهدارهای `args`: `'$date'`, `'$text'`, `'$range'`, `'$jdn'`, `'$jalali'`, `'$gregorian'`,
`'$info'`, `'$picker'`, `'$target'`, `'$event'` — هر مقدار ثابت دیگری عیناً به تابع پاس داده می‌شود.
اگر `args` تعیین نشود، تابع به شکل `handler(info, picker)` و با `this` برابر نمونه‌ی دیت‌پیکر صدا زده می‌شود.

### ۶.۳) بسته‌شدن یا بازماندن پنجره پس از انتخاب

```js
AriaDatePicker.create('#input', {
  calendar: 'jalali',
  closeOnSelect: false,        // پنل باز می‌ماند (برای انتخاب‌های پی‌درپی)
  // closeOnSelect: true,      // پیش‌فرض: پس از انتخاب، پنل بسته می‌شود

  range: true,
  closeOnSelectRange: false    // در حالت بازه، پس از انتخاب تاریخ دوم هم باز بماند
});
```

### ۶.۴) سوییچ تقویم با یک دکمه

```js
AriaDatePicker.create('#switch', {
  calendar: 'jalali',
  switchToCalendar: 'gregorian',   // دکمه‌ی سوییچ بالای پنل
  switchMode: 'both',              // 'both' = نمایش هم‌زمان | 'swap' = تعویض کامل تقویم
  calendarSwitch: true,            // نمایش دکمه‌ها (پیش‌فرض: در صورت وجود دو تقویم، خودکار)
  onCalendarChange: function (info) { console.log(info.calendars, info.primary); }
});

dp.switchCalendar('gregorian');   // یک کلیک: افزودن/حذف یا تعویض
dp.showGregorian();  dp.hideGregorian();  dp.showBothCalendars();
dp.setSwitchMode('swap');         // تغییر حالت در زمان اجرا
dp.getPrimaryCalendar();  dp.setPrimaryCalendar('gregorian');
dp.getAvailableCalendars();  dp.isCalendarActive('gregorian');
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
| `persianDigits` | `'auto'` | ارقام: `'auto'` (شمسی فارسی، میلادی لاتین)، `true` (همه فارسی)، `false` (همه لاتین) یا `{ jalali: true, gregorian: false }` |
| `calendarSwitch` | خودکار | نمایش دکمه‌ی سوییچ تقویم: `true`/`false` |
| `switchToCalendar` | `null` | تقویم دیگری که با دکمه در دسترس قرار می‌گیرد (مثلاً `'gregorian'`) |
| `switchMode` | `'both'` | `'both'` = نمایش هم‌زمان در کنار هم، `'swap'` = تعویض کامل تقویم |
| `dualDigits` | `false` | نمایش هم‌زمان دو شکل عدد (۱۲ و 12) در هر خانه |
| `format` / `displayFormat` | `'YYYY/MM/DD'` | قالب نمایش تاریخ؛ می‌تواند به تفکیک تقویم باشد |
| `dualDisplay` | `false` | نمایش هر دو تقویم در کادر ورودی |
| `rangeSeparator` | `' تا '` | جداکننده‌ی دو تاریخ در حالت بازه |
| `initialDate` | `'today'` | نمای شروع پنل: `'today'`، `'now'`، `'selected'`، تاریخ یا `Date` |
| `defaultDate` / `defaultRange` | `null` | مقدار پیش‌فرض انتخاب‌شده |
| `initialView` | `'days'` | نمای شروع هر پنل: `'days'`، `'months'`، `'years'` |
| `placeholder` | خودکار | متن جای‌خالی کادر |
| `theme` | `'light'` | `'light'`، `'dark'` یا `'auto'` (پیروی از `prefers-color-scheme`) |
| `dualDigits` | `false` | `true` = عدد روز معادل تقویم دیگر زیر عدد اصلی؛ `'same'` = همان عدد با ارقام دیگر |
| `dir`, `size`, `accent`, `zIndex`, `className`, `minWidth` | — | ظاهر و چیدمان |

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
| `closeOnSelect` | `true` | بستن پنل پس از انتخاب تاریخ (در حالت تک‌تاریخی) |
| `closeOnSelectRange` | `closeOnSelect` | بستن پنل پس از انتخاب تاریخ دوم در حالت بازه |
| `dayEvents` | `null` | رویدادهای شخصی روزها (شیء یا آرایه) |
| `onDayEvent` | `null` | تابع سراسری که پس از هر رویداد شخصی اجرا می‌شود |
| `monthsPerPanel` | `1` | تعداد ماه نمایش‌داده‌شده در هر پنل (۱ تا ۳) |
| `showOutsideDays` | `true` | نمایش روزهای ماه‌های مجاور |
| `highlightWeekends` | `true` | رنگ قرمز برای جمعه‌ها |
| `holidayStyle` | `'red'` | `'red'`، `'dot'`، `'both'`، `'none'` |
| `holidaySelectedStyle` | `'red'` | رنگ روز تعطیل/جمعه‌ی انتخاب‌شده: `'red'` (قرمز) یا `'accent'` (آبی) |
| `syncViews` | `true` | هماهنگی ماهِ پنل‌ها با تاریخ انتخاب‌شده و با ناوبری (`false` = مستقل) |
| `leapRule` | `'auto'` | قاعده‌ی سال‌های کبیسه: `'auto'`، `'borkowski'`، `'astronomical'`، `'arithmetic'`، فهرست سال‌ها، تابع دلخواه یا `{mode, add, remove}` |
| `strictLimits` | `true` | تاریخ‌های غیرفعال حتی با `setDate`/`setRange` هم تنظیم نشوند |
| `showTodayButton` / `showClearButton` / `showConfirmButton` / `showCloseButton` | خودکار | دکمه‌های پاصفحه |

### تعطیلات

| گزینه | پیش‌فرض | توضیح |
| --- | --- | --- |
| `holidays` | `null` | آبجکت JSON تعطیلات |
| `holidayJson` | `null` | آدرس فایل JSON تعطیلات (منبع پیش‌فرض و آفلاین) |
| `weekend` | `null` | روز(های) آخر هفته: `'جمعه'`، `'friday'`، `5`، `['پنجشنبه','جمعه']` یا `{jalali:[...], gregorian:[...]}` |
| `weekends` | `{jalali:[5], gregorian:[0,6]}` | همان تنظیم به تفکیک تقویم (0=یکشنبه … 6=شنبه) |
| `disableWeekends` | `false` | غیرقابل انتخاب شدن روزهای آخر هفته |
| `countryCode` | `'IR'` | کد کشور برای سرویس‌های میلادی |
| `holidayCache` / `holidayCacheKey` / `holidayTtl` | `true` / خودکار / ۷ روز | کش محلی (localStorage) |
| `holidayProviders` | `null` | سرویس‌های سفارشی دریافت تعطیلات |
| `showHolidayList` | `true` | نمایش فهرست مناسبت‌های ماه زیر تقویم |
| `holidayListLimit` | `6` | حداکثر تعداد مناسبت در فهرست |
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
dp.setOptions({ theme: 'dark' }); dp.setTheme('auto'); dp.getTheme();
dp.setDualDigits(true); dp.setSyncViews(false);
dp.setDate('1405/01/01', false, true);   // force = نقض محدودیت‌ها
dp.setRange('1405/01/01', '1405/01/13', false, true);
dp.setViewDate('1405/07/01'); dp.getViewDate();
dp.setDisabled(true); dp.refresh();
dp.getHolidays(1405, 'jalali');  dp.isHoliday();  dp.getHolidayTitle();
dp.setDayEvents({...}); dp.addDayEvent({...}); dp.removeDayEvent('dayEvent1');
dp.getDayEvents(); dp.triggerDayEvents('1405/01/05'); dp.getLastDayEvent();
dp.switchCalendar('gregorian'); dp.showGregorian(); dp.hideGregorian(); dp.showBothCalendars();
dp.setLeapRule('astronomical'); dp.getLeapRule(); dp.getLeapYears(1390, 1420); dp.isLeapYear(1403); dp.getYearLength(1403);
dp.setWeekend(['پنجشنبه','جمعه']); dp.getWeekend(); dp.getWeekendNames(); dp.getWeekendNamesAll(); dp.isWeekend('1405/01/07');
dp.setSwitchMode('swap'); dp.getPrimaryCalendar(); dp.setPrimaryCalendar('gregorian');
dp.getAvailableCalendars(); dp.isCalendarActive('gregorian');
dp.addHolidays({...}); dp.loadHolidays('holidays.json'); dp.syncHolidays(true);  // دریافت دستی
dp.exportHolidays(); dp.downloadHolidays('holidays.json'); dp.clearHolidays();
dp.destroy();
```

توابع مستقل:

```js
AriaDatePicker.version;                       // '1.2.0'
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
  onChange: function (value, picker) {},          // تغییر مقدار
  onDayEvent: function (info, picker) {},         // اجرای رویداد شخصی یک روز
  onCalendarChange: function (info, picker) {},   // تغییر تقویم با دکمه‌ی سوییچ
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
// همچنین: adp:open، adp:close و adp:dayevent (رویداد شخصی روز) و adp:calendarchange
```

---

## کبیسه‌ها: قاعده‌ی دقیق و قابل تنظیم

> **سال‌های کبیسه با قاعده‌ای صریح و آزمون‌پذیر محاسبه می‌شوند.** قاعده‌ی پیش‌فرض `'auto'` در بازه‌ی
> رسمی ۱۱۷۸ تا ۱۶۳۳ از الگوریتم بورکفسکی (مبنا: اعتدال بهاری) استفاده می‌کند و بیرون از آن بازه
> به محاسبه‌ی نجومی سوئیچ می‌کند. صحت آن با دو مرجع بررسی شده است:
>
> | سنجه | نتیجه |
> | --- | --- |
> | مقایسه‌ی روزبه‌روز با تقویم فارسی ICU (`Intl`) برای ۱۹۰۰ تا ۲۱۰۰ میلادی | ۷۳٬۴۱۴ روز — **۰ اختلاف** |
> | مقایسه‌ی کبیسه‌ها با محاسبه‌ی نجومی (میوس) و قاعده‌ی «ظهر تهران» | ۱۱۷۸ تا ۱۶۳۳ و ۱۶۳۴ تا ۲۱۰۰ — **۰ اختلاف** |
> | مقایسه با چرخه‌ی حسابی ۳۳ساله | ۱۳۰۰ تا ۱۵۰۰ — **۰ اختلاف** |
>
> اگر با این حال بخواهید کبیسه‌ها را خودتان تعیین کنید، همه‌ی راه‌ها باز است:

```js
// ۱) قاعده‌های آماده
AriaDatePicker.setLeapRule('auto');          // پیش‌فرض (بورکفسکی)
AriaDatePicker.setLeapRule('borkowski');     // همیشه جدول بورکفسکی
AriaDatePicker.setLeapRule('astronomical');  // محاسبه‌ی مستقیم اعتدال بهاری (میوس + ظهر تهران)
AriaDatePicker.setLeapRule('arithmetic');    // چرخه‌ی حسابی ۳۳ساله

// ۲) تعریف دقیق با فهرست سال‌ها
AriaDatePicker.setLeapRule([1403, 1408, 1412, 1417]);

// ۳) اصلاح موردی روی یک قاعده
AriaDatePicker.setLeapRule({ mode: 'auto', add: [1404], remove: [1402] });

// ۴) قاعده‌ی دلخواه
AriaDatePicker.setLeapRule(function (y) { return y % 4 === 0; });

// ۵) همچنین در تنظیمات دیت‌پیکر
AriaDatePicker.create('#d', { leapRule: 'astronomical' });
dp.setLeapRule('arithmetic'); dp.setOptions({ leapRule: [1403, 1408] });
```

ابزارهای سنجش و بررسی:

```js
AriaDatePicker.getLeapRule();            // { mode: 'auto', label: '...', add: [...], remove: [...] }
AriaDatePicker.leapYears(1395, 1412);    // [1395, 1399, 1403, 1408, 1412]
AriaDatePicker.utils.jalaliYearLength(1403);   // 366
AriaDatePicker.utils.isLeapJalaliYear(1403);   // true
AriaDatePicker.utils.jalaliMonthLength(1403, 12);  // 30

// آیا دو قاعده در یک بازه اختلاف دارند؟ (خروجی: آرایه‌ی سال‌های متفاوت)
AriaDatePicker.compareLeapRules('auto', 'astronomical', 1178, 1633);  // [] ← هیچ اختلافی نیست
AriaDatePicker.compareLeapRules('auto', 'arithmetic', 1300, 1500);    // [] ← هیچ اختلافی نیست

// نوروز بر اساس محاسبه‌ی نجومی خالص (برای بازه‌های دور از جدول)
AriaDatePicker.astronomicalNowruz(2025);  // { jdn: 2460756, gy: 2025, gm: 3, gd: 21 }
AriaDatePicker.astronomicalNowruz(2124);  // نوروزی که پس از ظهر تهران رخ می‌دهد
```

روی هر دیت‌پیکر هم: `dp.getLeapRule()`، `dp.setLeapRule()`، `dp.getLeapYears(from, to)`،
`dp.getYearLength(jy)`، `dp.isLeapYear(jy)`.

> نکته: قاعده‌ی کبیسه **سراسری** است (طول سال را تعیین می‌کند)، پس `AriaDatePicker.setLeapRule`
> روی همه‌ی نمونه‌های فعال اثر می‌گذارد و پنل‌ها بی‌درنگ بازترسیم می‌شوند.

---

## آخر هفته: تعیین روز(های) دلخواه

پیش‌فرض: **جمعه** برای تقویم شمسی و **شنبه/یکشنبه** برای تقویم میلادی. روزهای آخر هفته
قرمز نمایش داده می‌شوند، ستون‌های هفته علامت می‌خورند و با `disableWeekends: true` قابل انتخاب نیستند.

```js
AriaDatePicker.create('#d', {
  calendar: 'both',
  weekend: 'جمعه',                                            // ساده‌ترین حالت
  weekend: ['پنجشنبه', 'جمعه'],                               // چند روز
  weekend: 5,                                                 // 0=یکشنبه … 6=شنبه
  weekend: { jalali: ['جمعه'], gregorian: ['شنبه', 'یکشنبه'] }, // تفکیکی برای هر تقویم
  disableWeekends: false                                      // قابل انتخاب بمانند
});

// در زمان اجرا
dp.setWeekend(['پنجشنبه', 'جمعه']);
dp.setWeekend('friday');
dp.setWeekend(['شنبه', 'یکشنبه'], 'gregorian');   // فقط تقویم میلادی
dp.setWeekend({ jalali: ['جمعه'], gregorian: [0, 6] });

dp.getWeekend();          // { jalali: [5], gregorian: [0,6] }
dp.getWeekend('jalali');  // [5]
dp.getWeekendNames();     // ['جمعه']
dp.getWeekendNamesAll();  // { jalali: ['جمعه'], gregorian: ['یکشنبه','شنبه'] }
dp.isWeekend('1405/01/07');  // true
```

نام‌های پذیرفته‌شده (فارسی، انگلیسی، کوتاه‌نوشت و شماره‌ی روز؛ حساس به نیم‌فاصله نیست):
`یکشنبه/شنبه/…/جمعه`، `sunday…saturday`، `sun…sat`، `0…6`.

رویداد `onWeekendChange(weekends, picker)` هم پس از هر تغییر فراخوانی می‌شود.

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

## دریافت اختیاری تعطیلات از اینترنت

> **به‌صورت پیش‌فرض هیچ دانلود خودکاری انجام نمی‌شود.** تعطیلات فقط از فایل JSON محلی
> (`holidayJson`)، آبجکت `holidays` یا داده‌ی ذخیره‌شده در مرورگر خوانده می‌شود.

- دریافت اینترنتی فقط با فراخوانی دستی `dp.fetchHolidays()` (یا `dp.syncHolidays()`) انجام می‌شود؛ معمولاً پشت یک دکمه.
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

## رفتارهای مهم (نسخه‌ی ۱.۲.۰)

- **کبیسه‌ها صریح و قابل تنظیم‌اند**: `leapRule: 'auto'` (پیش‌فرض) در بازه‌ی ۱۱۷۸–۱۶۳۳ از جدول بورکفسکی و
  بیرون از آن از محاسبه‌ی نجومی استفاده می‌کند؛ با `setLeapRule([سال‌ها])`، `{mode, add, remove}` یا یک تابع
  می‌توانید عیناً سال‌های کبیسه را خودتان تعیین کنید. برای سنجش دقت: `compareLeapRules(a, b, from, to)`.
- **آخر هفته قابل تنظیم است**: `weekend: 'جمعه'`، `weekend: ['پنجشنبه','جمعه']` یا به تفکیک تقویم
  `{jalali:[5], gregorian:[0,6]}`؛ با `disableWeekends: true` غیرقابل انتخاب می‌شوند.

### رنگ روز تعطیل انتخاب‌شده
روزهای تعطیل (و جمعه‌ها) حتی پس از انتخاب هم **قرمز** می‌مانند و رنگ آبی انتخاب روی آن‌ها اعمال نمی‌شود.
برای برگرداندن رفتار قبلی (آبی شدن با انتخاب) گزینه‌ی `holidaySelectedStyle: 'accent'` را تنظیم کنید.

### عدد معادل تقویم دیگر
با `dualDigits: true` زیر عدد اصلی هر روز، عدد روز **معادل در تقویم دیگر** نمایش داده می‌شود
(مثلاً در پنل شمسی برای «۱ فروردین ۱۴۰۵» عدد `21` که همان ۲۱ مارس است و در پنل میلادی عدد `۱`).
برای نمایش همان عدد با شکل ارقام دیگر، از `dualDigits: 'same'` استفاده کنید.

### هماهنگی پنل‌ها
وقتی هر دو تقویم باز هستند (`calendar: 'both'`)، با انتخاب یک روز، ماهِ پنل دیگر با تاریخ انتخاب‌شده
هماهنگ می‌شود (روز انتخاب‌شده در هر دو پنل مشخص است) و ناوبری ماه/سال هر دو پنل را با هم جابه‌جا می‌کند.
برای غیرفعال کردن: `syncViews: false` یا `dp.setSyncViews(false)`.

### روزهای غیرفعال
روزهای خارج از بازه‌ی مجاز، روزهای تعطیل (با `disableHolidays`)، آخر هفته‌های غیرفعال، مقادیر
`disabledDates`/`disabledRanges`/`disabledDays` و رویدادهای دارای `disabled: true`:
- با ماوس روی خودِ عدد هم قابل کلیک نیستند (نگهبان در لایه‌ی رویداد + قاعده‌ی CSS `pointer-events: none`)
- با کیبورد از روی آن‌ها پریده می‌شود
- با `setDate`/`setRange` هم تنظیم نمی‌شوند (مگر با آرگومان `force`)
- محدودیت‌ها بر اساس **تقویم همان پنل** ارزیابی می‌شوند؛ بنابراین اگر روزی در تقویم میلادی تعطیل است
  ولی در شمسی آزاد، فقط در همان پنلی که غیرفعال نشان داده شده قابل انتخاب نیست.

### تم تاریک
```js
theme: 'dark'            // همیشه تیره
theme: 'auto'            // بر اساس prefers-color-scheme سیستم
dp.setTheme('dark');     // تغییر در زمان اجرا (یا setOptions({theme:'dark'}))
```
دموی صفحه شامل یک کنترل زنده برای تم و اندازه است.

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
npm test          # ۲۶۰ تست موتور تقویم، انتخاب، محدودیت‌ها، تعطیلات، رویدادها، سوییچ تقویم، کبیسه و آخر هفته + ۴۸ تست صفحه‌ی دمو (jsdom)
```

> خروجی نهایی همان `aria-datepicker.js` است؛ می‌توانید فایل ساخته‌شده را مستقیم در پروژه‌ی خود استفاده کنید.

---

## مجوز

GPL-3.0 — استفاده، تغییر و انتشار آزاد است؛ ذکر منبع الزامی است.
