const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); // Allow cross-origin requests (from React)
app.use(express.json()); // Parse incoming JSON bodies

// --- MySQL Connection Pool ---
// Use environment variables for security
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your_mysql_password', // !! CHANGE THIS
    database: process.env.DB_NAME || 'HealthcareDB' // Assumes you create a DB named this
};

const pool = mysql.createPool(dbConfig);

// --- API Test Route ---
app.get('/api/test', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT NOW() as now');
        res.json({ success: true, time: rows[0].now });
    } catch (err) {
        console.error("Database connection error:", err);
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

// -----------------------------------------------------
// --- AUTHENTICATION API (CRITICAL FOR ROLES) ---
// -----------------------------------------------------
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
        // !! IN A REAL APP, DO NOT STORE PLAIN TEXT PASSWORDS!
        // Use a library like 'bcrypt' to hash passwords on registration
        // and 'bcrypt.compare(password, user.Password)' here.
        const query = 'SELECT UserID, Role, LinkedID FROM Users WHERE Username = ? AND Password = ?';
        const [users] = await pool.query(query, [username, password]);

        if (users.length > 0) {
            const user = users[0];
            res.json({
                success: true,
                message: 'Login successful',
                role: user.Role,
                id: user.LinkedID, // This is the PatientID or DoctorID
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
// --- API ROUTE STUBS (To be built out) ---
// -----------------------------------------------------

// --- Patient Routes ---
// GET /api/patients/:id (Get details)
// GET /api/patients/:id/diagnoses (Get medical history)
// GET /api/patients/:id/payments (Get billing history)

// --- Doctor Routes ---
// GET /api/doctors/:id/patients (Get assigned patients)
// POST /api/diagnoses (Create a new diagnosis)

// --- Admin Routes ---
// GET /api/rooms (Get all rooms)
// POST /api/rooms/admit (Calls stored procedure sp_admit_patient)
// POST /api/staff (Add new nurse/wardboy)
// GET /api/billing/pending (Uses v_pending_payments)


// --- Start Server ---
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});