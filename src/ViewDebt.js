import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import "./ViewDebt.css";

function ViewDebt() {
  const { userId } = useParams();
  const [debts, setDebts] = useState([]);
  const [editingDebt, setEditingDebt] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: 0,
    quantity: 1,
    status: ""
  });

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, "debts"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDebts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [userId]);

  const handleEdit = (debt) => {
    setEditingDebt(debt.id);
    setEditForm({
      title: debt.title,
      description: debt.description,
      price: debt.price,
      quantity: debt.quantity,
      status: debt.status
    });
  };

  const handleCancelEdit = () => {
    setEditingDebt(null);
    setEditForm({
      title: "",
      description: "",
      price: 0,
      quantity: 1,
      status: ""
    });
  };

  const handleUpdate = async (debtId) => {
    try {
      const debtRef = doc(db, "debts", debtId);
      await updateDoc(debtRef, {
        ...editForm,
        price: Number(editForm.price),
        quantity: Number(editForm.quantity)
      });
      setEditingDebt(null);
    } catch (error) {
      console.error("Error updating debt:", error);
      alert("Failed to update debt");
    }
  };

  const handleDelete = async (debtId) => {
    if (window.confirm("Are you sure you want to delete this debt record?")) {
      try {
        await deleteDoc(doc(db, "debts", debtId));
      } catch (error) {
        console.error("Error deleting debt:", error);
        alert("Failed to delete debt");
      }
    }
  };

  return (
    <div className="view-debt-container">
      <h2>My Debt Records</h2>

      {debts.length === 0 ? (
        <p className="no-debt-message">You don't have any debts yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="debt-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((debt) => (
                <tr key={debt.id}>
                  {editingDebt === debt.id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="edit-input"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="edit-input"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="edit-input"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                        />
                      </td>
                      <td>₱{(editForm.price * editForm.quantity).toFixed(2)}</td>
                      <td>
                        <select
                          className="edit-input"
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>
                      <td className="action-buttons">
                        <button className="save-btn" onClick={() => handleUpdate(debt.id)}>
                          Save
                        </button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{debt.title}</td>
                      <td>{debt.description}</td>
                      <td>₱{debt.price.toFixed(2)}</td>
                      <td>{debt.quantity}</td>
                      <td>₱{(debt.price * (debt.quantity || 1)).toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${debt.status}`}>{debt.status}</span>
                      </td>
                      <td className="action-buttons">
                        <button className="edit-btn" onClick={() => handleEdit(debt)}>
                          Edit
                        </button>
                        <button className="delete-btn" onClick={() => handleDelete(debt.id)}>
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={() => window.history.back()} className="back-btn">
        Go Back
      </button>
    </div>
  );
}

export default ViewDebt;