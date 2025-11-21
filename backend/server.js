const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt'); 

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MySQL Connection Pool ---
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anant@2021', // !! Verify your password
    database: process.env.DB_NAME || 'HealthcareDB'
};

const pool = mysql.createPool(dbConfig);
const saltRounds = 10; 

// -----------------------------------------------------
// --- AUTHENTICATION API ---
// -----------------------------------------------------
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });

    try {
        const [users] = await pool.query('SELECT UserID, Role, LinkedID, Password FROM Users WHERE Username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.Password);
        
        if (match) {
            res.json({ success: true, role: user.Role, id: user.LinkedID, userId: user.UserID });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Login error' });
    }
});

app.post('/api/register', async (req, res) => {
    const { name, age, gender, address, contact, username, password } = req.body;
    if (!name || !username || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

    let connection;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [res1] = await connection.query('INSERT INTO Patients (Name, Age, Gender, Address, Contact) VALUES (?, ?, ?, ?, ?)', [name, age, gender, address, contact]);
        const newPatientID = res1.insertId;
        await connection.query('INSERT INTO Users (Username, Password, Role, LinkedID) VALUES (?, ?, ?, ?)', [username, hashedPassword, 'Patient', newPatientID]);

        await connection.commit();
        res.status(201).json({ success: true, message: 'Registration successful. Please log in.' });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Registration failed' });
    } finally {
        if (connection) connection.release();
    }
});

