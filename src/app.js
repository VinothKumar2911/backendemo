const express = require('express');
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes'); // 👈 ADD THIS
const patientRoutes = require('./routes/patient.routes'); // 👈 ADD THIS

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/doctor', doctorRoutes); // 👈 ADD THIS
app.use('/patient', patientRoutes); // 👈 ADD THIS

module.exports = app;