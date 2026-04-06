import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-100">Login</h2>
        <input
          className="mb-3 w-full rounded border border-gray-800 bg-gray-950 p-2 text-gray-100"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="mb-3 w-full rounded border border-gray-800 bg-gray-950 p-2 text-gray-100"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}
        <button className="w-full rounded bg-blue-600 px-3 py-2 hover:bg-blue-500">Sign In</button>
      </form>
    </div>
  );
}
