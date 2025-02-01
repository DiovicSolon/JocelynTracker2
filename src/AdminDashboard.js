// AdminDashboard.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from 'lucide-react';
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
 
} from "firebase/firestore";
import "./AdminDashboard.css";
import { X } from "lucide-react"; // Import close icon
// eslint-disable-next-line no-unused-vars



function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [error, setError] = useState("");
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showMinusDebtForm, setShowMinusDebtForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [minusAmount, setMinusAmount] = useState(0);
  const [selectedDebts, setSelectedDebts] = useState([]);
  const [debtForm, setDebtForm] = useState({
    title: "",
    description: "",
    debtDate: "",
    price: 0,
    quantity: 1,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

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

  const handlePaySelectedDebt = async (debtId, amount) => {
    try {
      const debtRef = doc(db, "debts", debtId);
      const debtDoc = debts.find(d => d.id === debtId);
      
      if (!debtDoc) return;

      const currentTotal = debtDoc.price * (debtDoc.quantity || 1);
      
      if (amount >= currentTotal) {
        await updateDoc(debtRef, {
          status: "paid",
          total: 0
        });
      } else {
        const newTotal = currentTotal - amount;
        await updateDoc(debtRef, {
          total: newTotal,
          price: newTotal / (debtDoc.quantity || 1)
        });
      }

      alert("Payment processed successfully!");
    } catch (error) {
      console.error("Error processing payment:", error);
      setError("Failed to process payment");
    }
  };

  const handleMinusDebt = async () => {
    if (!selectedUser || minusAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      let remainingAmount = parseFloat(minusAmount);
      const selectedDebtsTotal = selectedDebts.reduce((total, debtId) => {
        const debt = debts.find(d => d.id === debtId);
        return total + (debt ? debt.total : 0);
      }, 0);

      if (remainingAmount > selectedDebtsTotal) {
        alert("Payment amount exceeds selected debts total.");
        return;
      }

      for (const debtId of selectedDebts) {
        if (remainingAmount <= 0) break;
        
        const debt = debts.find(d => d.id === debtId);
        if (debt && debt.status === "unpaid") {
          const paymentForThisDebt = Math.min(remainingAmount, debt.total);
          await handlePaySelectedDebt(debtId, paymentForThisDebt);
          remainingAmount -= paymentForThisDebt;
        }
      }

      setShowMinusDebtForm(false);
      setMinusAmount(0);
      setSelectedDebts([]);
    } catch (error) {
      console.error("Error processing payments:", error);
      setError("Failed to process payments");
    }
  };

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <h1>Admin Dashboard</h1>
        <button onClick={() => navigate("/")} className="logout-btn">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
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
                <td className="action-buttons">
                  <button onClick={() => { 
                    setSelectedUser(user); 
                    setShowDebtForm(true); 
                  }} className="add-debt-btn">
                    Add Debt
                  </button>
                  <button onClick={() => {
                    setSelectedUser(user);
                    const userDebts = debts.filter(d => d.userId === user.id && d.status === "unpaid");
                    setSelectedDebts(userDebts.map(d => d.id));
                    setShowMinusDebtForm(true);
                  }} className="minus-debt-btn">
                    Minus Debt
                  </button>
                  <button onClick={() => navigate(`/view-debt/${user.id}`)} className="view-debt-btn">
                    View All Debts
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      <button onClick={() => setShowMinusDebtForm(false)} className="close-modal-btn">
        <X className="close-icon" />
      </button>
      <div className="debt-list">
        {debts
          .filter(debt => debt.userId === selectedUser?.id && debt.status === "unpaid")
          .map(debt => (
            <div key={debt.id} className="debt-item">
              <input
                type="checkbox"
                checked={selectedDebts.includes(debt.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDebts([...selectedDebts, debt.id]);
                  } else {
                    setSelectedDebts(selectedDebts.filter(id => id !== debt.id));
                  }
                }}
              />
              <span>{debt.title} - ₱{debt.total.toFixed(2)}</span>
              <button
                onClick={() => handlePaySelectedDebt(debt.id, debt.total)}
                className="pay-btn"
              >
                Pay Full
              </button>
            </div>
          ))}
      </div>
      <label>Enter Payment Amount</label>
      <input 
        type="number" 
        value={minusAmount} 
        onChange={(e) => setMinusAmount(e.target.value)}
        min="0"
        step="0.01"
      />
      <div className="form-buttons">
        <button onClick={handleMinusDebt} className="submit-btn">Pay Selected</button>
        <button onClick={() => {
          setShowMinusDebtForm(false);
          setSelectedDebts([]);
          setMinusAmount(0);
        }} className="cancel-btn">Cancel</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default AdminDashboard;