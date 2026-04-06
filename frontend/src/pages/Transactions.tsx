import { FormEvent, useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";
import Modal from "../components/Modal";

const money = (paise: number) =>
  (paise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });

export default function Transactions() {
  const { isRole } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({ type: "", category: "", startDate: "", endDate: "" });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", type: "EXPENSE", category: "", date: "", notes: "" });

  const fetchData = async (nextPage = page) => {
    const { data } = await api.get("/transactions", { params: { ...filters, page: nextPage, limit } });
    setRows(data.data);
    setTotal(data.total);
    setPage(data.page);
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const onFilter = (e: FormEvent) => {
    e.preventDefault();
    fetchData(1);
  };

  const createTx = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.patch(`/transactions/${editingId}`, form);
    } else {
      await api.post("/transactions", form);
    }
    setOpen(false);
    setEditingId(null);
    setForm({ amount: "", type: "EXPENSE", category: "", date: "", notes: "" });
    fetchData(1);
  };
  const startEdit = (row: any) => {
    setEditingId(row.id);
    setForm({
      amount: String(row.amount / 100),
      type: row.type,
      category: row.category,
      date: new Date(row.date).toISOString().slice(0, 10),
      notes: row.notes || "",
    });
    setOpen(true);
  };


  const removeTx = async (id: string) => {
    await api.delete(`/transactions/${id}`);
    fetchData(page);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <form onSubmit={onFilter} className="grid grid-cols-1 gap-2 rounded border border-gray-800 bg-gray-900 p-3 md:grid-cols-6">
        <select className="rounded border border-gray-800 bg-gray-950 p-2" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
          <option value="">All</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <input className="rounded border border-gray-800 bg-gray-950 p-2" placeholder="Category" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} />
        <input type="date" className="rounded border border-gray-800 bg-gray-950 p-2" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} />
        <input type="date" className="rounded border border-gray-800 bg-gray-950 p-2" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} />
        <button className="rounded bg-blue-600 px-3 py-2 hover:bg-blue-500">Search</button>
        {isRole("ADMIN") && <button type="button" className="rounded bg-gray-800 px-3 py-2 hover:bg-gray-700" onClick={() => setOpen(true)}>Add Transaction</button>}
      </form>
      <table className="w-full border-collapse overflow-hidden rounded border border-gray-800 bg-gray-900 text-sm">
        <thead><tr className="bg-gray-800 text-left"><th className="p-2">Date</th><th className="p-2">Category</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Notes</th><th className="p-2">Actions</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-gray-800">
              <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
              <td className="p-2">{r.category}</td>
              <td className="p-2"><span className={`rounded px-2 py-1 text-xs ${r.type === "INCOME" ? "bg-green-500/20 text-green-400" : "bg-rose-500/20 text-rose-400"}`}>{r.type}</span></td>
              <td className={`p-2 font-mono ${r.type === "INCOME" ? "text-green-400" : "text-rose-400"}`}>{money(r.amount)}</td>
              <td className="p-2 text-gray-400">{r.notes || "-"}</td>
              <td className="p-2">
                {isRole("ADMIN") ? (
                  <div className="flex gap-2">
                    <button className="rounded bg-gray-800 px-2 py-1" onClick={() => startEdit(r)}>Edit</button>
                    <button className="rounded bg-rose-700 px-2 py-1" onClick={() => removeTx(r.id)}>Delete</button>
                  </div>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-end gap-2">
        <button className="rounded bg-gray-800 px-3 py-2 hover:bg-gray-700" disabled={page <= 1} onClick={() => fetchData(page - 1)}>Previous</button>
        <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
        <button className="rounded bg-gray-800 px-3 py-2 hover:bg-gray-700" disabled={page >= totalPages} onClick={() => fetchData(page + 1)}>Next</button>
      </div>

      <Modal open={open} title={editingId ? "Edit Transaction" : "Add Transaction"} onClose={() => { setOpen(false); setEditingId(null); }}>
        <form className="space-y-2" onSubmit={createTx}>
          <input className="w-full rounded border border-gray-800 bg-gray-950 p-2" placeholder="Amount (Rupees)" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          <select className="w-full rounded border border-gray-800 bg-gray-950 p-2" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="EXPENSE">EXPENSE</option>
            <option value="INCOME">INCOME</option>
          </select>
          <input className="w-full rounded border border-gray-800 bg-gray-950 p-2" placeholder="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <input type="date" className="w-full rounded border border-gray-800 bg-gray-950 p-2" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <textarea className="w-full rounded border border-gray-800 bg-gray-950 p-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <button className="w-full rounded bg-blue-600 px-3 py-2 hover:bg-blue-500">{editingId ? "Update" : "Create"}</button>
        </form>
      </Modal>
    </div>
  );
}
