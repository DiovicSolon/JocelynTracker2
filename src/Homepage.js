import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { collection, onSnapshot, doc, getDoc, query, where } from "firebase/firestore";
import { LogOut, UserCircle } from "lucide-react";
import "./Homepage.css";

function Homepage() {
  const [user, setUser] = useState(null);
  const [debts, setDebts] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const authUser = auth.currentUser;
      if (authUser) {
        const userDoc = await getDoc(doc(db, "users", authUser.uid));
        if (userDoc.exists()) {
          setUser({ id: authUser.uid, ...userDoc.data() });

          // Fetch only the debts that belong to this user
          const debtsQuery = query(collection(db, "debts"), where("userId", "==", authUser.uid));
          const unsubscribeDebts = onSnapshot(debtsQuery, (snapshot) => {
            setDebts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          });

          return () => unsubscribeDebts();
        }
      }
    };

    fetchUserData();
  }, []);

  const calculateUserDebt = () => {
    return debts
      .filter((debt) => debt.status === "unpaid")
      .reduce((total, debt) => total + debt.price * (debt.quantity || 1), 0);
  };

  const formatDate = (timestamp) => {
    return timestamp?.seconds
      ? new Date(timestamp.seconds * 1000).toLocaleString()
      : "N/A";
  };

  return (
    <div className="homepage">
      <nav className="home-nav">
        <div className="profile-section">
          <UserCircle className="profile-icon" />
          <h1>Welcome, {user ? user.name : "Guest"}!</h1>
        </div>
        <button onClick={() => navigate("/")} className="logout-btn">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </nav>

      {error && <div className="error-message">{error}</div>}

      {user ? (
        <div className="users-table-container">
          <h2>My Account</h2>
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Registration Date</th>
                <th>Total Debt</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>₱{calculateUserDebt().toFixed(2)}</td>
                <td>
                  <button onClick={() => navigate(`/view-debt/${user.id}`)} className="view-debt-btn">
                    View My Debts
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
}

export default Homepage;
