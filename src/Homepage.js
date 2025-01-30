import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { collection, onSnapshot, doc, query, where, getDocs } from "firebase/firestore";
import "./Homepage.css";

function Homepage() {
  const [users, setUsers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Real-time listener for users collection
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time listener for debts collection
    const unsubscribeDebts = onSnapshot(collection(db, "debts"), (snapshot) => {
      setDebts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeDebts();
    };
  }, []);

  const calculateUserDebt = (userId) => {
    return debts
      .filter((debt) => debt.userId === userId && debt.status === "unpaid")
      .reduce((total, debt) => total + debt.price * (debt.quantity || 1), 0);
  };

  const calculateTotalDebt = () => {
    return debts
      .reduce((total, debt) => total + debt.price * (debt.quantity || 1), 0)
      .toFixed(2);
  };

  const formatDate = (timestamp) => {
    return timestamp?.seconds
      ? new Date(timestamp.seconds * 1000).toLocaleString()
      : "N/A";
  };

  return (
    <div className="homepage">
      <nav className="home-nav">
        <h1>Welcome to the Homepage</h1>
        <button onClick={() => navigate("/")} className="logout-btn">
          Logout
        </button>
      </nav>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Outstanding Debt</h3>
          <p>₱{calculateTotalDebt()}</p>
        </div>
      </div>

      <div className="users-table-container">
        <h2>Registered Users</h2>
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
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>₱{calculateUserDebt(user.id).toFixed(2)}</td>
                <td>
                  <button onClick={() => { setSelectedUser(user); navigate(`/view-debt/${user.id}`); }} className="view-debt-btn">
                    View All My Debt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Homepage;
