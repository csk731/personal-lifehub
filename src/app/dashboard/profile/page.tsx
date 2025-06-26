import { ProfileManager } from '@/components/profile/ProfileManager';
import { TopBar } from '@/components/dashboard/TopBar';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <TopBar isLoggedIn={true} />
      <div className="max-w-7xl mx-auto pt-20">
        <ProfileManager />
      </div>
    </div>
  );
} 