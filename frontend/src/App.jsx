import React, { useState, useEffect, useCallback } from 'react';

// --- Helper: API Fetch Function ---
async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(`http://localhost:3001${url}`, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Server error');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Could not connect to server');
  }
}

// -----------------------------------------------------
// --- SHARED UI COMPONENTS ---
// -----------------------------------------------------
const Spinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

const PageStub = ({ title }) => (
  <div className="p-6 bg-white rounded-lg shadow-md">
    <h3 className="text-3xl font-bold text-gray-700">{title}</h3>
    <p className="mt-4 text-gray-500">This component is under construction.</p>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl transform transition-all duration-300 scale-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// -----------------------------------------------------
// --- AUTHENTICATION ---
// -----------------------------------------------------
const AuthPage = ({ onLogin, onRegister, error, message, appLoading }) => {
  const [authMode, setAuthMode] = useState('login');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-indigo-600">Hospital Management System</h2>
        <div className="flex border-b border-gray-200">
          <button className={`flex-1 py-3 font-medium transition-colors ${authMode === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setAuthMode('login')}>Login</button>
          <button className={`flex-1 py-3 font-medium transition-colors ${authMode === 'register' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setAuthMode('register')}>Register (Patient)</button>
        </div>
        {error && <p className="text-sm text-center text-red-600">{error}</p>}
        {message && <p className="text-sm text-center text-green-600">{message}</p>}
        {appLoading ? <div className="py-12"><Spinner /></div> : (authMode === 'login' ? <LoginFormComponent onLogin={onLogin} /> : <RegisterFormComponent onRegister={onRegister} />)}
      </div>
    </div>
  );
};

const LoginFormComponent = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onLogin(username, password, false); }} className="space-y-6 pt-4">
      <input placeholder="Username" required className="form-input w-full p-2 border rounded" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" required className="form-input w-full p-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" className="w-full px-4 py-3 font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">Login</button>
    </form>
  );
};

const RegisterFormComponent = ({ onRegister }) => {
  const [formData, setFormData] = useState({ name: '', age: '', gender: 'Male', address: '', contact: '', username: '', password: '' });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onRegister(formData); }} className="space-y-4 pt-4">
      <div className="max-h-80 overflow-y-auto pr-2 space-y-4">
        <input type="text" name="name" placeholder="Full Name" required className="form-input w-full p-2 border rounded" value={formData.name} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-4">
          <input type="number" name="age" placeholder="Age" required className="form-input w-full p-2 border rounded" value={formData.age} onChange={handleChange} />
          <select name="gender" className="form-input w-full p-2 border rounded" value={formData.gender} onChange={handleChange}><option>Male</option><option>Female</option><option>Other</option></select>
        </div>
        <input type="tel" name="contact" placeholder="Contact" required className="form-input w-full p-2 border rounded" value={formData.contact} onChange={handleChange} />
        <input type="text" name="address" placeholder="Address" className="form-input w-full p-2 border rounded" value={formData.address} onChange={handleChange} />
        <input type="text" name="username" placeholder="Username" required className="form-input w-full p-2 border rounded" value={formData.username} onChange={handleChange} />
        <input type="password" name="password" placeholder="Password" required className="form-input w-full p-2 border rounded" value={formData.password} onChange={handleChange} />
      </div>
      <button type="submit" className="w-full px-4 py-3 font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">Register</button>
    </form>
  );
};

