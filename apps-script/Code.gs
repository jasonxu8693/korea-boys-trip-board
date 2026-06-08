const SHEET_NAME = 'State';
const STATE_KEY = 'boardState';

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  sheet.clear();
  sheet.getRange(1, 1, 1, 4).setValues([['key', 'json', 'updated_at', 'updated_by']]);
  sheet.getRange(2, 1, 1, 4).setValues([[STATE_KEY, '{}', new Date().toISOString(), 'setup']]);
  sheet.setFrozenRows(1);
}

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;
  const result = {
    ok: true,
    state: readState_(),
    updatedAt: getUpdatedAt_()
  };

  const json = JSON.stringify(result);
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = e.parameter && e.parameter.payload
      ? JSON.parse(e.parameter.payload)
      : JSON.parse(e.postData.contents || '{}');

    if (!payload.state) throw new Error('Missing state payload');
    writeState_(payload.state);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, updatedAt: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readState_() {
  const sheet = getStateSheet_();
  const json = sheet.getRange(2, 2).getValue();
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

function writeState_(state) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getStateSheet_();
    sheet.getRange(2, 1, 1, 4).setValues([[
      STATE_KEY,
      JSON.stringify(state),
      new Date().toISOString(),
      'web-board'
    ]]);
  } finally {
    lock.releaseLock();
  }
}

function getUpdatedAt_() {
  const sheet = getStateSheet_();
  return sheet.getRange(2, 3).getValue();
}

function getStateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setup();
    sheet = ss.getSheetByName(SHEET_NAME);
  }
  return sheet;
}
