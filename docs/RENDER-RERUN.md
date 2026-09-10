# Render ulang setelah edit

Setelah hasil render selesai, perubahan pada format, subtitle, efek, atau punch-in tidak mengubah file video lama secara diam-diam.

UI dapat meminta `POST /api/projects/:id/render` dengan body `{ "force": true }`. Server hanya menerima rerender paksa untuk job yang sudah `completed`, melakukan reservasi kredit baru dengan reference percobaan berikutnya, mengosongkan output lama, lalu memasukkan job kembali ke antrean.

Job `queued` atau `processing` tidak boleh diduplikasi. Jika reservasi atau perubahan status gagal, kredit baru dilepas dan output lama tetap tidak tertimpa oleh workflow baru.
