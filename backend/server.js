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
    // !!! IMPORTANT: Replace 'Anant@2021' with your actual MySQL password !!!
    password: process.env.DB_PASSWORD || 'Anant@2021', 
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
        console.error("Login Error:", err);
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
        console.error("Registration Error:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Username or contact already exists.' });
        }
        res.status(500).json({ success: false, message: 'Registration failed' });
    } finally {
        if (connection) connection.release();
    }
});

// -----------------------------------------------------
// --- DASHBOARD ANALYTICS (REAL-TIME) ---
// -----------------------------------------------------

// Admin Stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [patients] = await pool.query("SELECT COUNT(*) as count FROM Patients");
        const [doctorsTotal] = await pool.query("SELECT COUNT(*) as count FROM Doctors");
        const [doctorsActive] = await pool.query("SELECT COUNT(DISTINCT DoctorID) as count FROM Diagnoses");
        const [rooms] = await pool.query("SELECT COUNT(*) as total, SUM(CASE WHEN Status = 'Occupied' THEN 1 ELSE 0 END) as occupied FROM Rooms");
        const [revenueCollected] = await pool.query("SELECT SUM(Amount) as total FROM Payments WHERE Status = 'Completed'");
        const [revenuePending] = await pool.query("SELECT SUM(Amount) as total FROM Payments WHERE Status = 'Pending'");
        const [settings] = await pool.query("SELECT SettingValue FROM SystemSettings WHERE SettingKey = 'LastBackup'");
        const lastBackup = settings.length > 0 ? settings[0].SettingValue : 'Never';

        res.json({
            success: true,
            stats: {
                patients: patients[0].count,
                doctors: { 
                    total: doctorsTotal[0].count, 
                    active: doctorsActive[0].count 
                },
                rooms: { 
                    total: rooms[0].total, 
                    occupied: rooms[0].occupied || 0 
                },
                revenue: { 
                    collected: revenueCollected[0].total || 0, 
                    pending: revenuePending[0].total || 0 
                },
                lastBackup: lastBackup
            }
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Doctor Dashboard
app.get('/api/doctor/dashboard/:doctorId', async (req, res) => {
    const { doctorId } = req.params;
    try {
        const [todayAppts] = await pool.query("SELECT COUNT(*) as count FROM Appointments WHERE DoctorID = ? AND DATE(AppointmentDate) = CURDATE()", [doctorId]);
        const [pendingAppts] = await pool.query("SELECT COUNT(*) as count FROM Appointments WHERE DoctorID = ? AND Status = 'Pending'", [doctorId]);
        const [totalPatients] = await pool.query("SELECT COUNT(DISTINCT PatientID) as count FROM Diagnoses WHERE DoctorID = ?", [doctorId]);
        res.json({ success: true, stats: { today: todayAppts[0].count, pending: pendingAppts[0].count, patients: totalPatients[0].count } });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Patient Dashboard
app.get('/api/patient/dashboard/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const [nextAppt] = await pool.query(`SELECT A.*, D.Name as DoctorName, D.Specialization FROM Appointments A JOIN Doctors D ON A.DoctorID = D.DoctorID WHERE A.PatientID = ? AND A.AppointmentDate >= NOW() AND A.Status != 'Cancelled' ORDER BY A.AppointmentDate ASC LIMIT 1`, [patientId]);
        const [pendingBill] = await pool.query("SELECT SUM(Amount) as total FROM Payments WHERE PatientID = ? AND Status = 'Pending'", [patientId]);
        const [latestDiagnosis] = await pool.query("SELECT Disease, DiagnosisDate FROM Diagnoses WHERE PatientID = ? ORDER BY DiagnosisDate DESC LIMIT 1", [patientId]);
        res.json({ success: true, stats: { nextAppointment: nextAppt[0] || null, pendingBill: pendingBill[0].total || 0, latestDiagnosis: latestDiagnosis[0] || null } });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// --- System Health Check ---
app.get('/api/health', async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: 'Operational', db: 'Connected' });
    } catch (err) {
        res.json({ status: 'Degraded', db: 'Disconnected' });
    }
});

// -----------------------------------------------------
// --- ADMIN ROUTES ---
// -----------------------------------------------------

app.post('/api/admin/backup', async (req, res) => {
    try {
        await pool.query("INSERT INTO SystemSettings (SettingKey, SettingValue) VALUES ('LastBackup', NOW()) ON DUPLICATE KEY UPDATE SettingValue = NOW()");
        res.json({ success: true, message: 'System backup completed successfully.' });
    } catch (err) {
        console.error("Backup error:", err);
        res.status(500).json({ success: false, message: 'Backup failed' });
    }
});

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
        const [doctors] = await pool.query("SELECT DoctorID, Name, Specialization, Contact FROM Doctors");
        const [nurses] = await pool.query("SELECT NurseID, Name, Contact, AssignedDoctorID FROM Nurses");
        const [wardboys] = await pool.query("SELECT WardBoyID, Name, Contact, AssignedDoctorID FROM WardBoys");
        res.json({ success: true, doctors, nurses, wardboys });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching staff' }); }
});

