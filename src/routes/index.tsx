import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { LoginPage } from '@/features/auth/pages/login-page';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { UsersPage } from '@/features/users/pages/users-page';
import { RolesPage } from '@/features/roles/pages/roles-page';
import { PermissionGroupsPage } from '@/features/permission-groups/pages/permission-groups-page';
import { ProfilePage } from '@/features/profile/pages/profile-page';
import { HangfireMonitoringPage } from '@/features/hangfire-monitoring/pages/hangfire-monitoring-page';
import { StocksPage } from '@/features/stocks/pages/stocks-page';
import { CustomersPage } from '@/features/customers/pages/customers-page';
import { UtsVermeListPage } from '@/features/uts-verme-list/pages/uts-verme-list-page';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/permission-groups" element={<PermissionGroupsPage />} />
          <Route path="/hangfire-monitoring" element={<HangfireMonitoringPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/stocks" element={<StocksPage />} />
          <Route path="/uts-verme-list" element={<UtsVermeListPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
