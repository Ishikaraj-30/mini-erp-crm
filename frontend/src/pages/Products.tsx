import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import type { Product } from "../types";

interface ProductListResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProductResponse {
  success: boolean;
  data: Product;
}

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: string;
  minimumStock: string;
  warehouseLocation: string;
}

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  unitPrice: "",
  currentStock: "0",
  minimumStock: "0",
  warehouseLocation: "",
};

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<ProductListResponse>(
        `/products?search=${encodeURIComponent(search)}&page=${page}&limit=10`
      );

      setProducts(response.data);
      setTotalPages(response.pagination.totalPages || 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [page, search]);

  function updateField(
    field: keyof ProductForm,
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
      await apiRequest<ProductResponse>("/products", {
        method: "POST",
        body: {
          name: form.name,
          sku: form.sku,
          category: form.category,
          unitPrice: Number(form.unitPrice),
          currentStock: Number(form.currentStock),
          minimumStock: Number(form.minimumStock),
          warehouseLocation: form.warehouseLocation,
        },
      });

      setForm(emptyForm);
      setShowForm(false);
      setPage(1);

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create product"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page">
      <div className="module-page-header">
        <div>
          <span className="eyebrow">INVENTORY</span>
          <h1>Products</h1>
          <p>
            Manage products, warehouse stock and inventory movements.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setForm(emptyForm);
            setShowForm(true);
            setError("");
          }}
        >
          + Add Product
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
          placeholder="Search by product, SKU or category..."
          className="customer-search"
        />
      </div>

      <div className="customer-table-card">
        {loading ? (
          <div className="empty-state">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <strong>No products found</strong>
            <span>
              Try another search or add a new product.
            </span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Warehouse</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const lowStock =
                    product.currentStock <=
                    product.minimumStock;

                  return (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>

                      <td>{product.sku}</td>

                      <td>{product.category}</td>

                      <td>
                        ₹
                        {Number(product.unitPrice).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            lowStock
                              ? "stock-low"
                              : "stock-normal"
                          }
                        >
                          {product.currentStock}
                        </span>
                      </td>

                      <td>
                        {product.warehouseLocation}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="table-action"
                          onClick={() =>
                            navigate(
                              `/products/${product.id}`
                            )
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && products.length > 0 && (
        <div className="pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setPage((current) => current - 1)
            }
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((current) => current + 1)
            }
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
                <span className="eyebrow">INVENTORY</span>
                <h2>Add Product</h2>
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
                  <label>Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.currentStock}
                    onChange={(event) =>
                      updateField(
                        "currentStock",
                        event.target.value
                      )
                    }
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

                <div className="form-group form-full">
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
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}