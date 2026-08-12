import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import type { Product } from "../types";

interface ProductResponse {
  success: boolean;
  data: Product;
}

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  minimumStock: string;
  warehouseLocation: string;
}

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<ProductForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;

      try {
        const response =
          await apiRequest<ProductResponse>(
            `/products/${id}`
          );

        const product = response.data;

        setForm({
          name: product.name,
          sku: product.sku,
          category: product.category,
          unitPrice: String(product.unitPrice),
          minimumStock: String(product.minimumStock),
          warehouseLocation:
            product.warehouseLocation,
        });
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

    loadProduct();
  }, [id]);

  function updateField(
    field: keyof ProductForm,
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
      await apiRequest<ProductResponse>(
        `/products/${id}`,
        {
          method: "PUT",
          body: {
            name: form.name,
            sku: form.sku,
            category: form.category,
            unitPrice: Number(form.unitPrice),
            minimumStock: Number(form.minimumStock),
            warehouseLocation:
              form.warehouseLocation,
          },
        }
      );

      navigate(`/products/${id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        Loading product...
      </div>
    );
  }

  if (!form) {
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

  return (
    <div className="module-page">
      <div className="module-page-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(`/products/${id}`)
            }
          >
            ← Product Details
          </button>

          <span className="eyebrow">
            INVENTORY
          </span>

          <h1>Edit Product</h1>

          <p>
            Update product information and stock threshold.
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
              <label>Product Name *</label>

              <input
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-group">
              <label>SKU *</label>

              <input
                value={form.sku}
                onChange={(event) =>
                  updateField(
                    "sku",
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>

              <input
                value={form.category}
                onChange={(event) =>
                  updateField(
                    "category",
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Unit Price *</label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(event) =>
                  updateField(
                    "unitPrice",
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Minimum Stock</label>

              <input
                type="number"
                min="0"
                step="1"
                value={form.minimumStock}
                onChange={(event) =>
                  updateField(
                    "minimumStock",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label>Warehouse Location *</label>

              <input
                value={form.warehouseLocation}
                onChange={(event) =>
                  updateField(
                    "warehouseLocation",
                    event.target.value
                  )
                }
                required
              />
            </div>
          </div>

          <div className="stock-edit-note">
            <strong>Current stock is not edited here.</strong>

            <span>
              Use the Stock Management section on the
              product details page to record IN or OUT
              movements.
            </span>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(`/products/${id}`)
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