// --- LAYOUT ---
const MainLayout = ({ user, onLogout, page, setPage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  let navLinks = [];
  if (user.role === 'Patient') navLinks = [{ name: 'Dashboard', page: 'dashboard' }, { name: 'Appointments', page: 'appointments' }, { name: 'My History', page: 'history' }, { name: 'My Payments', page: 'billing' }, { name: 'Support', page: 'support' }];
  else if (user.role === 'Doctor') navLinks = [{ name: 'Dashboard', page: 'dashboard' }, { name: 'My Schedule', page: 'schedule' }, { name: 'My Patients', page: 'patients' }];
  else if (user.role === 'Admin') navLinks = [{ name: 'Dashboard', page: 'dashboard' }, { name: 'Rooms', page: 'rooms' }, { name: 'Staff', page: 'staff' }, { name: 'Billing', page: 'billing' }, { name: 'Support', page: 'support' }, { name: 'Emergency', page: 'emergency' }];

  const getPageTitle = (pageKey) => {
    if (pageKey === 'doctor-patient-history') return 'Patient History';
    return pageKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`bg-white text-gray-800 flex-shrink-0 border-r border-gray-200 ${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 h-16 border-b border-gray-200">
          <span className={`font-bold text-2xl text-indigo-600 ${!isSidebarOpen && 'hidden'}`}>HMS</span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md text-gray-500 hover:bg-gray-100">☰</button>
        </div>
        <nav className="mt-4">
          {navLinks.map((link) => {
             const isActive = page === link.page || (page === 'doctor-patient-history' && link.page === 'patients');
             return (
            <button key={link.name} onClick={() => setPage(link.page)} className={`flex items-center w-full px-4 py-3 my-1 ${isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-100'} ${!isSidebarOpen && 'justify-center'}`}>
              <span className={`ml-3 ${!isSidebarOpen && 'hidden'}`}>{link.name}</span>
            </button>
          )})}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button onClick={onLogout} className={`flex items-center w-full px-4 py-3 rounded-md text-red-600 hover:bg-red-50 ${!isSidebarOpen && 'justify-center'}`}>Logout</button>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 p-4 bg-white border-b border-gray-200 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-800">{getPageTitle(page)}</h1>
          <div className="text-right"><div className="font-medium text-gray-800">{user.role}</div><div className="text-sm text-gray-500">ID: {user.id || 'N/A'}</div></div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <ContentArea user={user} page={page} setPage={setPage} />
        </main>
      </div>
    </div>
  );
};

// --- CENTRAL CONTENT ROUTER ---
const ContentArea = ({ user, page, setPage }) => {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);

  // 1. Read-Only View
  const viewPatientHistory = (patientId) => { 
    setSelectedPatientId(patientId); 
    setSelectedAppointmentId(null); 
    setShowDiagnosisForm(false); // No form
    setPage('doctor-patient-history'); 
  };

  // 2. Consult & Write View
  const recordConsultation = (patientId, appointmentId) => { 
    setSelectedPatientId(patientId); 
    setSelectedAppointmentId(appointmentId); 
    setShowDiagnosisForm(true); // Show form
    setPage('doctor-patient-history'); 
  };

  switch (page) {
    case 'dashboard': return <DashboardPage user={user} />;
    case 'appointments': return <PatientAppointmentsPage user={user} />;
    case 'history': return <PatientHistoryPage user={user} />;
    case 'billing': return user.role === 'Admin' ? <AdminBillingPage user={user} /> : <PatientBillingPage user={user} />;
    case 'support': return user.role === 'Admin' ? <AdminSupportPage user={user} /> : <PatientSupportPage user={user} />;
    
    case 'patients': 
        return <DoctorPatientsPage user={user} onViewHistory={viewPatientHistory} />;
    case 'schedule': 
        return <DoctorSchedulePage user={user} onRecordConsultation={recordConsultation} />;
    case 'doctor-patient-history': 
        return <DoctorPatientHistoryPage 
                  user={user} 
                  patientId={selectedPatientId} 
                  appointmentId={selectedAppointmentId} 
                  showAddForm={showDiagnosisForm} 
                  onBack={() => setPage(showDiagnosisForm ? 'schedule' : 'patients')} // Smart back button
               />;
               
    case 'staff': return <AdminStaffPage user={user} />;
    case 'rooms': return <AdminRoomPage user={user} />;
    case 'emergency': return <AdminEmergencyPage user={user} />;
    default: return <DashboardPage user={user} />;
  }
};

