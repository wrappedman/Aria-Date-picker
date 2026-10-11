#!/usr/bin/env node
/**
 * Aria Date Picker — ساخت فایل ZIP تحویلی
 * -----------------------------------------------------------------------------
 * یک فایل زیپ شامل نسخه‌ی نهایی کتابخانه، صفحه‌ی دمو، فایل نمونه‌ی تعطیلات و
 * مستندات می‌سازد. این اسکریپت به هیچ بسته‌ی بیرونی نیاز ندارد و خودش فایل
 * ZIP را با zlib می‌سازد.
 *
 * اجرا:  node tools/pack.js [مسیر-خروجی]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');

/* ----------------------------- جدول CRC32 ----------------------------- */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

/* ------------------------------ DOS time ------------------------------ */
function dosDateTime(date = new Date()) {
  const time = ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() / 2)) & 0xffff;
  const day = (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;
  return { time, day };
}

/**
 * ساخت بافر ZIP
 * @param {{name: string, data: Buffer|string}[]} files
 */
function createZip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const { time, day } = dosDateTime();

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(String(file.data), 'utf8');
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const payload = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);              // version needed
    local.writeUInt16LE(0x0800, 6);          // flag: UTF-8
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    chunks.push(local, nameBuf, payload);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(day, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payload.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    central.push(centralHeader, nameBuf);

    offset += local.length + nameBuf.length + payload.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([Buffer.concat(chunks), centralBuf, end]);
}

/* ------------------------------ اجرا ------------------------------ */
function pack(outFile) {
  // ابتدا فایل نهایی کتابخانه ساخته شود
  require('./build.js');
  const build = require('./build.js');
  if (typeof build === 'function') { /* بیلد قبلاً اجرا شد */ }

  const entries = [
    ['aria-datepicker.js', 'aria-datepicker.js'],
    ['dist/aria-datepicker.min.js', 'aria-datepicker.min.js'],
    ['index.html', 'index.html'],
    ['holidays-sample.json', 'holidays-sample.json'],
    ['README.md', 'README.md'],
    ['LICENSE', 'LICENSE']
  ];

  const files = [];
  for (const [src, name] of entries) {
    const full = path.join(ROOT, src);
    if (!fs.existsSync(full)) {
      console.warn(`  (فایل ${src} پیدا نشد و نادیده گرفته شد)`);
      continue;
    }
    files.push({ name, data: fs.readFileSync(full) });
  }

  const zip = createZip(files);
  const out = outFile || path.join(path.dirname(ROOT), 'aria-datepicker-v1.1.0.zip');
  fs.writeFileSync(out, zip);
  console.log(`\n✔ فایل زیپ ساخته شد: ${out} (${(zip.length / 1024).toFixed(1)} کیلوبایت)`);
  console.log('  محتوای زیپ: ' + files.map((f) => f.name).join('، '));
  return out;
}

if (require.main === module) pack(process.argv[2]);
module.exports = { pack, createZip, crc32 };
