import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Static admin credentials
  const ADMIN_EMAIL = "jocelynsolon@gmail.com";
  const ADMIN_PASSWORD = "123456";

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setError('');
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      alert('Logged in as admin successfully!');
      navigate('/admin-dashboard');
    } else {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <h2>Admin Login</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleAdminLogin}>
          <div className="input-group">
            <label>Admin Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label>Admin Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Login as Admin
          </button>
        </form>

        <button 
          onClick={() => navigate('/')}
          className="toggle-btn"
        >
          Back to User Login
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;