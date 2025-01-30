import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./ViewDebt.css";

function ViewDebt() {
  const { userId } = useParams();
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, "debts"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDebts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [userId]);

  const formatDate = (timestamp) => {
    return timestamp?.seconds
      ? new Date(timestamp.seconds * 1000).toLocaleString()
      : "N/A";
  };

  return (
    <div className="view-debt-container">
      <h2>User's Debt Records</h2>
      
      <table className="debt-table">
        <thead>
          <tr>
           
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total</th>
            <th>Status</th>
         
          </tr>
        </thead>
        <tbody>
          {debts.map((debt) => (
            <tr key={debt.id}>
             
              <td>{debt.title}</td>
              <td>{debt.description}</td>
              <td>₱{debt.price.toFixed(2)}</td>
              <td>{debt.quantity}</td>
              <td>₱{debt.total.toFixed(2)}</td>
              <td>{debt.status}</td>
              
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => window.history.back()} className="back-btn">
        Go Back
      </button>
    </div>
  );
}

export default ViewDebt;
