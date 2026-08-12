import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import type {
  MovementType,
  Product,
  StockMovement,
} from "../types";

interface ProductDetailsResponse {
  success: boolean;
  data: Product & {
    stockMovements: StockMovement[];
  };
}

interface StockResponse {
  success: boolean;
  message: string;
  data: {
    product: Product;
    movement: StockMovement;
  };
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<
    (Product & {
      stockMovements: StockMovement[];
    }) | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [savingStock, setSavingStock] = useState(false);
  const [error, setError] = useState("");

  const [movementType, setMovementType] =
    useState<MovementType>("IN");

  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  async function loadProduct() {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const response =
        await apiRequest<ProductDetailsResponse>(
          `/products/${id}`
        );

      setProduct(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load product"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProduct();
  }, [id]);

  async function handleStockUpdate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id) return;

    setSavingStock(true);
    setError("");

    try {
      await apiRequest<StockResponse>(
        `/products/${id}/stock`,
        {
          method: "POST",
          body: {
            quantity: Number(quantity),
            movementType,
            reason,
          },
        }
      );

      setQuantity("");
      setReason("");

      await loadProduct();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update stock"
      );
    } finally {
      setSavingStock(false);
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="module-page">
        <div className="error-message">
          {error || "Product not found"}
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/products")}
        >
          ← Back to Products
        </button>
      </div>
    );
  }

  const lowStock =
    product.currentStock <= product.minimumStock;

  return (
    <div className="module-page">
      <div className="details-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/products")}
          >
            ← Products
          </button>

          <span className="eyebrow">INVENTORY</span>

          <h1>{product.name}</h1>

          <p>
            {product.sku} • {product.category}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate(`/products/${product.id}/edit`)
          }
        >
          Edit Product
        </button>
      </div>

      {error && (
        <div className="error-message customer-error">
          {error}
        </div>
      )}

      <div className="product-summary-grid">
        <div className="product-summary-card">
          <span>Current Stock</span>

          <strong
            className={lowStock ? "stock-number-low" : ""}
          >
            {product.currentStock}
          </strong>

          <small>
            Minimum: {product.minimumStock}
          </small>
        </div>

        <div className="product-summary-card">
          <span>Unit Price</span>

          <strong>
            ₹
            {Number(product.unitPrice).toLocaleString(
              "en-IN"
            )}
          </strong>

          <small>Per unit</small>
        </div>

        <div className="product-summary-card">
          <span>Warehouse</span>

          <strong>
            {product.warehouseLocation}
          </strong>

          <small>Storage location</small>
        </div>
      </div>

      <div className="details-grid">
        <section className="details-card">
          <div className="details-card-header">
            <div>
              <h2>Update Stock</h2>

              <p>
                Add incoming stock or record an outgoing
                movement.
              </p>
            </div>
          </div>

          <form
            className="followup-form"
            onSubmit={handleStockUpdate}
          >
            <div className="form-group">
              <label>Movement Type</label>

              <select
                value={movementType}
                onChange={(event) =>
                  setMovementType(
                    event.target.value as MovementType
                  )
                }
              >
                <option value="IN">
                  IN — Add Stock
                </option>

                <option value="OUT">
                  OUT — Remove Stock
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Quantity *</label>

              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Reason *</label>

              <textarea
                rows={3}
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="e.g. New supplier shipment"
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={savingStock}
            >
              {savingStock
                ? "Updating..."
                : "Update Stock"}
            </button>
          </form>
        </section>

        <section className="details-card">
          <div className="details-card-header">
            <div>
              <h2>Product Information</h2>
            </div>
          </div>

          <div className="details-fields">
            <div>
              <span>Product</span>
              <strong>{product.name}</strong>
            </div>

            <div>
              <span>SKU</span>
              <strong>{product.sku}</strong>
            </div>

            <div>
              <span>Category</span>
              <strong>{product.category}</strong>
            </div>

            <div>
              <span>Warehouse</span>
              <strong>
                {product.warehouseLocation}
              </strong>
            </div>

            <div>
              <span>Minimum Stock</span>
              <strong>{product.minimumStock}</strong>
            </div>

            <div>
              <span>Current Stock</span>
              <strong>{product.currentStock}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="details-card">
        <div className="details-card-header">
          <div>
            <h2>Stock Movement History</h2>

            <p>
              Recent inventory movements for this product.
            </p>
          </div>
        </div>

        {product.stockMovements.length === 0 ? (
          <div className="small-empty-state">
            No stock movements found.
          </div>
        ) : (
          <div className="stock-movement-list">
            {product.stockMovements.map((movement) => (
              <div
                className="stock-movement-row"
                key={movement.id}
              >
                <div
                  className={`movement-icon movement-${movement.movementType.toLowerCase()}`}
                >
                  {movement.movementType === "IN"
                    ? "+"
                    : "−"}
                </div>

                <div className="movement-main">
                  <strong>
                    {movement.movementType}{" "}
                    {movement.quantity} units
                  </strong>

                  <span>
                    {movement.reason}
                  </span>
                </div>

                <div className="movement-date">
                  {new Date(
                    movement.createdAt
                  ).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}