const DashboardPage = ({ user }) => {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        if (user.role === 'Admin') {
        apiFetch('/api/admin/stats').then(data => setStats(data.stats)).catch(err => console.error(err));
        }
    }, [user.role]);

    if (user.role === 'Admin') {
        return (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-indigo-600">
            <h3 className="text-3xl font-bold text-gray-800">Admin Dashboard</h3>
            <p className="mt-2 text-gray-600">Overview of hospital operations.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-xl shadow-md">
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <p className="text-2xl font-bold text-gray-800">{stats ? stats.patients : '-'}</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md">
                <p className="text-sm font-medium text-gray-500">Active Doctors</p>
                <p className="text-2xl font-bold text-gray-800">{stats ? stats.doctors : '-'}</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md">
                <p className="text-sm font-medium text-gray-500">Occupancy</p>
                <p className="text-2xl font-bold text-gray-800">{stats ? `${stats.rooms.occupied} / ${stats.rooms.total}` : '-'}</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800 text-green-600">${stats ? stats.revenue.toLocaleString() : '-'}</p>
            </div>
            </div>
        </div>
        );
    }
    // Default Dashboard for others
    let details = [];
    if (user.role === 'Patient') details = ['Book an Appointment', 'View Medical History', 'View Billing & Payments', 'Find Support Groups'];
    else if (user.role === 'Doctor') details = ['View My Schedule', 'View Assigned Patients', 'Update Patient Diagnosis'];

    return (
        <div className="p-8 bg-white rounded-xl shadow-lg">
        <h3 className="text-3xl font-bold text-indigo-600">Welcome, {user.role}!</h3>
        <ul className="mt-6 space-y-3 list-disc list-inside">
            {details.map((item, index) => <li key={index} className="text-gray-700 text-lg">{item}</li>)}
        </ul>
        </div>
    );
};

// --- ADMIN: Room Management ---
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsData, patientsData] = await Promise.all([apiFetch('/api/admin/rooms'), apiFetch('/api/admin/unassigned-patients')]);
      setAllRooms(roomsData.allRooms);
      setOccupiedRoomsDetails(roomsData.occupiedRoomsDetails);
      const available = roomsData.allRooms.filter(r => r.Status === 'Available');
      setAvailableRooms(available);
      if (available.length > 0) setSelectedRoomId(available[0].RoomID);
      setUnassignedPatients(patientsData.patients);
      if (patientsData.patients.length > 0) setSelectedPatientId(patientsData.patients[0].PatientID);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdmitPatient = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/admin/admit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: selectedPatientId, roomId: selectedRoomId }) });
      setMessage(data.message); setSelectedPatientId(''); setSelectedRoomId(''); fetchData();
    } catch (err) { setError(err.message); }
  };
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/admin/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomType: newRoomType, status: newRoomStatus }) });
      setMessage(data.message); fetchData();
    } catch (err) { setError(err.message); }
  };
  const handleDischargePatient = async (patientId) => {
    if (window.confirm('Discharge this patient?')) {
      try {
        const data = await apiFetch('/api/admin/discharge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId }) });
        setMessage(data.message); fetchData();
      } catch (err) { setError(err.message); }
    }
  };
  if (loading) return <Spinner />;
  return (
    <div className="space-y-8">
      {message && <p className="text-green-600 text-center">{message}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 bg-white rounded-xl shadow-lg">
           <h3 className="text-xl font-bold text-indigo-600 mb-4">Admit</h3>
           <form onSubmit={handleAdmitPatient} className="space-y-4">
              <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="form-input w-full p-2 border rounded" disabled={!unassignedPatients.length}>{unassignedPatients.map(p => <option key={p.PatientID} value={p.PatientID}>{p.Name}</option>)}</select>
              <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} className="form-input w-full p-2 border rounded" disabled={!availableRooms.length}>{availableRooms.map(r => <option key={r.RoomID} value={r.RoomID}>{r.RoomType} ({r.RoomID})</option>)}</select>
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded" disabled={!unassignedPatients.length || !availableRooms.length}>Admit</button>
           </form>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-lg">
           <h3 className="text-xl font-bold text-green-600 mb-4">Create Room</h3>
           <form onSubmit={handleCreateRoom} className="space-y-4">
             <select value={newRoomType} onChange={e => setNewRoomType(e.target.value)} className="form-input w-full p-2 border rounded"><option>General Ward</option><option>Private</option><option>ICU</option></select>
             <select value={newRoomStatus} onChange={e => setNewRoomStatus(e.target.value)} className="form-input w-full p-2 border rounded"><option>Available</option><option>Maintenance</option></select>
             <button type="submit" className="w-full py-2 bg-green-600 text-white rounded">Create</button>
           </form>
        </div>
      </div>
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">Inventory</h3>
        <table className="min-w-full">
          <thead><tr><th className="text-left">ID</th><th className="text-left">Type</th><th className="text-left">Status</th><th className="text-left">Occupant</th><th className="text-left">Action</th></tr></thead>
          <tbody>{allRooms.map(r => {
            const p = occupiedRoomsDetails.find(o => o.RoomID === r.RoomID);
            return <tr key={r.RoomID}><td className="py-2">{r.RoomID}</td><td>{r.RoomType}</td><td>{r.Status}</td><td>{p ? p.PatientName : '-'}</td><td>{p && <button onClick={() => handleDischargePatient(p.PatientID)} className="text-red-600">Discharge</button>}</td></tr>
          })}</tbody>
        </table>
      </div>
    </div>
  );
};

