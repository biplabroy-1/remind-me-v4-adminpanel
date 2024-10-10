import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import ScheduleForm from './components/ScheduleForm.jsx';
import HolidayManager from './components/HolidayManager.jsx';

const App = () => {
  return (
    <Router>
      <div>
        <h1 className='text-5xl font-bold text-center p-4 text-blue-600'>Class Schedule Admin Dashboard</h1>

        <nav className="flex justify-center space-x-4 mb-4">
          <Link to="/schedule" className="text-blue-500">Schedule Manager</Link>
          <Link to="/holiday" className="text-blue-500">Holiday Manager</Link>
        </nav>

        <Routes>
          <Route path="/schedule" element={<ScheduleForm />} />
          <Route path="/holiday" element={<HolidayManager />} />
          <Route path="/" element={<Navigate to="/schedule" />} /> {/* Redirecting to /schedule */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
