/**
 * تست‌های خودکار Aria Date Picker  (اجرا: node test/test.js)
 * محیط: jsdom
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const code = fs.readFileSync(path.join(__dirname, '..', 'aria-datepicker.js'), 'utf8');

let passed = 0, failed = 0;
let manualFetchCount = 0;
let manualFetchRequested = false;
function ok(name, cond, extra) {
  if (cond) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}
function is(name, actual, expected) {
  ok(name, String(actual) === String(expected), `got «${actual}» expected «${expected}»`);
}
function group(title) { console.log('\n■ ' + title); }

/* ------------------------------------------------------------------ */
function makeDom(html) {
  const dom = new JSDOM(`<!DOCTYPE html><html lang="fa" dir="rtl"><head></head><body>${html}</body></html>`, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.com/'
  });
  const w = dom.window;
  w.eval(code);
  return { dom, w, doc: w.document };
}

const click = (w, el) => {
  const ev = new w.MouseEvent('click', { bubbles: true, cancelable: true });
  el.dispatchEvent(ev);
};
const hover = (w, el) => el.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
const key = (w, el, k, opts = {}) => {
  const ev = new w.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, opts));
  el.dispatchEvent(ev);
  return ev;
};

/* ================================================================== */
group('۱) ساخت پایه و باز شدن پنل');
{
  const { w, doc } = makeDom('<input id="d1" type="text">');
  const ADP = w.AriaDatePicker;
  const p = ADP.create('#d1', { calendar: 'jalali' });
  ok('نمونه ساخته شد', !!p);
  is('input کلاس اختصاصی گرفت', doc.getElementById('d1').className, 'adp-input');
  ok('استایل تزریق شد', !!doc.getElementById('aria-datepicker-styles-v1'));
  ok('پنل ساخته شد', !!p.panelEl);
  ok('پنل بسته است', !p.isOpen());
  p.open();
  ok('پنل باز شد', p.isOpen());
  const days = p.panelEl.querySelectorAll('[data-day]');
  is('تعداد خانه‌های روز', days.length, 42);
  ok('پنل مخفی نیست', !p.panelEl.className.includes('adp-hidden'));
  // انتخاب یک روز
  const todaySel = p.panelEl.querySelector('[data-day]');
  click(w, todaySel);
  ok('پس از کلیک مقدار ثبت شد', !!p.value().from);
  ok('input پر شد', doc.getElementById('d1').value.length > 0);
  ok('پس از انتخاب بسته می‌شود', !p.isOpen());
  p.destroy();
  ok('تخریب انجام شد', !p.panelEl.parentNode && ADP.instances.length === 0);
}

/* ================================================================== */
group('۲) قالب‌بندی و ارقام فارسی');
{
  const { w, doc } = makeDom('<input id="d2">');
  const ADP = w.AriaDatePicker;
  const p = ADP.create('#d2', { calendar: 'jalali', defaultDate: '1404/01/01' });
  is('متن پیش‌فرض با ارقام فارسی', doc.getElementById('d2').value, '۱۴۰۴/۰۱/۰۱');
  p.setOptions({ persianDigits: false });
  is('حالت ارقام لاتین', doc.getElementById('d2').value, '1404/01/01');
  p.destroy();
}

/* ================================================================== */
group('۳) تقویم میلادی و حالت دو-تقویمی');
{
  const { w, doc } = makeDom('<input id="d3">');
  const ADP = w.AriaDatePicker;
  const g = ADP.create('#d3', { calendar: 'gregorian', defaultDate: '2026/03/21' });
  is('نمایش میلادی', doc.getElementById('d3').value, '2026/03/21');
  is('معادل شمسی', ADP.format(g.value().from.jalali, 'YYYY/MM/DD', 'jalali', { persianDigits: false }), '1405/01/01');
  g.destroy();

  const { w: w2, doc: d2 } = makeDom('<input id="d4">');
  const b = w2.AriaDatePicker.create('#d4', { calendar: 'both', range: true });
  b.open();
  is('دو پنل تقویم رندر شد', b.panelEl.querySelectorAll('.' + b.cls('cal')).length, 2);
  ok('پنل شمسی وجود دارد', !!b.panelEl.querySelector('[data-cal="jalali"]'));
  ok('پنل میلادی وجود دارد', !!b.panelEl.querySelector('[data-cal="gregorian"]'));
  b.destroy();
}

