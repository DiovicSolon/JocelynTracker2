import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          navigate('/admin-dashboard');
        } 
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegistering) {
        if (!name.trim() || !email.trim() || password.length < 6) {
          throw new Error('Please fill all fields. Password must be at least 6 characters.');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Automatically create users collection and store user data
        await setDoc(doc(collection(db, "users"), user.uid), {
          uid: user.uid,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          role: 'user',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isActive: true,
          emailVerified: user.emailVerified,
          metadata: {
            registrationSource: 'web',
            lastUpdated: serverTimestamp()
          }
        });
        
        alert('Account created successfully!');
        navigate('/homepage');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, "users", user.uid), {
          lastLogin: serverTimestamp()
        }, { merge: true });
        
        alert('Logged in successfully!');
        navigate('/homepage');
      }
      
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message);
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="input-group">
              <label>Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="input-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <button onClick={() => setIsRegistering(!isRegistering)} className="toggle-btn">
          {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>

        {/* Admin Login Button */}
        <button onClick={() => navigate('/admin-login')} className="admin-login-btn">
          Login as Admin
        </button>
      </div>
    </div>
  );
}

export default App;
