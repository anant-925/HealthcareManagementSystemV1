import React, { useState, useEffect } from 'react';

// --- Helper Functions & Components ---

// A simple hook to simulate fetching data
// We will replace this with real `fetch` calls
const useMockFetch = (user) => {
  const [data, setData] = useState({ title: 'Loading...', details: [] });

  useEffect(() => {
    if (!user) return;

    // Simulate API call based on role
    if (user.role === 'Patient') {
      setData({
        title: `Patient Dashboard (ID: ${user.id})`,
        details: [
          'View Medical History',
          'View Appointments',
          'Check Billing',
          'Find Support Groups'
        ]
      });
    } else if (user.role === 'Doctor') {
      setData({
        title: `Doctor Dashboard (ID: ${user.id})`,
        details: [
          'View Assigned Patients',
          'Update Patient Diagnosis',
          'View Schedule'
        ]
      });
    } else if (user.role === 'Admin') {
      setData({
        title: 'Admin Dashboard',
        details: [
          'Manage Staff (Doctors, Nurses)',
          'Manage Inpatient Rooms',
          'Oversee Billing & Payments',
          'Manage Support Groups'
        ]
      });
    }
  }, [user]);

  return data;
};

// --- Main Page Components ---

const LoginComponent = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-blue-600">
          Hospital Management System
        </h2>
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
              placeholder="admin, doctor, or patient"
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
              placeholder="password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

const MainLayout = ({ user, onLogout, page, setPage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Define links based on user role
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
      { name: 'Staff', page: 'staff' },
      { name: 'Rooms', page: 'rooms' },
      { name: 'Billing', page: 'billing' },
      { name: 'Support', page: 'support' },
    ];
  }

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
            {/* Menu Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
        <nav className="mt-4">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => setPage(link.page)}
              className={`flex items-center w-full px-4 py-3 ${
                page === link.page
                  ? 'bg-blue-900'
                  : 'hover:bg-blue-700'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              {/* Placeholder Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 8v8m-4-5v5m-4-2v2"
                />
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
            {/* Logout Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7"
              />
            </svg>
            <span className={`ml-3 ${!isSidebarOpen && 'hidden'}`}>
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 p-4 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">
            {page.charAt(0).toUpperCase() + page.slice(1)}
          </h1>
          <div className="text-right">
            <div className="font-medium">{user.role}</div>
            <div className="text-sm text-gray-500">
              {user.role} ID: {user.id || 'N/A'}
            </div>
          </div>
        </header>
        
        {/* Page Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* This is where we will render the specific page component */}
          <ContentArea user={user} page={page} />
        </main>
      </div>
    </div>
  );
};

// --- Content Area: Renders the selected page ---
const ContentArea = ({ user, page }) => {
  // This switch statement is our "router".
  // It renders the correct component based on the 'page' state.
  switch (page) {
    case 'dashboard':
      return <DashboardPage user={user} />;
    case 'history':
      return <PageStub title="My Medical History" />;
    case 'billing':
      return <PageStub title="Billing & Payments" />;
    case 'support':
      return <PageStub title="Support Groups & Calls" />;
    case 'patients':
      return <PageStub title="My Patients List" />;
    case 'schedule':
      return <PageStub title="My Schedule" />;
    case 'staff':
      return <PageStub title="Staff Management" />;
    case 'rooms':
      return <PageStub title="Inpatient Room Management" />;
    default:
      return <DashboardPage user={user} />;
  }
};

// --- Page Component Stubs (To be built out) ---

const DashboardPage = ({ user }) => {
  const data = useMockFetch(user); // Using mock data for now

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-3xl font-bold text-blue-600">{data.title}</h3>
      <p className="mt-4 text-gray-600">
        Welcome to the system. Here are the features available to you:
      </p>
      <ul className="mt-6 space-y-2 list-disc list-inside">
        {data.details.map((item, index) => (
          <li key={index} className="text-gray-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const PageStub = ({ title }) => (
  <div className="p-6 bg-white rounded-lg shadow-md">
    <h3 className="text-3xl font-bold text-gray-700">{title}</h3>
    <p className="mt-4 text-gray-500">
      This component is under construction. Full implementation for "{title}" will
      go here.
    </p>
  </div>
);

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null); // { role: 'Patient', id: 1, userId: 1 }
  const [page, setPage] = useState('dashboard');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // The main login handler
  const handleLogin = async (username, password) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser({
          role: data.role,
          id: data.id,
          userId: data.userId,
        });
        setPage('dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Could not connect to the server. Is it running?');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPage('login');
  };

  // Render the correct view
  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl">Loading...</h1>
      </div>
    );
  }

  if (!user) {
    return <LoginComponent onLogin={handleLogin} error={error} />;
  }

  return (
    <MainLayout
      user={user}
      onLogout={handleLogout}
      page={page}
      setPage={setPage}
    />
  );
}