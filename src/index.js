import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Homepage from './Homepage';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import ViewDebt from './ViewDebt'; // Import ViewDebt Component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/view-debt/:userId" element={<ViewDebt />} /> 
        {/* New Route for ViewDebt */}
      </Routes>
    </Router>
  </React.StrictMode>
);