// --- ADMIN: Staff Management ---
const AdminStaffPage = () => {
  const [loading, setLoading] = useState(true);
  const [regRole, setRegRole] = useState('Doctor');
  const [regName, setRegName] = useState('');
  const [regSpec, setRegSpec] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [assignPatientId, setAssignPatientId] = useState('');
  const [assignRole, setAssignRole] = useState('Nurse');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [wardboys, setWardboys] = useState([]);
  const [patients, setPatients] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
       const [s, p] = await Promise.all([apiFetch('/api/admin/staff'), apiFetch('/api/admin/patients')]);
       setDoctors(s.doctors); setNurses(s.nurses); setWardboys(s.wardboys); setPatients(p.patients);
       if(p.patients.length) setAssignPatientId(p.patients[0].PatientID);
       if(s.nurses.length) setAssignStaffId(s.nurses[0].NurseID);
    } catch(e){} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  
  useEffect(() => {
    if (assignRole === 'Nurse' && nurses.length > 0) setAssignStaffId(nurses[0].NurseID);
    else if (assignRole === 'WardBoy' && wardboys.length > 0) setAssignStaffId(wardboys[0].WardBoyID);
    else setAssignStaffId('');
  }, [assignRole, nurses, wardboys]);

  const regStaff = async (e) => {
    e.preventDefault();
    await apiFetch('/api/admin/staff', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({role: regRole, name: regName, specialization: regRole==='Doctor'?regSpec:null, contact: regContact, username: regUsername, password: regPassword})});
    fetchData();
  };
  const assign = async (e) => {
    e.preventDefault();
    await apiFetch('/api/admin/assignments', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({staffId: assignStaffId, patientId: assignPatientId, role: assignRole})});
  };

  if (loading) return <Spinner />;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-indigo-600 mb-4">Register Staff</h3>
            <form onSubmit={regStaff} className="space-y-4">
               <select value={regRole} onChange={e=>setRegRole(e.target.value)} className="w-full p-2 border rounded"><option>Doctor</option><option>Nurse</option><option>WardBoy</option></select>
               <input placeholder="Name" value={regName} onChange={e=>setRegName(e.target.value)} className="w-full p-2 border rounded" required />
               {regRole==='Doctor' && <input placeholder="Specialization" value={regSpec} onChange={e=>setRegSpec(e.target.value)} className="w-full p-2 border rounded" required />}
               <input placeholder="Contact" value={regContact} onChange={e=>setRegContact(e.target.value)} className="w-full p-2 border rounded" required />
               <input placeholder="Username" value={regUsername} onChange={e=>setRegUsername(e.target.value)} className="w-full p-2 border rounded" required />
               <input type="password" placeholder="Password" value={regPassword} onChange={e=>setRegPassword(e.target.value)} className="w-full p-2 border rounded" required />
               <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded">Register</button>
            </form>
         </div>
         <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-green-600 mb-4">Assign Staff</h3>
            <form onSubmit={assign} className="space-y-4">
               <select value={assignPatientId} onChange={e=>setAssignPatientId(e.target.value)} className="w-full p-2 border rounded">{patients.map(p=><option key={p.PatientID} value={p.PatientID}>{p.Name}</option>)}</select>
               <select value={assignRole} onChange={e=>setAssignRole(e.target.value)} className="w-full p-2 border rounded"><option>Nurse</option><option>WardBoy</option></select>
               <select value={assignStaffId} onChange={e=>setAssignStaffId(e.target.value)} className="w-full p-2 border rounded">{(assignRole==='Nurse'?nurses:wardboys).map(s=><option key={s.NurseID||s.WardBoyID} value={s.NurseID||s.WardBoyID}>{s.Name}</option>)}</select>
               <button type="submit" className="w-full py-2 bg-green-600 text-white rounded">Assign</button>
            </form>
         </div>
      </div>
    </div>
  );
};

