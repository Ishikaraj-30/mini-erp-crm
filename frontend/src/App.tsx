import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import CustomerEdit from "./pages/CustomerEdit";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import ProductEdit from "./pages/ProductEdit";
import Challans from "./pages/Challans";
import ChallanDetails from "./pages/ChallanDetails";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
        />

        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />

        <Route element={<Layout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

         <Route
  path="/customers"
  element={<Customers />}
/>
 <Route
    path="/customers/:id"
    element={<CustomerDetails />}
  />
  <Route
  path="/customers/:id/edit"
  element={<CustomerEdit />}
/>

       <Route
  path="/products"
  element={<Products />}
/>
<Route
  path="/products/:id"
  element={<ProductDetails />}
/>
<Route
  path="/products/:id/edit"
  element={<ProductEdit />}
/>

        <Route
  path="/challans"
  element={<Challans />}
/>
<Route
  path="/challans/:id"
  element={<ChallanDetails />}
/>

        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}