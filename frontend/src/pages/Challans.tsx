import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import type { Customer, Product } from "../types";

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
  createdAt: string;
  customer: Customer;
  items: ChallanItem[];
}

interface ChallanListResponse {
  success: boolean;
  data: Challan[];
}

interface CustomerResponse {
  success: boolean;
  data: Customer[];
}

interface ProductResponse {
  success: boolean;
  data: Product[];
}

interface CreateChallanResponse {
  success: boolean;
  message: string;
  data: Challan;
}

interface DraftItem {
  productId: string;
  quantity: string;
}

export default function Challans() {
  const navigate = useNavigate();

  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    {
      productId: "",
      quantity: "1",
    },
  ]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        challanResponse,
        customerResponse,
        productResponse,
      ] = await Promise.all([
        apiRequest<ChallanListResponse>("/challans"),
        apiRequest<CustomerResponse>(
          "/customers?limit=100"
        ),
        apiRequest<ProductResponse>(
          "/products?limit=100"
        ),
      ]);

      setChallans(challanResponse.data);
      setCustomers(customerResponse.data);
      setProducts(productResponse.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load challans"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setCustomerId("");

    setItems([
      {
        productId: "",
        quantity: "1",
      },
    ]);

    setError("");
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        productId: "",
        quantity: "1",
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function updateItem(
    index: number,
    field: keyof DraftItem,
    value: string
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  async function handleCreate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    const validItems = items.filter(
      (item) =>
        item.productId &&
        Number(item.quantity) > 0
    );

    if (validItems.length === 0) {
      setError(
        "Add at least one product with a valid quantity."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await apiRequest<CreateChallanResponse>(
          "/challans",
          {
            method: "POST",
            body: {
              customerId: Number(customerId),
              items: validItems.map((item) => ({
                productId: Number(item.productId),
                quantity: Number(item.quantity),
              })),
            },
          }
        );

      setShowForm(false);
      resetForm();

      await loadData();

      navigate(`/challans/${response.data.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create challan"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page">
      <div className="module-page-header">
        <div>
          <span className="eyebrow">SALES</span>

          <h1>Sales Challans</h1>

          <p>
            Create, review and confirm customer sales
            challans.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Create Challan
        </button>
      </div>

      {error && (
        <div className="error-message customer-error">
          {error}
        </div>
      )}

      <div className="customer-table-card">
        {loading ? (
          <div className="empty-state">
            Loading challans...
          </div>
        ) : challans.length === 0 ? (
          <div className="empty-state">
            <strong>No challans found</strong>

            <span>
              Create your first sales challan.
            </span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Challan</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total Quantity</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {challans.map((challan) => (
                  <tr key={challan.id}>
                    <td>
                      <strong>
                        {challan.challanNumber}
                      </strong>
                    </td>

                    <td>
                      {challan.customer.customerName}
                    </td>

                    <td>
                      {challan.items.length}
                    </td>

                    <td>
                      {challan.totalQuantity}
                    </td>

                    <td>
                      <span
                        className={`status-badge status-${challan.status.toLowerCase()}`}
                      >
                        {challan.status}
                      </span>
                    </td>

                    <td>
                      {new Date(
                        challan.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="table-action"
                        onClick={() =>
                          navigate(
                            `/challans/${challan.id}`
                          )
                        }
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

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowForm(false);
            }
          }}
        >
          <div className="customer-modal challan-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  SALES
                </span>

                <h2>Create Challan</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>
            </div>

            <form
              className="customer-form"
              onSubmit={handleCreate}
            >
              <div className="form-group">
                <label>Customer *</label>

                <select
                  value={customerId}
                  onChange={(event) =>
                    setCustomerId(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.customerName} —{" "}
                      {customer.businessName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="challan-items-header">
                <div>
                  <h3>Products</h3>

                  <p>
                    Select products and quantities.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={addItem}
                >
                  + Add Item
                </button>
              </div>

              <div className="challan-items">
                {items.map((item, index) => (
                  <div
                    className="challan-item"
                    key={index}
                  >
                    <div className="form-group">
                      <label>Product</label>

                      <select
                        value={item.productId}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "productId",
                            event.target.value
                          )
                        }
                        required
                      >
                        <option value="">
                          Select product
                        </option>

                        {products.map(
                          (product) => (
                            <option
                              key={product.id}
                              value={product.id}
                            >
                              {product.name} (
                              {product.sku}) — Stock:{" "}
                              {product.currentStock}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="form-group quantity-field">
                      <label>Quantity</label>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "quantity",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        className="remove-item-button"
                        onClick={() =>
                          removeItem(index)
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="challan-draft-note">
                <strong>
                  This creates a DRAFT challan.
                </strong>

                <span>
                  Stock will only be reduced when the
                  challan is confirmed.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowForm(false)
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
                    ? "Creating..."
                    : "Create Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}