/* ================================================================== */
group('۴) حالت بازه (از تاریخ تا تاریخ)');
{
  const { w, doc } = makeDom('<input id="d5">');
  const p = w.AriaDatePicker.create('#d5', { calendar: 'jalali', range: true, closeOnSelect: false });
  p.open();
  const dn = () => Array.from(p.panelEl.querySelectorAll('[data-cal="jalali"] [data-day]'));
  const aJdn = +dn()[10].getAttribute('data-day'), bJdn = +dn()[20].getAttribute('data-day');
  click(w, dn()[10]);
  is('شروع بازه', p.value().from.jdn, aJdn);
  ok('هنوز بسته نشده', p.isOpen());
  hover(w, dn()[20]);
  click(w, dn()[20]);
  is('پایان بازه', p.value().to.jdn, bJdn);
  is('تعداد روزهای بازه', +p.value().to.jdn - +p.value().from.jdn, bJdn - aJdn);
  is('متن بازه', doc.getElementById('d5').value.split(' تا ').length, 2);
  // انتخاب برعکس
  p.clear(true); p.render();
  click(w, dn()[20]); click(w, dn()[10]);
  is('جابه‌جایی خودکار از/تا', p.value().from.jdn, aJdn);
  p.destroy();
}

/* ================================================================== */
group('۵) محدود کردن بازه‌ی انتخاب');
{
  const { w, doc } = makeDom('<input id="d6">');
  const p = w.AriaDatePicker.create('#d6', {
    calendar: 'jalali',
    initialDate: '1404/01/01',
    limits: { mode: 'range', from: '1404/01/10', to: '1404/01/20' }
  });
  p.open();
  const dn = Array.from(p.panelEl.querySelectorAll('[data-cal="jalali"] [data-day]'));
  const dIjdns = dn.map((el) => +el.getAttribute('data-day'));
  const min = +p.toDateObj('1404/01/10').jdn, max = +p.toDateObj('1404/01/20').jdn;
  const disabledOut = dn.filter((el) => {
    const j = +el.getAttribute('data-day');
    return (j < min || j > max) && el.hasAttribute('disabled');
  }).length;
  const enabledIn = dn.filter((el) => {
    const j = +el.getAttribute('data-day');
    return j >= min && j <= max && !el.hasAttribute('disabled');
  }).length;
  is('روزهای داخل بازه فعال', enabledIn, 11);
  ok('روزهای بیرون بازه غیرفعال', disabledOut > 0, `disabled=${disabledOut}`);
  const outside = dn.find((el) => +el.getAttribute('data-day') < min);
  click(w, outside);
  ok('انتخاب بیرون بازه نادیده گرفته شد', !p.value().from);
  const inside = dn.find((el) => +el.getAttribute('data-day') === min + 3);
  click(w, inside);
  is('انتخاب داخل بازه', p.value().from.jdn, min + 3);
  p.destroy();
}

/* ================================================================== */
group('۶) تعطیلات: ورود JSON، رنگ قرمز و فهرست مناسبت‌ها');
{
  const { w, doc } = makeDom('<input id="d7">');
  const now = w.eval('AriaDatePicker.utils');
  const t = w.AriaDatePicker.utils.todayIn('jalali');
  const d10 = `${t.y}/${String(t.m).padStart(2, '0')}/10`;
  const d12 = `${t.y}/${String(t.m).padStart(2, '0')}/12`;
  const p = w.AriaDatePicker.create('#d7', {
    calendar: 'jalali',
    autoFetch: 'off',
    holidays: {
      jalali: {
        [d10]: 'مناسبت آزمایشی ۱۰',
        [d12]: { title: 'مناسبت آزمایشی ۱۲', type: 'holiday' }
      }
    },
    weekends: { jalali: [5], gregorian: [0, 6] }
  });
  p.open();
  is('رکورد تعطیلات ثبت شد', p.holiday.isHoliday('jalali', t.y, t.m, 10), 'true');
  const el10 = p.panelEl.querySelector(`[data-cal="jalali"] [data-day="${p.toDateObj(d10).jdn}"]`);
  ok('کلاس تعطیل روی روز ۱۰', el10.className.includes('adp-holiday') || el10.className.includes('adp-off'), el10.className);
  ok('عنوان تعطیلات روی روز', (el10.getAttribute('title') || '').includes('مناسبت'), el10.getAttribute('title'));
  const listItems = p.panelEl.querySelectorAll('[data-holiday-item]');
  is('فهرست مناسبت‌های ماه', listItems.length, 2);
  // جمعه‌ها قرمز باشند
  const fridays = Array.from(p.panelEl.querySelectorAll('[data-cal="jalali"] [data-day]'))
    .filter((el) => new w.Date(w.AriaDatePicker.utils.gregorianFromJdn(+el.getAttribute('data-day')).gy,
      w.AriaDatePicker.utils.gregorianFromJdn(+el.getAttribute('data-day')).gm - 1,
      w.AriaDatePicker.utils.gregorianFromJdn(+el.getAttribute('data-day')).gd).getDay() === 5);
  ok('جمعه‌ها کلاس تعطیل دارند', fridays.length > 0 && fridays.every((el) => el.className.includes('adp-off')),
    `fridays=${fridays.length}`);
  p.destroy();
}

