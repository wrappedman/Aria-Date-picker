#!/usr/bin/env node
/**
 * Aria Date Picker — build script
 * -----------------------------------------------------------------------------
 * فایل‌های موجود در پوشه‌ی src/ را به ترتیب شماره‌ی ابتدای نام‌شان به هم می‌چسباند
 * و فایل نهایی dist/aria-datepicker.js را می‌سازد.
 * همچنین اگر ابزار terser نصب باشد، نسخه‌ی فشرده (min) هم تولید می‌شود.
 *
 * اجرا:  node tools/build.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const BANNER = `/*! Aria Date Picker v1.1.0 | تقویم شمسی و میلادی | GPL-3.0 | ${new Date().toISOString().slice(0, 10)} */\n`;

function build() {
  const files = fs.readdirSync(SRC)
    .filter((f) => /^\d+.*\.js$/.test(f))
    .sort();

  const parts = [];
  for (const f of files) {
    const body = fs.readFileSync(path.join(SRC, f), 'utf8');
    parts.push(`/* ===== ${f} ===== */\n${body.replace(/\s+$/, '')}`);
  }

  const out = BANNER + parts.join('\n\n') + '\n';

  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
  // فایل اصلی (تنها فایل موردنیاز برای اجرا) در ریشه‌ی مخزن قرار می‌گیرد
  fs.writeFileSync(path.join(ROOT, 'aria-datepicker.js'), out, 'utf8');
  const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(1);
  console.log(`✔ aria-datepicker.js  (${files.length} بخش، ${kb} کیلوبایت)`);

  // نسخه‌ی فشرده (اختیاری)
  try {
    const terser = path.join(ROOT, 'node_modules', '.bin', 'terser');
    if (fs.existsSync(terser)) {
      const min = execFileSync(terser, ['--compress', '--mangle', '--comments', 'some'], {
        input: out, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024
      });
      fs.writeFileSync(path.join(DIST, 'aria-datepicker.min.js'), min, 'utf8');
      console.log(`✔ dist/aria-datepicker.min.js (${(Buffer.byteLength(min, 'utf8') / 1024).toFixed(1)} کیلوبایت)`);
    }
  } catch (e) {
    console.warn('  (terser در دسترس نبود؛ نسخه‌ی min ساخته نشد)');
  }

  return out;
}

if (require.main === module) build();
module.exports = build;