// --- ADMIN: Billing ---
const AdminBillingPage = () => {
  const [pending, setPending] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pid, setPid] = useState('');
  const [amt, setAmt] = useState(0);
  const [mode, setMode] = useState('Cash');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
       const [b, p] = await Promise.all([apiFetch('/api/admin/billing'), apiFetch('/api/admin/patients')]);
       setPending(b.pending); setPatients(p.patients);
       if(p.patients.length) setPid(p.patients[0].PatientID);
    } catch(e){} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const createBill = async (e) => {
     e.preventDefault();
     await apiFetch('/api/admin/billing', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({patientId: pid, amount: amt, paymentMode: mode})});
     setAmt(0); fetchData();
  };

  if(loading) return <Spinner />;
  return (
    <div className="space-y-8">
       <div className="p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-indigo-600 mb-4">Create Bill</h3>
          <form onSubmit={createBill} className="flex gap-4 items-end">
             <select value={pid} onChange={e=>setPid(e.target.value)} className="p-2 border rounded flex-1">{patients.map(p=><option key={p.PatientID} value={p.PatientID}>{p.Name}</option>)}</select>
             <input type="number" value={amt} onChange={e=>setAmt(e.target.value)} className="p-2 border rounded flex-1" placeholder="Amount" />
             <select value={mode} onChange={e=>setMode(e.target.value)} className="p-2 border rounded flex-1"><option>Cash</option><option>E-Banking</option><option>Card</option></select>
             <button type="submit" className="py-2 px-4 bg-indigo-600 text-white rounded">Create</button>
          </form>
       </div>
       <div className="p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">Pending Payments</h3>
          <table className="min-w-full">
             <thead><tr><th className="text-left">Patient</th><th className="text-left">Amount</th></tr></thead>
             <tbody>{pending.map(b=><tr key={b.PatientID}><td className="py-2">{b.PatientName}</td><td className="text-red-600">${b.TotalDue}</td></tr>)}</tbody>
          </table>
       </div>
    </div>
  );
};

