import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { Role } from "../types";

interface StoredUser {
  name: string;
  email: string;
  role: Role;
}

export default function Layout() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");

  let user: StoredUser | null = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser) as StoredUser;
    } catch {
      localStorage.removeItem("user");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/login");
  }

  const navigation = [
    {
      label: "Dashboard",
      path: "/dashboard",
      roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"],
    },
    {
      label: "Customers",
      path: "/customers",
      roles: ["ADMIN", "SALES", "ACCOUNTS"],
    },
    {
      label: "Products",
      path: "/products",
      roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"],
    },
    {
      label: "Sales Challans",
      path: "/challans",
      roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"],
    },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">ERP</div>

          <div>
            <strong>Operations</strong>
            <span>Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-heading">MAIN MENU</p>

          {navigation
            .filter((item) =>
              item.roles.includes(user?.role || "")
            )
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">
                  {item.label.charAt(0)}
                </span>

                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="avatar">
              {user?.name?.charAt(0) || "U"}
            </div>

            <div className="sidebar-user-info">
              <strong>{user?.name || "User"}</strong>
              <span>{user?.role || "USER"}</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="topbar-label">
              OPERATIONS PORTAL
            </span>
          </div>

          <div className="topbar-user">
            <div className="topbar-avatar">
              {user?.name?.charAt(0) || "U"}
            </div>

            <div>
              <strong>{user?.name || "User"}</strong>
              <span>{user?.role || "USER"}</span>
            </div>
          </div>
        </header>

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}