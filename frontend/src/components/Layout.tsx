import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const roleBadgeMap = {
  ADMIN: "bg-amber-500/20 text-amber-400",
  ANALYST: "bg-blue-500/20 text-blue-400",
  VIEWER: "bg-slate-500/20 text-slate-400",
};

export default function Layout() {
  const { user, logout, isRole } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <aside className="fixed left-0 top-0 h-full w-56 border-r border-gray-800 bg-gray-900 p-4">
        <h1 className="mb-6 text-xl font-semibold">Finance Dashboard</h1>
        <nav className="space-y-2">
          <Link className="block rounded bg-gray-800 px-3 py-2 hover:bg-gray-700" to="/">
            Dashboard
          </Link>
          <Link
            className="block rounded bg-gray-800 px-3 py-2 hover:bg-gray-700"
            to="/transactions"
          >
            Transactions
          </Link>
          {isRole("ADMIN") && (
            <Link className="block rounded bg-gray-800 px-3 py-2 hover:bg-gray-700" to="/users">
              Users
            </Link>
          )}
        </nav>
      </aside>
      <main className="ml-56 min-h-screen">
        <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-2">
            <span>{user?.name}</span>
            {user && (
              <span className={`rounded px-2 py-1 text-xs ${roleBadgeMap[user.role]}`}>
                {user.role}
              </span>
            )}
          </div>
          <button
            className="rounded bg-gray-800 px-3 py-2 hover:bg-gray-700"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </header>
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
