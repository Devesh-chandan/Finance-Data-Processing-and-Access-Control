import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import Modal from "../components/Modal";

export default function Users() {
  const { isRole } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VIEWER" });

  const fetchUsers = async () => {
    const { data } = await api.get("/users");
    setUsers(data.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!isRole("ADMIN")) return <Navigate to="/transactions" replace />;

  const updateUser = async (id: string, payload: Record<string, string>) => {
    await api.patch(`/users/${id}`, payload);
    fetchUsers();
  };

  const addUser = async (e: FormEvent) => {
    e.preventDefault();
    await api.post("/auth/register", form);
    setOpen(false);
    setForm({ name: "", email: "", password: "", role: "VIEWER" });
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="rounded bg-blue-600 px-3 py-2 hover:bg-blue-500" onClick={() => setOpen(true)}>
          Add User
        </button>
      </div>
      <table className="w-full border-collapse overflow-hidden rounded border border-gray-800 bg-gray-900 text-sm">
        <thead><tr className="bg-gray-800 text-left"><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-gray-800">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">
                <select className="rounded border border-gray-800 bg-gray-950 p-1" value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="ANALYST">ANALYST</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </td>
              <td className="p-2">
                <span className={`rounded px-2 py-1 text-xs ${u.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}>{u.status}</span>
              </td>
              <td className="p-2">
                <button className="rounded bg-rose-700 px-2 py-1" onClick={() => updateUser(u.id, { status: "INACTIVE" })}>
                  Deactivate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={open} title="Add User" onClose={() => setOpen(false)}>
        <form className="space-y-2" onSubmit={addUser}>
          <input className="w-full rounded border border-gray-800 bg-gray-950 p-2" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="w-full rounded border border-gray-800 bg-gray-950 p-2" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input type="password" className="w-full rounded border border-gray-800 bg-gray-950 p-2" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <select className="w-full rounded border border-gray-800 bg-gray-950 p-2" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            <option value="ADMIN">ADMIN</option>
            <option value="ANALYST">ANALYST</option>
            <option value="VIEWER">VIEWER</option>
          </select>
          <button className="w-full rounded bg-blue-600 px-3 py-2 hover:bg-blue-500">Create User</button>
        </form>
      </Modal>
    </div>
  );
}
