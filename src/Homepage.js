import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { collection, onSnapshot, doc, getDoc, query, where } from "firebase/firestore";
import { LogOut, UserCircle, CreditCard, CalendarDays, CircleDollarSign, Sun, Moon } from "lucide-react";
import "./Homepage.css";

function Homepage() {
  const [user, setUser] = useState(null);
  const [debts, setDebts] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");

  const navigate = useNavigate();

  useEffect(() => {
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const fetchUserData = async () => {
      const authUser = auth.currentUser;
      if (authUser) {
        const userDoc = await getDoc(doc(db, "users", authUser.uid));
        if (userDoc.exists()) {
          setUser({ id: authUser.uid, ...userDoc.data() });

          // Fetch debts for this user
          const debtsQuery = query(collection(db, "debts"), where("userId", "==", authUser.uid));
          const unsubscribeDebts = onSnapshot(debtsQuery, (snapshot) => {
            const sortedDebts = snapshot.docs
              .map((doc) => ({ id: doc.id, ...doc.data() }))
              .sort((a, b) => (a.status === "unpaid" ? -1 : 1)); // Sort unpaid first

            setDebts(sortedDebts);
          });

          return () => unsubscribeDebts();
        }
      }
    };

    fetchUserData();
  }, []);

  const calculateTotalDebt = () => {
    return debts
      .filter((debt) => debt.status === "unpaid")
      .reduce((total, debt) => total + debt.price * (debt.quantity || 1), 0);
  };

  const formatDate = (timestamp) => {
    return timestamp?.seconds
      ? new Date(timestamp.seconds * 1000).toLocaleDateString()
      : "N/A";
  };

  return (
    <div className="homepage">
      {/* Navigation Bar */}
      <nav className="home-nav">
        <div className="profile-section">
          <UserCircle className="profile-icon" />
          <h1>Welcome, {user ? user.name : "Guest"}!</h1>
        </div>
        <div className="nav-actions">
          <button onClick={() => navigate("/")} className="logout-btn">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Total Debt Section */}
      <div className="debt-summary">
        <h2>Total Debt</h2>
        <div className="debt-amount-card">
          <CreditCard className="debt-icon" />
          <p>₱{calculateTotalDebt().toFixed(2)}</p>
        </div>
      </div>

      <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle">
        {darkMode ? <Sun className="theme-icon" /> : <Moon className="theme-icon" />}
      </button>

      {/* Debt List */}
      <div className="debt-list">
        <h3>My Debts</h3>
        {debts.length > 0 ? (
          debts.map((debt) => (
            <div key={debt.id} className="debt-item">
              <div className="debt-info">
                <h4><CircleDollarSign className="debt-icon-small" /> {debt.description}</h4>
                <p><strong>Amount:</strong> ₱{(debt.price * (debt.quantity || 1)).toFixed(2)}</p>
                <p><CalendarDays className="debt-icon-small" /> <strong>Due Date:</strong> {formatDate(debt.dueDate)}</p>
              </div>
              <span className={`status-badge ${debt.status}`}>
                {debt.status === "unpaid" ? "Unpaid" : "Paid"}
              </span>
            </div>
          ))
        ) : (
          <p>{user && user.name === "Jocelyn" ? "Wait for an update from Jocelyn." : "You don't have any debts yet, or just wait for Jocelyn to update your debt."}</p>
        )}
      </div>
    </div>
  );
}

export default Homepage;
