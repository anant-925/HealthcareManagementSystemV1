import React, { useState, useEffect, useCallback } from 'react';

// --- API HELPER ---
async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(`http://localhost:3001${url}`, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Server error');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Connection failed');
  }
}

// --- UI COMPONENTS ---

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
  </div>
);

const Card = ({ title, children, className = "", action }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
    {title && (
      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">{title}</h3>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const StatCard = ({ title, value, subValue, percentage, color, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}>
         {icon}
      </div>
    </div>
    {percentage !== undefined && (
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
        <div 
          className={`bg-${color}-500 h-full rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        ></div>
      </div>
    )}
    {subValue && (
      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
        {percentage !== undefined && <span className={`text-${color}-600 font-bold bg-${color}-50 px-1.5 py-0.5 rounded`}>{percentage}%</span>}
        {subValue}
      </p>
    )}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, type = "button" }) => {
  const baseStyle = "px-4 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95";
  const variants = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 shadow-sm hover:shadow-teal-200",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-emerald-200",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Alert = ({ type, message }) => {
  if (!message) return null;
  const styles = type === 'error' 
    ? "bg-red-50 text-red-700 border-red-200" 
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <div className={`p-4 rounded-lg border ${styles} mb-6 flex items-center animate-fade-in shadow-sm`}>
      <span className="text-lg mr-3">{type === 'error' ? '⚠️' : '✅'}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl transform transition-all scale-100 border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- ICONS ---
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Home: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  CreditCard: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Support: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Emergency: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  History: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Team: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
};

// --- AUTHENTICATION ---
const AuthPage = ({ onLogin, onRegister, error, message, appLoading }) => {
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({});

  const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,#2dd4bf_0%,transparent_50%),radial-gradient(circle_at_100%_0%,#6366f1_0%,transparent_30%)]"></div>
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative z-10 transform transition-all">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">MediCare</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium uppercase tracking-wide">Hospital Management System</p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
          {['login', 'register'].map((mode) => (
            <button
              key={mode}
              onClick={() => setAuthMode(mode)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${authMode === mode ? 'bg-white text-teal-700 shadow-sm transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <Alert type="error" message={error} />
        <Alert type="success" message={message} />

        {appLoading ? <Spinner /> : (
          <form onSubmit={(e) => {
            e.preventDefault();
            authMode === 'login' ? onLogin(formData.username, formData.password) : onRegister(formData);
          }} className="space-y-5">
            
            {authMode === 'register' && (
              <div className="space-y-4 animate-fade-in-up">
                <input name="name" placeholder="Full Name" required className="form-input" onChange={handleInput} />
                <div className="grid grid-cols-2 gap-4">
                  <input name="age" type="number" placeholder="Age" required className="form-input" onChange={handleInput} />
                  <select name="gender" className="form-input" onChange={handleInput} defaultValue="Male">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <input name="contact" type="tel" placeholder="Contact Number" required className="form-input" onChange={handleInput} />
                <input name="address" placeholder="Address" className="form-input" onChange={handleInput} />
              </div>
            )}
            
            <div className="space-y-4">
              <input name="username" placeholder="Username" required className="form-input" onChange={handleInput} />
              <input name="password" type="password" placeholder="Password" required className="form-input" onChange={handleInput} />
            </div>

            <Button type="submit" variant="primary" className="w-full py-3.5 text-lg mt-4">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- LAYOUT ---
const MainLayout = ({ user, onLogout, page, setPage, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const links = {
    Patient: [
      { id: 'dashboard', label: 'Overview', icon: Icons.Dashboard },
      { id: 'appointments', label: 'Appointments', icon: Icons.Calendar },
      { id: 'history', label: 'Medical History', icon: Icons.History },
      { id: 'billing', label: 'Billing', icon: Icons.CreditCard },
      { id: 'care-team', label: 'My Care Team', icon: Icons.Team },
      { id: 'support', label: 'Support Groups', icon: Icons.Support },
    ],
    Doctor: [
      { id: 'dashboard', label: 'Overview', icon: Icons.Dashboard },
      { id: 'schedule', label: 'Schedule', icon: Icons.Calendar },
      { id: 'patients', label: 'My Patients', icon: Icons.Users },
    ],
    Admin: [
      { id: 'dashboard', label: 'Overview', icon: Icons.Dashboard },
      { id: 'rooms', label: 'Rooms', icon: Icons.Home },
      { id: 'staff', label: 'Staff & Assignments', icon: Icons.Users },
      { id: 'billing', label: 'Billing', icon: Icons.CreditCard },
      { id: 'emergency', label: 'Emergency', icon: Icons.Emergency },
      { id: 'support', label: 'Support & Groups', icon: Icons.Support },
    ]
  };

  const navLinks = links[user.role] || [];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-30 shadow-sm`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-50">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">MediCare</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navLinks.map(link => {
            const isActive = page === link.id || (page === 'doctor-patient-history' && link.id === 'patients');
            return (
              <button
                key={link.id}
                onClick={() => setPage(link.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-teal-50 text-teal-700 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  <link.icon />
                </div>
                <span className={`whitespace-nowrap transition-opacity duration-200 ${!sidebarOpen && 'opacity-0 hidden'}`}>{link.label}</span>
                {isActive && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500"></div>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all group">
            <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className={`whitespace-nowrap font-medium ${!sidebarOpen && 'hidden'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 capitalize tracking-tight">
              {page.replace(/-/g, ' ')}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage your hospital operations efficiently</p>
          </div>
          <div className="flex items-center gap-4 pl-8 border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-slate-800">{user.role} Account</div>
              <div className="text-xs text-slate-500">ID: #{user.id}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 border border-white shadow-sm flex items-center justify-center text-teal-700 font-bold text-lg">
              {user.role[0]}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-20">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- PAGE COMPONENTS ---

const DashboardPage = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState({ occupancy: 0, revenuePending: 0 });
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState({ status: 'Checking', db: 'Checking' });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      let url = user.role === 'Admin' ? '/api/admin/stats' : `/api/${user.role.toLowerCase()}/dashboard/${user.id}`;
      const data = await apiFetch(url);
      setStats(data.stats);
      
      if (user.role === 'Admin' && data.stats) {
          const totalRooms = data.stats.rooms.total || 1;
          const occupiedRooms = data.stats.rooms.occupied || 0;
          const occPct = Math.round((occupiedRooms / totalRooms) * 100);
          
          const totalRevenue = parseFloat(data.stats.revenue.collected || 0);
          const pendingRevenue = parseFloat(data.stats.revenue.pending || 0);
          const totalPotential = totalRevenue + pendingRevenue || 1;
          const revPct = Math.round((pendingRevenue / totalPotential) * 100);
          
          setMetrics({ occupancy: occPct, revenuePending: revPct });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [user]);

  const fetchHealth = useCallback(async () => {
      try {
          const data = await apiFetch('/api/health');
          setHealth(data);
      } catch(e) { setHealth({ status: 'Error', db: 'Error' }); }
  }, []);

  useEffect(() => { 
      fetchStats(); 
      fetchHealth();
  }, [fetchStats, fetchHealth]);
  
  const handleBackup = async () => { if(window.confirm("Start system backup?")) { try { await apiFetch('/api/admin/backup', { method: 'POST' }); fetchStats(); alert("Backup completed successfully."); } catch(e) { alert(e.message); } } };

  const timeAgo = (dateString) => {
    if (!dateString || dateString === 'Never') return 'Never';
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  };

  if (loading) return <Spinner />;

  if (user.role === 'Admin') {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Patients" value={stats?.patients} color="blue" icon={<Icons.Users />} subValue="Registered in system" percentage={100} />
          <StatCard title="Doctor Staffing" value={`${stats?.doctors?.active || 0} / ${stats?.doctors?.total || 0}`} color="teal" icon={<Icons.Users />} subValue="Active (With Cases)" percentage={stats?.doctors?.total > 0 ? Math.round((stats.doctors.active/stats.doctors.total)*100) : 0} />
          <StatCard title="Room Occupancy" value={`${stats?.rooms?.occupied || 0} / ${stats?.rooms?.total || 0}`} color="purple" icon={<Icons.Home />} subValue="Occupied" percentage={metrics.occupancy} />
          <StatCard title="Revenue Collected" value={`$${parseFloat(stats?.revenue?.collected || 0).toLocaleString()}`} color="emerald" icon={<Icons.CreditCard />} subValue={`${metrics.revenuePending}% Pending`} percentage={100 - metrics.revenuePending} />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <Card title="Quick Actions" className="lg:col-span-2">
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {['Staff', 'Rooms', 'Billing', 'Emergency'].map(action => (
                 <button key={action} className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-center group">
                    <div className="font-semibold text-slate-700 group-hover:text-teal-700">{action}</div>
                    <div className="text-xs text-slate-400 group-hover:text-teal-600 mt-1">Manage</div>
                 </button>
               ))}
             </div>
          </Card>
          <Card title="System Status">
            <div className="space-y-4">
               <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-sm font-medium text-emerald-800">Server Status</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${health.status === 'Operational' ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>{health.status}</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-sm font-medium text-blue-800">Database</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${health.db === 'Connected' ? 'bg-blue-200 text-blue-800' : 'bg-red-200 text-red-800'}`}>{health.db}</span>
               </div>
               <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                 <div><span className="block text-sm text-slate-600">Last Backup</span><span className="text-xs text-slate-400">{timeAgo(stats?.lastBackup)}</span></div>
                 <Button onClick={handleBackup} className="px-3 py-1 text-xs">Backup Now</Button>
               </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (user.role === 'Doctor') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Today's Appointments" value={stats?.today} color="blue" icon={<Icons.Calendar />} subValue="Scheduled" />
          <StatCard title="Pending Requests" value={stats?.pending} color="yellow" icon={<Icons.Calendar />} subValue="Action Needed" />
          <StatCard title="Total Patients" value={stats?.patients} color="teal" icon={<Icons.Users />} subValue="All Time" />
        </div>
      </div>
    );
  }

  if (user.role === 'Patient') {
    return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Next Appointment" className="border-t-4 border-t-blue-500">
          {stats?.nextAppointment ? (
             <div className="text-center py-8">
               <div className="text-4xl font-bold text-slate-800 mb-2">{new Date(stats.nextAppointment.AppointmentDate).toLocaleDateString()}</div>
               <div className="text-xl text-teal-600 font-medium mb-6">{new Date(stats.nextAppointment.AppointmentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
               <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-50 rounded-full border border-slate-200">
                 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">Dr</div>
                 <div className="text-left">
                    <div className="text-sm font-bold text-slate-800">{stats.nextAppointment.DoctorName}</div>
                    <div className="text-xs text-slate-500">{stats.nextAppointment.Specialization}</div>
                 </div>
               </div>
             </div>
          ) : <p className="text-slate-500 text-center py-12">No upcoming appointments scheduled.</p>}
        </Card>
        <Card title="Outstanding Balance" className="border-t-4 border-t-red-500">
           <div className="text-center py-12">
             <div className={`text-5xl font-bold ${stats?.pendingBill > 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
               ${(stats?.pendingBill || 0).toLocaleString()}
             </div>
             <p className={`mt-4 font-medium ${stats?.pendingBill > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
               {stats?.pendingBill > 0 ? 'Payment Due Immediately' : 'Account in Good Standing'}
             </p>
           </div>
        </Card>
      </div>
    </div>
  );
  }
  return null;
};

// --- ADMIN PAGES ---

const AdminRoomPage = () => {
  const [data, setData] = useState({ rooms: [], occupied: [], patients: [] });
  const [forms, setForms] = useState({ pid: '', rid: '', type: 'General Ward', status: 'Available' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([apiFetch('/api/admin/rooms'), apiFetch('/api/admin/unassigned-patients')]);
      setData({ rooms: r.allRooms, occupied: r.occupiedRoomsDetails, patients: p.patients });
      if(p.patients.length) setForms(f => ({ ...f, pid: p.patients[0].PatientID }));
      const avail = r.allRooms.filter(x => x.Status === 'Available');
      if(avail.length) setForms(f => ({ ...f, rid: avail[0].RoomID }));
    } catch(e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const action = async (url, body) => {
    try {
      const res = await apiFetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
      setMsg(res.message); fetchAll();
    } catch(e) { alert(e.message); }
  };

  if(loading) return <Spinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      <Alert type="success" message={msg} />
      <div className="grid lg:grid-cols-2 gap-8">
        <Card title="Admit Patient">
           <form onSubmit={e => { e.preventDefault(); action('/api/admin/admit', { patientId: forms.pid, roomId: forms.rid }); }} className="space-y-4">
             <div>
               <label className="label">Select Patient</label>
               <select className="form-input" onChange={e => setForms({...forms, pid: e.target.value})} value={forms.pid} disabled={!data.patients.length}>
                  {data.patients.map(p => <option key={p.PatientID} value={p.PatientID}>{p.Name} (ID: {p.PatientID})</option>)}
               </select>
             </div>
             <div>
               <label className="label">Select Available Room</label>
               <select className="form-input" onChange={e => setForms({...forms, rid: e.target.value})} value={forms.rid}>
                  {data.rooms.filter(r => r.Status === 'Available').map(r => <option key={r.RoomID} value={r.RoomID}>{r.RoomType} {r.RoomID}</option>)}
               </select>
             </div>
             <Button type="submit" className="w-full">Admit Patient</Button>
           </form>
        </Card>
        <Card title="Add New Room">
           <form onSubmit={e => { e.preventDefault(); action('/api/admin/rooms', { roomType: forms.type, status: forms.status }); }} className="space-y-4">
             <div>
               <label className="label">Room Type</label>
               <select className="form-input" onChange={e => setForms({...forms, type: e.target.value})} value={forms.type}><option>General Ward</option><option>Private</option><option>ICU</option></select>
             </div>
             <div>
               <label className="label">Initial Status</label>
               <select className="form-input" onChange={e => setForms({...forms, status: e.target.value})} value={forms.status}><option>Available</option><option>Maintenance</option></select>
             </div>
             <Button type="submit" variant="secondary" className="w-full">Create Room</Button>
           </form>
        </Card>
      </div>
      <Card title="Room Inventory" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase"><tr><th className="px-6 py-3">ID</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Occupant</th><th className="px-6 py-3">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.rooms.map(r => {
                const p = data.occupied.find(o => o.RoomID === r.RoomID);
                return (
                  <tr key={r.RoomID} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{r.RoomID}</td>
                    <td className="px-6 py-4">{r.RoomType}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.Status==='Occupied'?'bg-red-100 text-red-700':r.Status==='Available'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{r.Status}</span></td>
                    <td className="px-6 py-4">{p ? p.PatientName : '-'}</td>
                    <td className="px-6 py-4">{p && <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => action('/api/admin/discharge', { patientId: p.PatientID })}>Discharge</Button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const AdminStaffPage = () => {
  const [data, setData] = useState({ docs: [], nurses: [], wards: [], patients: [] });
  const [form, setForm] = useState({ role: 'Doctor', name: '', spec: '', contact: '', user: '', pass: '' });
  const [assign, setAssign] = useState({ pid: '', role: 'Nurse', sid: '' });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([apiFetch('/api/admin/staff'), apiFetch('/api/admin/patients')]);
      setData({ docs: s.doctors, nurses: s.nurses, wards: s.wardboys, patients: p.patients });
      
      // Set defaults for assignment dropdowns
      if(p.patients.length) setAssign(a => ({...a, pid: p.patients[0].PatientID}));
      if(s.nurses.length) setAssign(a => ({...a, sid: s.nurses[0].NurseID}));
    } catch(e){
        console.error("Failed to load staff data", e);
    } finally { 
        setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Update assignment dropdown when role changes
  useEffect(() => {
      if (assign.role === 'Nurse' && data.nurses.length > 0) {
          setAssign(prev => ({ ...prev, sid: data.nurses[0].NurseID }));
      } else if (assign.role === 'WardBoy' && data.wards.length > 0) {
          setAssign(prev => ({ ...prev, sid: data.wards[0].WardBoyID }));
      } else {
          setAssign(prev => ({ ...prev, sid: '' }));
      }
  }, [assign.role, data.nurses, data.wards]);

  const handleReg = async (e) => {
    e.preventDefault();
    // --- FIX STARTS HERE: Wrapped in try/catch to prevent crash ---
    try {
        await apiFetch('/api/admin/staff', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({
                role: form.role, 
                name: form.name, 
                specialization: form.role === 'Doctor' ? form.spec : null, 
                contact: form.contact, 
                username: form.user, 
                password: form.pass
            })
        });
        
        // Refresh list and clear form on success
        fetchAll(); 
        setForm({ ...form, name: '', user: '', pass: '', contact: '' });
        alert("Staff Registered Successfully!");
    } catch (err) {
        // Alert the error instead of crashing
        alert(`Registration Failed: ${err.message}`);
    }
    // --- FIX ENDS HERE ---
  };

  const handleAssign = async (e) => {
      e.preventDefault();
      try {
          await apiFetch('/api/admin/assignments', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({
                  staffId: assign.sid, 
                  patientId: assign.pid, 
                  role: assign.role
              })
          });
          alert('Staff assigned successfully');
      } catch (err) {
          alert(`Assignment Failed: ${err.message}`);
      }
  };

  if(loading) return <Spinner />;
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid lg:grid-cols-2 gap-8">
        <Card title="Register Staff">
          <form onSubmit={handleReg} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <select className="form-input" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}><option>Doctor</option><option>Nurse</option><option>WardBoy</option></select>
               <input placeholder="Full Name" className="form-input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
             </div>
             {form.role === 'Doctor' && <input placeholder="Specialization" className="form-input" value={form.spec} onChange={e=>setForm({...form, spec:e.target.value})} required />}
             <input placeholder="Contact Info" className="form-input" value={form.contact} onChange={e=>setForm({...form, contact:e.target.value})} required />
             <div className="grid grid-cols-2 gap-4">
               <input placeholder="Username" className="form-input" value={form.user} onChange={e=>setForm({...form, user:e.target.value})} required />
               <input type="password" placeholder="Password" className="form-input" value={form.pass} onChange={e=>setForm({...form, pass:e.target.value})} required />
             </div>
             <Button type="submit" className="w-full">Register Staff</Button>
          </form>
        </Card>
        <Card title="Assign Staff">
            <form onSubmit={handleAssign} className="space-y-4">
               <div>
                   <label className="label">Select Patient</label>
                   <select className="form-input" value={assign.pid} onChange={e=>setAssign({...assign, pid:e.target.value})}>{data.patients.map(p=><option key={p.PatientID} value={p.PatientID}>{p.Name}</option>)}</select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="label">Role</label>
                       <select className="form-input" value={assign.role} onChange={e=>setAssign({...assign, role:e.target.value})}><option>Nurse</option><option>WardBoy</option></select>
                   </div>
                   <div>
                       <label className="label">Staff Member</label>
                       <select className="form-input" value={assign.sid} onChange={e=>setAssign({...assign, sid:e.target.value})}>{(assign.role==='Nurse'?data.nurses:data.wards).map(s=><option key={s.NurseID||s.WardBoyID} value={s.NurseID||s.WardBoyID}>{s.Name}</option>)}</select>
                   </div>
               </div>
               <Button type="submit" variant="success" className="w-full">Assign Staff</Button>
            </form>
        </Card>
        <Card title="Staff Directory" className="lg:col-span-2">
          <div className="grid md:grid-cols-3 gap-6">
             <div className="p-4 bg-teal-50 rounded-lg"><h4 className="font-bold text-teal-800 mb-3 border-b border-teal-200 pb-2">Doctors</h4><div className="space-y-2 max-h-60 overflow-y-auto">{data.docs.map(d=><div key={d.DoctorID} className="text-sm">{d.Name} <span className="block text-xs text-teal-600">{d.Specialization}</span></div>)}</div></div>
             <div className="p-4 bg-indigo-50 rounded-lg"><h4 className="font-bold text-indigo-800 mb-3 border-b border-indigo-200 pb-2">Nurses</h4><div className="space-y-2 max-h-60 overflow-y-auto">{data.nurses.map(n=><div key={n.NurseID} className="text-sm">{n.Name}</div>)}</div></div>
             <div className="p-4 bg-amber-50 rounded-lg"><h4 className="font-bold text-amber-800 mb-3 border-b border-amber-200 pb-2">Ward Boys</h4><div className="space-y-2 max-h-60 overflow-y-auto">{data.wards.map(w=><div key={w.WardBoyID} className="text-sm">{w.Name}</div>)}</div></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const AdminBillingPage = () => {
  const [data, setData] = useState({ pending: [], history: [], patients: [] });
  const [form, setForm] = useState({ pid: '', amt: '', mode: 'Cash' });
  
  const fetchAll = useCallback(async () => {
     const [b, p] = await Promise.all([apiFetch('/api/admin/billing'), apiFetch('/api/admin/patients')]);
     setData({ ...b, patients: p.patients });
     if(p.patients.length) setForm(f => ({...f, pid: p.patients[0].PatientID}));
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (e) => {
    e.preventDefault();
    await apiFetch('/api/admin/billing', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({patientId: form.pid, amount: form.amt, paymentMode: form.mode})});
    fetchAll(); setForm(f=>({...f, amt:''}));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <Card title="Create Bill">
         <form onSubmit={create} className="flex flex-col md:flex-row gap-4 items-end">
           <select className="form-input flex-1" value={form.pid} onChange={e=>setForm({...form, pid:e.target.value})}>{data.patients.map(p=><option key={p.PatientID} value={p.PatientID}>{p.Name}</option>)}</select>
           <input type="number" placeholder="Amount" className="form-input flex-1" value={form.amt} onChange={e=>setForm({...form, amt:e.target.value})} required />
           <select className="form-input flex-1" value={form.mode} onChange={e=>setForm({...form, mode:e.target.value})}><option>Cash</option><option>E-Banking</option><option>Card</option></select>
           <Button type="submit">Generate Bill</Button>
         </form>
      </Card>
      <div className="grid md:grid-cols-2 gap-8">
         <Card title="Pending Payments">
            {data.pending.map(p => <div key={p.PatientID} className="flex justify-between py-2 border-b"><span>{p.PatientName}</span><span className="font-bold text-red-600">${p.TotalDue}</span></div>)}
         </Card>
         <Card title="Recent Transactions">
            {data.history.map(h => <div key={h.PaymentID} className="flex justify-between py-2 border-b text-sm"><span>{h.PatientName}</span><span className="text-emerald-600 font-medium">+${h.Amount}</span></div>)}
         </Card>
      </div>
    </div>
  );
};

const AdminSupportPage = () => {
    const [data, setData] = useState({ logs: [], groups: [], patients: [] });
    const [form, setForm] = useState({ pid: '', detail: '' });
    const [groupForm, setGroupForm] = useState({ name: '', desc: '', time: '' });
    const [activeTab, setActiveTab] = useState('calls'); // 'calls' or 'groups'
    const [selectedGroup, setSelectedGroup] = useState(null); // For viewing members
    const [modalOpen, setModalOpen] = useState(false);
    
    const fetchAll = useCallback(async () => {
        const [p, g, c] = await Promise.all([apiFetch('/api/admin/patients'), apiFetch('/api/support-groups'), apiFetch('/api/admin/support-calls')]);
        setData({ patients: p.patients, groups: g.groups, logs: c.calls });
        if(p.patients.length) setForm(f => ({...f, pid: p.patients[0].PatientID}));
    }, []);
    useEffect(() => { fetchAll(); }, [fetchAll]);

    const logCall = async (e) => {
        e.preventDefault();
        await apiFetch('/api/admin/support-calls', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({patientId: form.pid, details: form.detail})});
        fetchAll(); setForm(f=>({...f, detail:''}));
    };

    const createGroup = async (e) => {
        e.preventDefault();
        await apiFetch('/api/admin/support-groups', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({groupName: groupForm.name, description: groupForm.desc, meetingTime: groupForm.time})});
        fetchAll(); setGroupForm({name:'', desc:'', time:''});
        alert("Group created!");
    };

    const viewMembers = async (group) => {
        try {
            const res = await apiFetch(`/api/admin/support-groups/${group.GroupID}/members`);
            setSelectedGroup({ ...group, members: res.members });
            setModalOpen(true);
        } catch(e) { alert(e.message); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex space-x-4 border-b border-slate-200 pb-4">
                <button onClick={() => setActiveTab('calls')} className={`pb-2 px-4 font-semibold ${activeTab==='calls' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Call Logs</button>
                <button onClick={() => setActiveTab('groups')} className={`pb-2 px-4 font-semibold ${activeTab==='groups' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Group Management</button>
            </div>

            {activeTab === 'calls' ? (
                <div className="grid lg:grid-cols-2 gap-8">
                    <Card title="Support Logger">
                        <form onSubmit={logCall} className="space-y-4">
                            <select className="form-input" value={form.pid} onChange={e=>setForm({...form, pid:e.target.value})}>{data.patients.map(p=><option key={p.PatientID} value={p.PatientID}>{p.Name}</option>)}</select>
                            <textarea className="form-input" placeholder="Enter call details..." value={form.detail} onChange={e=>setForm({...form, detail:e.target.value})} rows="3"></textarea>
                            <Button type="submit">Log Call</Button>
                        </form>
                    </Card>
                    <Card title="Recent Logs" className="lg:col-span-2">
                        <div className="h-64 overflow-y-auto pr-2">
                            {data.logs.map(l => (
                                <div key={l.CallID} className="mb-4 pb-4 border-b last:border-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-slate-700">{l.PatientName}</span>
                                        <span className="text-xs text-slate-400">{new Date(l.CallDate).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{l.CallDetails}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="grid lg:grid-cols-2 gap-8">
                    <Card title="Create Support Group">
                        <form onSubmit={createGroup} className="space-y-4">
                            <input className="form-input" placeholder="Group Name" value={groupForm.name} onChange={e=>setGroupForm({...groupForm, name:e.target.value})} required />
                            <input className="form-input" placeholder="Meeting Time (e.g. Fridays 5PM)" value={groupForm.time} onChange={e=>setGroupForm({...groupForm, time:e.target.value})} required />
                            <textarea className="form-input" placeholder="Description" value={groupForm.desc} onChange={e=>setGroupForm({...groupForm, desc:e.target.value})} required rows="3" />
                            <Button type="submit" variant="secondary">Create Group</Button>
                        </form>
                    </Card>
                    <Card title="Existing Groups">
                         <div className="space-y-4">
                             {data.groups.map(g => (
                                 <div key={g.GroupID} className="flex justify-between items-center p-4 border rounded-lg bg-slate-50">
                                     <div>
                                         <div className="font-bold text-slate-800">{g.GroupName}</div>
                                         <div className="text-xs text-slate-500">{g.MeetingTime}</div>
                                     </div>
                                     <Button onClick={() => viewMembers(g)} className="px-3 py-1 text-xs">View Members</Button>
                                 </div>
                             ))}
                         </div>
                    </Card>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedGroup?.GroupName || 'Members'}>
                {selectedGroup?.members?.length > 0 ? (
                    <ul className="space-y-2">
                        {selectedGroup.members.map((m, idx) => (
                            <li key={idx} className="flex justify-between border-b py-2">
                                <span className="font-medium">{m.PatientName}</span>
                                <span className="text-slate-500 text-sm">{m.Contact}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-slate-500">No members joined yet.</p>}
            </Modal>
        </div>
    );
};

const AdminEmergencyPage = () => {
    const [data, setData] = useState({ patients: [], doctors: [], logs: [] });
    const [form, setForm] = useState({ pid: '', did: '', detail: '' });

    const fetchAll = useCallback(async () => {
        const [p, s, l] = await Promise.all([apiFetch('/api/admin/patients'), apiFetch('/api/admin/staff'), apiFetch('/api/admin/emergency')]);
        setData({ patients: p.patients, doctors: s.doctors, logs: l.logs });
        if(p.patients.length) setForm(f => ({...f, pid: p.patients[0].PatientID}));
        if(s.doctors.length) setForm(f => ({...f, did: s.doctors[0].DoctorID}));
    }, []);
    useEffect(() => { fetchAll(); }, [fetchAll]);

    const log = async (e) => {
        e.preventDefault();
        await apiFetch('/api/admin/emergency', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({patientId: form.pid, doctorId: form.did, details: form.detail})});
        fetchAll(); setForm(f=>({...f, detail:''}));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <Card title="Emergency Intake" className="border-t-4 border-red-500">
                <form onSubmit={log} className="grid md:grid-cols-2 gap-4 items-end">
                    <select className="form-input" value={form.pid} onChange={e=>setForm({...form, pid:e.target.value})}>{data.patients.map(p=><option key={p.PatientID} value={p.PatientID}>{p.Name}</option>)}</select>
                    <select className="form-input" value={form.did} onChange={e=>setForm({...form, did:e.target.value})}>{data.doctors.map(d=><option key={d.DoctorID} value={d.DoctorID}>{d.Name}</option>)}</select>
                    <textarea className="form-input md:col-span-2" placeholder="Emergency details..." value={form.detail} onChange={e=>setForm({...form, detail:e.target.value})} rows="2"></textarea>
                    <Button type="submit" variant="danger" className="md:col-span-2">Log Emergency</Button>
                </form>
            </Card>
            <Card title="Emergency Log History">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50"><tr><th className="p-3">Time</th><th className="p-3">Patient</th><th className="p-3">Doctor</th><th className="p-3">Details</th></tr></thead>
                    <tbody className="divide-y">
                        {data.logs.map(l=><tr key={l.EmergencyID} className="hover:bg-red-50/30"><td className="p-3">{new Date(l.AdmissionDate).toLocaleString()}</td><td className="p-3 font-medium">{l.PatientName}</td><td className="p-3">{l.DoctorName}</td><td className="p-3 text-red-600 font-medium">{l.Details}</td></tr>)}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

// --- DOCTOR & PATIENT PAGES ---

const DoctorSchedulePage = ({ user, onRecordConsultation }) => {
  const [appointments, setAppointments] = useState([]);
  const fetch = useCallback(() => apiFetch(`/api/appointments/doctor/${user.id}`).then(d => setAppointments(d.appointments)), [user.id]);
  useEffect(() => { fetch(); }, [fetch]);

  const update = async (id, status) => {
    try {
        await apiFetch(`/api/appointments/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status})});
        fetch();
    } catch (e) {
        alert(`Update failed: ${e.message}`);
    }
  };

  return (
    <Card title="My Schedule" className="animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 uppercase text-slate-500"><tr><th className="p-4">Time</th><th className="p-4">Patient</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
          <tbody className="divide-y">
            {appointments.map(a => (
              <tr key={a.AppointmentID} className="hover:bg-slate-50">
                <td className="p-4">{new Date(a.AppointmentDate).toLocaleString()}</td>
                <td className="p-4 font-medium">{a.PatientName}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${a.Status==='Pending'?'bg-yellow-100 text-yellow-700':a.Status==='Confirmed'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-700'}`}>{a.Status}</span></td>
                <td className="p-4 flex gap-2">
                  {a.Status==='Pending' && <Button onClick={()=>update(a.AppointmentID, 'Confirmed')} className="px-2 py-1 text-xs">Confirm</Button>}
                  {a.Status==='Confirmed' && <Button variant="success" onClick={()=>onRecordConsultation(a.PatientID, a.AppointmentID)} className="px-2 py-1 text-xs">Consult</Button>}
                  {a.Status!=='Completed' && <Button variant="danger" onClick={()=>update(a.AppointmentID, 'Cancelled')} className="px-2 py-1 text-xs">Cancel</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const DoctorPatientsPage = ({ user, onViewHistory }) => {
  const [patients, setPatients] = useState([]);
  useEffect(() => { apiFetch(`/api/doctor/patients/${user.id}`).then(d => setPatients(d.patients)); }, [user.id]);
  return (
    <Card title="Patient Directory" className="animate-fade-in">
      <div className="grid gap-4">
        {patients.map(p => (
          <div key={p.PatientID} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div>
              <div className="font-bold text-lg text-slate-800">{p.Name}</div>
              <div className="text-sm text-slate-500">{p.Age} yrs • {p.Gender} • {p.Contact}</div>
            </div>
            <Button variant="secondary" onClick={() => onViewHistory(p.PatientID)}>History</Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

const DoctorPatientHistoryPage = ({ user, patientId, appointmentId, showAddForm, onBack }) => {
  const [data, setData] = useState({ patient: null, diagnoses: [] });
  const [form, setForm] = useState({ disease: '', prescription: '' });
  const [errorFetching, setErrorFetching] = useState(false); 
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setErrorFetching(false); 
    try {
      const d = await apiFetch(`/api/doctor/patient-history/${patientId}`);
      setData({ patient: d.patient, diagnoses: d.diagnoses });
    } catch(e) {
        console.error("Failed to fetch patient history:", e);
        setErrorFetching(true); 
    } finally {
        setLoading(false);
    }
  }, [patientId]);
  
  useEffect(() => { 
    if(patientId) fetchHistory(); 
  }, [fetchHistory, patientId]);

  const submit = async (e) => {
    e.preventDefault();
    try {
        await apiFetch('/api/doctor/diagnoses', { 
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body:JSON.stringify({
                patientId, 
                doctorId: user.id, 
                disease: form.disease, 
                prescription: form.prescription, 
                appointmentId
            }) 
        });
        
        alert('Consultation recorded successfully!');
        
        if(appointmentId) {
            onBack(); 
        } else { 
            fetchHistory(); 
            setForm({disease:'', prescription:''}); 
        }
    } catch (e) {
        alert(`Consultation Failed: ${e.message}`); 
    }
  };

  if(loading) return <Spinner />;
  if(errorFetching || !data.patient) return <Alert type="error" message="Could not load patient details." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-teal-600 hover:underline flex items-center gap-1">&larr; Back</button>
        <div className="text-xl font-bold text-slate-800">{data.patient.Name}</div>
      </div>

      {showAddForm && (
        <Card title="New Consultation Record" className="border-l-4 border-teal-500">
           <form onSubmit={submit} className="space-y-4">
             <input placeholder="Diagnosis" className="form-input" value={form.disease} onChange={e=>setForm({...form, disease:e.target.value})} required />
             <textarea placeholder="Prescription & Notes" className="form-input" rows="3" value={form.prescription} onChange={e=>setForm({...form, prescription:e.target.value})} required />
             <Button type="submit">Save Record & Complete Appointment</Button>
           </form>
        </Card>
      )}

      <div className="space-y-4">
        {data.diagnoses && data.diagnoses.map(d => (
          <div key={d.DiagnosisID} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-slate-800">{d.Disease}</span>
              <span className="text-sm text-slate-400">{new Date(d.DiagnosisDate).toLocaleDateString()}</span>
            </div>
            <p className="text-slate-600">{d.Prescription}</p>
            <div className="mt-2 text-xs text-teal-600 font-medium">Dr. {d.DoctorName || 'N/A'}</div> 
          </div>
        ))}
        {data.diagnoses.length === 0 && <p className="text-slate-500 text-center">No medical history found.</p>}
      </div>
    </div>
  );
};

const PatientAppointmentsPage = ({user}) => {
  const [data, setData] = useState({ docs: [], appts: [] });
  const [form, setForm] = useState({ doc: '', date: '', reason: '' });
  
  const fetch = useCallback(async () => {
      const [d, a] = await Promise.all([apiFetch('/api/doctors'), apiFetch(`/api/appointments/patient/${user.id}`)]);
      setData({ docs: d.doctors, appts: a.appointments });
      if(d.doctors.length) setForm(f => ({...f, doc: d.doctors[0].DoctorID}));
  }, [user.id]);
  useEffect(() => { fetch(); }, [fetch]);

  const book = async (e) => {
      e.preventDefault();
      await apiFetch('/api/appointments', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({patientId: user.id, doctorId: form.doc, appointmentDate: form.date, reason: form.reason})});
      fetch();
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <Card title="Book Appointment">
          <form onSubmit={book} className="grid md:grid-cols-2 gap-4">
             <select className="form-input" value={form.doc} onChange={e=>setForm({...form, doc:e.target.value})}>{data.docs.map(d=><option key={d.DoctorID} value={d.DoctorID}>{d.Name} ({d.Specialization})</option>)}</select>
             <input type="datetime-local" className="form-input" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} required />
             <textarea className="form-input md:col-span-2" placeholder="Reason for visit..." value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})} />
             <Button type="submit" className="md:col-span-2">Request Appointment</Button>
          </form>
       </Card>
       <Card title="History">
          {data.appts.map(a => (
            <div key={a.AppointmentID} className="flex justify-between items-center py-3 border-b last:border-0">
               <div>
                 <div className="font-medium">{new Date(a.AppointmentDate).toLocaleString()}</div>
                 <div className="text-sm text-slate-500">Dr. {a.DoctorName}</div>
               </div>
               <span className={`px-3 py-1 rounded-full text-xs ${a.Status==='Pending'?'bg-yellow-100 text-yellow-700':'bg-emerald-100 text-emerald-700'}`}>{a.Status}</span>
            </div>
          ))}
       </Card>
    </div>
  );
};

const PatientHistoryPage = ({user}) => {
  const [list, setList] = useState([]);
  useEffect(() => { apiFetch(`/api/patient/history/${user.id}`).then(d => setList(d.diagnoses)); }, [user.id]);
  
  return (
    <Card title="Medical History" className="animate-fade-in">
      <div className="space-y-4">
         {list.map(l=>(
           <div key={l.DiagnosisID} className="p-4 border rounded-lg">
              <div className="flex justify-between font-medium text-slate-800"><span>{l.Disease}</span><span>{new Date(l.DiagnosisDate).toLocaleDateString()}</span></div>
              <p className="text-slate-600 mt-1">{l.Prescription}</p>
              <p className="text-xs text-slate-400 mt-2">Dr. {l.DoctorName}</p>
           </div>
         ))}
      </div>
    </Card>
  );
};

const PatientBillingPage = ({user}) => {
  const [bills, setBills] = useState([]);
  const [modal, setModal] = useState(null);
  
  const fetch = useCallback(() => apiFetch(`/api/patient/billing/${user.id}`).then(d => setBills(d.payments)), [user.id]);
  useEffect(() => { fetch(); }, [fetch]);

  const pay = async () => {
    await apiFetch('/api/patient/pay', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({paymentId:modal.PaymentID, patientId:user.id})});
    setModal(null); fetch();
  };

  return (
    <>
      <Modal isOpen={!!modal} onClose={()=>setModal(null)} title="Pay Bill">
         {modal && (
           <div className="space-y-4">
             <p className="text-center text-3xl font-bold text-slate-800">${modal.Amount}</p>
             <p className="text-center text-slate-500">Secure Payment Simulation</p>
             <Button type="submit" variant="success" className="w-full" onClick={pay}>Confirm Payment</Button>
           </div>
         )}
      </Modal>
      <Card title="Billing History" className="animate-fade-in">
         {bills.map(b => (
           <div key={b.PaymentID} className="flex justify-between items-center py-4 border-b last:border-0">
              <div>
                <div className="font-bold text-slate-800">${b.Amount}</div>
                <div className="text-xs text-slate-500">{new Date(b.PaymentDate).toLocaleDateString()} • {b.PaymentMode}</div>
              </div>
              {b.Status==='Pending' ? <Button onClick={()=>setModal(b)} className="px-3 py-1 text-sm">Pay Now</Button> : <span className="text-emerald-600 font-medium text-sm">Paid</span>}
           </div>
         ))}
      </Card>
    </>
  );
};

const PatientCareTeamPage = ({ user }) => {
    const [staff, setStaff] = useState([]);
    useEffect(() => {
        apiFetch(`/api/patient/staff/${user.id}`).then(d => setStaff(d.assignments)).catch(console.error);
    }, [user.id]);

    return (
        <Card title="My Assigned Care Team" className="animate-fade-in">
            <div className="grid md:grid-cols-2 gap-4">
                {staff.length > 0 ? staff.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${s.Role === 'Nurse' ? 'bg-indigo-500' : 'bg-amber-500'}`}>
                            {s.Role[0]}
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">{s.StaffName}</div>
                            <div className="text-sm text-slate-500">{s.Role}</div>
                            <div className="text-xs text-slate-400 mt-1">{s.Contact}</div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-2 text-center py-10 text-slate-500">No nursing staff assigned yet.</div>
                )}
            </div>
        </Card>
    );
};

const PatientSupportPageInternal = ({ user }) => {
    const [groups, setGroups] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    
    const fetchData = useCallback(async () => {
        try {
            const [g, m] = await Promise.all([
                apiFetch('/api/support-groups'),
                apiFetch(`/api/patient/support-groups/my/${user.id}`)
            ]);
            setGroups(g.groups);
            setMyGroups(m.memberships || []);
        } catch(e){}
    }, [user.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const joinGroup = async (groupId) => {
        try {
            await apiFetch('/api/patient/support-groups/join', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ patientId: user.id, groupId })
            });
            alert("Joined group successfully!");
            fetchData();
        } catch (e) { alert(e.message); }
    };

    return (
      <Card title="Support Groups" className="animate-fade-in">
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map(g => {
            const isMember = myGroups.includes(g.GroupID);
            return (
              <div key={g.GroupID} className="p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                 <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold text-indigo-800 text-lg">{g.GroupName}</h4>
                     {isMember ? (
                         <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Joined</span>
                     ) : (
                         <Button onClick={() => joinGroup(g.GroupID)} className="px-3 py-1 text-xs">Join</Button>
                     )}
                 </div>
                 <p className="text-sm text-slate-600 mb-3">{g.Description}</p>
                 <div className="flex items-center text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                     {g.MeetingTime}
                 </div>
              </div>
            );
          })}
          {groups.length === 0 && <p className="text-center col-span-2 text-slate-500 py-8">No support groups available.</p>}
        </div>
      </Card>
    );
};

// --- MAIN APP WRAPPER ---
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- LIFTED STATE ---
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);

  // --- ACTIONS ---
  const viewPatientHistory = (patientId) => { 
      setSelectedPatientId(patientId); 
      setSelectedAppointmentId(null); 
      setShowDiagnosisForm(false); 
      setPage('doctor-patient-history'); 
  };

  const recordConsultation = (patientId, appointmentId) => { 
      setSelectedPatientId(patientId); 
      setSelectedAppointmentId(appointmentId); 
      setShowDiagnosisForm(true); 
      setPage('doctor-patient-history'); 
  };

  const handleLogin = async (username, password) => {
    setLoading(true); setError('');
    try {
      const data = await apiFetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      setUser({ role: data.role, id: data.id, userId: data.userId });
      setPage('dashboard');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleRegister = async (formData) => {
    setLoading(true); setError('');
    try {
      await apiFetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      alert('Registration successful! Please login.');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (!user) return <AuthPage onLogin={handleLogin} onRegister={handleRegister} error={error} appLoading={loading} />;

  // --- RENDER CONTENT ---
  const renderContent = () => {
    switch (page) {
        case 'dashboard': return <DashboardPage user={user} />;
        case 'appointments': return <PatientAppointmentsPage user={user} />;
        case 'history': return <PatientHistoryPage user={user} />;
        case 'billing': return user.role === 'Admin' ? <AdminBillingPage /> : <PatientBillingPage user={user} />;
        case 'care-team': return <PatientCareTeamPage user={user} />;
        case 'support': return user.role === 'Admin' ? <AdminSupportPage /> : <PatientSupportPageInternal user={user} />;
        case 'patients': return <DoctorPatientsPage user={user} onViewHistory={viewPatientHistory} />;
        case 'schedule': return <DoctorSchedulePage user={user} onRecordConsultation={recordConsultation} />;
        case 'doctor-patient-history': 
            return <DoctorPatientHistoryPage 
                      user={user} 
                      patientId={selectedPatientId} 
                      appointmentId={selectedAppointmentId} 
                      showAddForm={showDiagnosisForm} 
                      onBack={() => setPage(showDiagnosisForm ? 'schedule' : 'patients')} 
                   />;
        case 'staff': return <AdminStaffPage />;
        case 'rooms': return <AdminRoomPage />;
        case 'emergency': return <AdminEmergencyPage />;
        default: return <DashboardPage user={user} />;
    }
  };

  return <MainLayout user={user} onLogout={() => setUser(null)} page={page} setPage={setPage}>{renderContent()}</MainLayout>;
}