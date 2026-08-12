import { useNavigate } from "react-router-dom";
import type { Role } from "../types";

interface StoredUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export default function Dashboard() {
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

  const cards = [
    {
      title: "Customers",
      description:
        "Manage customer records, business information and CRM follow-ups.",
      path: "/customers",
      roles: ["ADMIN", "SALES", "ACCOUNTS"],
    },
    {
      title: "Products",
      description:
        "Manage products, warehouse locations and current inventory.",
      path: "/products",
      roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"],
    },
    {
      title: "Sales Challans",
      description:
        "Create draft challans and confirm stock-aware sales transactions.",
      path: "/challans",
      roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"],
    },
  ];

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OVERVIEW</span>

          <h1>Dashboard</h1>

          <p>
            Welcome back, {user?.name || "User"}.
          </p>
        </div>

        <div className="role-badge">
          {user?.role || "USER"}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">
            CUSTOMERS
          </span>

          <strong>CRM</strong>

          <span className="stat-description">
            Customer management
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            INVENTORY
          </span>

          <strong>STOCK</strong>

          <span className="stat-description">
            Products & movements
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            SALES
          </span>

          <strong>CHALLANS</strong>

          <span className="stat-description">
            Sales transactions
          </span>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Quick access</h2>
          <p>Open an operations module.</p>
        </div>
      </div>

      <div className="module-grid">
        {cards
          .filter((card) =>
            card.roles.includes(user?.role || "")
          )
          .map((card) => (
            <button
              key={card.path}
              type="button"
              className="module-card"
              onClick={() => navigate(card.path)}
            >
              <div className="module-icon">
                {card.title.charAt(0)}
              </div>

              <h3>{card.title}</h3>

              <p>{card.description}</p>

              <span className="module-link">
                Open module →
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}