import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [error, setError] = useState("");
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showMinusDebtForm, setShowMinusDebtForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [minusAmount, setMinusAmount] = useState(0);
  const [debtForm, setDebtForm] = useState({
    title: "",
    description: "",
    debtDate: "",
    price: 0,
    quantity: 1,
  });

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
  const totalDebt = users.reduce((total, user) => total + calculateUserDebt(user.id), 0);

  const calculateTotalDebt = () => {
    return debts
      .reduce((total, debt) => {
        // Sum up the debt for each user using the same formula for debt calculation
        const userDebtAmount = debt.price * (debt.quantity || 1);
        return total + userDebtAmount;
      }, 0)
      .toFixed(2); // Format to 2 decimal places
  };
  
  
  const formatDate = (timestamp) => {
    return timestamp?.seconds
      ? new Date(timestamp.seconds * 1000).toLocaleString()
      : "N/A";
  };

  const handleAddDebt = async () => {
    if (!selectedUser) {
      setError("Please select a user first.");
      return;
    }

    if (!debtForm.title || !debtForm.description || !debtForm.debtDate || debtForm.price <= 0 || debtForm.quantity <= 0) {
      setError("All fields must be filled with valid values.");
      return;
    }

    try {
      await addDoc(collection(db, "debts"), {
        userId: selectedUser.id,
        title: debtForm.title,
        description: debtForm.description,
        debtDate: debtForm.debtDate,
        price: parseFloat(debtForm.price),
        quantity: parseInt(debtForm.quantity),
        total: parseFloat(debtForm.price) * parseInt(debtForm.quantity),
        status: "unpaid",
        createdAt: serverTimestamp(),
      });

      setShowDebtForm(false);
      setDebtForm({
        title: "",
        description: "",
        debtDate: "",
        price: 0,
        quantity: 1,
      });
      setError("");
      alert("Debt added successfully!");
    } catch (error) {
      setError("Error adding debt: " + error.message);
    }
  };

  const handleMinusDebt = async () => {
    if (!selectedUser || minusAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const userDebtsQuery = query(
      collection(db, "debts"),
      where("userId", "==", selectedUser.id),
      where("status", "==", "unpaid")
    );

    const querySnapshot = await getDocs(userDebtsQuery);

    if (querySnapshot.empty) {
      alert("No unpaid debts for this user.");
      return;
    }

    let remainingAmount = parseFloat(minusAmount);
    let updatedDebts = [...debts];

    try {
      for (let debtDoc of querySnapshot.docs) {
        if (remainingAmount <= 0) break;

        const debt = debtDoc.data();
        const debtRef = doc(db, "debts", debtDoc.id);

        const currentTotal = debt.price * (debt.quantity || 1);
        let newTotal = currentTotal; // ✅ Initialize newTotal properly

        if (currentTotal <= remainingAmount) {
          // Mark debt as paid if we can fully cover it
          await updateDoc(debtRef, { status: "paid", total: 0 });
          newTotal = 0;
          remainingAmount -= currentTotal;
        } else {
          // Reduce the amount from this debt
          newTotal = currentTotal - remainingAmount;
          await updateDoc(debtRef, {
            price: newTotal / (debt.quantity || 1),
            total: newTotal,
          });
          remainingAmount = 0;
        }

        // Update local debts state
        updatedDebts = updatedDebts.map((d) =>
          d.id === debtDoc.id ? { ...d, total: newTotal, status: newTotal > 0 ? "unpaid" : "paid" } : d
        );
      }

      setDebts(updatedDebts);
      setShowMinusDebtForm(false);
      setMinusAmount(0);
      alert("Debt successfully reduced!");
    } catch (error) {
      console.error("Error updating debt:", error);
      setError("Failed to update debt status.");
    }
  };

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <h1>Admin Dashboard</h1>
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
          <h3>₱{totalDebt.toFixed(2)}</h3>
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
            <button onClick={() => { setSelectedUser(user); setShowDebtForm(true); }} className="add-debt-btn">
              Add Debt
            </button>

            <button onClick={() => { setSelectedUser(user); setShowMinusDebtForm(true); }} className="minus-debt-btn">
              Minus Debt
            </button>

            <button onClick={() => navigate(`/view-debt/${user.id}`)} className="view-debt-btn">
              View All My Debt
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* Display total debt */}
  <div className="total-debt-container">
    <h3>Total Debt: ₱{totalDebt.toFixed(2)}</h3>
  </div>
</div>

      {showDebtForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Debt for {selectedUser?.name}</h2>
            <form>
              <label>Title</label>
              <input 
                type="text" 
                value={debtForm.title} 
                onChange={(e) => setDebtForm({ ...debtForm, title: e.target.value })}
              />
              <label>Description</label>
              <input 
                type="text" 
                value={debtForm.description} 
                onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })}
              />
              <label>Debt Date</label>
              <input 
                type="date" 
                value={debtForm.debtDate} 
                onChange={(e) => setDebtForm({ ...debtForm, debtDate: e.target.value })}
              />
              <label>Price</label>
              <input 
                type="number" 
                value={debtForm.price} 
                onChange={(e) => setDebtForm({ ...debtForm, price: e.target.value })}
              />
              <label>Quantity</label>
              <input 
                type="number" 
                value={debtForm.quantity} 
                onChange={(e) => setDebtForm({ ...debtForm, quantity: e.target.value })}
              />
              <div className="form-buttons">
                <button type="button" onClick={handleAddDebt} className="submit-btn">Add Debt</button>
                <button onClick={() => setShowDebtForm(false)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMinusDebtForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Minus Debt for {selectedUser?.name}</h2>
            <label>Enter Amount</label>
            <input type="number" value={minusAmount} onChange={(e) => setMinusAmount(e.target.value)} />
            <div className="form-buttons">
              <button onClick={handleMinusDebt} className="submit-btn">Submit</button>
              <button onClick={() => setShowMinusDebtForm(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