/* ================================================================== */
group('۷) ذخیره‌سازی/بازخوانی JSON تعطیلات');
{
  const { w, doc } = makeDom('<input id="d8">');
  const p = w.AriaDatePicker.create('#d8', { calendar: 'jalali', autoFetch: 'off' });
  p.holiday.normalize({ jalali: { '1405/01/01': 'نوروز', '1405/01/02': 'عید نوروز' }, gregorian: { '2026-12-25': 'کریسمس' } });
  const json = p.holiday.toJSON();
  is('رکورد شمسی در خروجی JSON', json.jalali['1405-01-01'].title, 'نوروز');
  is('رکورد میلادی در خروجی JSON', json.gregorian['2026-12-25'].title, 'کریسمس');
  const str = p.holiday.toJSONString();
  ok('رشته JSON معتبر است', (() => { try { JSON.parse(str); return true; } catch (e) { return false; } })());
  const before = Object.keys(json.jalali).length;
  p.holiday.clearCache();
  is('پاک شدن کش', p.holiday.isHoliday('jalali', 1405, 1, 1), 'false');
  p.holiday.normalize(JSON.parse(str));
  is('بازخوانی از JSON', p.holiday.isHoliday('jalali', 1405, 1, 1), 'true');
  is('تعداد رکوردها پس از بازخوانی', Object.keys(p.holiday.holidays.jalali).length, before);
  p.destroy();
}

/* ================================================================== */
group('۸) مقدار پیش‌فرض و تاریخ شروع نمایش');
{
  const { w, doc } = makeDom('<input id="d9">');
  const p = w.AriaDatePicker.create('#d9', {
    calendar: 'jalali', initialDate: '1399/05/05', defaultDate: '1402/02/02'
  });
  p.open();
  is('نمای شروع روی تاریخ تعیین‌شده', `${p.state.view.jalali.y}-${p.state.view.jalali.m}`, '1399-5');
  is('مقدار پیش‌فرض کادر', doc.getElementById('d9').value, '۱۴۰۲/۰۲/۰۲');
  ok('دکمه‌ی امروز وجود دارد', !!p.panelEl.querySelector('[data-foot="today"]'));
  click(w, p.panelEl.querySelector('[data-foot="today"]'));
  const nowJal = w.AriaDatePicker.utils.todayIn('jalali');
  is('دکمه‌ی امروز مقدار را به امروز برد', p.state.from.y, nowJal.y);
  click(w, p.panelEl.querySelector('[data-foot="clear"]'));
  is('پاک کردن مقدار', doc.getElementById('d9').value, '');
  p.destroy();
}

/* ================================================================== */
group('۹) ساعت، حالت تأییدی و رویداد change');
{
  const { w, doc } = makeDom('<input id="d10"><input id="d11">');
  let changes = 0, lastText = '';
  const p = w.AriaDatePicker.create('#d10', {
    calendar: 'jalali', timePicker: true, showSeconds: false, defaultDate: '1404/01/01',
    onChange: (v) => { changes++; lastText = v.text; }
  });
  ok('ردیف ساعت رندر شد', !!p.panelEl.querySelector('[data-time="hh"]'));
  is('گزینه‌های دقیقه با گام ۵', p.panelEl.querySelectorAll('[data-time="mm"] option').length, 12);
  p.setDate('1404/01/02');
  is('رویداد onChange فراخوانی شد', changes > 0, 'true');
  ok('متن رویداد', lastText.includes('۱۴۰۴'), lastText);
  p.destroy();

  const q = w.AriaDatePicker.create('#d11', { calendar: 'jalali', confirmMode: true, defaultDate: '1404/03/03' });
  q.open();
  click(w, q.panelEl.querySelectorAll('[data-cal="jalali"] [data-day]')[0]);
  ok('در حالت تأییدی پنل باز می‌ماند', q.isOpen());
  const applied = q._confirmed.from.jdn;
  q.close();
  is('بستن بدون تأیید => بازگشت به مقدار قبلی', q.state.from.jdn, applied);
  is('مقدار روی input دست‌نخورده', doc.getElementById('d11').value, '۱۴۰۴/۰۳/۰۳');
  q.destroy();
}

/* ================================================================== */
group('۱۰) کیبورد و دسترسی‌پذیری');
{
  const { w, doc } = makeDom('<input id="d12">');
  const p = w.AriaDatePicker.create('#d12', { calendar: 'jalali' });
  p.open();
  const first = p.panelEl.querySelector('[data-cal="jalali"] [data-day]');
  key(w, first, 'ArrowLeft');
  ok('جابه‌جایی با کلید جهت‌دار', p.state.focusJdn != null, String(p.state.focusJdn));
  const before = p.state.view.jalali.m;
  const foc = () => p.panelEl.querySelector('[data-day][tabindex="0"]') || p.panelEl.querySelector('[data-day]');
  key(w, foc(), 'PageDown');
  is('کلید PageDown ماه بعد', p.state.view.jalali.m, before === 12 ? 1 : before + 1);
  key(w, foc(), 'Escape');
  ok('کلید Escape پنل را می‌بندد', !p.isOpen());
  ok('aria-label روی روزها', !!first.getAttribute('aria-label'));
  ok('role=dialog روی پنل', p.panelEl.getAttribute('role') === 'dialog');
  p.destroy();
}

