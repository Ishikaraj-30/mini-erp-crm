import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import type { CustomerDetails as CustomerDetailsType } from "../types";

interface CustomerResponse {
  success: boolean;
  data: CustomerDetailsType;
}

interface FollowupResponse {
  success: boolean;
  data: {
    id: number;
    customerId: number;
    note: string;
    followUpDate: string | null;
    createdById: number;
    createdAt: string;
  };
}

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] =
    useState<CustomerDetailsType | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [followupNote, setFollowupNote] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [savingFollowup, setSavingFollowup] = useState(false);

  async function loadCustomer() {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const response =
        await apiRequest<CustomerResponse>(
          `/customers/${id}`
        );

      setCustomer(response.data);
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

  useEffect(() => {
    loadCustomer();
  }, [id]);

  async function addFollowup(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id || !followupNote.trim()) {
      return;
    }

    setSavingFollowup(true);
    setError("");

    try {
      await apiRequest<FollowupResponse>(
        `/customers/${id}/followups`,
        {
          method: "POST",
          body: {
            note: followupNote,
            followUpDate:
              followupDate || undefined,
          },
        }
      );

      setFollowupNote("");
      setFollowupDate("");

      await loadCustomer();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add follow-up"
      );
    } finally {
      setSavingFollowup(false);
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        Loading customer...
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="module-page">
        <div className="error-message">
          {error}
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

  if (!customer) {
    return (
      <div className="empty-state">
        Customer not found.
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="details-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/customers")}
          >
            ← Customers
          </button>

          <span className="eyebrow">CUSTOMER PROFILE</span>

          <h1>{customer.customerName}</h1>

          <p>{customer.businessName}</p>
        </div>

        <div className="details-header-actions">
          <span
            className={`status-badge status-${customer.status.toLowerCase()}`}
          >
            {customer.status}
          </span>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(`/customers/${customer.id}/edit`)
            }
          >
            Edit Customer
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message customer-error">
          {error}
        </div>
      )}

      <div className="details-grid">
        <section className="details-card">
          <div className="details-card-header">
            <h2>Customer Information</h2>
          </div>

          <div className="details-fields">
            <div>
              <span>Name</span>
              <strong>{customer.customerName}</strong>
            </div>

            <div>
              <span>Mobile</span>
              <strong>{customer.mobile}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {customer.email || "Not provided"}
              </strong>
            </div>

            <div>
              <span>Business</span>
              <strong>{customer.businessName}</strong>
            </div>

            <div>
              <span>Customer Type</span>
              <strong>{customer.customerType}</strong>
            </div>

            <div>
              <span>GST Number</span>
              <strong>
                {customer.gstNumber || "Not provided"}
              </strong>
            </div>

            <div className="details-full">
              <span>Address</span>
              <strong>{customer.address}</strong>
            </div>

            <div className="details-full">
              <span>Notes</span>
              <strong>
                {customer.notes || "No notes"}
              </strong>
            </div>

            <div>
              <span>Next Follow-up</span>
              <strong>
                {customer.followUpDate
                  ? new Date(
                      customer.followUpDate
                    ).toLocaleDateString()
                  : "Not scheduled"}
              </strong>
            </div>

            <div>
              <span>Created</span>
              <strong>
                {new Date(
                  customer.createdAt
                ).toLocaleDateString()}
              </strong>
            </div>
          </div>
        </section>

        <section className="details-card">
          <div className="details-card-header">
            <div>
              <h2>Add Follow-up</h2>
              <p>Record the next customer interaction.</p>
            </div>
          </div>

          <form
            className="followup-form"
            onSubmit={addFollowup}
          >
            <div className="form-group">
              <label>Follow-up Note *</label>

              <textarea
                rows={4}
                value={followupNote}
                onChange={(event) =>
                  setFollowupNote(event.target.value)
                }
                placeholder="Enter follow-up details..."
                required
              />
            </div>

            <div className="form-group">
              <label>Follow-up Date</label>

              <input
                type="date"
                value={followupDate}
                onChange={(event) =>
                  setFollowupDate(event.target.value)
                }
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={savingFollowup}
            >
              {savingFollowup
                ? "Saving..."
                : "Add Follow-up"}
            </button>
          </form>
        </section>
      </div>

      <div className="details-bottom-grid">
        <section className="details-card">
          <div className="details-card-header">
            <div>
              <h2>Follow-up History</h2>
              <p>
                {customer.followups.length} recorded follow-up
                {customer.followups.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          {customer.followups.length === 0 ? (
            <div className="small-empty-state">
              No follow-ups recorded yet.
            </div>
          ) : (
            <div className="timeline">
              {customer.followups.map((followup) => (
                <div
                  className="timeline-item"
                  key={followup.id}
                >
                  <div className="timeline-dot" />

                  <div>
                    <strong>{followup.note}</strong>

                    <span>
                      Created{" "}
                      {new Date(
                        followup.createdAt
                      ).toLocaleDateString()}

                      {followup.followUpDate
                        ? ` • Follow-up ${new Date(
                            followup.followUpDate
                          ).toLocaleDateString()}`
                        : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="details-card">
          <div className="details-card-header">
            <div>
              <h2>Challan History</h2>
              <p>
                Sales transactions associated with this customer.
              </p>
            </div>
          </div>

          {customer.challans.length === 0 ? (
            <div className="small-empty-state">
              No challans found for this customer.
            </div>
          ) : (
            <div className="challan-history">
              {customer.challans.map((challan) => (
                <div
                  className="challan-history-row"
                  key={challan.id}
                >
                  <div>
                    <strong>
                      {challan.challanNumber}
                    </strong>

                    <span>
                      {new Date(
                        challan.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="challan-history-right">
                    <span>
                      {challan.totalQuantity} items
                    </span>

                    <span
                      className={`status-badge status-${challan.status.toLowerCase()}`}
                    >
                      {challan.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}