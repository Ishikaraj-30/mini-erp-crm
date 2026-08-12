import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import type {
  Customer,
  CustomerStatus,
  CustomerType,
} from "../types";

interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CustomerResponse {
  success: boolean;
  data: Customer;
}

interface CustomerForm {
  customerName: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber: string;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate: string;
  notes: string;
}

const emptyForm: CustomerForm = {
  customerName: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL",
  address: "",
  status: "LEAD",
  followUpDate: "",
  notes: "",
};

export default function Customers() {
     const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<CustomerListResponse>(
        `/customers?search=${encodeURIComponent(search)}&page=${page}&limit=10`
      );

      setCustomers(response.data);
      setTotalPages(response.pagination.totalPages || 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [page, search]);

  function updateField(
    field: keyof CustomerForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      await apiRequest<CustomerResponse>("/customers", {
        method: "POST",
        body: {
          ...form,
          email: form.email || undefined,
          gstNumber: form.gstNumber || undefined,
          followUpDate: form.followUpDate || undefined,
          notes: form.notes || undefined,
        },
      });

      setForm(emptyForm);
      setShowForm(false);
      setPage(1);

      await loadCustomers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create customer"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page">
      <div className="module-page-header">
        <div>
          <span className="eyebrow">CRM</span>
          <h1>Customers</h1>
          <p>
            Manage customer information and CRM follow-ups.
          </p>
        </div>

        <button
          type="button"
          className="primary-button customer-add-button"
          onClick={() => {
            setForm(emptyForm);
            setShowForm(true);
            setError("");
          }}
        >
          + Add Customer
        </button>
      </div>

      {error && (
        <div className="error-message customer-error">
          {error}
        </div>
      )}

      <div className="customer-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name, business or mobile..."
          className="customer-search"
        />
      </div>

      <div className="customer-table-card">
        {loading ? (
          <div className="empty-state">
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <strong>No customers found</strong>
            <span>
              Try another search or add a new customer.
            </span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Business</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Action</th>
                  
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.customerName}</strong>
                      {customer.email && (
                        <span className="table-secondary">
                          {customer.email}
                        </span>
                      )}
                    </td>

                    <td>{customer.businessName}</td>

                    <td>{customer.mobile}</td>

                    <td>
                      <span className="type-badge">
                        {customer.customerType}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge status-${customer.status.toLowerCase()}`}
                      >
                        {customer.status}
                      </span>
                    </td>

                    <td>
                      {customer.followUpDate
                        ? new Date(
                            customer.followUpDate
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                     <td>
    <button
  type="button"
  className="table-action"
  onClick={() => navigate(`/customers/${customer.id}`)}
>
  View
</button>
      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && customers.length > 0 && (
        <div className="pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      )}

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="customer-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">CRM</span>
                <h2>Add Customer</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="customer-form"
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    value={form.customerName}
                    onChange={(event) =>
                      updateField(
                        "customerName",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mobile *</label>
                  <input
                    value={form.mobile}
                    onChange={(event) =>
                      updateField(
                        "mobile",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Business Name *</label>
                  <input
                    value={form.businessName}
                    onChange={(event) =>
                      updateField(
                        "businessName",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>GST Number</label>
                  <input
                    value={form.gstNumber}
                    onChange={(event) =>
                      updateField(
                        "gstNumber",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Customer Type *</label>
                  <select
                    value={form.customerType}
                    onChange={(event) =>
                      updateField(
                        "customerType",
                        event.target.value
                      )
                    }
                  >
                    <option value="RETAIL">
                      Retail
                    </option>
                    <option value="WHOLESALE">
                      Wholesale
                    </option>
                    <option value="DISTRIBUTOR">
                      Distributor
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value
                      )
                    }
                  >
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">
                      Active
                    </option>
                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Follow-up Date</label>
                  <input
                    type="date"
                    value={form.followUpDate}
                    onChange={(event) =>
                      updateField(
                        "followUpDate",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group form-full">
                  <label>Address *</label>
                  <textarea
                    value={form.address}
                    onChange={(event) =>
                      updateField(
                        "address",
                        event.target.value
                      )
                    }
                    required
                    rows={3}
                  />
                </div>

                <div className="form-group form-full">
                  <label>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateField(
                        "notes",
                        event.target.value
                      )
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}