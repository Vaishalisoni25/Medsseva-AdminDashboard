import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { TestCatalogPage } from '@/pages/TestCatalog';
import { UsersPage } from '@/pages/Users';
import { PackagesPage } from '@/pages/Packages';
import { BookingsPage } from '@/pages/Bookings';
import { SamplesPage } from '@/pages/Samples';
import { ReportBuilderPage } from '@/pages/ReportBuilder';
import { ReportApprovalPage } from '@/pages/ReportApproval';
import { PaymentsPage } from '@/pages/Payments';
import { CouponsPage } from '@/pages/Coupons';
import { FranchisesPage } from '@/pages/Franchises';
import NotificationsPage from '@/pages/Notifications';
import { CMSPage } from '@/pages/CMS';
import { AnalyticsPage } from '@/pages/Analytics';
import { LogsPage } from '@/pages/Logs';
import { SettingsPage } from '@/pages/Settings';
import { InventoryPage } from '@/pages/Inventory';
import { SupportPage } from '@/pages/Support';
import { RolesPermissionsPage } from '@/pages/RolesPermissions';
import { AdminUsersPage } from '@/pages/AdminUsers';
import { UnauthorizedPage } from '@/pages/Unauthorized';
import Branches from '../pages/Branches';
import { PathologyPartnersPage } from '@/pages/PathologyPartners';
import PrescriptionsPage from '@/pages/Prescriptions';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      // User management
{
        path: 'users',
        element: (
          <ProtectedRoute permission="users.view">
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin-users',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
      // Tests catalog & builder
   {
        path: 'tests',
        element: (
          <ProtectedRoute permission="lab_tests.view">
            <TestCatalogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'packages',
        element: (
          <ProtectedRoute permission="packages.view">
            <PackagesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bookings',
        element: (
          <ProtectedRoute permission="bookings.view">
            <BookingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'samples',
        element: (
          <ProtectedRoute permission="lab_tests.view">
            <SamplesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'report-builder',
        element: (
          <ProtectedRoute permission="reports.create">
            <ReportBuilderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'report-approval',
        element: (
          <ProtectedRoute permission="reports.approve">
            <ReportApprovalPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'payments',
        element: (
          <ProtectedRoute permission="payments.view">
            <PaymentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'coupons',
        element: (
          <ProtectedRoute permission="coupons.view">
            <CouponsPage />
          </ProtectedRoute>
        ),
      },
 {
        path: 'franchises',
        element: (
          <ProtectedRoute permission="franchise.view">
            <FranchisesPage />
          </ProtectedRoute>
        ),
      },
 {
        path: 'branches',
        element: (
          <ProtectedRoute permission="franchise.view">
            <Branches />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pathology-partners',
        element: (
          <ProtectedRoute permission="bookings.view">
            <PathologyPartnersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute permission="notifications.view">
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cms',
        element: (
          <ProtectedRoute permission="cms.view">
            <CMSPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'analytics',
        element: (
          <ProtectedRoute permission="analytics.view">
            <AnalyticsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute permission="inventory.view">
            <InventoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'support',
        element: (
          <ProtectedRoute permission="support.view">
            <SupportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'logs',
        element: (
          <ProtectedRoute permission="audit_logs.view">
            <LogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'roles',
        element: (
          <ProtectedRoute permission="roles_permissions.view">
            <RolesPermissionsPage />
          </ProtectedRoute>
        ),
      },
   {
        path: 'prescriptions',
        element: (
          <ProtectedRoute permission="prescriptions.view">
            <PrescriptionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      // Guarded Fallbacks
{
        path: 'unauthorized',
        element: <UnauthorizedPage />,
      },
    ],
  },
  // Absolute Catch-all redirects back to root
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
