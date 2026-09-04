import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";

// =========================================================
// PAGES
// =========================================================

import LoginPage from "@/pages/Login";
import SignupPage from "@/pages/Signup";

import DashboardPage from "@/pages/Dashboard";
import UnauthorizedPage from "@/pages/Unauthorized";

import CustomersPage from "@/pages/CustomersPage";
import CreateCustomerPage from "@/pages/Customers/CreateCustomer";

import OrdersPage from "@/pages/OrdersPage";
import CreateOrderPage from "@/pages/order/CreateOrderPage";

import MeasurementsPage from "@/pages/Measurement";

import ServicesPricingPage from "@/pages/ServicesPricingPage";
import AddOnsPage from "@/pages/AddOnsPage";

// =========================================================
// ROUTE GUARDS
// =========================================================

import GuestRoute from "@/routes/GuestRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";
import RoleRoute from "@/routes/RoleRoute";

// =========================================================
// LAYOUT / AUTH
// =========================================================

import AuthInitializer from "@/components/AuthInitializer";
import DashboardLayout from "@/components/layout/DashboardLayout";


// =========================================================
// APP ROUTES
// =========================================================

export default function AppRoutes() {
    return (
        <>
            <BrowserRouter>

                <AuthInitializer>

                    <Routes>

                        {/* =================================================
                            GUEST ROUTES
                        ================================================= */}

                        <Route element={<GuestRoute />}>

                            <Route
                                path="/login"
                                element={<LoginPage />}
                            />

                            <Route
                                path="/signup"
                                element={<SignupPage />}
                            />

                        </Route>


                        {/* =================================================
                            PROTECTED ROUTES
                        ================================================= */}

                        <Route element={<ProtectedRoute />}>

                            <Route element={<DashboardLayout />}>

                                {/* =================================================
                                    DASHBOARD
                                ================================================= */}

                                <Route
                                    path="/dashboard"
                                    element={<DashboardPage />}
                                />


                                {/* =================================================
                                    CUSTOMERS
                                ================================================= */}

                                <Route
                                    path="/customers"
                                    element={<CustomersPage />}
                                />

                                <Route
                                    path="/customers/new"
                                    element={<CreateCustomerPage />}
                                />


                                {/* =================================================
                                    MEASUREMENTS
                                ================================================= */}

                                <Route
                                    path="/measurements"
                                    element={<MeasurementsPage />}
                                />


                                {/* =================================================
                                    ORDERS
                                ================================================= */}

                                {/* Order list */}
                                <Route path="/orders" element={<OrdersPage />} />
                                <Route path="/orders/new" element={<CreateOrderPage />} />
                                <Route
                                    path="/orders/create"
                                    element={<Navigate to="/orders/new" replace />}
                                />


                                {/* Canonical create-order route */}

                                <Route
                                    path="/orders/new"
                                    element={<CreateOrderPage />}
                                />


                                {/* -------------------------------------------------
                                    BACKWARD COMPATIBILITY

                                    If any old button/link still uses:

                                    /orders/create

                                    it will still open CreateOrderPage.
                                ------------------------------------------------- */}

                                <Route
                                    path="/orders/create"
                                    element={
                                        <Navigate
                                            to="/orders/new"
                                            replace
                                        />
                                    }
                                />


                                {/* =================================================
                                    SERVICES & PRICING
                                ================================================= */}

                                <Route
                                    path="/services-pricing"
                                    element={<ServicesPricingPage />}
                                />


                                {/* =================================================
                                    ADD-ONS
                                ================================================= */}

                                <Route
                                    path="/addons"
                                    element={<AddOnsPage />}
                                />


                                {/* =================================================
                                    ADMIN ROUTES
                                ================================================= */}

                                <Route
                                    element={
                                        <RoleRoute
                                            allowedRoles={["ADMIN"]}
                                        />
                                    }
                                >

                                    {/* Add ADMIN routes here */}

                                </Route>


                                {/* =================================================
                                    SHOPKEEPER ROUTES
                                ================================================= */}

                                <Route
                                    element={
                                        <RoleRoute
                                            allowedRoles={["SHOPKEEPER"]}
                                        />
                                    }
                                >

                                    {/* Add SHOPKEEPER routes here */}

                                </Route>


                                {/* =================================================
                                    TAILOR ROUTES
                                ================================================= */}

                                <Route
                                    element={
                                        <RoleRoute
                                            allowedRoles={["TAILOR"]}
                                        />
                                    }
                                >

                                    {/* Add TAILOR routes here */}

                                </Route>

                            </Route>

                        </Route>


                        {/* =================================================
                            UNAUTHORIZED
                        ================================================= */}

                        <Route
                            path="/unauthorized"
                            element={<UnauthorizedPage />}
                        />


                        {/* =================================================
                            FALLBACK
                        ================================================= */}

                        <Route
                            path="*"
                            element={
                                <Navigate
                                    to="/dashboard"
                                    replace
                                />
                            }
                        />

                    </Routes>

                </AuthInitializer>

            </BrowserRouter>


            {/* =================================================
                GLOBAL TOASTER
            ================================================= */}

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                }}
            />

        </>
    );
}