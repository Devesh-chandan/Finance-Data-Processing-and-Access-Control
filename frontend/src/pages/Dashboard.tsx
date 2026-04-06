import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api";
import { useAuth } from "../AuthContext";

const money = (paise: number) =>
  (paise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });

export default function Dashboard() {
  const { isRole } = useAuth();
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    transactionCount: 0,
  });
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.get("/dashboard/summary"), api.get("/dashboard/by-category"), api.get("/dashboard/trends")]).then(
      ([s, c, t]) => {
        setSummary(s.data.data);
        setByCategory(c.data.data);
        setTrends(t.data.data);
      },
    );
  }, []);

  if (!isRole("ADMIN", "ANALYST")) return <Navigate to="/transactions" replace />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card title="Total Income" value={money(summary.totalIncome)} cls="text-green-400" />
        <Card title="Total Expenses" value={money(summary.totalExpenses)} cls="text-rose-400" />
        <Card title="Net Balance" value={money(summary.netBalance)} cls="text-blue-400" />
        <Card title="Count" value={String(summary.transactionCount)} cls="text-gray-300" />
      </div>
      <section className="rounded border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3">Category Breakdown</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCategory}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalIncome" fill="#4ade80" />
              <Bar dataKey="totalExpenses" fill="#fb7185" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3">Monthly Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="totalIncome" stroke="#4ade80" />
              <Line type="monotone" dataKey="totalExpenses" stroke="#fb7185" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function Card({ title, value, cls }: { title: string; value: string; cls: string }) {
  return (
    <div className="rounded border border-gray-800 bg-gray-900 p-4">
      <p className="text-sm text-gray-400">{title}</p>
      <p className={`font-mono text-xl ${cls}`}>{value}</p>
    </div>
  );
}
