import React from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/button';

interface DashboardHeaderProps {
  isFetching: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isFetching }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
          Welcome back, {user?.fullName || user?.username || 'Admin'}
        </h1>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
          Here's what's happening with your business today.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-xs font-medium text-[#111111] dark:text-[#FAFAFA]">
          <Calendar className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
          <span>{formattedDate}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          className="h-8 px-3 text-xs gap-1.5 border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
};
