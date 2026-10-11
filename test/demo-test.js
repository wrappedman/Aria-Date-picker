/**
 * تست دود صفحه‌ی دمو (index.html)  —  node test/demo-test.js
 * کتابخانه و اسکریپت داخلی صفحه را در محیط jsdom اجرا می‌کند تا مطمئن شویم
 * هیچ خطای زمان اجرا وجود ندارد و همه‌ی نمونه‌های دمو ساخته می‌شوند.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = process.env.ADP_ROOT ? path.resolve(process.env.ADP_ROOT) : path.resolve(__dirname, '..');
const lib = fs.readFileSync(path.join(ROOT, 'aria-datepicker.js'), 'utf8');
const sampleHolidays = JSON.parse(fs.readFileSync(path.join(ROOT, 'holidays-sample.json'), 'utf8'));

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// حذف اسکریپت‌ها و منابع خارجی تا خودمان به ترتیب اجرا کنیم
html = html.replace(/<link[^>]*jsdelivr[^>]*>/g, '');
const inlineScripts = [];
html = html.replace(/<script(?:\s+src="[^"]*")?>([\s\S]*?)<\/script>/g, (m, code) => {
  if (code && code.trim()) inlineScripts.push(code);
  return '';
});

const errors = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://demo.local/' });
const w = dom.window;
w.addEventListener('error', (e) => errors.push('window error: ' + e.message));

// شبیه‌سازی سرویس‌های اینترنتی
w.fetch = function (url) {
  if (/holidays-sample\.json/.test(url)) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(sampleHolidays) });
  }
  if (/holidayapi\.ir\/jalali\/\d+/.test(url)) {
    return Promise.resolve({
      ok: true, status: 200,
      json: () => Promise.resolve({
        holidays: [
          { date: '1405/01/01', description: 'جشن نوروز', is_holiday: true },
          { date: '1405/04/14', description: 'عاشورا', is_holiday: true }
        ]
      })
    });
  }
  if (/holidayapi\.ir\/gregorian\/\d+/.test(url)) {
    return Promise.resolve({
      ok: true, status: 200,
      json: () => Promise.resolve({ holidays: [{ date: '2026-12-25', description: 'کریسمس', is_holiday: true }] })
    });
  }
  return Promise.reject(new Error('offline (stub): ' + url));
};

w.eval(lib);
inlineScripts.forEach((code, i) => {
  try { w.eval(code); } catch (e) { errors.push('inline script #' + i + ': ' + e.message); }
});

let passed = 0, failed = 0;
function ok(name, cond, extra) {
  if (cond) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

setTimeout(() => {
  console.log('\n■ تست صفحه‌ی دمو');
  const ADP = w.AriaDatePicker;
  ok('کتابخانه در صفحه بارگذاری شد', !!ADP);
  ok('هیچ خطای زمان اجرایی رخ نداد', errors.length === 0, errors.join(' | '));
  ok('همه‌ی نمونه‌ها ساخته شدند', ADP.instances.length >= 10, 'تعداد: ' + ADP.instances.length);

  const ids = ['demo-basic', 'demo-both', 'demo-greg', 'demo-today', 'demo-default', 'demo-range',
    'demo-limited', 'demo-noholi', 'demo-json', 'demo-online', 'demo-inline', 'demo-div', 'demo-form-field',
    'demo-time', 'demo-digits', 'demo-events', 'demo-close', 'demo-switch'];
  ids.forEach((id) => {
    const el = w.document.getElementById(id);
    const p = el && ADP.get(el);
    ok('نمونه‌ی «' + id + '» فعال است', !!p && !!p.panelEl);
  });

  // تعطیلات فایل نمونه بارگذاری شده است
  const jsonPicker = ADP.get(w.document.getElementById('demo-json'));
  ok('تعطیلات فایل نمونه در حافظه است', jsonPicker.holiday.isHoliday('jalali', 1405, 1, 1));
  ok('تعطیلات میلادی فایل نمونه', jsonPicker.holiday.isHoliday('gregorian', 2026, 12, 25));

  // فیلد مخفی فرم
  const hidden = w.document.querySelector('input[name="trip_date"]');
  ok('فیلد مخفی فرم ساخته شد', !!hidden);
  ok('هیچ گزینه‌ی autoFetch باقی نمانده', ADP.instances.every((p) => p.options.autoFetch === undefined));

  // دکمه‌ی نمایش تاریخ امروز
  const todayPicker = ADP.get(w.document.getElementById('demo-today'));
  ok('نمونه‌ی «امروز» مقدار پیش‌فرض دارد', todayPicker.hasValue());

  // کش تعطیلات پس از دریافت آنلاین
  const online = ADP.get(w.document.getElementById('demo-online'));
  ok('کش تعطیلات ذخیره شد', !!w.localStorage.getItem('aria-datepicker-holidays-cache-v1-adp-'));

  // بستن همه بدون خطا
  ADP.instances.forEach((p) => p.open());
  ADP.instances.forEach((p) => p.close());
  ok('باز/بسته کردن همه‌ی نمونه‌ها بدون خطا', errors.length === 0, errors.join(' | '));

  // کنترل‌های جدید
  const digits = ADP.get(w.document.getElementById('demo-digits'));
  ok('نمونه‌ی ارقام ساخته شد', !!digits);
  const digitsSel = w.document.getElementById('digits-mode');
  digitsSel.value = 'fa';
  digitsSel.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok('تغییر ارقام به فارسی', /[۰-۹]/.test(w.document.getElementById('demo-digits').value),
     w.document.getElementById('demo-digits').value);
  digitsSel.value = 'en';
  digitsSel.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok('تغییر ارقام به لاتین', /^[0-9]/.test(w.document.getElementById('demo-digits').value),
     w.document.getElementById('demo-digits').value);

  const evts = ADP.get(w.document.getElementById('demo-events'));
  ok('رویدادهای شخصی تعریف شد', evts.getDayEvents().length === 5, 'تعداد: ' + evts.getDayEvents().length);
  evts.triggerDayEvents('1405/01/05');
  ok('اجرای دستی رویداد', w.document.getElementById('out-events').innerHTML.indexOf('جلسه') !== -1,
     w.document.getElementById('out-events').innerHTML);

  const sw = ADP.get(w.document.getElementById('demo-switch'));
  sw.showGregorian();
  ok('API نمایش میلادی', sw.getCalendars().join(','), 'jalali,gregorian');
  const swSel = w.document.getElementById('switch-mode');
  swSel.value = 'swap';
  swSel.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok('تغییر حالت سوییچ', sw.options.switchMode, 'swap');

  const closeSel = w.document.getElementById('close-mode');
  closeSel.value = 'keep';
  closeSel.dispatchEvent(new w.Event('change', { bubbles: true }));
  const cp = ADP.get(w.document.getElementById('demo-close'));
  ok('بازسازی نمونه‌ی بسته‌شدن', !!cp && cp.options.closeOnSelect === false);

  // خروجی JSON نمونه
  const json = jsonPicker.exportHolidays();
  ok('خروجی JSON معتبر است', (() => { try { JSON.parse(json); return true; } catch (e) { return false; } })());

  console.log(`\n──────────────\nنتیجه دمو: ${passed} موفق، ${failed} ناموفق`);
  process.exit(failed ? 1 : 0);
}, 300);
