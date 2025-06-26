import { Dashboard } from '@/components/dashboard/Dashboard';
import AuthGuard from '@/components/auth/AuthGuard';

export default function Home() {
  return (
    <AuthGuard requireAuth={true}>
      <Dashboard />
    </AuthGuard>
  );
}
