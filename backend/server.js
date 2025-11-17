const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MySQL Connection Pool ---
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anant@2021', // !! CHANGE THIS
    database: process.env.DB_NAME || 'HealthcareDB'
};

const pool = mysql.createPool(dbConfig);

// -----------------------------------------------------
// --- AUTHENTICATION API ---
// -----------------------------------------------------
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
        const query = 'SELECT UserID, Role, LinkedID FROM Users WHERE Username = ? AND Password = ?';
        const [users] = await pool.query(query, [username, password]);

        if (users.length > 0) {
            const user = users[0];
            res.json({
                success: true,
                message: 'Login successful',
                role: user.Role,
                id: user.LinkedID,
                userId: user.UserID
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: 'An error occurred during login' });
    }
});

// -----------------------------------------------------
// --- PATIENT REGISTRATION API (with TCL) ---
// -----------------------------------------------------
app.post('/api/register', async (req, res) => {
    const { name, age, gender, address, contact, username, password } = req.body;

    if (!name || !age || !gender || !contact || !username || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const patientQuery = 'INSERT INTO Patients (Name, Age, Gender, Address, Contact) VALUES (?, ?, ?, ?, ?)';
        const [patientResult] = await connection.query(patientQuery, [name, age, gender, address, contact]);
        
        const newPatientID = patientResult.insertId;

        const userQuery = 'INSERT INTO Users (Username, Password, Role, LinkedID) VALUES (?, ?, ?, ?)';
        await connection.query(userQuery, [username, password, 'Patient', newPatientID]);

        await connection.commit();

        res.status(201).json({ 
            success: true, 
            message: 'Patient registered successfully. Please log in.',
            patientId: newPatientID
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Registration error:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Username or contact number already exists.' });
        }
        res.status(500).json({ success: false, message: 'An error occurred during registration.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// -----------------------------------------------------
// --- ADMIN ROUTES ---
// -----------------------------------------------------

// --- Room Management ---
app.get('/api/admin/rooms', async (req, res) => {
    try {
        const [allRooms] = await pool.query("SELECT * FROM Rooms ORDER BY RoomID");
        const [occupiedRoomsDetails] = await pool.query("SELECT * FROM v_admitted_patients");
        res.json({ success: true, allRooms, occupiedRoomsDetails });
    } catch (err) {
        console.error("Error fetching room data:", err);
        res.status(500).json({ success: false, message: 'Server error fetching room data' });
    }
});

app.post('/api/admin/rooms', async (req, res) => {
    const { roomType, status } = req.body;
    try {
        const query = "INSERT INTO Rooms (RoomType, Status) VALUES (?, ?)";
        await pool.query(query, [roomType, status]);
        res.status(201).json({ success: true, message: 'Room created successfully!' });
    } catch (err) {
        console.error("Error creating room:", err);
        res.status(500).json({ success: false, message: 'Server error creating room' });
    }
});

app.get('/api/admin/unassigned-patients', async (req, res) => {
    try {
        const query = "SELECT PatientID, Name FROM Patients WHERE CurrentRoomID IS NULL";
        const [patients] = await pool.query(query);
        res.json({ success: true, patients });
    } catch (err) {
        console.error("Error fetching unassigned patients:", err);
        res.status(500).json({ success: false, message: 'Server error fetching patients' });
    }
});

app.post('/api/admin/admit', async (req, res) => {
    const { patientId, roomId } = req.body;
    try {
        const query = "CALL sp_admit_patient(?, ?)";
        await pool.query(query, [patientId, roomId]);
        res.json({ success: true, message: 'Patient admitted successfully!' });
    } catch (err) {
        console.error("Error admitting patient:", err);
        res.status(500).json({ success: false, message: 'Server error during admission' });
    }
});

app.post('/api/admin/discharge', async (req, res) => {
    const { patientId } = req.body;
    try {
        const query = "UPDATE Patients SET CurrentRoomID = NULL WHERE PatientID = ?";
        const [result] = await pool.query(query, [patientId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Patient not found or not admitted' });
        }
        res.json({ success: true, message: 'Patient discharged successfully! Room is now available.' });
    } catch (err) {
        console.error("Error discharging patient:", err);
        res.status(500).json({ success: false, message: 'Server error during discharge' });
    }
});

// --- Staff Management ---
app.get('/api/admin/staff', async (req, res) => {
    try {
        const [doctors] = await pool.query("SELECT DoctorID, Name, Specialization FROM Doctors");
        const [nurses] = await pool.query("SELECT NurseID, Name, AssignedDoctorID FROM Nurses");
        const [wardboys] = await pool.query("SELECT WardBoyID, Name, AssignedDoctorID FROM WardBoys");
        res.json({ success: true, doctors, nurses, wardboys });
    } catch (err) {
        console.error("Error fetching staff:", err);
        res.status(500).json({ success: false, message: 'Server error fetching staff' });
    }
});

app.post('/api/admin/staff', async (req, res) => {
    const { role, name, specialization, contact, username, password } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        
        let linkedId;
        
        if (role === 'Doctor') {
            const [result] = await connection.query(
                'INSERT INTO Doctors (Name, Specialization, Contact) VALUES (?, ?, ?)',
                [name, specialization, contact]
            );
            linkedId = result.insertId;
        } else if (role === 'Nurse') {
            const [result] = await connection.query('INSERT INTO Nurses (Name, Contact) VALUES (?, ?)', [name, contact]);
            linkedId = result.insertId;
        } else if (role === 'WardBoy') {
            const [result] = await connection.query('INSERT INTO WardBoys (Name, Contact) VALUES (?, ?)', [name, contact]);
            linkedId = result.insertId;
        } else {
            throw new Error('Invalid staff role');
        }

        // Create the user login
        await connection.query(
            'INSERT INTO Users (Username, Password, Role, LinkedID) VALUES (?, ?, ?, ?)',
            [username, password, role, linkedId]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'Staff member registered successfully' });
        
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error registering staff:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Username or contact number already exists.' });
        }
        res.status(500).json({ success: false, message: 'Server error registering staff' });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/admin/patients', async (req, res) => {
    try {
        const [patients] = await pool.query("SELECT PatientID, Name FROM Patients");
        res.json({ success: true, patients });
    } catch (err) {
        console.error("Error fetching all patients:", err);
        res.status(500).json({ success: false, message: 'Server error fetching patients' });
    }
});

app.post('/api/admin/assignments', async (req, res) => {
    const { staffId, patientId, role } = req.body;
    try {
        await pool.query(
            'INSERT INTO Assignments (StaffID, PatientID, Role) VALUES (?, ?, ?)',
            [staffId, patientId, role]
        );
        res.status(201).json({ success: true, message: 'Staff assigned successfully' });
    } catch (err) {
        console.error("Error assigning staff:", err);
        res.status(500).json({ success: false, message: 'Server error assigning staff' });
    }
});

// --- Billing Management ---
app.get('/api/admin/billing', async (req, res) => {
    try {
        // Use the view for pending payments
        const [pending] = await pool.query("SELECT * FROM v_pending_payments");
        res.json({ success: true, pending });
    } catch (err) {
        console.error("Error fetching pending bills:", err);
        res.status(500).json({ success: false, message: 'Server error fetching bills' });
    }
});

app.post('/api/admin/billing', async (req, res) => {
    const { patientId, amount, paymentMode } = req.body;
    try {
        await pool.query(
            'INSERT INTO Payments (PatientID, Amount, PaymentMode, Status) VALUES (?, ?, ?, ?)',
            [patientId, amount, paymentMode, 'Pending']
        );
        res.status(201).json({ success: true, message: 'Bill created successfully' });
    } catch (err) {
        console.error("Error creating bill:", err);
        res.status(500).json({ success: false, message: 'Server error creating bill' });
    }
});

// --- Support & Emergency ---
app.get('/api/support-groups', async (req, res) => {
    try {
        const [groups] = await pool.query("SELECT * FROM SupportGroups");
        res.json({ success: true, groups });
    } catch (err) {
        console.error("Error fetching support groups:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/admin/support-groups', async (req, res) => {
    const { groupName, description, meetingTime } = req.body;
    try {
        await pool.query(
            'INSERT INTO SupportGroups (GroupName, Description, MeetingTime) VALUES (?, ?, ?)',
            [groupName, description, meetingTime]
        );
        res.status(201).json({ success: true, message: 'Support group created' });
    } catch (err) {
        console.error("Error creating support group:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/admin/support-calls', async (req, res) => {
    const { patientId, details } = req.body;
    try {
        await pool.query(
            'INSERT INTO SupportCalls (PatientID, CallDetails, CallDate) VALUES (?, ?, NOW())',
            [patientId, details]
        );
        res.status(201).json({ success: true, message: 'Support call logged' });
    } catch (err) {
        console.error("Error logging call:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/admin/emergency', async (req, res) => {
    const { patientId, doctorId, details } = req.body;
    try {
        await pool.query(
            'INSERT INTO EmergencyCare (PatientID, DoctorID, Details, AdmissionDate) VALUES (?, ?, ?, NOW())',
            [patientId, doctorId, details]
        );
        res.status(D01).json({ success: true, message: 'Emergency case logged' });
    } catch (err) {
        console.error("Error logging emergency:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// -----------------------------------------------------
// --- DOCTOR ROUTES ---
// -----------------------------------------------------

app.get('/api/doctor/patients/:doctorId', async (req, res) => {
    const { doctorId } = req.params;
    try {
        const query = `
            SELECT DISTINCT
                P.PatientID, P.Name, P.Age, P.Gender, P.Contact
            FROM Patients P
            JOIN Diagnoses D ON P.PatientID = D.PatientID
            WHERE D.DoctorID = ?
            ORDER BY P.Name;
        `;
        const [patients] = await pool.query(query, [doctorId]);
        res.json({ success: true, patients: patients });
    } catch (err) {
        console.error("Error fetching doctor's patients:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/doctor/patient-history/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const [patient] = await pool.query("SELECT * FROM Patients WHERE PatientID = ?", [patientId]);
        const [diagnoses] = await pool.query(
            "SELECT D.*, Doc.Name as DoctorName FROM Diagnoses D JOIN Doctors Doc ON D.DoctorID = Doc.DoctorID WHERE D.PatientID = ? ORDER BY D.DiagnosisDate DESC",
            [patientId]
        );
        res.json({ success: true, patient: patient[0], diagnoses });
    } catch (err) {
        console.error("Error fetching patient history:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/doctor/diagnoses', async (req, res) => {
    const { patientId, doctorId, disease, prescription } = req.body;
    try {
        await pool.query(
            'INSERT INTO Diagnoses (PatientID, DoctorID, Disease, Prescription, DiagnosisDate) VALUES (?, ?, ?, ?, NOW())',
            [patientId, doctorId, disease, prescription]
        );
        res.status(201).json({ success: true, message: 'Diagnosis added successfully' });
    } catch (err) {
        console.error("Error adding diagnosis:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// -----------------------------------------------------
// --- PATIENT ROUTES ---
// -----------------------------------------------------

app.get('/api/patient/history/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const [diagnoses] = await pool.query(
            "SELECT D.*, Doc.Name as DoctorName, Doc.Specialization FROM Diagnoses D JOIN Doctors Doc ON D.DoctorID = Doc.DoctorID WHERE D.PatientID = ? ORDER BY D.DiagnosisDate DESC",
            [patientId]
        );
        res.json({ success: true, diagnoses });
    } catch (err) {
        console.error("Error fetching patient history:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/patient/billing/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const [payments] = await pool.query(
            "SELECT * FROM Payments WHERE PatientID = ? ORDER BY PaymentDate DESC",
            [patientId]
        );
        res.json({ success: true, payments });
    } catch (err) {
        console.error("Error fetching patient billing:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// --- NEW: Make a Payment (TCL) ---
app.post('/api/patient/pay', async (req, res) => {
    const { paymentId, patientId } = req.body;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Update the payment status and date
        const query = "UPDATE Payments SET Status = 'Completed', PaymentDate = NOW() WHERE PaymentID = ? AND PatientID = ? AND Status = 'Pending'";
        const [result] = await connection.query(query, [paymentId, patientId]);

        if (result.affectedRows === 0) {
            throw new Error('Payment not found or already completed.');
        }

        // You could add other actions here, like updating an "accounts" table
        // For now, we just commit the change.
        await connection.commit();

        res.json({ success: true, message: 'Payment successful!' });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Payment error:", err);
        res.status(500).json({ success: false, message: err.message || 'Payment failed.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// --- Start Server ---
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});