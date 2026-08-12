import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import type {
  Customer,
  CustomerStatus,
  CustomerType,
} from "../types";

interface CustomerResponse {
  success: boolean;
  data: Customer;
}

interface FormData {
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

export default function CustomerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      if (!id) return;

      try {
        const response = await apiRequest<CustomerResponse>(
          `/customers/${id}`
        );

        const customer = response.data;

        setForm({
          customerName: customer.customerName,
          mobile: customer.mobile,
          email: customer.email || "",
          businessName: customer.businessName,
          gstNumber: customer.gstNumber || "",
          customerType: customer.customerType,
          address: customer.address,
          status: customer.status,
          followUpDate: customer.followUpDate
            ? customer.followUpDate.slice(0, 10)
            : "",
          notes: customer.notes || "",
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load customer"
        );
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [id]);

  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id || !form) return;

    setSaving(true);
    setError("");

    try {
      await apiRequest<CustomerResponse>(
        `/customers/${id}`,
        {
          method: "PUT",
          body: {
            ...form,
            email: form.email || null,
            gstNumber: form.gstNumber || null,
            followUpDate:
              form.followUpDate || null,
            notes: form.notes || null,
          },
        }
      );

      navigate(`/customers/${id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update customer"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        Loading customer...
      </div>
    );
  }

  if (!form) {
    return (
      <div className="module-page">
        <div className="error-message">
          {error || "Customer not found"}
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/customers")}
        >
          ← Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-page-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(`/customers/${id}`)}
          >
            ← Customer Details
          </button>

          <span className="eyebrow">CRM</span>

          <h1>Edit Customer</h1>

          <p>
            Update customer information.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message customer-error">
          {error}
        </div>
      )}

      <div className="edit-card">
        <form
          className="customer-form"
          onSubmit={handleSubmit}
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
                <option value="ACTIVE">Active</option>
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
                rows={3}
                value={form.address}
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-group form-full">
              <label>Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    "notes",
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(`/customers/${id}`)
              }
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
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}