/* ================================================================== */
group('۱۱) هدف غیر ورودی (div) و inline');
{
  const { w, doc } = makeDom('<div id="box"></div><div id="box2"></div>');
  const p = w.AriaDatePicker.create('#box', { calendar: 'jalali' });
  const field = doc.querySelector('#box .adp-field');
  ok('فیلد اختصاصی ساخته شد', !!field);
  click(w, field);
  ok('کلیک روی فیلد پنل را باز می‌کند', p.isOpen());
  click(w, field);
  ok('کلیک مجدد می‌بندد', !p.isOpen());
  ok('برچسب جای‌خالی نمایش داده می‌شود', field.textContent.includes('انتخاب تاریخ'), field.textContent);
  p.destroy();

  const q = w.AriaDatePicker.create('#box2', { calendar: 'jalali', inline: true });
  ok('حالت inline پنل داخل عنصر قرار می‌گیرد', doc.querySelector('#box2 [data-adp]') !== null);
  ok('حالت inline همیشه باز است', q.inline === true);
  q.destroy();
}

/* ================================================================== */
group('۱۲) تعطیلات اینترنتی (سرویس جعلی)');
{
  const { w, doc } = makeDom('<input id="d13">');
  const calls = [];
  w.fetch = function (url) {
    calls.push(url);
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        holidays: [
          { date: '1404/01/01', description: 'جشن نوروز', is_holiday: true },
          { date: '1404/01/02', description: 'عید نوروز', is_holiday: true }
        ]
      })
    });
  };
  const p = w.AriaDatePicker.create('#d13', { calendar: 'jalali', autoFetch: 'off', holidays: null });
  p.holiday.fetched = { jalali: {}, gregorian: {} };
  return p.holiday.fetchHolidays({ jalali: [1404] }).then((res) => new Promise((r) => setTimeout(() => r(res), 80))).then((res) => {
    ok('درخواست اینترنتی ارسال شد', calls.length > 0, calls.join(','));
    is('تعداد تعطیلات دریافتی', res.jalali, 2);
    ok('عنوان تعطیلات دریافتی', p.holiday.titleOf('jalali', 1404, 1, 1) === 'جشن نوروز');
    ok('ذخیره در کش محلی', !!w.localStorage.getItem('aria-datepicker-holidays-cache-v1-adp-'));
    const json = p.holiday.toJSON();
    ok('خروجی JSON شامل داده‌ی اینترنتی', json.jalali['1404-01-01'].title === 'جشن نوروز');
    p.destroy();

    runExtra();
  });
}

