import React, { useState, useEffect } from 'react';

// --- Helper: API Fetch Function ---
// A single, reusable fetch function to handle errors
async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(`http://localhost:3001${url}`, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Server error');
    }
    return data;
  } catch (err) {
    throw new Error(err.message || 'Could not connect to server');
  }
}

// -----------------------------------------------------
// --- AUTHENTICATION COMPONENTS ---
// -----------------------------------------------------

const AuthPage = ({ onLogin, onRegister, error, message }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-blue-600">
          Hospital Management System
        </h2>
        
        <div className="flex border-b">
          <button
            className={`flex-1 py-2 font-medium ${authMode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => { setAuthMode('login'); onLogin('', '', true); /* Clear messages */ }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 font-medium ${authMode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => { setAuthMode('register'); onLogin('', '', true); /* Clear messages */ }}
          >
            Register (Patient)
          </button>
        </div>

        {error && <p className="text-sm text-center text-red-600">{error}</p>}
        {message && <p className="text-sm text-center text-green-600">{message}</p>}

        {authMode === 'login' ? (
          <LoginFormComponent onLogin={onLogin} />
        ) : (
          <RegisterFormComponent onRegister={onRegister} />
        )}
      </div>
    </div>
  );
};

const LoginFormComponent = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password, false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Login
      </button>
    </form>
  );
};

const RegisterFormComponent = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    address: '',
    contact: '',
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="max-h-80 overflow-y-auto pr-2 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text" name="name" required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
            value={formData.name} onChange={handleChange}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number" name="age" required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              value={formData.age} onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              name="gender"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              value={formData.gender} onChange={handleChange}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Number</label>
          <input
            type="tel" name="contact" required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
            value={formData.contact} onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input
            type="text" name="address"
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
            value={formData.address} onChange={handleChange}
          />
        </div>
        <hr className="my-4" />
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text" name="username" required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
            value={formData.username} onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password" name="password" required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
            value={formData.password} onChange={handleChange}
          />
        </div>
      </div>
      
      <button
        type="submit"
        className="w-full px-4 py-2 font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700"
      >
        Register
      </button>
    </form>
  );
};

// -----------------------------------------------------
// --- MAIN LAYOUT & ROUTING ---
// -----------------------------------------------------

const MainLayout = ({ user, onLogout, page, setPage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  let navLinks = [];
  if (user.role === 'Patient') {
    navLinks = [
      { name: 'Dashboard', page: 'dashboard' },
      { name: 'My History', page: 'history' },
      { name: 'My Payments', page: 'billing' },
      { name: 'Support', page: 'support' },
    ];
  } else if (user.role === 'Doctor') {
    navLinks = [
      { name: 'Dashboard', page: 'dashboard' },
      { name: 'My Patients', page: 'patients' },
      { name: 'Schedule', page: 'schedule' },
    ];
  } else if (user.role === 'Admin') {
    navLinks = [
      { name: 'Dashboard', page: 'dashboard' },
      { name: 'Rooms', page: 'rooms' },
      { name: 'Staff', page: 'staff' },
      { name: 'Billing', page: 'billing' },
      { name: 'Support', page: 'support' },
      { name: 'Emergency', page: 'emergency' },
    ];
  }

  // Helper function to create a clean title from the page key
  const getPageTitle = (pageKey) => {
    if (pageKey === 'doctor-patient-history') return 'Patient History';
    return pageKey
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-blue-800 text-white flex-shrink-0 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300`}
      >
        <div className="flex items-center justify-between p-4 h-16">
          <span className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}>
            HMS
          </span>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <nav className="mt-4">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => setPage(link.page)}
              className={`flex items-center w-full px-4 py-3 ${
                page === link.page ? 'bg-blue-900' : 'hover:bg-blue-700'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2" />
              </svg>
              <span className={`ml-3 ${!isSidebarOpen && 'hidden'}`}>
                {link.name}
              </span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={onLogout}
            className={`flex items-center w-full px-4 py-3 rounded-md hover:bg-red-600 bg-red-500 ${!isSidebarOpen && 'justify-center'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
            <span className={`ml-3 ${!isSidebarOpen && 'hidden'}`}>
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 p-4 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">
            {getPageTitle(page)}
          </h1>
          <div className="text-right">
            <div className="font-medium">{user.role}</div>
            <div className="text-sm text-gray-500">
              {user.role} ID: {user.id || 'N/A'}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Pass 'page' and 'setPage' down to the router */}
          <ContentArea user={user} page={page} setPage={setPage} />
        </main>
      </div>
    </div>
  );
};

