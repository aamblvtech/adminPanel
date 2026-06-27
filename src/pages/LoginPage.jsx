import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/admin-login", { email, password });
      if (response.data.success) {
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminToken", response.data.token);
        navigate("/dashboard");
      } else {
        alert(response.data.message || "Invalid Credentials");
      }
    } catch (err) {
      console.error("[Login Error]", err);
      alert(err.response?.data?.message || "Invalid Credentials");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form
        onSubmit={login}
        className="bg-white p-8 rounded-lg shadow-md w-[400px]"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-black text-white p-3 rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;