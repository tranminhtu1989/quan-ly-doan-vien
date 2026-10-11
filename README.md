# APP QUẢN LÝ ĐOÀN VIÊN V3 – FIREBASE PREPARATION

## Files
- `index.html`, `styles.css`, `app.js`: giao diện và chức năng app.
- `seed-students.js`: danh sách học sinh đi kèm bản V3.
- `firebase-config.js`: cấu hình Firebase Web cho dự án `quan-ly-doan-vien-tran-phu`.

## Firebase connection
- The app signs in anonymously (no login form) and uses Firestore collections `unionStudents`, `unionHistory`, and `unionYears`.
- If the `unionStudents` collection is empty, the app asks for confirmation before uploading the bundled seed list. Do not approve this on a public deployment until the school's data-access approach is agreed.
- Anonymous Authentication is NOT authorization: any visitor can obtain an anonymous session. Do not deploy Firestore rules that allow all anonymous users to read/write real student records. For production, use an authenticated/authorized backend or a stronger access model (for example, class-specific access credentials managed securely and server-side authorization).
- Keep Firestore rules closed until an appropriate security model is configured. The default deny rules will cause permission-denied errors, which is safer than exposing students' addresses and phone numbers.

## Deploy
Upload the files inside this folder to the `main` branch root of `quan-ly-doan-vien`, replacing the corresponding existing files. Keep all files together. GitHub Pages then redeploys automatically.
