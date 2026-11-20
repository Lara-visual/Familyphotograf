/**
 * Приём заявок с лендинга → Google Sheets + Telegram.
 *
 * Как использовать:
 * 1. Откройте таблицу → Расширения → Apps Script.
 * 2. Выделите весь код (Ctrl+A) и замените его этим файлом.
 * 3. Проверьте SHEET_ID (уже заполнен).
 * 4. Telegram необязателен: если не нужен — оставьте TG_TOKEN и TG_CHAT_ID пустыми ('').
 * 5. Ctrl+S → Развернуть → Новое развёртывание → Веб-приложение
 *    («Выполнять от имени»: Я, «У кого есть доступ»: Все) → скопируйте URL на /exec.
 */

const SHEET_ID = '1OSn3ttaMeE6H9SA0AS6qELng5JFGIIgBXwJWJwWvlvk';
const SHEET_NAME = 'Заявки';

// Необязательно. Пустые строки = уведомления в Telegram отключены.
const TG_TOKEN = '';     // например '123456789:AAH...'
const TG_CHAT_ID = '';   // например '123456789'

function doGet() {
  return ContentService.createTextOutput('Скрипт работает. Форму можно подключать.');
}

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    const phoneDigits = String(d.phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      return json({ ok: false, error: 'bad phone' });
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow(['Дата', 'Имя', 'Телефон', 'Контакт', 'Комментарий', 'Страница']);
      sh.setFrozenRows(1);
    }

    const row = [
      new Date(),
      String(d.name || ''),
      '', // телефон пишем отдельно, текстом — см. ниже
      String(d.contact || ''),
      String(d.comment || ''),
      String(d.page || '')
    ];
    sh.appendRow(row);

    // Телефон начинается с «+», и Google Таблицы принимают его за формулу (#ERROR!).
    // Поэтому ячейке сначала ставим текстовый формат и только потом записываем номер.
    const phoneCell = sh.getRange(sh.getLastRow(), 3);
    phoneCell.setNumberFormat('@').setValue(String(d.phone || ''));
    const phone = phoneCell.getDisplayValue();

    if (TG_TOKEN && TG_CHAT_ID) {
      const text = [
        '📸 Новая заявка',
        row[1] && 'Имя: ' + row[1],
        'Телефон: ' + phone,
        row[3] && 'Связь: ' + row[3],
        row[4] && 'Комментарий: ' + row[4]
      ].filter(Boolean).join('\n');

      UrlFetchApp.fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
        method: 'post',
        payload: { chat_id: TG_CHAT_ID, text: text, disable_web_page_preview: true },
        muteHttpExceptions: true
      });
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
