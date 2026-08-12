/**
 * Backend sinkronisasi sederhana untuk fitur "Konfirmasi Kehadiran Imam"
 * pada aplikasi Jadwal Sholat Masjid.
 *
 * CARA PASANG:
 * 1. Buka https://script.google.com -> New project.
 * 2. Hapus semua isi editor, tempel seluruh isi file ini.
 * 3. Klik "Deploy" -> "New deployment".
 * 4. Pilih tipe "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Klik "Deploy", izinkan aksesnya, lalu salin "Web app URL" yang muncul
 *    (bentuknya seperti https://script.google.com/macros/s/xxxxx/exec).
 * 6. Tempel URL itu ke Pengaturan -> tab "Adzan & Iqomah" -> "URL Sinkronisasi".
 *
 * Setiap kali Anda mengubah kode ini, buat "New deployment" lagi (bukan edit
 * deployment lama) supaya perubahan benar-benar aktif.
 */

function doGet(e) {
  var props = PropertiesService.getScriptProperties();
  var state = props.getProperty('STATE') || '{"request":null,"confirm":null}';
  return ContentService.createTextOutput(state).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var state = JSON.parse(props.getProperty('STATE') || '{"request":null,"confirm":null}');
  var body = JSON.parse(e.postData.contents);

  if (body.type === 'request') {
    state.request = body.request; // null, atau {iso, prayerKey, label, deadlineEpoch}
  } else if (body.type === 'confirm') {
    state.confirm = { iso: body.iso, prayerKey: body.prayerKey, status: body.status, at: Date.now() };
  }

  props.setProperty('STATE', JSON.stringify(state));
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