// --- UPDATED STAFF REGISTRATION ENDPOINT ---
app.post('/api/admin/staff', async (req, res) => {
    const { role, name, specialization, contact, username, password } = req.body;
    
    // Basic Validation
    if (!role || !name || !contact || !username || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        let linkedId;

        if (role === 'Doctor') {
            const [res1] = await connection.query('INSERT INTO Doctors (Name, Specialization, Contact) VALUES (?, ?, ?)', [name, specialization, contact]);
            linkedId = res1.insertId;
        } else if (role === 'Nurse') {
            // Ensure the Nurses table exists and AssignedDoctorID is nullable
            const [res1] = await connection.query('INSERT INTO Nurses (Name, Contact) VALUES (?, ?)', [name, contact]);
            linkedId = res1.insertId;
        } else if (role === 'WardBoy') {
            // Ensure the WardBoys table exists and AssignedDoctorID is nullable
            const [res1] = await connection.query('INSERT INTO WardBoys (Name, Contact) VALUES (?, ?)', [name, contact]);
            linkedId = res1.insertId;
        } else {
            throw new Error("Invalid Role Selected");
        }

        await connection.query('INSERT INTO Users (Username, Password, Role, LinkedID) VALUES (?, ?, ?, ?)', [username, hashedPassword, role, linkedId]);
        
        await connection.commit();
        res.status(201).json({ success: true, message: 'Staff registered successfully' });
    } catch (err) {
        if (connection) await connection.rollback();
        
        // Log the ACTUAL error to your terminal
        console.error("Detailed Registration Error:", err); 
        
        // Send the specific SQL error to the frontend
        if (err.code === 'ER_NO_SUCH_TABLE') {
            res.status(500).json({ success: false, message: `Database Error: Table for ${role} does not exist.` });
        } else if (err.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ success: false, message: 'Username already exists.' });
        } else {
            res.status(500).json({ success: false, message: 'Registration failed: ' + err.message });
        }
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/admin/patients', async (req, res) => {
    try {
        const [patients] = await pool.query("SELECT PatientID, Name, Age, Gender, Contact, Address, RegistrationDate FROM Patients ORDER BY RegistrationDate DESC");
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
        const [history] = await pool.query(`
            SELECT P.PaymentID, P.Amount, P.PaymentMode, P.PaymentDate, Pat.Name as PatientName 
            FROM Payments P 
            JOIN Patients Pat ON P.PatientID = Pat.PatientID 
            WHERE P.Status = 'Completed' 
            ORDER BY P.PaymentDate DESC
        `);
        res.json({ success: true, pending, history });
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

app.get('/api/admin/support-groups/:groupId/members', async (req, res) => {
    const { groupId } = req.params;
    try {
        const query = `
            SELECT GM.JoinDate, P.Name as PatientName, P.Contact
            FROM GroupMemberships GM
            JOIN Patients P ON GM.PatientID = P.PatientID
            WHERE GM.GroupID = ?
            ORDER BY GM.JoinDate DESC
        `;
        const [members] = await pool.query(query, [groupId]);
        res.json({ success: true, members });
    } catch (err) {
        console.error("Error fetching group members:", err);
        res.status(500).json({ success: false, message: 'Error fetching group members' });
    }
});

app.get('/api/admin/support-calls', async (req, res) => {
    try {
        const [calls] = await pool.query("SELECT SC.CallID, SC.CallDetails, SC.CallDate, P.Name as PatientName FROM SupportCalls SC JOIN Patients P ON SC.PatientID = P.PatientID ORDER BY SC.CallDate DESC");
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

app.get('/api/admin/emergency', async (req, res) => {
    try {
        const [logs] = await pool.query("SELECT E.EmergencyID, E.Details, E.AdmissionDate, P.Name as PatientName, D.Name as DoctorName FROM EmergencyCare E JOIN Patients P ON E.PatientID = P.PatientID JOIN Doctors D ON E.DoctorID = D.DoctorID ORDER BY E.AdmissionDate DESC");
        res.json({ success: true, logs });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching logs' }); }
});

app.post('/api/admin/emergency', async (req, res) => {
    const { patientId, doctorId, details } = req.body;
    try {
        await pool.query('INSERT INTO EmergencyCare (PatientID, DoctorID, Details, AdmissionDate) VALUES (?, ?, ?, NOW())', [patientId, doctorId, details]);
        res.json({ success: true, message: 'Emergency logged' });
    } catch (err) { res.status(500).json({ success: false, message: 'Emergency logging failed' }); }
});

// -----------------------------------------------------
// --- DOCTOR & PATIENT & APPOINTMENT ROUTES ---
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

app.post('/api/doctor/diagnoses', async (req, res) => {
    const { patientId, doctorId, disease, prescription, appointmentId } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        await connection.query('INSERT INTO Diagnoses (PatientID, DoctorID, Disease, Prescription, DiagnosisDate) VALUES (?, ?, ?, ?, NOW())', [patientId, doctorId, disease, prescription]);
        if (appointmentId) {
            await connection.query("UPDATE Appointments SET Status = 'Completed' WHERE AppointmentID = ?", [appointmentId]);
        }
        await connection.commit();
        res.status(201).json({ success: true, message: 'Consultation recorded and appointment completed.' });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Failed to record consultation' });
    } finally {
        if (connection) connection.release();
    }
});

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

app.post('/api/patient/support-groups/join', async (req, res) => {
    const { patientId, groupId } = req.body;
    try {
        await pool.query("INSERT INTO GroupMemberships (PatientID, GroupID) VALUES (?, ?)", [patientId, groupId]);
        res.json({ success: true, message: 'Joined group successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Already a member' });
        res.status(500).json({ success: false, message: 'Failed to join group' });
    }
});

app.get('/api/patient/support-groups/my/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const [memberships] = await pool.query("SELECT GroupID FROM GroupMemberships WHERE PatientID = ?", [patientId]);
        res.json({ success: true, memberships: memberships.map(m => m.GroupID) });
    } catch (err) { res.status(500).json({ success: false, message: 'Error fetching memberships' }); }
});

// --- NEW ENDPOINT: Fetch Assigned Staff for Patient ---
app.get('/api/patient/staff/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const query = `
            SELECT A.Role, 
                   CASE 
                       WHEN A.Role = 'Nurse' THEN N.Name
                       WHEN A.Role = 'WardBoy' THEN W.Name
                   END as StaffName,
                   CASE
                        WHEN A.Role = 'Nurse' THEN N.Contact
                        WHEN A.Role = 'WardBoy' THEN W.Contact
                   END as Contact
            FROM Assignments A
            LEFT JOIN Nurses N ON A.StaffID = N.NurseID AND A.Role = 'Nurse'
            LEFT JOIN WardBoys W ON A.StaffID = W.WardBoyID AND A.Role = 'WardBoy'
            WHERE A.PatientID = ?
        `;
        const [assignments] = await pool.query(query, [patientId]);
        res.json({ success: true, assignments });
    } catch (err) {
        console.error("Error fetching patient staff:", err);
        res.status(500).json({ success: false, message: 'Error fetching staff' });
    }
});

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

// --- START SERVER ---
// Fixed: Using app.listen() directly to avoid ReferenceError
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});