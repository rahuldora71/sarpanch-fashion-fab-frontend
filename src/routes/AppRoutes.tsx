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
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";

import DashboardPage from "@/pages/Dashboard";
import UnauthorizedPage from "@/pages/Unauthorized";

import CustomersPage from "@/pages/CustomersPage";
import CreateCustomerPage from "@/pages/Customers/CreateCustomer";

import OrdersPage from "@/pages/OrdersPage";
import CreateOrderPage from "@/pages/order/CreateOrderPage";

import MeasurementsPage from "@/pages/Measurement";
import AlterationsPage from "@/pages/AlterationsPage";

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
import CustomerEditPage from "@/pages/CustomerEditPage";
import CustomerProfilePage from "@/pages/CustomerProfilePage";
import OrderDashboardPage from "@/pages/OrderDashboardPage";
import CuttingQueuePage from "@/pages/CuttingQueuePage";
import CuttingWorkspacePage from "@/pages/CuttingWorkspacePage";
import ProductionCalendarPage from "@/pages/ProductionCalendarPage";
import CheckoutPage from "@/pages/CheckoutPage";
import SettingsPage from "@/pages/SettingsPage";
import WorkersPage from "@/pages/WorkersPage";
import PaymentsPage from "@/pages/PaymentsPage";
import BillingPage from "@/pages/BillingPage";
import ExpensesPage from "@/pages/ExpensesPage";
import HistoricalOrderEntryPage from "@/pages/HistoricalOrderEntryPage";
import CustomerOrderTrackingPage from "@/pages/public/CustomerOrderTrackingPage";
import LogsDashboardPage from "@/pages/LogsDashboardPage";
import ReportsPage from "@/pages/ReportsPage";
import ProfilePage from "@/pages/ProfilePage";
import RoleAccessPage from "@/pages/RoleAccessPage";
import DynamicAccessRoute from "@/routes/DynamicAccessRoute";


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
                            PUBLIC ORDER TRACKING (MOBILE-FIRST)
                        ================================================= */}
                        <Route
                            path="/track/:trackingToken"
                            element={<CustomerOrderTrackingPage />}
                        />
                        <Route
                            path="/track"
                            element={<CustomerOrderTrackingPage />}
                        />
                        <Route
                            path="/orders/track/:trackingToken"
                            element={<CustomerOrderTrackingPage />}
                        />

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

                            <Route
                                path="/forgot-password"
                                element={<ForgotPasswordPage />}
                            />

                        </Route>


                        {/* =================================================
                            PROTECTED ROUTES
                        ================================================= */}

                        <Route element={<ProtectedRoute />}>

                            <Route element={<DashboardLayout />}>
                                <Route element={<DynamicAccessRoute />}>

                                {/* =================================================
                                    DASHBOARD
                                ================================================= */}

                                
                                {/* =================================================
                                    COMMUNICATION & ACCESS LOGS DASHBOARD
                                ================================================= */}
                                <Route
                                    path="/logs"
                                    element={<LogsDashboardPage />}
                                />
                                <Route
                                    path="/communication/logs"
                                    element={<LogsDashboardPage />}
                                />
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
                                <Route path="/customers" element={<CustomersPage />} />
                                <Route path="/customers/new" element={<CreateCustomerPage />} />
                                <Route path="/customers/:customerId" element={<CustomerProfilePage />} />
                                <Route path="/customers/:customerId/edit" element={<CustomerEditPage />} />

                                {/* =================================================
                                    MEASUREMENTS
                                ================================================= */}

                                <Route
                                    path="/measurements"
                                    element={<MeasurementsPage />}
                                />

                                {/* =================================================
                                    ALTERATIONS
                                ================================================= */}

                                <Route
                                    path="/alterations"
                                    element={<AlterationsPage />}
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
                                <Route
                                    path="/orders/:orderId"
                                    element={<OrderDashboardPage />}
                                />
                                <Route
                                    path="/orders/:orderId/edit"
                                    element={<CreateOrderPage />}
                                />
                                <Route
                                    path="/orders/historical-entry"
                                    element={<HistoricalOrderEntryPage />}
                                />
                                <Route
                                    path="/orders/historical"
                                    element={<Navigate to="/orders/historical-entry" replace />}
                                />

                                {/* =================================================
                                    CUTTING QUEUE & WORKSPACE
                                ================================================= */}

                                <Route
                                    path="/cutting-queue"
                                    element={<CuttingQueuePage />}
                                />
                                <Route
                                    path="/cutting-queue/:orderId"
                                    element={<CuttingWorkspacePage />}
                                />

                                {/* =================================================
                                    PRODUCTION CALENDAR
                                ================================================= */}

                                <Route
                                    path="/production"
                                    element={<ProductionCalendarPage />}
                                />

                                {/* =================================================
                                    CHECKOUT
                                ================================================= */}

                                <Route
                                    path="/checkout"
                                    element={<CheckoutPage />}
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
                                    WORKERS & STAFF PORTAL
                                ================================================= */}

                                <Route
                                    path="/workers"
                                    element={<WorkersPage />}
                                />
                                <Route
                                    path="/worker-production"
                                    element={<WorkersPage />}
                                />
                                <Route
                                    path="/production-history"
                                    element={<WorkersPage />}
                                />
                                <Route
                                    path="/staff"
                                    element={<WorkersPage />}
                                />

                                {/* =================================================
                                    PAYMENTS & COLLECTIONS
                                ================================================= */}

                                <Route
                                    path="/payments"
                                    element={<PaymentsPage />}
                                />

                                {/* =================================================
                                    BILLING & TAX MANAGEMENT
                                ================================================= */}

                                <Route
                                    path="/billing"
                                    element={<BillingPage />}
                                />

                                {/* =================================================
                                    EXPENSES & OVERHEADS MANAGEMENT
                                ================================================= */}

                                <Route
                                    path="/expenses"
                                    element={<ExpensesPage />}
                                />
                                <Route
                                    path="/reports"
                                    element={<ReportsPage />}
                                />

                                {/* =================================================
                                    SETTINGS
                                ================================================= */}

                                <Route
                                    path="/settings"
                                    element={<SettingsPage />}
                                />

                                <Route
                                    path="/profile"
                                    element={<ProfilePage />}
                                />

                                <Route
                                    path="/roles"
                                    element={<RoleAccessPage />}
                                />

                                <Route
                                    path="/settings/roles"
                                    element={<RoleAccessPage />}
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