// --- Main Router ---
const ContentArea = ({ user, page, setPage }) => {
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // Function for Doctor to select a patient
  const viewPatientHistory = (patientId) => {
    setSelectedPatientId(patientId);
    setPage('doctor-patient-history'); // Use the prop 'setPage'
  };

  // Use a function to render the correct page based on role
  const renderPage = () => {
    switch (page) { // Switch on the 'page' prop
      case 'dashboard':
        return <DashboardPage user={user} />;
      
      // --- Pages with Role-Based Views ---
      case 'billing':
        if (user.role === 'Admin') return <AdminBillingPage user={user} />;
        if (user.role === 'Patient') return <PatientBillingPage user={user} />;
        return <PageStub title="Billing" />; // Fallback

      case 'support':
        if (user.role === 'Admin') return <AdminSupportPage user={user} />;
        if (user.role === 'Patient') return <PatientSupportPage user={user} />;
        return <PageStub title="Support" />; // Fallback

      // --- Patient Pages ---
      case 'history':
        return <PatientHistoryPage user={user} />;

      // --- Doctor Pages ---
      case 'patients':
        return <DoctorPatientsPage user={user} onViewHistory={viewPatientHistory} />;
      case 'doctor-patient-history':
        return <DoctorPatientHistoryPage user={user} patientId={selectedPatientId} onBack={() => setPage('patients')} />;
      case 'schedule':
        return <PageStub title="My Schedule" />;

      // --- Admin Pages ---
      case 'staff':
        return <AdminStaffPage user={user} />;
      case 'rooms':
        return <AdminRoomPage user={user} />;
      case 'emergency':
        return <AdminEmergencyPage user={user} />;
        
      default:
        return <DashboardPage user={user} />;
    }
  }
  
  return renderPage();
};

// -----------------------------------------------------
// --- SHARED COMPONENTS ---
// -----------------------------------------------------

const PageStub = ({ title }) => (
  <div className="p-6 bg-white rounded-lg shadow-md">
    <h3 className="text-3xl font-bold text-gray-700">{title}</h3>
    <p className="mt-4 text-gray-500">
      This component is under construction. Full implementation for "{title}" will
      go here.
    </p>
  </div>
);

