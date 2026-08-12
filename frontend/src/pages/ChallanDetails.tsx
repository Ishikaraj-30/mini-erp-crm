import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import type { Customer } from "../types";

interface ChallanItem {
  id: number;
  challanId: number;
  productId: number;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: string | number;
  quantity: number;
}

interface Challan {
  id: number;
  challanNumber: string;
  customerId: number;
  totalQuantity: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  createdById: number;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  items: ChallanItem[];
  createdBy?: {
    id: number;
    name: string;
    role: string;
  };
}

interface ChallanResponse {
  success: boolean;
  data: Challan;
}

interface ConfirmResponse {
  success: boolean;
  message: string;
  data: Challan;
}

export default function ChallanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [challan, setChallan] = useState<Challan | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadChallan() {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const response =
        await apiRequest<ChallanResponse>(
          `/challans/${id}`
        );

      setChallan(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load challan"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChallan();
  }, [id]);

  async function confirmChallan() {
    if (!id || !challan) return;

    const confirmed = window.confirm(
      "Are you sure you want to confirm this challan? Stock will be reduced."
    );

    if (!confirmed) return;

    setConfirming(true);
    setError("");
    setSuccessMessage("");

    try {
      const response =
        await apiRequest<ConfirmResponse>(
          `/challans/${id}/confirm`,
          {
            method: "POST",
          }
        );

      setSuccessMessage(
        response.message ||
          "Challan confirmed successfully."
      );

      setChallan(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to confirm challan"
      );
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        Loading challan...
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="module-page">
        <div className="error-message">
          {error || "Challan not found"}
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/challans")}
        >
          ← Back to Challans
        </button>
      </div>
    );
  }

  const totalAmount = challan.items.reduce(
    (total, item) =>
      total +
      Number(item.unitPriceSnapshot) * item.quantity,
    0
  );

  return (
    <div className="module-page">
      {/* HEADER */}

      <div className="details-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/challans")}
          >
            ← Challans
          </button>

          <span className="eyebrow">SALES CHALLAN</span>

          <h1>{challan.challanNumber}</h1>

          <p>
            Created on{" "}
            {new Date(
              challan.createdAt
            ).toLocaleDateString()}
          </p>
        </div>

        <div className="details-header-actions">
          <span
            className={`status-badge status-${challan.status.toLowerCase()}`}
          >
            {challan.status}
          </span>

          {challan.status === "DRAFT" && (
            <button
              type="button"
              className="primary-button"
              onClick={confirmChallan}
              disabled={confirming}
            >
              {confirming
                ? "Confirming..."
                : "Confirm Challan"}
            </button>
          )}
        </div>
      </div>

      {/* SUCCESS */}

      {successMessage && (
        <div className="success-message">
          ✓ {successMessage}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="error-message customer-error">
          {error}
        </div>
      )}

      {/* CUSTOMER */}

      <section className="details-card challan-customer-card">
        <div className="details-card-header">
          <div>
            <h2>Customer Information</h2>
          </div>
        </div>

        <div className="details-fields">
          <div>
            <span>Customer Name</span>
            <strong>
              {challan.customer.customerName}
            </strong>
          </div>

          <div>
            <span>Business</span>
            <strong>
              {challan.customer.businessName}
            </strong>
          </div>

          <div>
            <span>Mobile</span>
            <strong>
              {challan.customer.mobile}
            </strong>
          </div>

          <div>
            <span>Email</span>
            <strong>
              {challan.customer.email ||
                "Not provided"}
            </strong>
          </div>

          <div>
            <span>Customer Type</span>
            <strong>
              {challan.customer.customerType}
            </strong>
          </div>

          <div>
            <span>GST Number</span>
            <strong>
              {challan.customer.gstNumber ||
                "Not provided"}
            </strong>
          </div>

          <div className="details-full">
            <span>Address</span>
            <strong>
              {challan.customer.address}
            </strong>
          </div>
        </div>
      </section>

      {/* ITEMS */}

      <section className="details-card challan-items-card">
        <div className="details-card-header">
          <div>
            <h2>Challan Items</h2>

            <p>
              {challan.items.length} product
              {challan.items.length === 1
                ? ""
                : "s"} in this challan.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="customer-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {challan.items.map((item) => {
                const itemTotal =
                  Number(item.unitPriceSnapshot) *
                  item.quantity;

                return (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {item.productNameSnapshot}
                      </strong>
                    </td>

                    <td>
                      {item.skuSnapshot}
                    </td>

                    <td>
                      ₹
                      {Number(
                        item.unitPriceSnapshot
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>{item.quantity}</td>

                    <td>
                      ₹
                      {itemTotal.toLocaleString(
                        "en-IN"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}

        <div className="challan-total-section">
          <div>
            <span>Total Quantity</span>
            <strong>
              {challan.totalQuantity}
            </strong>
          </div>

          <div>
            <span>Total Amount</span>
            <strong>
              ₹
              {totalAmount.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>
        </div>
      </section>

      {/* STATUS INFORMATION */}

      <section className="challan-status-card">
        {challan.status === "DRAFT" ? (
          <>
            <strong>Draft Challan</strong>

            <p>
              This challan has been created but stock
              has not been reduced yet. Click{" "}
              <strong>Confirm Challan</strong> to
              complete the sale.
            </p>
          </>
        ) : challan.status === "CONFIRMED" ? (
          <>
            <strong>✓ Challan Confirmed</strong>

            <p>
              This challan has been confirmed and the
              corresponding stock has been reduced.
            </p>
          </>
        ) : (
          <>
            <strong>Challan Cancelled</strong>

            <p>
              This challan is no longer active.
            </p>
          </>
        )}
      </section>
    </div>
  );
}