function runExtra() {

/* ================================================================== */
group('۱۵) ارقام فارسی/لاتین قابل تنظیم برای هر دو تقویم');
{
  const { w, doc } = makeDom('<input id="z1"><input id="z2"><input id="z3"><input id="z4">');
  const ADP = w.AriaDatePicker;

  const fa = ADP.create('#z1', { calendar: 'both', persianDigits: true, defaultDate: '1405/01/01' });
  ok('ارقام فارسی برای هر دو تقویم', doc.getElementById('z1').value.indexOf('۱۴۰۵') === 0, doc.getElementById('z1').value);
  fa.open();
  const gPanelFa = fa.panelOf('gregorian');
  ok('دیگر ارقام میلادی هم فارسی است', /[۰-۹]/.test(gPanelFa.querySelector('[data-day] .adp-day-num').textContent),
     gPanelFa.querySelector('[data-day] .adp-day-num').textContent);
  fa.destroy();

  const en = ADP.create('#z2', { calendar: 'both', persianDigits: false, defaultDate: '1405/01/01' });
  ok('ارقام لاتین برای هر دو تقویم', doc.getElementById('z2').value.indexOf('1405') === 0, doc.getElementById('z2').value);
  en.open();
  ok('خانه‌های شمسی هم لاتین', /^[0-9]+$/.test(en.panelOf('jalali').querySelector('[data-day] .adp-day-num').textContent));
  en.destroy();

  const mixed = ADP.create('#z3', { calendar: 'both', persianDigits: { jalali: true, gregorian: false }, defaultDate: '1405/01/01' });
  mixed.open();
  ok('حالت تلفیقی: شمسی فارسی', /[۰-۹]/.test(mixed.panelOf('jalali').querySelector('[data-day] .adp-day-num').textContent));
  ok('حالت تلفیقی: میلادی لاتین', /^[0-9]+$/.test(mixed.panelOf('gregorian').querySelector('[data-day] .adp-day-num').textContent));
  mixed.setOptions({ persianDigits: { jalali: false, gregorian: true } });
  ok('تغییر تلفیقی در زمان اجرا', /^[0-9]+$/.test(mixed.panelOf('jalali').querySelector('[data-day] .adp-day-num').textContent));
  mixed.destroy();

  const auto = ADP.create('#z4', { calendar: 'both', persianDigits: 'auto', defaultDate: '1405/01/01' });
  auto.open();
  ok('حالت خودکار: شمسی فارسی', /[۰-۹]/.test(auto.panelOf('jalali').querySelector('[data-day] .adp-day-num').textContent));
  ok('حالت خودکار: میلادی لاتین', /^[0-9]+$/.test(auto.panelOf('gregorian').querySelector('[data-day] .adp-day-num').textContent));
  auto.destroy();
}

/* ================================================================== */
group('۱۶) رویداد شخصی با انتخاب روز');
{
  const { w, doc } = makeDom('<input id="e1"><input id="e2"><input id="e3">');
  const ADP = w.AriaDatePicker;

  // حالت اول: handler با (info, picker)
  let calls = [], received = null;
  const p = ADP.create('#e1', {
    calendar: 'jalali',
    initialDate: '1405/01/01',
    dayEvents: {
      days: ['1405/01/05', '1405/01/07'],
      title: 'روز کاری خاص',
      handler: function (info, picker) { calls.push(info.text); received = { info, picker }; return 'ret-ok'; }
    }
  });
  ok('رویداد تعریف شد', p.getDayEvents().length === 1 && p.getDayEvents()[0].hasHandler);
  p.open();
  const dayBtn = p.panelEl.querySelector('[data-cal="jalali"] [data-day="' + p.toDateObj('1405/01/05').jdn + '"]');
  ok('کلاس has-event روی روز', dayBtn.className.indexOf('adp-has-event') !== -1, dayBtn.className);
  ok('نشانگر رویداد ساخته شد', !!dayBtn.querySelector('.adp-event-dot'));
  ok('عنوان رویداد در tooltip', (dayBtn.getAttribute('title') || '').indexOf('روز کاری خاص') !== -1, dayBtn.getAttribute('title'));
  click(w, dayBtn);
  is('تابع با انتخاب روز اجرا شد', calls.length, 1);
  is('متن تاریخ به تابع رسید', calls[0], '۱۴۰۵/۰۱/۰۵');
  ok('آرگومان دوم نمونه‌ی دیت‌پیکر است', received.picker === p);
  ok('اطلاعات کامل تاریخ', received.info.jalali.y === 1405 && received.info.gregorian.y === 2026);
  // روز دیگر
  p.open();
  click(w, p.panelEl.querySelector('[data-cal="jalali"] [data-day="' + p.toDateObj('1405/01/07').jdn + '"]'));
  is('رویداد روز دوم', calls.length, 2);
  // روز بی‌رویداد
  p.open();
  click(w, p.panelEl.querySelector('[data-cal="jalali"] [data-day="' + p.toDateObj('1405/01/06').jdn + '"]'));
  is('روز بدون رویداد تابع را اجرا نمی‌کند', calls.length, 2);
  // رویداد مستقل روز که توسط طرح موضوعی مشخص شده
  is('نشانگر تماس onDayEvent نداشت (تعریف‌نشده)', p.getDayEvents().length, 1);
  p.destroy();

  // حالت دوم: ورودی‌های دلخواه کاربر (args)
  let argLog = null;
  const q = ADP.create('#e2', {
    calendar: 'jalali',
    initialDate: '1405/02/01',
    dayEvents: {
      days: ['1405/02/03'],
      title: 'یادآور',
      args: ['$text', 42, '$picker', 'ثابت'],
      handler: function (a, b, c, d) { argLog = { a, b, c, d, self: this }; return true; }
    }
  });
  q.open();
  click(w, q.panelEl.querySelector('[data-cal="jalali"] [data-day="' + q.toDateObj('1405/02/03').jdn + '"]'));
  ok('ورودی‌های دلخواه به تابع رسید', argLog && argLog.a === '۱۴۰۵/۰۲/۰۳' && argLog.b === 42 && argLog.c === q && argLog.d === 'ثابت',
     JSON.stringify({ a: argLog && argLog.a, b: argLog && argLog.b, d: argLog && argLog.d }));
  ok('this داخل تابع = نمونه‌ی دیت‌پیکر', argLog && argLog.self === q);
  q.destroy();

  // حالت سوم: رویداد بازه‌ای + once + disabled
  let rangeCalls = [];
  const r = ADP.create('#e3', {
    calendar: 'jalali',
    range: true,
    closeOnSelect: false,
    initialDate: '1405/03/01',
    dayEvents: [
      { weekdays: [5], title: 'جمعه آزاد', className: 'my-friday', handler: function (info) { rangeCalls.push('friday'); } },
      { rangeDays: { min: 3, max: 5 }, title: 'بازه کوتاه', handler: function (info) { rangeCalls.push(info.range.lengthDays); } },
      { days: ['1405/03/02'], once: true, handler: function () { rangeCalls.push('once'); } },
      { days: ['1405/03/09'], disabled: true, title: 'تعطیل' }
    ]
  });
  r.open();
  const days = r.panelEl.querySelectorAll('[data-cal="jalali"] [data-day]');
  const d2 = r.panelEl.querySelector('[data-cal="jalali"] [data-day="' + r.toDateObj('1405/03/02').jdn + '"]');
  ok('کلاس دلخواه کاربر روی روز', d2.className.indexOf('my-friday') !== -1 || d2.className.indexOf('adp-has-event') !== -1);
  const d9 = r.panelEl.querySelector('[data-cal="jalali"] [data-day="' + r.toDateObj('1405/03/09').jdn + '"]');
  ok('روز غیرفعال با رویداد disabled', d9.hasAttribute('disabled'));
  click(w, d2);
  is('رویداد once اجرا شد', rangeCalls.filter((c) => c === 'once').length, 1);
  click(w, d2);
  is('رویداد once دوباره اجرا نشد', rangeCalls.filter((c) => c === 'once').length, 1);
  // بازه‌ی ۳ روزه: 1405/03/04 تا 1405/03/06
  const den = (x) => r.panelEl.querySelector('[data-cal="jalali"] [data-day="' + r.toDateObj(x).jdn + '"]');
  if (!den('1405/03/04').hasAttribute('disabled') && !den('1405/03/06').hasAttribute('disabled')) {
    click(w, den('1405/03/04'));
    click(w, den('1405/03/06'));
    ok('رویداد مبتنی بر طول بازه اجرا شد', rangeCalls.indexOf(3) !== -1, JSON.stringify(rangeCalls));
  }
  ok('فهرست رویدادها با getDayEvents', r.getDayEvents().length === 4);
  r.removeDayEvent('dayEvent1');
  is('حذف رویداد با id', r.getDayEvents().length, 3);
  r.setDayEvents(null);
  is('پاک کردن همه‌ی رویدادها', r.getDayEvents().length, 0);
  r.destroy();
}

/* ================================================================== */
group('۱۷) بسته‌شدن یا بازماندن پنل پس از انتخاب');
{
  const { w, doc } = makeDom('<input id="c1"><input id="c2"><input id="c3"><input id="c4">');
  const ADP = w.AriaDatePicker;
  const pick = (p, x) => click(w, p.panelEl.querySelector('[data-cal="jalali"] [data-day="' + p.toDateObj(x).jdn + '"]'));
  const todayJ = () => { const t = ADP.utils.todayIn('jalali'); return t.y + '/' + String(t.m).padStart(2, '0') + '/' + String(t.d).padStart(2, '0'); };

  const a = ADP.create('#c1', { calendar: 'jalali', closeOnSelect: true, initialDate: '1405/01/01' });
  a.open(); pick(a, '1405/01/05');
  ok('closeOnSelect:true => بسته می‌شود', !a.isOpen());
  a.destroy();

  const b = ADP.create('#c2', { calendar: 'jalali', closeOnSelect: false, initialDate: '1405/01/01' });
  b.open(); pick(b, '1405/01/05');
  ok('closeOnSelect:false => باز می‌ماند', b.isOpen());
  ok('مقدار همان‌جا ثبت شد', b.getText(), '۱۴۰۵/۰۱/۰۵');
  pick(b, '1405/01/09');
  is('انتخاب بعدی جای قبلی را می‌گیرد', b.getText(), '۱۴۰۵/۰۱/۰۹');
  b.destroy();

  const c = ADP.create('#c3', { calendar: 'jalali', range: true, closeOnSelect: true, closeOnSelectRange: false, initialDate: '1405/01/01' });
  c.open(); pick(c, '1405/01/05');
  ok('در حالت رنج با closeOnSelectRange:false باز می‌ماند', c.isOpen());
  pick(c, '1405/01/10');
  ok('پس از بازه هم باز می‌ماند', c.isOpen());
  c.destroy();

  const d = ADP.create('#c4', { calendar: 'jalali', range: true, closeOnSelect: true, closeOnSelectRange: true, initialDate: '1405/01/01' });
  d.open(); pick(d, '1405/01/05'); pick(d, '1405/01/10');
  ok('با closeOnSelectRange:true پس از بازه بسته می‌شود', !d.isOpen());
  d.destroy();
}

/* ================================================================== */
group('۱۸) سوییچ تقویم با یک دکمه');
{
  const { w, doc } = makeDom('<input id="s1"><input id="s2"><input id="s3">');
  const ADP = w.AriaDatePicker;

  const p = ADP.create('#s1', { calendar: 'jalali', switchToCalendar: 'gregorian', initialDate: '1405/01/01' });
  p.open();
  const bar = p.panelEl.querySelector('.adp-switchbar');
  ok('نوار سوییچ ساخته شد', !!bar);
  is('دو دکمه‌ی تقویم', bar.querySelectorAll('[data-switch]').length, 2);
  is('در ابتدا فقط شمسی فعال', p.getCalendars().join(','), 'jalali');
  click(w, bar.querySelector('[data-switch="gregorian"]'));
  is('با کلیک، میلادی هم‌زمان نمایش داده شد', p.getCalendars().join(','), 'jalali,gregorian');
  ok('پنل میلادی رندر شد', !!p.panelOf('gregorian'));
  is('تقویم اصلی به میلادی تغییر کرد', p.getPrimaryCalendar(), 'gregorian');
  click(w, p.panelEl.querySelector('[data-switch="gregorian"]'));
  is('کلیک دوباره پنل میلادی را پنهان می‌کند', p.getCalendars().join(','), 'jalali');
  p.destroy();

  const swap = ADP.create('#s2', { calendar: 'jalali', switchMode: 'swap', initialDate: '1405/01/01' });
  swap.open();
  click(w, swap.panelEl.querySelector('[data-switch="gregorian"]'));
  is('حالت swap: فقط میلادی', swap.getCalendars().join(','), 'gregorian');
  ok('پنل شمسی حذف شد', !swap.panelOf('jalali'));
  click(w, swap.panelEl.querySelector('[data-switch="jalali"]'));
  is('بازگشت به شمسی', swap.getCalendars().join(','), 'jalali');
  swap.setSwitchMode('both');
  is('تغییر حالت سوییچ', swap.options.switchMode, 'both');
  swap.destroy();

  const hide = ADP.create('#s3', { calendar: 'jalali', calendarSwitch: false });
  hide.open();
  ok('با calendarSwitch:false نوار مخفی است', !hide.panelEl.querySelector('.adp-switchbar'));
  hide.showGregorian();
  is('API نمایش هم‌زمان میلادی', hide.getCalendars().join(','), 'jalali,gregorian');
  is('تقویم اصلی میلادی شد', hide.getPrimaryCalendar(), 'gregorian');
  hide.showGregorian();
  is('فراخوانی دوباره‌ی API باعث پنهان شدن نشود', hide.getCalendars().join(','), 'jalali,gregorian');
  hide.hideGregorian();
  is('API پنهان کردن میلادی', hide.getCalendars().join(','), 'jalali');
  hide.destroy();
}

/* ================================================================== */
group('۱۹) تعطیلات فقط از فایل نمونه/محلی (بدون دانلود خودکار)');
{
  const { w, doc } = makeDom('<input id="h1"><input id="h2">');
  const ADP = w.AriaDatePicker;
  w.fetch = function () { manualFetchCount++; return Promise.reject(new Error('offline')); };

  const p = ADP.create('#h1', { calendar: 'jalali', holidays: { jalali: { '1405/01/01': 'نوروز' } } });
  p.open();
  p.setViewDate('1405/03/01').setViewDate('1406/01/01');
  ok('هیچ دانلود خودکاری انجام نشد', manualFetchCount === 0, 'fetched=' + manualFetchCount);
  ok('گزینه‌ی autoFetch وجود ندارد', p.options.autoFetch === undefined);
  ok('گزینه‌ی showOnlineStatus وجود ندارد', p.options.showOnlineStatus === undefined);
  ok('نشانگر آنلاین در پاصفحه نیست', !p.panelEl.querySelector('.adp-status'));
  ok('تعطیلات فایل نمونه در دسترس است', p.isHoliday('1405/01/01'));
  // دریافت دستی اختیاری (بررسی غیرهمگام در پایان تست‌ها)
  p.holiday.fetched = { jalali: {}, gregorian: {} };
  manualFetchRequested = true;
  const done = p.fetchHolidays();
  if (done && done.catch) done.catch(function () { });
  p.destroy();

  const q = ADP.create('#h2', { calendar: 'jalali', holidayJson: 'holidays-sample.json' });
  q.open();
  ok('آدرس فایل ذخیره شده است', q.options.holidayJson === 'holidays-sample.json');
  q.destroy();
}


/* ================================================================== */
group('۱۳) قابلیت‌های تکمیلی');
{
  const { w, doc } = makeDom('<input id="x1"><input id="x2"><div id="x3"></div><input id="x4">');
  const ADP = w.AriaDatePicker;

  // دو ماه در هر پنل
  const two = ADP.create('#x1', { calendar: 'jalali', monthsPerPanel: 2, range: true });
  two.open();
  is('دو ماه در یک پنل', two.panelEl.querySelectorAll('[data-cal="jalali"] [data-month-of]').length, 2);
  const before = two.state.view.jalali.m;
  click(w, two.panelEl.querySelector('[data-nav="next-month"]'));
  is('پرش دو ماهه با دکمه‌ی ماه بعد', two.state.view.jalali.m, before === 11 ? 1 : (before === 12 ? 2 : before + 2));
  two.destroy();

  // پنهان کردن روزهای ماه‌های مجاور
  const out = ADP.create('#x2', { calendar: 'jalali', showOutsideDays: false });
  out.open();
  is('تعداد خانه‌های فعال', out.panelEl.querySelectorAll('[data-cal="jalali"] [data-day]').length <= 31, 'true');
  ok('خانه‌های بیرون ماه بدون button هستند', out.panelEl.querySelectorAll('[data-cal="jalali"] .adp-day.adp-out:not([data-day])').length > 0);
  out.destroy();

  // پیشوند اختصاصی
  ADP.injectStyles('myapp-pick-');
  const pref = ADP.create('#x3', { calendar: 'jalali', prefix: 'myapp-pick-' });
  ok('کلاس‌ها با پیشوند اختصاصی', !!doc.querySelector('#x3 .myapp-pick-field'));
  ok('استایل پیشوند اختصاصی تزریق شد', !!doc.getElementById('aria-datepicker-styles-v1-myapp-pick-'));
  pref.destroy();

  // تم تاریک + نمایش دوگانه + ارقام دوگانه
  const dark = ADP.create('#x4', {
    calendar: 'both', theme: 'dark', dualDisplay: true, dualDigits: true, defaultDate: '1404/05/10'
  });
  ok('کلاس تم تاریک', dark.panelEl.className.includes('adp-theme-dark'));
  ok('نمایش هر دو تقویم در کادر', doc.getElementById('x4').value.includes('—'), doc.getElementById('x4').value);
  dark.open();
  ok('عدد دوگانه در خانه‌ها', !!dark.panelEl.querySelector('.adp-day-sub'));
  ok('پنل میلادی وجود دارد', !!dark.panelEl.querySelector('[data-cal="gregorian"]'));
  dark.destroy();

  // تعطیلات غیرفعال + تایپ دستی
  const { w: w2 } = { w };
  const editable = ADP.create('#x1', { calendar: 'jalali', editable: true, disableHolidays: true,
    holidays: { jalali: { '1405/01/01': 'نوروز' } } });
  const input = doc.getElementById('x1');
  input.value = '1420/05/05';
  input.dispatchEvent(new w.Event('change', { bubbles: true }));
  is('تحلیل مقدار تایپ‌شده', editable.state.from.y, 1420);
  input.value = 'متن نامعتبر';
  input.dispatchEvent(new w.Event('change', { bubbles: true }));
  is('بازگشت مقدار در صورت متن نامعتبر', editable.state.from.y, 1420);
  editable.destroy();
}

/* ================================================================== */
group('۱۴) خروجی متدهای عمومی');
{
  const { w, doc } = makeDom('<input id="y1">');
  const p = w.AriaDatePicker.create('#y1', { calendar: 'both', range: true, defaultRange: '1404/01/01 - 1404/01/10' });
  is('getRange().from (شمسی)', p.getRange().from.jalali.y, 1404);
  is('getRange().to (میلادی)', p.getRange().to.gregorian.y, 2025);
  is('getISO', p.getISO(), '2025-03-21');
  is('hasValue', p.hasValue(), 'true');
  is('getCalendars', p.getCalendars().join(','), 'jalali,gregorian');
  p.setCalendar('gregorian');
  is('setCalendar', p.getCalendar(), 'gregorian');
  p.setViewDate('1406/03/01');
  is('setViewDate', p.getViewDate().jalali.m, 3);
  p.setLimits({ mode: 'before', to: '1404/02/01' });
  is('setLimits', p.getLimits().mode, 'before');
  p.setDisabled(true);
  ok('setDisabled', p.options.disabled === true);
  p.addHolidays({ jalali: { '1404/01/01': 'نوروز' } });
  is('addHolidays + getHolidays', p.getHolidays(1404, 'jalali').length, 1);
  ok('isHoliday', p.isHoliday('1404/01/01'));
  is('getHolidayTitle', p.getHolidayTitle('1404/01/01'), 'نوروز');
  ok('exportHolidays رشته‌ی JSON است', p.exportHolidays().indexOf('نوروز') !== -1);
  p.clearHolidays();
  is('clearHolidays', p.getHolidays(1404, 'jalali').length, 0);
  p.destroy();
}

  /* ---------- خلاصه ---------- */
  setTimeout(function () {
    ok('fetchHolidays فقط با فراخوانی دستی از اینترنت استفاده می‌کند',
      manualFetchRequested && manualFetchCount > 0, 'fetched=' + manualFetchCount);
    console.log(`\n──────────────\nنتیجه: ${passed} موفق، ${failed} ناموفق`);
    process.exit(failed ? 1 : 0);
  }, 150);
}