// --- ADMIN: Support Management (UPDATED WITH LOGS) ---
const AdminSupportPage = () => {
  const [patients, setPatients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [callLogs, setCallLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [callPid, setCallPid] = useState('');
  const [callDetails, setCallDetails] = useState('');
  const [gName, setGName] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gTime, setGTime] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, g, c] = await Promise.all([
        apiFetch('/api/admin/patients'), 
        apiFetch('/api/support-groups'),
        apiFetch('/api/admin/support-calls') 
      ]);
      setPatients(p.patients);
      setGroups(g.groups);
      setCallLogs(c.calls);
      if (p.patients.length) setCallPid(p.patients[0].PatientID);
    } catch (err) {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const logCall = async (e) => {
    e.preventDefault();
    await apiFetch('/api/admin/support-calls', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({patientId: callPid, details: callDetails})});
    setCallDetails(''); fetchData();
  };

  const createGroup = async (e) => {
    e.preventDefault();
    await apiFetch('/api/admin/support-groups', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({groupName: gName, description: gDesc, meetingTime: gTime})});
    setGName(''); setGDesc(''); setGTime(''); fetchData();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-indigo-600 mb-4">Log Call</h3>
            <form onSubmit={logCall} className="space-y-4">
               <select value={callPid} onChange={e=>setCallPid(e.target.value)} className="w-full p-2 border rounded">{patients.map(p=><option key={p.PatientID} value={p.PatientID}>{p.Name}</option>)}</select>
               <textarea value={callDetails} onChange={e=>setCallDetails(e.target.value)} className="w-full p-2 border rounded" placeholder="Details" />
               <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded">Log</button>
            </form>
         </div>
         <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-green-600 mb-4">Create Group</h3>
            <form onSubmit={createGroup} className="space-y-4">
               <input placeholder="Name" value={gName} onChange={e=>setGName(e.target.value)} className="w-full p-2 border rounded" />
               <input placeholder="Desc" value={gDesc} onChange={e=>setGDesc(e.target.value)} className="w-full p-2 border rounded" />
               <input placeholder="Time" value={gTime} onChange={e=>setGTime(e.target.value)} className="w-full p-2 border rounded" />
               <button type="submit" className="w-full py-2 bg-green-600 text-white rounded">Create</button>
            </form>
         </div>
      </div>
      
      {/* NEW: Call Logs Table */}
      <div className="p-6 bg-white rounded-xl shadow-lg">
         <h3 className="text-xl font-bold mb-4">Support Call Logs</h3>
         <div className="overflow-x-auto">
             <table className="min-w-full">
                 <thead><tr><th className="text-left p-2">Date</th><th className="text-left p-2">Patient</th><th className="text-left p-2">Details</th></tr></thead>
                 <tbody>
                     {callLogs.length > 0 ? callLogs.map(log => (
                         <tr key={log.CallID} className="border-b">
                             <td className="p-2 text-sm text-gray-600">{new Date(log.CallDate).toLocaleString()}</td>
                             <td className="p-2 font-medium">{log.PatientName}</td>
                             <td className="p-2 text-sm">{log.CallDetails}</td>
                         </tr>
                     )) : <tr><td colSpan="3" className="p-4 text-center text-gray-500">No calls logged.</td></tr>}
                 </tbody>
             </table>
         </div>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-lg">
         <h3 className="text-xl font-bold mb-4">Groups</h3>
         <ul>{groups.map(g=><li key={g.GroupID} className="border-b py-2 font-medium">{g.GroupName} - <span className="text-sm font-normal text-gray-600">{g.MeetingTime}</span></li>)}</ul>
      </div>
    </div>
  );
};

const AdminEmergencyPage = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [pid, setPid] = useState('');
  const [did, setDid] = useState('');
  const [det, setDet] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
       const [p, s] = await Promise.all([apiFetch('/api/admin/patients'), apiFetch('/api/admin/staff')]);
       setPatients(p.patients); setDoctors(s.doctors);
       if(p.patients.length) setPid(p.patients[0].PatientID);
       if(s.doctors.length) setDid(s.doctors[0].DoctorID);
    } catch(e){} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const log = async (e) => {
     e.preventDefault();
     await apiFetch('/api/admin/emergency', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({patientId: pid, doctorId: did, details: det})});
     setDet('');
  };

  if(loading) return <Spinner />;
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
       <h3 className="text-2xl font-bold text-red-600 mb-4">Emergency Log</h3>
       <form onSubmit={log} className="space-y-4">
          <select value={pid} onChange={e=>setPid(e.target.value)} className="w-full p-2 border rounded">{patients.map(p=><option key={p.PatientID} value={p.PatientID}>{p.Name}</option>)}</select>
          <select value={did} onChange={e=>setDid(e.target.value)} className="w-full p-2 border rounded">{doctors.map(d=><option key={d.DoctorID} value={d.DoctorID}>{d.Name}</option>)}</select>
          <textarea value={det} onChange={e=>setDet(e.target.value)} className="w-full p-2 border rounded" rows="4" placeholder="Details" />
          <button type="submit" className="w-full py-2 bg-red-600 text-white rounded">Log</button>
       </form>
    </div>
  );
};