// -----------------------------------------------------
// --- ADMIN ROUTES ---
// -----------------------------------------------------
app.get('/api/admin/rooms', async (req, res) => {
    try {
        const [allRooms] = await pool.query("SELECT * FROM Rooms ORDER BY RoomID");
        const [occupied] = await pool.query("SELECT * FROM v_admitted_patients");
        res.json({ success: true, allRooms, occupiedRoomsDetails: occupied });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching rooms' }); }
});

app.post('/api/admin/rooms', async (req, res) => {
    const { roomType, status } = req.body;
    try {
        await pool.query("INSERT INTO Rooms (RoomType, Status) VALUES (?, ?)", [roomType, status]);
        res.status(201).json({ success: true, message: 'Room created' });
    } catch (err) { res.status(500).json({ success: false, message: 'Error creating room' }); }
});

app.get('/api/admin/unassigned-patients', async (req, res) => {
    try {
        const [patients] = await pool.query("SELECT PatientID, Name FROM Patients WHERE CurrentRoomID IS NULL");
        res.json({ success: true, patients });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching patients' }); }
});

app.post('/api/admin/admit', async (req, res) => {
    const { patientId, roomId } = req.body;
    try {
        await pool.query("CALL sp_admit_patient(?, ?)", [patientId, roomId]);
        res.json({ success: true, message: 'Patient admitted' });
    } catch (err) { res.status(500).json({ success: false, message: 'Admission failed' }); }
});

app.post('/api/admin/discharge', async (req, res) => {
    const { patientId } = req.body;
    try {
        const [res1] = await pool.query("UPDATE Patients SET CurrentRoomID = NULL WHERE PatientID = ?", [patientId]);
        if (res1.affectedRows === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.json({ success: true, message: 'Patient discharged' });
    } catch (err) { res.status(500).json({ success: false, message: 'Discharge failed' }); }
});

app.get('/api/admin/staff', async (req, res) => {
    try {
        const [doctors] = await pool.query("SELECT DoctorID, Name, Specialization FROM Doctors");
        const [nurses] = await pool.query("SELECT NurseID, Name FROM Nurses");
        const [wardboys] = await pool.query("SELECT WardBoyID, Name FROM WardBoys");
        res.json({ success: true, doctors, nurses, wardboys });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching staff' }); }
});

app.post('/api/admin/staff', async (req, res) => {
    const { role, name, specialization, contact, username, password } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const hashed = await bcrypt.hash(password, saltRounds);
        let linkedId;

        if (role === 'Doctor') {
            const [res1] = await connection.query('INSERT INTO Doctors (Name, Specialization, Contact) VALUES (?, ?, ?)', [name, specialization, contact]);
            linkedId = res1.insertId;
        } else if (role === 'Nurse') {
            const [res1] = await connection.query('INSERT INTO Nurses (Name, Contact) VALUES (?, ?)', [name, contact]);
            linkedId = res1.insertId;
        } else if (role === 'WardBoy') {
            const [res1] = await connection.query('INSERT INTO WardBoys (Name, Contact) VALUES (?, ?)', [name, contact]);
            linkedId = res1.insertId;
        }

        await connection.query('INSERT INTO Users (Username, Password, Role, LinkedID) VALUES (?, ?, ?, ?)', [username, hashed, role, linkedId]);
        await connection.commit();
        res.status(201).json({ success: true, message: 'Staff registered' });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Staff registration failed' });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/admin/patients', async (req, res) => {
    try {
        const [patients] = await pool.query("SELECT PatientID, Name FROM Patients");
        res.json({ success: true, patients });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching patients' }); }
});

app.post('/api/admin/assignments', async (req, res) => {
    const { staffId, patientId, role } = req.body;
    try {
        await pool.query('INSERT INTO Assignments (StaffID, PatientID, Role) VALUES (?, ?, ?)', [staffId, patientId, role]);
        res.json({ success: true, message: 'Staff assigned' });
    } catch (err) { res.status(500).json({ success: false, message: 'Assignment failed' }); }
});

app.get('/api/admin/billing', async (req, res) => {
    try {
        const [pending] = await pool.query("SELECT * FROM v_pending_payments");
        res.json({ success: true, pending });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching bills' }); }
});

app.post('/api/admin/billing', async (req, res) => {
    const { patientId, amount, paymentMode } = req.body;
    try {
        await pool.query('INSERT INTO Payments (PatientID, Amount, PaymentMode, Status) VALUES (?, ?, ?, "Pending")', [patientId, amount, paymentMode]);
        res.json({ success: true, message: 'Bill created' });
    } catch (err) { res.status(500).json({ success: false, message: 'Bill creation failed' }); }
});

app.get('/api/support-groups', async (req, res) => {
    try {
        const [groups] = await pool.query("SELECT * FROM SupportGroups");
        res.json({ success: true, groups });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching groups' }); }
});

app.post('/api/admin/support-groups', async (req, res) => {
    const { groupName, description, meetingTime } = req.body;
    try {
        await pool.query('INSERT INTO SupportGroups (GroupName, Description, MeetingTime) VALUES (?, ?, ?)', [groupName, description, meetingTime]);
        res.json({ success: true, message: 'Group created' });
    } catch (err) { res.status(500).json({ success: false, message: 'Creation failed' }); }
});

app.get('/api/admin/support-calls', async (req, res) => {
    try {
        const query = `
            SELECT SC.CallID, SC.CallDetails, SC.CallDate, P.Name as PatientName 
            FROM SupportCalls SC 
            JOIN Patients P ON SC.PatientID = P.PatientID 
            ORDER BY SC.CallDate DESC
        `;
        const [calls] = await pool.query(query);
        res.json({ success: true, calls });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching logs' }); }
});

app.post('/api/admin/support-calls', async (req, res) => {
    const { patientId, details } = req.body;
    try {
        await pool.query('INSERT INTO SupportCalls (PatientID, CallDetails, CallDate) VALUES (?, ?, NOW())', [patientId, details]);
        res.json({ success: true, message: 'Call logged' });
    } catch (err) { res.status(500).json({ success: false, message: 'Logging failed' }); }
});

app.post('/api/admin/emergency', async (req, res) => {
    const { patientId, doctorId, details } = req.body;
    try {
        await pool.query('INSERT INTO EmergencyCare (PatientID, DoctorID, Details, AdmissionDate) VALUES (?, ?, ?, NOW())', [patientId, doctorId, details]);
        res.json({ success: true, message: 'Emergency logged' });
    } catch (err) { res.status(500).json({ success: false, message: 'Emergency logging failed' }); }
});

// -----------------------------------------------------
// --- DOCTOR ROUTES ---
// -----------------------------------------------------
app.get('/api/doctor/patients/:doctorId', async (req, res) => {
    const { doctorId } = req.params;
    try {
        const query = `SELECT DISTINCT P.PatientID, P.Name, P.Age, P.Gender, P.Contact FROM Patients P JOIN Diagnoses D ON P.PatientID = D.PatientID WHERE D.DoctorID = ? ORDER BY P.Name`;
        const [patients] = await pool.query(query, [doctorId]);
        res.json({ success: true, patients });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching patients' }); }
});

app.get('/api/doctor/patient-history/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const [patient] = await pool.query("SELECT * FROM Patients WHERE PatientID = ?", [patientId]);
        const [diagnoses] = await pool.query("SELECT D.*, Doc.Name as DoctorName, Doc.Specialization FROM Diagnoses D JOIN Doctors Doc ON D.DoctorID = Doc.DoctorID WHERE D.PatientID = ? ORDER BY D.DiagnosisDate DESC", [patientId]);
        res.json({ success: true, patient: patient[0], diagnoses });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching history' }); }
});

// --- MODIFIED: Add Diagnosis AND Complete Appointment ---
app.post('/api/doctor/diagnoses', async (req, res) => {
    const { patientId, doctorId, disease, prescription, appointmentId } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Add the Diagnosis record
        await connection.query(
            'INSERT INTO Diagnoses (PatientID, DoctorID, Disease, Prescription, DiagnosisDate) VALUES (?, ?, ?, ?, NOW())',
            [patientId, doctorId, disease, prescription]
        );

        // 2. If an appointment ID was passed, mark it as Completed
        if (appointmentId) {
            await connection.query(
                "UPDATE Appointments SET Status = 'Completed' WHERE AppointmentID = ?",
                [appointmentId]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Consultation recorded and appointment completed.' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error adding diagnosis:", err);
        res.status(500).json({ success: false, message: 'Failed to record consultation' });
    } finally {
        if (connection) connection.release();
    }
});

// -----------------------------------------------------
// --- PATIENT ROUTES ---
// -----------------------------------------------------
app.get('/api/patient/history/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const [diagnoses] = await pool.query("SELECT D.*, Doc.Name as DoctorName, Doc.Specialization FROM Diagnoses D JOIN Doctors Doc ON D.DoctorID = Doc.DoctorID WHERE D.PatientID = ? ORDER BY D.DiagnosisDate DESC", [patientId]);
        res.json({ success: true, diagnoses });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching history' }); }
});

app.get('/api/patient/billing/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const [payments] = await pool.query("SELECT * FROM Payments WHERE PatientID = ? ORDER BY PaymentDate DESC", [patientId]);
        res.json({ success: true, payments });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching billing' }); }
});

app.post('/api/patient/pay', async (req, res) => {
    const { paymentId, patientId } = req.body;
    try {
        const [res1] = await pool.query("UPDATE Payments SET Status = 'Completed', PaymentDate = NOW() WHERE PaymentID = ? AND PatientID = ? AND Status = 'Pending'", [paymentId, patientId]);
        if (res1.affectedRows === 0) return res.status(404).json({ success: false, message: 'Payment not found or complete' });
        res.json({ success: true, message: 'Payment successful' });
    } catch (err) { res.status(500).json({ success: false, message: 'Payment failed' }); }
});

// -----------------------------------------------------
// --- APPOINTMENT ROUTES ---
// -----------------------------------------------------
app.get('/api/doctors', async (req, res) => {
    try {
        const [doctors] = await pool.query("SELECT DoctorID, Name, Specialization FROM Doctors");
        res.json({ success: true, doctors });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching doctors' }); }
});

app.post('/api/appointments', async (req, res) => {
    const { patientId, doctorId, appointmentDate, reason } = req.body;
    try {
        await pool.query("INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, Reason, Status) VALUES (?, ?, ?, ?, 'Pending')", [patientId, doctorId, appointmentDate, reason]);
        res.status(201).json({ success: true, message: 'Appointment booked' });
    } catch (err) { res.status(500).json({ success: false, message: 'Booking failed' }); }
});

app.get('/api/appointments/doctor/:doctorId', async (req, res) => {
    const { doctorId } = req.params;
    try {
        const query = `SELECT A.*, P.Name as PatientName, P.PatientID FROM Appointments A JOIN Patients P ON A.PatientID = P.PatientID WHERE A.DoctorID = ? ORDER BY A.AppointmentDate ASC`;
        const [appointments] = await pool.query(query, [doctorId]);
        res.json({ success: true, appointments });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching appointments' }); }
});

app.get('/api/appointments/patient/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const query = `SELECT A.*, D.Name as DoctorName, D.Specialization FROM Appointments A JOIN Doctors D ON A.DoctorID = D.DoctorID WHERE A.PatientID = ? ORDER BY A.AppointmentDate DESC`;
        const [appointments] = await pool.query(query, [patientId]);
        res.json({ success: true, appointments });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching appointments' }); }
});

app.put('/api/appointments/:appointmentId', async (req, res) => {
    const { appointmentId } = req.params;
    const { status } = req.body;
    try {
        await pool.query("UPDATE Appointments SET Status = ? WHERE AppointmentID = ?", [status, appointmentId]);
        res.json({ success: true, message: `Appointment ${status}` });
    } catch (err) { res.status(500).json({ success: false, message: 'Update failed' }); }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});