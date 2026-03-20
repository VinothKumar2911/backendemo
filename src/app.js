<<<<<<< HEAD
// // src/app.js
// const express = require('express');
// const cors = require('cors');
// const fs = require('fs');
// const path = require('path');
=======


// const express = require('express');
// const cors = require('cors');
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a

// const db = require('./config/db');

// const authRoutes = require('./routes/auth.routes');
// const doctorRoutes = require('./routes/doctor.routes');
// const patientRoutes = require('./routes/patient.routes');
// const adminRoutes = require('./routes/admin.routes');
<<<<<<< HEAD
=======

>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
// const app = express();

// /* =========================
//    MIDDLEWARE
// ========================= */
// app.use(express.json());
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

<<<<<<< HEAD
// // 🔴 THIS WAS MISSING (VERY IMPORTANT)
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

=======
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
// /* =========================
//    HEALTH CHECK
// ========================= */
// app.get('/', (req, res) => {
<<<<<<< HEAD
//   res.send('✅ Backend running successfully');
// });

// /* =========================
//    TEST DB CONNECTION
=======
//   res.json({
//     status: 'ok',
//     message: 'Backend running successfully'
//   });
// });

// /* =========================
//    DB CONNECTION TEST
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
// ========================= */
// app.get('/test-db', async (req, res) => {
//   try {
//     await db.query('SELECT 1');
<<<<<<< HEAD
//     res.json({ message: '✅ DB connected successfully' });
//   } catch (err) {
//     console.error('DB ERROR:', err);
//     res.status(500).json({ message: '❌ DB connection failed' });
//   }
// });
// app.use('/uploads', express.static('uploads'));
=======
//     res.json({ status: 'ok', message: 'DB connected successfully' });
//   } catch (error) {
//     console.error('DB ERROR:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'DB connection failed'
//     });
//   }
// });

>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
// /* =========================
//    ROUTES
// ========================= */
// app.use('/auth', authRoutes);
// app.use('/doctor', doctorRoutes);
// app.use('/patient', patientRoutes);
// app.use('/admin', adminRoutes);

<<<<<<< HEAD
// module.exports = app;




const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./config/db');
=======
// /* =========================
//    404 HANDLER
// ========================= */
// app.use((req, res) => {
//   res.status(404).json({
//     status: 'error',
//     message: 'Route not found'
//   });
// });

// module.exports = app;

const express = require('express');
const cors = require('cors');
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a

const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }));

<<<<<<< HEAD
/* =========================
   HEALTH CHECK
========================= */
=======
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend running successfully' });
});

<<<<<<< HEAD
/* =========================
   TEST DB CONNECTION
========================= */
app.get('/test-db', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ message: '✅ DB connected successfully' });
  } catch (err) {
    console.error('DB ERROR:', err);
    res.status(500).json({ message: '❌ DB connection failed' });
  }
});

/* =========================
   ROUTES
========================= */
=======
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a
app.use('/auth', authRoutes);
app.use('/doctor', doctorRoutes);
app.use('/patient', patientRoutes);
app.use('/admin', adminRoutes);
<<<<<<< HEAD

module.exports = app;   // ✅ EXPORT ONLY
=======
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a