const DoctorSchedulePage = ({ user, onRecordConsultation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/appointments/doctor/${user.id}`);
      setAppointments(data.appointments);
    } catch (err) {} finally { setLoading(false); }
  }, [user.id]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateStatus = async (id, status) => {
    await apiFetch(`/api/appointments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchData();
  };

  if (loading) return <Spinner />;
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">My Schedule</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map(appt => (
              <tr key={appt.AppointmentID}>
                <td className="px-6 py-4">{new Date(appt.AppointmentDate).toLocaleString()}</td>
                <td className="px-6 py-4">{appt.PatientName}</td>
                <td className="px-6 py-4"><span className={`px-2 text-xs font-semibold rounded-full bg-blue-100 text-blue-800`}>{appt.Status}</span></td>
                <td className="px-6 py-4 space-x-2">
                  {appt.Status === 'Pending' && <button onClick={() => handleUpdateStatus(appt.AppointmentID, 'Confirmed')} className="px-3 py-1 bg-indigo-600 text-white rounded">Confirm</button>}
                  {appt.Status === 'Confirmed' && <button onClick={() => onRecordConsultation(appt.PatientID, appt.AppointmentID)} className="px-3 py-1 bg-green-600 text-white rounded">Record Consultation</button>}
                  {appt.Status !== 'Completed' && <button onClick={() => handleUpdateStatus(appt.AppointmentID, 'Cancelled')} className="px-3 py-1 bg-red-600 text-white rounded">Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DoctorPatientsPage = ({ user, onViewHistory }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/doctor/patients/${user.id}`);
      setPatients(data.patients);
    } catch (err) {} finally { setLoading(false); }
  }, [user.id]);
  useEffect(() => { fetchData(); }, [fetchData]);
  
  if (loading) return <Spinner />;
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">My Patients</h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {patients.map(p => (
            <tr key={p.PatientID}>
              <td className="px-6 py-4">{p.Name}</td>
              <td className="px-6 py-4"><button onClick={() => onViewHistory(p.PatientID)} className="px-3 py-1 bg-indigo-600 text-white rounded">View History</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DoctorPatientHistoryPage = ({ user, patientId, appointmentId, showAddForm, onBack }) => {
  const [patient, setPatient] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [disease, setDisease] = useState('');
  const [prescription, setPrescription] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/doctor/patient-history/${patientId}`);
      setPatient(data.patient);
      setDiagnoses(data.diagnoses);
    } catch (err) {} finally { setLoading(false); }
  }, [patientId]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddDiagnosis = async (e) => {
    e.preventDefault();
    await apiFetch('/api/doctor/diagnoses', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ patientId, doctorId: user.id, disease, prescription, appointmentId }) 
    });
    setDisease(''); setPrescription('');
    if(appointmentId) onBack(); 
    else fetchData();
  };

  if (loading) return <Spinner />;
  if (!patient) return <div>Patient not found</div>;

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800">&larr; Back</button>
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-2xl font-semibold text-gray-800">{patient.Name}</h3>
        <p>Age: {patient.Age}, Gender: {patient.Gender}</p>
      </div>
      
      {showAddForm && (
        <div className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-indigo-500">
          <h3 className="text-xl font-semibold text-indigo-600 mb-4">Consultation Record</h3>
          <form onSubmit={handleAddDiagnosis} className="space-y-4">
            <input placeholder="Disease" value={disease} onChange={e => setDisease(e.target.value)} className="form-input w-full p-2 border rounded" required />
            <textarea placeholder="Prescription" value={prescription} onChange={e => setPrescription(e.target.value)} className="form-input w-full p-2 border rounded" required />
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save & Complete</button>
          </form>
        </div>
      )}
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">History</h3>
        {diagnoses.map(d => (
          <div key={d.DiagnosisID} className="border-b py-2">
            <p className="font-semibold">{d.Disease} <span className="text-sm text-gray-500">- {new Date(d.DiagnosisDate).toLocaleDateString()}</span></p>
            <p className="text-gray-600">{d.Prescription}</p>
            <p className="text-xs text-gray-400">Dr. {d.DoctorName}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PatientAppointmentsPage = ({user}) => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [docId, setDocId] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  
  const fetchData = useCallback(async () => {
     const [d, a] = await Promise.all([apiFetch('/api/doctors'), apiFetch(`/api/appointments/patient/${user.id}`)]);
     setDoctors(d.doctors); setAppointments(a.appointments);
     if(d.doctors.length) setDocId(d.doctors[0].DoctorID);
  }, [user.id]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const book = async (e) => {
    e.preventDefault();
    await apiFetch('/api/appointments', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ patientId: user.id, doctorId: docId, appointmentDate: date, reason }) });
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-indigo-600">Book Appointment</h3>
        <form onSubmit={book} className="space-y-4 mt-4">
           <select value={docId} onChange={e=>setDocId(e.target.value)} className="w-full p-2 border rounded">{doctors.map(d=><option key={d.DoctorID} value={d.DoctorID}>{d.Name}</option>)}</select>
           <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-2 border rounded" required />
           <textarea value={reason} onChange={e=>setReason(e.target.value)} className="w-full p-2 border rounded" placeholder="Reason" />
           <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Book</button>
        </form>
      </div>
      <div className="p-6 bg-white rounded-xl shadow-lg">
         <h3 className="text-xl font-semibold">My Appointments</h3>
         {appointments.map(a => <div key={a.AppointmentID} className="border-b py-2">{new Date(a.AppointmentDate).toLocaleString()} - {a.DoctorName} - <span className="font-bold">{a.Status}</span></div>)}
      </div>
    </div>
  );
};
const PatientHistoryPage = ({user}) => {
  const [list, setList] = useState([]);
  useEffect(() => { apiFetch(`/api/patient/history/${user.id}`).then(d => setList(d.diagnoses)); }, [user.id]);
  return <div className="p-6 bg-white rounded-xl shadow-lg"><h3 className="text-xl font-bold">History</h3>{list.map(l=><div key={l.DiagnosisID} className="border-b py-2">{l.Disease} - {l.Prescription}</div>)}</div>;
};
const PaymentModal = ({ isOpen, onClose, payment, onSubmit }) => {
  const [proc, setProc] = useState(false);
  const sub = async (e) => { e.preventDefault(); setProc(true); await onSubmit(payment.PaymentID); setProc(false); };
  if (!isOpen || !payment) return null;
  return <Modal isOpen={isOpen} onClose={onClose} title="Pay Bill">{proc ? <Spinner/> : <form onSubmit={sub} className="space-y-4"><p className="text-xl font-bold">${payment.Amount}</p><button className="w-full py-2 bg-green-600 text-white rounded">Pay</button></form>}</Modal>;
};
const PatientBillingPage = ({user}) => {
  const [bills, setBills] = useState([]);
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState(false);
  const fetchBills = useCallback(() => apiFetch(`/api/patient/billing/${user.id}`).then(d => setBills(d.payments)), [user.id]);
  useEffect(() => { fetchBills(); }, [fetchBills]);
  const pay = async (id) => { await apiFetch('/api/patient/pay', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({paymentId:id, patientId:user.id})}); setOpen(false); fetchBills(); };
  return <><PaymentModal isOpen={open} onClose={()=>setOpen(false)} payment={sel} onSubmit={pay} /><div className="p-6 bg-white rounded-xl shadow-lg"><h3 className="text-xl font-bold">Billing</h3>{bills.map(b=><div key={b.PaymentID} className="border-b py-2 flex justify-between"><span>${b.Amount} - {b.Status}</span>{b.Status==='Pending'&&<button onClick={()=>{setSel(b);setOpen(true)}} className="px-2 py-1 bg-green-600 text-white rounded">Pay</button>}</div>)}</div></>;
};
const PatientSupportPage = () => { const [g, setG] = useState([]); useEffect(()=>{ apiFetch('/api/support-groups').then(d=>setG(d.groups))},[]); return <div className="p-6 bg-white rounded-xl shadow-lg"><h3 className="text-xl font-bold">Groups</h3>{g.map(x=><div key={x.GroupID} className="border-b py-2">{x.GroupName}</div>)}</div>; };

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username, password) => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      setUser({ role: data.role, id: data.id, userId: data.userId });
      setPage('dashboard');
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleRegister = async (formData) => {
    setLoading(true);
    try {
      await apiFetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      alert('Registration successful');
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  if (!user) return <AuthPage onLogin={handleLogin} onRegister={handleRegister} appLoading={loading} />;

  return <MainLayout user={user} onLogout={() => setUser(null)} page={page} setPage={setPage} />;
}