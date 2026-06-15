/*******************************************************
 * World Cup 2026 Sticker Album Tracker - Google Sheets Backend v2
 * Supports mixed codes: 00, FWC1-FWC19, team codes like ARG17,
 * and Coca-Cola bonus stickers like CC1-CC12.
 *
 * How to use:
 * 1) Create a Google Sheet.
 * 2) Go to Extensions > Apps Script.
 * 3) Delete the default code and paste this file.
 * 4) Change EDIT_PIN below.
 * 5) Deploy > New deployment > Web app.
 * 6) Execute as: Me.
 * 7) Who has access: Anyone.
 * 8) Copy the Web App URL into the mobile app Sync tab.
 *******************************************************/

const EDIT_PIN = 'CHANGE_THIS_PIN_2026'; // Change this before deploying.
const SETTINGS_SHEET = 'Settings';
const STICKERS_SHEET = 'Stickers';
const STICKER_HEADERS = ['code', 'section', 'name', 'category', 'pasted', 'duplicates', 'updatedAt', 'updatedBy'];

function doGet(e) {
  try {
    ensureSheets_();
    const action = (e.parameter.action || 'load').toLowerCase();
    if (action === 'load') {
      return output_(loadAll_(), e.parameter.callback);
    }
    return output_({ ok: false, error: 'Unknown GET action.' }, e.parameter.callback);
  } catch (error) {
    return output_({ ok: false, error: String(error) }, e && e.parameter && e.parameter.callback);
  }
}

function doPost(e) {
  try {
    ensureSheets_();
    const action = String(e.parameter.action || '').trim();
    const pin = String(e.parameter.pin || '').trim();
    const payload = JSON.parse(e.parameter.payload || '{}');

    if (pin !== EDIT_PIN) {
      return output_({ ok: false, error: 'Invalid editor PIN.' });
    }

    const lock = LockService.getDocumentLock();
    lock.waitLock(10000);
    try {
      if (action === 'updateSticker') {
        updateSticker_(payload.sticker || {});
        return output_({ ok: true, action: action });
      }

      if (action === 'bulkSave') {
        bulkSave_(payload.settings || {}, payload.stickers || []);
        return output_({ ok: true, action: action });
      }

      if (action === 'saveSettings') {
        saveSettings_(payload.settings || {});
        return output_({ ok: true, action: action });
      }

      return output_({ ok: false, error: 'Unknown POST action.' });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return output_({ ok: false, error: String(error) });
  }
}

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('This script must be attached to a Google Sheet.');

  let settings = ss.getSheetByName(SETTINGS_SHEET);
  if (!settings) settings = ss.insertSheet(SETTINGS_SHEET);
  if (settings.getLastRow() === 0) {
    settings.appendRow(['key', 'value']);
    settings.appendRow(['title', 'Álbum Mundial 2026']);
    settings.appendRow(['total', '980']);
    settings.appendRow(['pad', '3']);
  }

  let stickers = ss.getSheetByName(STICKERS_SHEET);
  if (!stickers) stickers = ss.insertSheet(STICKERS_SHEET);
  if (stickers.getLastRow() === 0) {
    stickers.appendRow(STICKER_HEADERS);
  } else {
    migrateStickerHeaders_(stickers);
  }
}

function migrateStickerHeaders_(sheet) {
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), STICKER_HEADERS.length)).getValues()[0]
    .map(h => String(h || '').trim());
  if (!headers.includes('category')) {
    sheet.insertColumnAfter(3);
    sheet.getRange(1, 4).setValue('category');
  }
  sheet.getRange(1, 1, 1, STICKER_HEADERS.length).setValues([STICKER_HEADERS]);
}

function loadAll_() {
  return {
    ok: true,
    settings: getSettings_(),
    stickers: getStickers_(),
    loadedAt: new Date().toISOString()
  };
}

function getSettings_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET);
  const values = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < values.length; i++) {
    const key = String(values[i][0] || '').trim();
    if (key) settings[key] = values[i][1];
  }
  return settings;
}

function saveSettings_(settings) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET);
  const current = getSettings_();
  const next = Object.assign({}, current, settings, { savedAt: new Date().toISOString() });
  sheet.clearContents();
  sheet.appendRow(['key', 'value']);
  Object.keys(next).sort().forEach(key => sheet.appendRow([key, next[key]]));
}

function getStickers_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STICKERS_SHEET);
  migrateStickerHeaders_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, STICKER_HEADERS.length).getValues();
  return values
    .filter(row => String(row[0] || '').trim() !== '')
    .map(row => normalizeSticker_({
      code: row[0],
      section: row[1],
      name: row[2],
      category: row[3],
      pasted: row[4],
      duplicates: row[5],
      updatedAt: row[6],
      updatedBy: row[7]
    }));
}

function updateSticker_(sticker) {
  if (!sticker || !sticker.code) throw new Error('Sticker code is required.');
  const clean = normalizeSticker_(sticker);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STICKERS_SHEET);
  migrateStickerHeaders_(sheet);
  const row = findStickerRow_(clean.code);
  const values = [[clean.code, clean.section, clean.name, clean.category, clean.pasted, clean.duplicates, clean.updatedAt, clean.updatedBy]];
  if (row > 0) {
    sheet.getRange(row, 1, 1, STICKER_HEADERS.length).setValues(values);
  } else {
    sheet.appendRow(values[0]);
  }
}

function findStickerRow_(code) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STICKERS_SHEET);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const codes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const cleanCode = normalizeCode_(code);
  for (let i = 0; i < codes.length; i++) {
    if (normalizeCode_(codes[i][0]) === cleanCode) return i + 2;
  }
  return -1;
}

function bulkSave_(settings, stickers) {
  saveSettings_(settings || {});
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STICKERS_SHEET);
  sheet.clearContents();
  sheet.appendRow(STICKER_HEADERS);
  const rows = (stickers || []).filter(s => s && s.code).map(s => {
    const clean = normalizeSticker_(s);
    return [clean.code, clean.section, clean.name, clean.category, clean.pasted, clean.duplicates, clean.updatedAt, clean.updatedBy];
  });
  if (rows.length) sheet.getRange(2, 1, rows.length, STICKER_HEADERS.length).setValues(rows);
}

function normalizeCode_(value) {
  let code = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
  code = code.replace(/^CC[-_]?/i, 'CC');
  code = code.replace(/^FWC[-_]?/i, 'FWC');
  if (code === '0') return '00';
  if (/^\d{1,3}$/.test(code) && code !== '00') return String(Number(code)).padStart(3, '0');
  return code;
}

function detectCategory_(code, category) {
  const clean = normalizeCode_(code);
  if (category) return String(category).trim();
  if (/^CC/.test(clean)) return 'bonus';
  return 'base';
}

function normalizeSticker_(sticker) {
  const code = normalizeCode_(sticker.code);
  const category = detectCategory_(code, sticker.category);
  return {
    code: code,
    section: String(sticker.section || (category === 'bonus' ? 'Coca-Cola' : 'Album')).trim() || 'Album',
    name: String(sticker.name || '').trim(),
    category: category,
    pasted: sticker.pasted === true || String(sticker.pasted).toUpperCase() === 'TRUE' || String(sticker.pasted) === '1',
    duplicates: Math.max(0, Number(sticker.duplicates || 0)),
    updatedAt: String(sticker.updatedAt || new Date().toISOString()),
    updatedBy: String(sticker.updatedBy || '')
  };
}

function output_(object, callback) {
  const json = JSON.stringify(object);
  if (callback) {
    return ContentService
      .createTextOutput(String(callback) + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
