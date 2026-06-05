import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  // Explicitly check for the string "true" to avoid accidental truthy values
  const isLoggedIn = localStorage.getItem("adminLoggedIn") === "true";

  return isLoggedIn ? children : <Navigate to="/" />;
}

export default ProtectedRoute;