-- -- Main database for the hospital / rehab application
-- CREATE DATABASE IF NOT EXISTS hospital_app;
-- USE hospital_app;
-- show tables;
-- select * from users_auth;


-- -- Stores OTPs temporarily for verification
-- CREATE TABLE otp_verification (
--   id BIGINT AUTO_INCREMENT PRIMARY KEY,
--   phone VARCHAR(20) NOT NULL,                  -- Phone receiving OTP
--   otp VARCHAR(6) NOT NULL,                     -- OTP code
--   expires_at TIMESTAMP NOT NULL,               -- OTP expiry time
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Stores OTPs temporarily for verification
-- CREATE TABLE otp_verification (
--   id BIGINT AUTO_INCREMENT PRIMARY KEY,
--   phone VARCHAR(20) NOT NULL,                  -- Phone receiving OTP
--   otp VARCHAR(6) NOT NULL,                     -- OTP code
--   expires_at TIMESTAMP NOT NULL,               -- OTP expiry time
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Stores doctor profile & dashboard statistics
-- CREATE TABLE doctors (
--   id CHAR(36) PRIMARY KEY,                     -- Doctor UUID
--   user_auth_id CHAR(36) UNIQUE,                -- Link to login table

--   name VARCHAR(100) NOT NULL,
--   email VARCHAR(100) UNIQUE,
--   phone VARCHAR(20) UNIQUE,
--   profile_image_url TEXT,                      -- Doctor profile image

--   specialization VARCHAR(100),
--   experience INT,                              -- Years of experience
--   status ENUM('active','inactive') DEFAULT 'active',

--   -- Dashboard counters (can be cached for performance)
--   patients_treated_count INT DEFAULT 0,
--   reports_submitted_count INT DEFAULT 0,
--   exercises_created_count INT DEFAULT 0,

--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

--   FOREIGN KEY (user_auth_id) REFERENCES users_auth(id)
-- );

-- -- Stores patient profile details
-- CREATE TABLE patients (
--   id CHAR(36) PRIMARY KEY,                     -- Patient UUID
--   user_auth_id CHAR(36) UNIQUE,                -- Login mapping
--   doctor_id CHAR(36),                          -- Assigned doctor

--   name VARCHAR(100) NOT NULL,
--   age INT,
--   gender ENUM('male','female','other'),
--   phone VARCHAR(20),
--   email VARCHAR(100),

--   profile_photo_url TEXT,                      -- Patient image
--   status ENUM('active','inactive') DEFAULT 'active',
--   registered_on DATE,                          -- Registration date

--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

--   FOREIGN KEY (doctor_id) REFERENCES doctors(id),
--   FOREIGN KEY (user_auth_id) REFERENCES users_auth(id)
-- );

-- -- Rehab programs created by doctors
-- CREATE TABLE programs (
--   id CHAR(36) PRIMARY KEY,
--   doctor_id CHAR(36) NOT NULL,                 -- Owner doctor

--   name VARCHAR(150) NOT NULL,
--   description TEXT,
--   status ENUM('draft','published','disabled') DEFAULT 'draft',
--   total_minutes INT,                           -- Total program duration

--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

--   FOREIGN KEY (doctor_id) REFERENCES doctors(id)
-- );

-- -- Individual exercises with S3 video
-- CREATE TABLE exercises (
--   id CHAR(36) PRIMARY KEY,
--   doctor_id CHAR(36) NOT NULL,                 -- Owner doctor

--   title VARCHAR(150) NOT NULL,
--   description TEXT,
--   video_s3_url TEXT NOT NULL,                  -- S3 video URL

--   duration_minutes INT,
--   category VARCHAR(100),

--   status ENUM('draft','published','disabled') DEFAULT 'draft',

--   created_by CHAR(36),                         -- Doctor who created
--   updated_by CHAR(36),                         -- Doctor who updated

--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

--   FOREIGN KEY (doctor_id) REFERENCES doctors(id),
--   FOREIGN KEY (created_by) REFERENCES doctors(id),
--   FOREIGN KEY (updated_by) REFERENCES doctors(id)
-- );

-- -- Mapping exercises to programs with default sets & reps
-- CREATE TABLE program_exercises (
--   id CHAR(36) PRIMARY KEY,
--   program_id CHAR(36) NOT NULL,
--   exercise_id CHAR(36) NOT NULL,

--   sets INT DEFAULT 3,                          -- Default sets
--   reps INT DEFAULT 15,                         -- Default reps
--   duration_minutes INT,

--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

--   FOREIGN KEY (program_id) REFERENCES programs(id),
--   FOREIGN KEY (exercise_id) REFERENCES exercises(id),

--   UNIQUE(program_id, exercise_id)              -- Prevent duplicates
-- );

-- -- Programs assigned to patients
-- CREATE TABLE patient_programs (
--   id CHAR(36) PRIMARY KEY,
--   patient_id CHAR(36) NOT NULL,
--   program_id CHAR(36) NOT NULL,
--   assigned_by CHAR(36) NOT NULL,               -- Doctor

--   start_date DATE,
--   end_date DATE,
--   status ENUM('active','paused','completed') DEFAULT 'active',

--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

--   FOREIGN KEY (patient_id) REFERENCES patients(id),
--   FOREIGN KEY (program_id) REFERENCES programs(id),
--   FOREIGN KEY (assigned_by) REFERENCES doctors(id)
-- );

-- -- Tracks how much of a video patient watched
-- CREATE TABLE exercise_progress (
--   id CHAR(36) PRIMARY KEY,
--   patient_id CHAR(36) NOT NULL,
--   exercise_id CHAR(36) NOT NULL,

--   watched_seconds INT DEFAULT 0,               -- Actual watched time
--   total_seconds INT,                           -- Full video length

--   completed BOOLEAN DEFAULT false,
--   completed_at TIMESTAMP NULL,

--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

--   FOREIGN KEY (patient_id) REFERENCES patients(id),
--   FOREIGN KEY (exercise_id) REFERENCES exercises(id),

--   UNIQUE(patient_id, exercise_id)
-- );

-- -- Feedback submitted after exercise completion
-- CREATE TABLE feedback (
--   id CHAR(36) PRIMARY KEY,
--   patient_id CHAR(36) NOT NULL,
--   program_id CHAR(36) NOT NULL,
--   exercise_id CHAR(36) NOT NULL,

--   pain_level INT CHECK (pain_level BETWEEN 0 AND 10),
--   difficulty ENUM('easy','moderate','hard'),
--   notes TEXT,

--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

--   FOREIGN KEY (patient_id) REFERENCES patients(id),
--   FOREIGN KEY (program_id) REFERENCES programs(id),
--   FOREIGN KEY (exercise_id) REFERENCES exercises(id)
-- );

-- CREATE INDEX idx_user_phone ON users_auth(phone);
-- CREATE INDEX idx_patient_doctor ON patients(doctor_id);
-- CREATE INDEX idx_program_doctor ON programs(doctor_id);
-- CREATE INDEX idx_exercise_doctor ON exercises(doctor_id);
-- CREATE INDEX idx_progress_patient ON exercise_progress(patient_id);

-- -- -----------------------------------------------------------------------------------------------

-- -- Doctor login
-- INSERT INTO users_auth (id, phone, role, is_verified)
-- VALUES (
--   UUID(),
--   '9876543210',
--   'doctor',
--   true
-- );

-- -- Patient login
-- INSERT INTO users_auth (id, phone, role, is_verified)
-- VALUES (
--   UUID(),
--   '9123456789',
--   'patient',
--   true
-- );

-- INSERT INTO doctors (
--   id,
--   user_auth_id,
--   name,
--   email,
--   phone,
--   profile_image_url,
--   specialization,
--   experience,
--   patients_treated_count,
--   reports_submitted_count,
--   exercises_created_count
-- )
-- VALUES (
--   'doc-111',
--   (SELECT id FROM users_auth WHERE phone='9876543210'),
--   'Dr. Arjun Kumar',
--   'arjun@hospital.com',
--   '9876543210',
--   'https://s3.amazonaws.com/demo/doctor_arjun.jpg',
--   'Physiotherapy',
--   10,
--   45,
--   120,
--   18
-- );

-- INSERT INTO patients (
--   id,
--   user_auth_id,
--   doctor_id,
--   name,
--   age,
--   gender,
--   phone,
--   email,
--   profile_photo_url,
--   registered_on
-- )
-- VALUES (
--   'pat-111',
--   (SELECT id FROM users_auth WHERE phone='9123456789'),
--   'doc-111',
--   'Rahul Verma',
--   28,
--   'male',
--   '9123456789',
--   'rahul@gmail.com',
--   'https://s3.amazonaws.com/demo/patient_rahul.jpg',
--   CURDATE()
-- );

-- INSERT INTO programs (
--   id,
--   doctor_id,
--   name,
--   description,
--   status,
--   total_minutes
-- )
-- VALUES (
--   'prog-ankle',
--   'doc-111',
--   'Ankle Rehab Program',
--   'Exercises for ankle strength and mobility',
--   'published',
--   30
-- );

-- INSERT INTO exercises (
--   id,
--   doctor_id,
--   title,
--   description,
--   video_s3_url,
--   duration_minutes,
--   category,
--   status,
--   created_by
-- )
-- VALUES
-- (
--   'ex-ankle-1',
--   'doc-111',
--   'Ankle Rotation',
--   'Rotation exercise to improve flexibility',
--   'https://s3.amazonaws.com/demo/ankle_rotation.mp4',
--   5,
--   'ankle',
--   'published',
--   'doc-111'
-- ),
-- (
--   'ex-ankle-2',
--   'doc-111',
--   'Toe Raises',
--   'Strengthens ankle muscles',
--   'https://s3.amazonaws.com/demo/toe_raise.mp4',
--   7,
--   'ankle',
--   'published',
--   'doc-111'
-- );

-- INSERT INTO program_exercises (
--   id,
--   program_id,
--   exercise_id,
--   sets,
--   reps
-- )
-- VALUES
-- (UUID(), 'prog-ankle', 'ex-ankle-1', 3, 15),
-- (UUID(), 'prog-ankle', 'ex-ankle-2', 3, 15);

-- INSERT INTO patient_programs (
--   id,
--   patient_id,
--   program_id,
--   assigned_by,
--   start_date,
--   end_date
-- )
-- VALUES (
--   UUID(),
--   'pat-111',
--   'prog-ankle',
--   'doc-111',
--   CURDATE(),
--   DATE_ADD(CURDATE(), INTERVAL 14 DAY)
-- );

-- INSERT INTO exercise_progress (
--   id,
--   patient_id,
--   exercise_id,
--   watched_seconds,
--   total_seconds,
--   completed
-- )
-- VALUES (
--   UUID(),
--   'pat-111',
--   'ex-ankle-1',
--   240,
--   300,
--   false
-- );

-- INSERT INTO feedback (
--   id,
--   patient_id,
--   program_id,
--   exercise_id,
--   pain_level,
--   difficulty,
--   notes
-- )
-- VALUES (
--   UUID(),
--   'pat-111',
--   'prog-ankle',
--   'ex-ankle-1',
--   4,
--   'moderate',
--   'Mild pain while rotating'
-- );
-- -- -----------------------------------------------------------------------
-- SELECT
--   d.name AS doctor,
--   p.name AS patient,
--   pr.name AS program,
--   e.title AS exercise,
--   pe.sets,
--   pe.reps,
--   ep.watched_seconds,
--   ep.total_seconds,
--   ep.completed,
--   f.pain_level,
--   f.difficulty,
--   f.notes
-- FROM doctors d
-- JOIN patients p ON p.doctor_id = d.id
-- JOIN patient_programs pp ON pp.patient_id = p.id
-- JOIN programs pr ON pr.id = pp.program_id
-- JOIN program_exercises pe ON pe.program_id = pr.id
-- JOIN exercises e ON e.id = pe.exercise_id
-- LEFT JOIN exercise_progress ep
--   ON ep.patient_id = p.id AND ep.exercise_id = e.id
-- LEFT JOIN feedback f
--   ON f.patient_id = p.id AND f.exercise_id = e.id;


-- SELECT * FROM otp_verification ORDER BY created_at DESC;

-- SELECT name, patients_treated_count, exercises_created_count
-- FROM doctors;

-- SELECT * FROM patient_programs;

-- SELECT * FROM exercise_progress;

-- SELECT * FROM feedback;

-- SELECT d.name AS doctor, p.name AS patient
-- FROM doctors d
-- JOIN patients p ON p.doctor_id = d.id;


-- INSERT INTO doctors (id, name, specialization)
-- VALUES
-- ('d1', 'Dr. Vinoth Kumar', 'Physiotherapy'),
-- ('d2', 'Dr. Meena Rao', 'Orthopedics');


-- SELECT
--   d.name AS doctor,
--   p.name AS patient,
--   pr.name AS program,
--   e.title AS exercise,
--   pe.sets,
--   pe.reps,
--   ep.watched_seconds,
--   ep.total_seconds,
--   ep.completed,
--   f.pain_level,
--   f.difficulty,
--   f.notes
-- FROM doctors d
-- JOIN patients p ON p.doctor_id = d.id
-- JOIN patient_programs pp ON pp.patient_id = p.id
-- JOIN programs pr ON pr.id = pp.program_id
-- JOIN program_exercises pe ON pe.program_id = pr.id
-- JOIN exercises e ON e.id = pe.exercise_id
-- LEFT JOIN exercise_progress ep
--   ON ep.patient_id = p.id AND ep.exercise_id = e.id
-- LEFT JOIN feedback f
--   ON f.patient_id = p.id AND f.exercise_id = e.id;

-- select* from patients;
-- select* from doctors;
-- select * from user_auth;
-- INSERT INTO doctors (id, name, phone)
-- VALUES (
--   'PASTE_JWT_USER_ID_HERE',
--   'Dr Demo',
--   '9999999999'
-- );


-- SELECT * FROM users_auth WHERE phone = '9876543210'; 
-- SELECT * FROM doctors WHERE id = "some-uuid";


-- -- --------- patient dashbord
-- SELECT
--   pr.id AS program_id,
--   pr.name AS program_name,
--   pr.total_minutes,

--   e.id AS exercise_id,
--   e.title AS exercise_title,
--   e.duration_minutes,

--   ep.watched_seconds,
--   ep.total_seconds,
--   ep.completed,

--   CASE 
--     WHEN f.id IS NULL THEN false
--     ELSE true
--   END AS feedback_given

-- FROM patients pat
-- JOIN patient_programs pp ON pp.patient_id = pat.id
-- JOIN programs pr ON pr.id = pp.program_id
-- JOIN program_exercises pe ON pe.program_id = pr.id
-- JOIN exercises e ON e.id = pe.exercise_id

-- LEFT JOIN exercise_progress ep
--   ON ep.exercise_id = e.id AND ep.patient_id = pat.id

-- LEFT JOIN feedback f
--   ON f.exercise_id = e.id AND f.patient_id = pat.id

-- WHERE pat.user_auth_id = ?
-- ORDER BY pr.created_at, e.title;

-- --  ACTIVITY LOGS
-- CREATE TABLE activity_logs (
--   id CHAR(36) PRIMARY KEY,
--   user_id CHAR(36),
--   role ENUM('doctor','patient','admin'),
--   action VARCHAR(100),
--   entity_type VARCHAR(50),
--   entity_id CHAR(36),
--   metadata JSON,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );


-- -- -----------------------------------------------------------------------
-- SHOW TABLES;

-- -- Relationship
-- SELECT
--   TABLE_NAME,
--   COLUMN_NAME,
--   REFERENCED_TABLE_NAME
-- FROM information_schema.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = 'hospital_app'
-- AND REFERENCED_TABLE_NAME IS NOT NULL;

-- SELECT id, phone, role, is_verified FROM users_auth;

-- -- doc
-- SELECT d.name AS doctor, u.phone
-- FROM doctors d
-- JOIN users_auth u ON u.id = d.user_auth_id;
-- -- patient
-- SELECT p.name AS patient, u.phone
-- FROM patients p
-- JOIN users_auth u ON u.id = p.user_auth_id;	

--  -- programs
-- SELECT id, name, doctor_id, total_minutes FROM programs;

-- -- exercises
-- SELECT id, title, category, duration_minutes FROM exercises;

-- -- Show program → exercise mapping
-- SELECT
--   pr.name AS program,
--   e.title AS exercise,
--   pe.sets,
--   pe.reps
-- FROM program_exercises pe
-- JOIN programs pr ON pr.id = pe.program_id
-- JOIN exercises e ON e.id = pe.exercise_id;

-- -- Show program assigned to patient
-- SELECT
--   p.name AS patient,
--   pr.name AS program,
--   pp.start_date,
--   pp.status
-- FROM patient_programs pp
-- JOIN patients p ON p.id = pp.patient_id
-- JOIN programs pr ON pr.id = pp.program_id;


-- -- Patient flow
-- SELECT
--   p.name AS patient,
--   e.title AS exercise,
--   ep.watched_seconds,
--   ep.total_seconds,
--   ep.completed
-- FROM exercise_progress ep
-- JOIN patients p ON p.id = ep.patient_id
-- JOIN exercises e ON e.id = ep.exercise_id;

-- -- feedback
-- SELECT
--   p.name AS patient,
--   e.title AS exercise,
--   f.pain_level,
--   f.difficulty,
--   f.notes
-- FROM feedback f
-- JOIN patients p ON p.id = f.patient_id
-- JOIN exercises e ON e.id = f.exercise_id;

 
--  -- doc dashboard
-- SELECT
--   p.name AS patient,
--   pr.name AS program,
--   COUNT(e.id) AS total_exercises,
--   SUM(ep.completed) AS completed_exercises
-- FROM patient_programs pp
-- JOIN patients p ON p.id = pp.patient_id
-- JOIN programs pr ON pr.id = pp.program_id
-- JOIN program_exercises pe ON pe.program_id = pr.id
-- JOIN exercises e ON e.id = pe.exercise_id
-- LEFT JOIN exercise_progress ep
--   ON ep.exercise_id = e.id AND ep.patient_id = p.id
-- GROUP BY p.id, pr.id;



-- --        DEMO ---------------
-- DELETE FROM patient_programs;
-- DELETE FROM program_exercises;
-- DELETE FROM exercise_progress;
-- DELETE FROM feedback;
-- DELETE FROM exercises;
-- DELETE FROM programs;
-- DELETE FROM patients;
-- DELETE FROM doctors;
-- DELETE FROM users_auth;


-- -- Doctor user
-- INSERT INTO users_auth (id, phone, role, is_verified)
-- VALUES (UUID(), '9000000001', 'doctor', true);

-- -- Patient user
-- INSERT INTO users_auth (id, phone, role, is_verified)
-- VALUES (UUID(), '9000000002', 'patient', true);

-- SELECT id, phone, role FROM users_auth;

-- INSERT INTO doctors (id, user_auth_id, name, phone, specialization)
-- VALUES (
--   UUID(),
--   (SELECT id FROM users_auth WHERE phone='9000000001'),
--   'Dr Demo',
--   '9000000001',
--   'Physiotherapy'
-- );

-- SELECT id, name, phone FROM doctors;

-- INSERT INTO patients (id, user_auth_id, doctor_id, name, phone)
-- VALUES (
--   UUID(),
--   (SELECT id FROM users_auth WHERE phone='9000000002'),
--   (SELECT id FROM doctors WHERE phone='9000000001'),
--   'Demo Patient',
--   '9000000002'
-- );

-- SELECT id, name, phone FROM patients;

-- SELECT id, name, doctor_id FROM programs;




-- INSERT INTO patient_programs
-- (id, patient_id, program_id, assigned_by, start_date, status)
-- VALUES (
--   UUID(),
--   'd67e2754-dfce-11f0-a24a-581122dde31b',
--   'f7d1a032-52f8-42cd-b12f-eb17755d23c8',
--   'cc6c6509-dfce-11f0-a24a-581122dde31b',
--   CURDATE(),
--   'active'
-- );

-- SELECT * FROM patient_programs;
-- SELECT id, phone, role FROM users_auth;











CREATE DATABASE IF NOT EXISTS hospital_app;

CREATE TABLE users_auth (
  id CHAR(36) PRIMARY KEY,
  phone VARCHAR(20) UNIQUE,
  role ENUM('doctor','patient','admin'),
  is_verified BOOLEAN DEFAULT false
);

CREATE TABLE otp_verification (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
  id CHAR(36) PRIMARY KEY,
  user_auth_id CHAR(36) UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  specialization VARCHAR(100),
  experience INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_auth_id) REFERENCES users_auth(id)
);

CREATE TABLE patients (
  id CHAR(36) PRIMARY KEY,
  user_auth_id CHAR(36) UNIQUE,
  doctor_id CHAR(36),
  name VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_auth_id) REFERENCES users_auth(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE programs (
  id CHAR(36) PRIMARY KEY,
  doctor_id CHAR(36),
  name VARCHAR(150),
  description TEXT,
  total_minutes INT,
  status ENUM('draft','published') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE exercises (
  id CHAR(36) PRIMARY KEY,
  doctor_id CHAR(36),
  title VARCHAR(150),
  video_s3_url TEXT,
  duration_minutes INT,
  category VARCHAR(100),
  status ENUM('draft','published') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE program_exercises (
  id CHAR(36) PRIMARY KEY,
  program_id CHAR(36),
  exercise_id CHAR(36),
  sets INT DEFAULT 3,
  reps INT DEFAULT 15,
  FOREIGN KEY (program_id) REFERENCES programs(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id),
  UNIQUE(program_id, exercise_id)
);

CREATE TABLE patient_programs (
  id CHAR(36) PRIMARY KEY,
  patient_id CHAR(36),
  program_id CHAR(36),
  assigned_by CHAR(36),
  start_date DATE,
  status ENUM('active','completed') DEFAULT 'active',
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (program_id) REFERENCES programs(id),
  FOREIGN KEY (assigned_by) REFERENCES doctors(id)
);

CREATE TABLE exercise_progress (
  id CHAR(36) PRIMARY KEY,
  patient_id CHAR(36),
  exercise_id CHAR(36),
  completed BOOLEAN DEFAULT false,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id),
  UNIQUE(patient_id, exercise_id)
);
