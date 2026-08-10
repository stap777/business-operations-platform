import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, getRoleRedirectPath, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#000000] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 dark:bg-[#1A1A1A] flex items-center justify-center text-[#111111] dark:text-[#FAFAFA]">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-[#111111] dark:text-[#FAFAFA] tracking-tight">
            Access Denied
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-xs mx-auto">
            Your account ({user?.username || 'User'}, role: <span className="font-semibold">{user?.role}</span>) does not have authorization to view this area.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(getRoleRedirectPath())}
            className="w-full text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={logout}
            className="w-full text-xs font-medium"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