const DashboardPage = ({ user }) => {
  let details = [];
  if (user.role === 'Patient') {
      details = [
        'View Medical History', 'View Appointments', 'Check Billing', 'Find Support Groups'
      ];
    } else if (user.role === 'Doctor') {
      details = [
        'View Assigned Patients', 'Update Patient Diagnosis', 'View Schedule'
      ];
    } else if (user.role === 'Admin') {
      details = [
        'Manage Staff (Doctors, Nurses)', 'Manage Inpatient Rooms', 'Oversee Billing & Payments', 'Manage Support Groups'
      ];
    }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-3xl font-bold text-blue-600">Welcome, {user.role}!</h3>
      <p className="mt-4 text-gray-600">
        Here are the features available to you:
      </p>
      <ul className="mt-6 space-y-2 list-disc list-inside">
        {details.map((item, index) => (
          <li key={index} className="text-gray-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

// -----------------------------------------------------
// --- ADMIN: Room Management Page ---
// -----------------------------------------------------
const AdminRoomPage = () => {
  const [allRooms, setAllRooms] = useState([]);
  const [occupiedRoomsDetails, setOccupiedRoomsDetails] = useState([]);
  const [unassignedPatients, setUnassignedPatients] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [newRoomType, setNewRoomType] = useState('General Ward');
  const [newRoomStatus, setNewRoomStatus] = useState('Available');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const [roomsData, patientsData] = await Promise.all([
        apiFetch('/api/admin/rooms'),
        apiFetch('/api/admin/unassigned-patients')
      ]);

      setAllRooms(roomsData.allRooms);
      setOccupiedRoomsDetails(roomsData.occupiedRoomsDetails);
      
      const available = roomsData.allRooms.filter(r => r.Status === 'Available');
      setAvailableRooms(available);
      if (available.length > 0) {
        setSelectedRoomId(available[0].RoomID);
      } else {
        setSelectedRoomId('');
      }

      setUnassignedPatients(patientsData.patients);
      if (patientsData.patients.length > 0) {
        setSelectedPatientId(patientsData.patients[0].PatientID);
      } else {
        setSelectedPatientId('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdmitPatient = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!selectedPatientId || !selectedRoomId) {
      setError('Please select a patient and a room.');
      return;
    }
    try {
      const data = await apiFetch('/api/admin/admit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          roomId: selectedRoomId,
        }),
      });
      setMessage(data.message);
      setSelectedPatientId('');
      setSelectedRoomId('');
      fetchData(); 
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const data = await apiFetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomType: newRoomType,
          status: newRoomStatus,
        }),
      });
      setMessage(data.message);
      fetchData(); 
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDischargePatient = async (patientId) => {
    if (window.confirm('Are you sure you want to discharge this patient?')) {
      setError('');
      setMessage('');
      try {
        const data = await apiFetch('/api/admin/discharge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId }),
        });
        setMessage(data.message);
        fetchData(); 
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) return <div className="text-center p-8">Loading Room Data...</div>;

  return (
    <div className="space-y-8">
      {error && <p className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
      {message && <p className="p-4 text-center text-green-700 bg-green-100 rounded-lg">{message}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-blue-700 mb-4">Admit Patient</h3>
          <form onSubmit={handleAdmitPatient} className="space-y-4">
            <div>
              <label htmlFor="patient-select" className="block text-sm font-medium text-gray-700">Select Patient</label>
              <select id="patient-select" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" disabled={unassignedPatients.length === 0}>
                {unassignedPatients.length > 0 ? (
                  unassignedPatients.map((p) => (
                    <option key={p.PatientID} value={p.PatientID}>{p.Name} (ID: {p.PatientID})</option>
                  ))
                ) : ( <option value="">No unassigned patients</option> )}
              </select>
            </div>
            <div>
              <label htmlFor="room-select" className="block text-sm font-medium text-gray-700">Select Available Room</label>
              <select id="room-select" value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" disabled={availableRooms.length === 0}>
                {availableRooms.length > 0 ? (
                  availableRooms.map((r) => (
                    <option key={r.RoomID} value={r.RoomID}>{r.RoomType} (Room {r.RoomID})</option>
                  ))
                ) : ( <option value="">No available rooms</option> )}
              </select>
            </div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
              disabled={unassignedPatients.length === 0 || availableRooms.length === 0}>
              Admit Patient
            </button>
          </form>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-green-700 mb-4">Create New Room</h3>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label htmlFor="room-type" className="block text-sm font-medium text-gray-700">Room Type</label>
              <select id="room-type" value={newRoomType} onChange={(e) => setNewRoomType(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                <option>General Ward</option> <option>Private</option> <option>ICU</option>
              </select>
            </div>
            <div>
              <label htmlFor="room-status" className="block text-sm font-medium text-gray-700">Initial Status</label>
              <select id="room-status" value={newRoomStatus} onChange={(e) => setNewRoomStatus(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                <option>Available</option> <option>Maintenance</option>
              </select>
            </div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">
              Create Room
            </button>
          </form>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Full Room Inventory</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allRooms.length > 0 ? (
                allRooms.map((room) => {
                  const patientDetails = occupiedRoomsDetails.find(p => p.RoomID === room.RoomID);
                  return (
                    <tr key={room.RoomID}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{room.RoomID}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{room.RoomType}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          room.Status === 'Occupied' ? 'bg-red-100 text-red-800' :
                          room.Status === 'Available' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>{room.Status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {patientDetails ? `${patientDetails.PatientName} (ID: ${patientDetails.PatientID})` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {room.Status === 'Occupied' && patientDetails ? (
                          <button
                            onClick={() => handleDischargePatient(patientDetails.PatientID)}
                            className="px-3 py-1 font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700">
                            Discharge
                          </button>
                        ) : ( 'N/A' )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No rooms found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------
// --- ADMIN: Staff Management Page ---
// -----------------------------------------------------
const AdminStaffPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Data lists
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [wardboys, setWardboys] = useState([]);
  const [patients, setPatients] = useState([]);
  
  // Form state: Register Staff
  const [regRole, setRegRole] = useState('Doctor');
  const [regName, setRegName] = useState('');
  const [regSpec, setRegSpec] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  // Form state: Assign Staff
  const [assignPatientId, setAssignPatientId] = useState('');
  const [assignRole, setAssignRole] = useState('Nurse');
  const [assignStaffId, setAssignStaffId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffData, patientData] = await Promise.all([
        apiFetch('/api/admin/staff'),
        apiFetch('/api/admin/patients')
      ]);
      
      setDoctors(staffData.doctors);
      setNurses(staffData.nurses);
      setWardboys(staffData.wardboys);
      setPatients(patientData.patients);
      
      // Set default dropdown values
      if (patientData.patients.length > 0) setAssignPatientId(patientData.patients[0].PatientID);
      if (staffData.nurses.length > 0) setAssignStaffId(staffData.nurses[0].NurseID);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const data = await apiFetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: regRole,
          name: regName,
          specialization: regRole === 'Doctor' ? regSpec : null,
          contact: regContact,
          username: regUsername,
          password: regPassword,
        }),
      });
      setMessage(data.message);
      // Clear form
      setRegName(''); setRegSpec(''); setRegContact(''); setRegUsername(''); setRegPassword('');
      fetchData(); // Refresh staff list
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleAssignStaff = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const data = await apiFetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: assignStaffId,
          patientId: assignPatientId,
          role: assignRole,
        }),
      });
      setMessage(data.message);
      // We don't need to refresh data here, as this page doesn't show assignments yet
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Update staff dropdown when role changes
  useEffect(() => {
    if (assignRole === 'Nurse' && nurses.length > 0) setAssignStaffId(nurses[0].NurseID);
    else if (assignRole === 'WardBoy' && wardboys.length > 0) setAssignStaffId(wardboys[0].WardBoyID);
    else setAssignStaffId('');
  }, [assignRole, nurses, wardboys]);

  if (loading) return <div className="text-center p-8">Loading staff data...</div>;

  return (
    <div className="space-y-8">
      {error && <p className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
      {message && <p className="p-4 text-center text-green-700 bg-green-100 rounded-lg">{message}</p>}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- Register Staff Form --- */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-blue-700 mb-4">Register New Staff</h3>
          <form onSubmit={handleRegisterStaff} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Role</label>
              <select value={regRole} onChange={(e) => setRegRole(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                <option>Doctor</option> <option>Nurse</option> <option>WardBoy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
            {regRole === 'Doctor' && (
              <div>
                <label className="block text-sm font-medium">Specialization</label>
                <input type="text" value={regSpec} onChange={(e) => setRegSpec(e.target.value)} required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium">Contact</label>
              <input type="tel" value={regContact} onChange={(e) => setRegContact(e.target.value)} required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <hr />
            <div>
              <label className="block text-sm font-medium">Username</label>
              <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">
              Register Staff Member
            </button>
          </form>
        </div>

        {/* --- Assign Staff Form --- */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-green-700 mb-4">Assign Staff to Patient</h3>
          <form onSubmit={handleAssignStaff} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Patient</label>
              <select value={assignPatientId} onChange={(e) => setAssignPatientId(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" disabled={patients.length === 0}>
                {patients.length > 0 ? patients.map(p => (
                  <option key={p.PatientID} value={p.PatientID}>{p.Name}</option>
                )) : <option>No patients found</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Staff Role</label>
              <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                <option>Nurse</option> <option>WardBoy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Staff Member</label>
              <select value={assignStaffId} onChange={(e) => setAssignStaffId(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" disabled={assignRole === 'Nurse' ? nurses.length === 0 : wardboys.length === 0}>
                {assignRole === 'Nurse' ? (
                  nurses.length > 0 ? nurses.map(s => (<option key={s.NurseID} value={s.NurseID}>{s.Name}</option>)) : <option>No nurses found</option>
                ) : (
                  wardboys.length > 0 ? wardboys.map(s => (<option key={s.WardBoyID} value={s.WardBoyID}>{s.Name}</option>)) : <option>No wardboys found</option>
                )}
              </select>
            </div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">
              Assign Staff
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------
// --- ADMIN: Billing Management Page ---
// -----------------------------------------------------
const AdminBillingPage = () => {
  const [pending, setPending] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Form state
  const [patientId, setPatientId] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [billData, patientData] = await Promise.all([
        apiFetch('/api/admin/billing'),
        apiFetch('/api/admin/patients')
      ]);
      setPending(billData.pending);
      setPatients(patientData.patients);
      if (patientData.patients.length > 0) setPatientId(patientData.patients[0].PatientID);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleCreateBill = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const data = await apiFetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, amount, paymentMode }),
      });
      setMessage(data.message);
      setAmount(0);
      fetchData(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };
  
  if (loading) return <div className="text-center p-8">Loading billing data...</div>;

  return (
    <div className="space-y-8">
      {error && <p className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
      {message && <p className="p-4 text-center text-green-700 bg-green-100 rounded-lg">{message}</p>}
      
      {/* --- Create Bill Form --- */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-blue-700 mb-4">Create New Bill</h3>
        <form onSubmit={handleCreateBill} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium">Patient</label>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" disabled={patients.length === 0}>
              {patients.length > 0 ? patients.map(p => (
                <option key={p.PatientID} value={p.PatientID}>{p.Name}</option>
              )) : <option>No patients found</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Amount ($)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium">Payment Mode</label>
            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              <option>Cash</option> <option>E-Banking</option> <option>Card</option>
            </select>
          </div>
          <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">
            Create Bill
          </button>
        </form>
      </div>
      
      {/* --- Pending Payments Table (from View) --- */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Pending Payments</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Due</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pending.length > 0 ? (
                pending.map((bill) => (
                  <tr key={bill.PatientID}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{bill.PatientID}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{bill.PatientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{bill.Contact}</td>
                    <td className="px-6 py-4 text-sm text-red-600 font-medium">${bill.TotalDue}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No pending payments.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------
// --- ADMIN: Support Management Page ---
// -----------------------------------------------------
const AdminSupportPage = () => {
  const [patients, setPatients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Log Call form
  const [callPatientId, setCallPatientId] = useState('');
  const [callDetails, setCallDetails] = useState('');
  
  // New Group form
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupTime, setGroupTime] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientData, groupData] = await Promise.all([
        apiFetch('/api/admin/patients'),
        apiFetch('/api/support-groups')
      ]);
      setPatients(patientData.patients);
      setGroups(groupData.groups);
      if (patientData.patients.length > 0) setCallPatientId(patientData.patients[0].PatientID);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleLogCall = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const data = await apiFetch('/api/admin/support-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: callPatientId, details: callDetails }),
      });
      setMessage(data.message);
      setCallDetails('');
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const data = await apiFetch('/api/admin/support-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, description: groupDesc, meetingTime: groupTime }),
      });
      setMessage(data.message);
      setGroupName(''); setGroupDesc(''); setGroupTime('');
      fetchData(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center p-8">Loading support data...</div>;

  return (
    <div className="space-y-8">
      {error && <p className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
      {message && <p className="p-4 text-center text-green-700 bg-green-100 rounded-lg">{message}</p>}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Log Support Call */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-blue-700 mb-4">Log Support Call</h3>
          <form onSubmit={handleLogCall} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Patient</label>
              <select value={callPatientId} onChange={(e) => setCallPatientId(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" disabled={patients.length === 0}>
                {patients.length > 0 ? patients.map(p => (
                  <option key={p.PatientID} value={p.PatientID}>{p.Name}</option>
                )) : <option>No patients found</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Call Details</label>
              <textarea value={callDetails} onChange={(e) => setCallDetails(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" rows="3"></textarea>
            </div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">
              Log Call
            </button>
          </form>
        </div>
        
        {/* Create Support Group */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-green-700 mb-4">Create Support Group</h3>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Group Name</label>
              <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <input type="text" value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium">Meeting Time</label>
              <input type="text" value={groupTime} onChange={(e) => setGroupTime(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., Tuesdays at 5:00 PM" />
            </div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">
              Create Group
            </button>
          </form>
        </div>
      </div>
      
      {/* Existing Support Groups */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Available Support Groups</h3>
        <ul className="divide-y divide-gray-200">
          {groups.length > 0 ? groups.map(g => (
            <li key={g.GroupID} className="py-4">
              <h4 className="text-lg font-semibold text-gray-900">{g.GroupName}</h4>
              <p className="text-sm text-gray-600">{g.Description}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">{g.MeetingTime}</p>
            </li>
          )) : <p className="text-center text-gray-500">No support groups found.</p>}
        </ul>
      </div>
    </div>
  );
};

// -----------------------------------------------------
// --- ADMIN: Emergency Log Page ---
// -----------------------------------------------------
const AdminEmergencyPage = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Form state
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [patientData, staffData] = await Promise.all([
          apiFetch('/api/admin/patients'),
          apiFetch('/api/admin/staff')
        ]);
        setPatients(patientData.patients);
        setDoctors(staffData.doctors);
        if (patientData.patients.length > 0) setPatientId(patientData.patients[0].PatientID);
        if (staffData.doctors.length > 0) setDoctorId(staffData.doctors[0].DoctorID);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const handleLogEmergency = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const data = await apiFetch('/api/admin/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, doctorId, details }),
      });
      setMessage(data.message);
      setDetails('');
    } catch (err) {
      setError(err.message);
    }
  };
  
  if (loading) return <div className="text-center p-8">Loading data...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      {error && <p className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
      {message && <p className="p-4 text-center text-green-700 bg-green-100 rounded-lg">{message}</p>}
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-red-700 mb-4">Log Emergency Case</h3>
        <form onSubmit={handleLogEmergency} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Patient</label>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" disabled={patients.length === 0}>
              {patients.length > 0 ? patients.map(p => (
                <option key={p.PatientID} value={p.PatientID}>{p.Name}</option>
              )) : <option>No patients found</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Responding Doctor</label>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" disabled={doctors.length === 0}>
              {doctors.length > 0 ? doctors.map(d => (
                <option key={d.DoctorID} value={d.DoctorID}>{d.Name} ({d.Specialization})</option>
              )) : <option>No doctors found</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Case Details</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" rows="4"></textarea>
          </div>
          <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700">
            Log Emergency
          </button>
        </form>
      </div>
    </div>
  );
};

// -----------------------------------------------------
// --- DOCTOR: My Patients Page ---
// -----------------------------------------------------
const DoctorPatientsPage = ({ user, onViewHistory }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const doctorId = user.id;

  useEffect(() => {
    if (!doctorId) {
      setError("Doctor ID not found.");
      setLoading(false);
      return;
    }
    const fetchPatients = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch(`/api/doctor/patients/${doctorId}`);
        setPatients(data.patients);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [doctorId]);

  if (loading) return <div className="text-center p-8">Loading patients...</div>;
  if (error) return <div className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">My Patients</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patients.length > 0 ? (
              patients.map((patient) => (
                <tr key={patient.PatientID}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{patient.PatientID}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{patient.Name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{patient.Age}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{patient.Gender}</td>
                  <td className="px-6 py-4 text-sm">
                    <button onClick={() => onViewHistory(patient.PatientID)}
                      className="px-3 py-1 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">
                      View History
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">You have not treated any patients yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -----------------------------------------------------
// --- DOCTOR: View Patient History Page ---
// -----------------------------------------------------
const DoctorPatientHistoryPage = ({ user, patientId, onBack }) => {
  const [patient, setPatient] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // New Diagnosis form
  const [disease, setDisease] = useState('');
  const [prescription, setPrescription] = useState('');

  const fetchData = async () => {
    if (!patientId) {
      setError('No patient selected.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch(`/api/doctor/patient-history/${patientId}`);
      setPatient(data.patient);
      setDiagnoses(data.diagnoses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);
  
  const handleAddDiagnosis = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const data = await apiFetch('/api/doctor/diagnoses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId,
          doctorId: user.id,
          disease: disease,
          prescription: prescription,
        }),
      });
      setMessage(data.message);
      setDisease('');
      setPrescription('');
      fetchData(); // Refresh history
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center p-8">Loading patient history...</div>;
  if (error) return <div className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</div>;
  if (!patient) return <div className="p-4 text-center text-gray-500">Patient not found.</div>;

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="text-sm font-medium text-blue-600 hover:text-blue-800">
        &larr; Back to My Patients
      </button>
      
      {/* Patient Details */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">{patient.Name} (ID: {patient.PatientID})</h3>
        <div className="grid grid-cols-2 gap-4">
          <p><span className="font-medium">Age:</span> {patient.Age}</p>
          <p><span className="font-medium">Gender:</span> {patient.Gender}</p>
          <p><span className="font-medium">Contact:</span> {patient.Contact}</p>
          <p><span className="font-medium">Address:</span> {patient.Address}</p>
        </div>
      </div>
      
      {error && <p className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
      {message && <p className="p-4 text-center text-green-700 bg-green-100 rounded-lg">{message}</p>}

      {/* Add Diagnosis Form */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-blue-700 mb-4">Add New Diagnosis</h3>
        <form onSubmit={handleAddDiagnosis} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Disease/Condition</label>
            <input type="text" value={disease} onChange={(e) => setDisease(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium">Prescription / Notes</label>
            <textarea value={prescription} onChange={(e) => setPrescription(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" rows="3"></textarea>
          </div>
          <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">
            Add to History
          </button>
        </form>
      </div>

      {/* Medical History List */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Medical History</h3>
        <div className="space-y-4">
          {diagnoses.length > 0 ? (
            diagnoses.map(diag => (
              <div key={diag.DiagnosisID} className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-900">{diag.Disease}</h4>
                  <span className="text-sm text-gray-500">{new Date(diag.DiagnosisDate).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{diag.Prescription}</p>
                <p className="text-sm font-medium text-gray-500 mt-2">Diagnosed by: {diag.DoctorName}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No medical history found for this patient.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------
// --- PATIENT: My Medical History Page ---
// -----------------------------------------------------
const PatientHistoryPage = ({ user }) => {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/patient/history/${user.id}`);
        setDiagnoses(data.diagnoses);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);
  
  if (loading) return <div className="text-center p-8">Loading medical history...</div>;
  if (error) return <div className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">My Medical History</h3>
      <div className="space-y-4">
        {diagnoses.length > 0 ? (
          diagnoses.map(diag => (
            <div key={diag.DiagnosisID} className="p-4 border border-gray-200 rounded-md">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-900">{diag.Disease}</h4>
                <span className="text-sm text-gray-500">{new Date(diag.DiagnosisDate).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{diag.Prescription}</p>
              <p className="text-sm font-medium text-gray-500 mt-2">
                Diagnosed by: {diag.DoctorName} ({diag.Specialization})
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No medical history found.</p>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------
// --- PATIENT: My Billing Page ---
// -----------------------------------------------------
const PatientBillingPage = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // --- NEW: Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  const fetchData = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await apiFetch(`/api/patient/billing/${user.id}`);
      setPayments(data.payments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const openPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
    setError('');
    setMessage('');
  };

  const handlePaymentSubmit = async (paymentId) => {
    setError('');
    setMessage('');
    try {
      const data = await apiFetch('/api/patient/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: user.id, paymentId: paymentId }),
      });
      
      setMessage(data.message);
      setIsModalOpen(false);
      fetchData(); // Refresh the billing list
    } catch (err) {
      setError(err.message);
      setIsModalOpen(false); // Close modal on error too
    }
  };
  
  if (loading) return <div className="text-center p-8">Loading billing history...</div>;

  return (
    <>
      {/* --- NEW: Payment Modal --- */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        payment={selectedPayment}
      />

      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">My Billing & Payments</h3>
        
        {error && <p className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</p>}
        {message && <p className="p-4 text-center text-green-700 bg-green-100 rounded-lg">{message}</p>}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length > 0 ? (
                payments.map((pay) => (
                  <tr key={pay.PaymentID}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{pay.PaymentID}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">${pay.Amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{pay.PaymentMode}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {pay.PaymentDate ? new Date(pay.PaymentDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pay.Status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>{pay.Status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {pay.Status === 'Pending' ? (
                        <button
                          onClick={() => openPaymentModal(pay)}
                          className="px-3 py-1 font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">Paid</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No payment history found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// -----------------------------------------------------
// --- NEW: Payment Modal Component ---
// -----------------------------------------------------
const PaymentModal = ({ isOpen, onClose, payment, onSubmit }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    // Pass the payment ID to the submit handler
    // We await it so the loading spinner stays active
    await onSubmit(payment.PaymentID);
    // Only reset processing state if it's still open (e.g., on error)
    setIsProcessing(false);
  };
  
  // Reset processing state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
    }
  }, [isOpen]);
  
  if (!isOpen || !payment) return null;

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      {/* Modal Content */}
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold">Simulated Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>
        
        {isProcessing ? (
          <div className="text-center p-8">
            <h4 className="text-lg font-medium text-blue-600">Processing Payment...</h4>
            <p className="text-sm text-gray-500 mt-2">Please wait, this is a simulation.</p>
            {/* Simple spinner */}
            <div className="mt-4 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-600">You are paying:</p>
              <p className="text-3xl font-bold text-gray-900">${payment.Amount}</p>
              <p className="text-sm text-gray-500">for Payment ID: {payment.PaymentID}</p>
            </div>
          
            {/* Fake Credit Card Form */}
            <div>
              <label className="block text-sm font-medium">Card Number</label>
              <input type="text" placeholder="4242 4242 4242 4242"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Expiry (MM/YY)</label>
                <input type="text" placeholder="12/25"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium">CVC</label>
                <input type="text" placeholder="123"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-2 font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700"
            >
              Pay ${payment.Amount}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};


// -----------------------------------------------------
// --- PATIENT: Support Groups Page ---
// -----------------------------------------------------
const PatientSupportPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await apiFetch('/api/support-groups');
        setGroups(data.groups);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  if (loading) return <div className="text-center p-8">Loading support groups...</div>;
  if (error) return <div className="p-4 text-center text-red-700 bg-red-100 rounded-lg">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Available Support Groups</h3>
      <div className="space-y-4">
        {groups.length > 0 ? (
          groups.map(g => (
            <div key={g.GroupID} className="p-4 border border-gray-200 rounded-md">
              <h4 className="text-lg font-semibold text-gray-900">{g.GroupName}</h4>
              <p className="text-sm text-gray-600 mt-1">{g.Description}</p>
              <p className="text-sm font-medium text-gray-500 mt-2">{g.MeetingTime}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No support groups are currently available.</p>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------
// --- Main App Component ---
// -----------------------------------------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard'); // This is the single source of truth for navigation
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (username, password, isTabSwitch) => {
    if (isTabSwitch) {
      setError(''); setMessage('');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      setUser({ role: data.role, id: data.id, userId: data.userId });
      setPage('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (formData) => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await apiFetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setError('');
    setMessage('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl">Loading...</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        onLogin={handleLogin}
        onRegister={handleRegister}
        error={error}
        message={message}
      />
    );
  }

  return (
    <MainLayout
      user={user}
      onLogout={handleLogout}
      page={page}
      setPage={setPage} // This allows ContentArea and its children to change the page
    />
  );
}