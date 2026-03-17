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
import { UtsUretimListPage } from '@/features/uts-uretim-list/pages/uts-uretim-list-page';
import { UtsTVermeListPage } from '@/features/uts-tverme-list/pages/uts-tverme-list-page';
import { UtsTuketiciVermeListPage } from '@/features/uts-tuketici-verme-list/pages/uts-tuketici-verme-list-page';
import { UtsIthalatListPage } from '@/features/uts-ithalat-list/pages/uts-ithalat-list-page';
import { UtsImhaListPage } from '@/features/uts-imha-list/pages/uts-imha-list-page';
import { UtsIhracatListPage } from '@/features/uts-ihracat-list/pages/uts-ihracat-list-page';
import { UtsAlmaListPage } from '@/features/uts-alma-list/pages/uts-alma-list-page';

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
          <Route path="/uts-uretim-list" element={<UtsUretimListPage />} />
          <Route path="/uts-verme-list" element={<UtsVermeListPage />} />
          <Route path="/uts-tverme-list" element={<UtsTVermeListPage />} />
          <Route path="/uts-tuketici-verme-list" element={<UtsTuketiciVermeListPage />} />
          <Route path="/uts-ithalat-list" element={<UtsIthalatListPage />} />
          <Route path="/uts-imha-list" element={<UtsImhaListPage />} />
          <Route path="/uts-ihracat-list" element={<UtsIhracatListPage />} />
          <Route path="/uts-alma-list" element={<UtsAlmaListPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
