/**
 * Backend sinkronisasi untuk aplikasi Jadwal Sholat Masjid.
 * Menyimpan SEMUA pengaturan (jadwal, banner/video, pengumuman, identitas,
 * pengaturan adzan/iqomah/suara, dan laporan "imam berhalangan") dalam satu
 * file JSON di Google Drive akun Anda, supaya semua perangkat yang
 * menjalankan aplikasi ini (TV, HP imam, dll) selalu menampilkan data yang
 * sama.
 *
 * CARA PASANG / PASANG ULANG:
 * 1. Buka https://script.google.com -> New project (atau buka project lama).
 * 2. Hapus semua isi editor, tempel seluruh isi file ini.
 * 3. Klik "Deploy" -> "New deployment" (WAJIB "New deployment", bukan edit
 *    yang lama, karena script ini butuh izin akses Google Drive yang
 *    berbeda dari versi sebelumnya).
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Saat pertama kali deploy, Google akan minta izin akses Drive -> klik
 *    "Allow"/"Izinkan". Ini wajar dan aman, izin itu hanya dipakai untuk
 *    membuat 1 file kecil bernama "mosque-app-state.json" di Drive Anda.
 * 5. Salin "Web app URL" yang muncul, tempel ke Pengaturan aplikasi -> tab
 *    "Adzan & Iqomah" -> "URL Sinkronisasi" -> Simpan.
 */

var FILE_NAME = 'mosque-app-state.json';

function getStateFile_() {
  var files = DriveApp.getFilesByName(FILE_NAME);
  if (files.hasNext()) return files.next();
  return DriveApp.createFile(FILE_NAME, '{}', MimeType.PLAIN_TEXT);
}

function readState_() {
  var file = getStateFile_();
  try {
    return JSON.parse(file.getBlob().getDataAsString() || '{}');
  } catch (err) {
    return {};
  }
}

function doGet(e) {
  var state = readState_();
  return ContentService.createTextOutput(JSON.stringify(state)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var file = getStateFile_();
  var state = readState_();
  var body = JSON.parse(e.postData.contents);

  if (typeof body.key !== 'undefined') {
    // General settings update, e.g. { key: "schedule", value: {...} }
    state[body.key] = body.value;
  } else if (body.iso && body.prayerKey) {
    // "Imam berhalangan" report, e.g. { iso, prayerKey, action: "set"|"clear" }
    if (!state.reports) state.reports = {};
    var key = body.iso + '#' + body.prayerKey;
    if (body.action === 'clear') {
      delete state.reports[key];
    } else {
      state.reports[key] = { status: 'absen', at: Date.now() };
    }
  }

  file.setContent(JSON.stringify(state));
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
