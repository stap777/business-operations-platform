import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const AvenLoginPage = lazy(() =>
  import('./features/auth/AvenLoginPage').then((m) => ({ default: m.AvenLoginPage }))
);
const AvenForgotPasswordPage = lazy(() =>
  import('./features/auth/AvenForgotPasswordPage').then((m) => ({ default: m.AvenForgotPasswordPage }))
);
const AvenResetPasswordPage = lazy(() =>
  import('./features/auth/AvenResetPasswordPage').then((m) => ({ default: m.AvenResetPasswordPage }))
);
const AvenWorkspaceSetupFlow = lazy(() =>
  import('./features/workspace/AvenWorkspaceSetupFlow').then((m) => ({ default: m.AvenWorkspaceSetupFlow }))
);

const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const AdminDashboardPage = lazy(() => import('./features/dashboard/admin/AdminDashboardPage'));
const ManagerDashboardPage = lazy(() => import('./features/dashboard/manager/ManagerDashboardPage'));
const DeliveryDashboardPage = lazy(() => import('./features/dashboard/delivery/DeliveryDashboardPage'));
const CustomersPage = lazy(() => import('./features/customers/CustomersPage'));
const ProductsPage = lazy(() => import('./features/products/ProductsPage'));
const UsersPage = lazy(() => import('./features/admin/users/UsersPage'));
const BusinessSettingsPage = lazy(() => import('./features/admin/settings/BusinessSettingsPage'));
const CouponsPage = lazy(() => import('./features/admin/coupons/CouponsPage'));
const InventoryPage = lazy(() => import('./features/admin/inventory/InventoryPage'));
const InvoicesPage = lazy(() => import('./features/admin/invoices/InvoicesPage'));
const AdminPaymentsPage = lazy(() => import('./features/admin/payments/AdminPaymentsPage'));
const ReportsPage = lazy(() => import('./features/admin/reports/ReportsPage'));
const OrdersPage = lazy(() => import('./features/orders/OrdersPage'));
const CreateOrderPage = lazy(() => import('./features/orders/CreateOrderPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#000000]">
                  <LoadingSpinner size="lg" label="Loading Aven Platform..." />
                </div>
              }
            >
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<AvenLoginPage />} />
                <Route path="/forgot-password" element={<AvenForgotPasswordPage />} />
                <Route path="/reset-password" element={<AvenResetPasswordPage />} />
                <Route path="/workspace-setup" element={<AvenWorkspaceSetupFlow />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* ADMIN Workspace Routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/admin/inventory" element={<InventoryPage />} />
                    <Route path="/admin/invoices" element={<InvoicesPage />} />
                    <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                    <Route path="/admin/credit" element={<AdminPaymentsPage />} />
                    <Route path="/admin/reports" element={<ReportsPage />} />
                    <Route path="/admin/coupons" element={<CouponsPage />} />
                    <Route path="/admin/employees" element={<UsersPage />} />
                    <Route path="/admin/settings" element={<BusinessSettingsPage />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                  </Route>
                </Route>

                {/* MANAGER Workspace Routes */}
                <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
                  </Route>
                </Route>

                {/* DELIVERY Workspace Routes */}
                <Route element={<ProtectedRoute allowedRoles={['DELIVERY']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/delivery/dashboard" element={<DeliveryDashboardPage />} />
                    <Route path="/deliveries" element={<DeliveryDashboardPage />} />
                  </Route>
                </Route>

                {/* Shared ADMIN + MANAGER Operational Routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/orders/create" element={<CreateOrderPage />} />
                    <Route path="/payments" element={<ManagerDashboardPage />} />
                  </Route>
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
        <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
