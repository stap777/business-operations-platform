import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AvenLogo } from '../aven/AvenLogo';
import { formatRoleDisplay } from '../../utils/roleUtils';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Truck,
  Boxes,
  Tag,
  Settings,
  LogOut,
  X,
  FileText,
  BarChart3,
  ClipboardList,
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const getNavigationGroups = () => {
    const role = user?.role;

    if (role === 'MANAGER') {
      return [
        {
          group: 'OPERATIONS',
          items: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/manager/dashboard' },
            { label: 'Orders', icon: ClipboardList, path: '/orders' },
            { label: 'Create Order', icon: ShoppingCart, path: '/orders/create' },
            { label: 'Customers', icon: Users, path: '/customers' },
            { label: 'Payments', icon: CreditCard, path: '/payments' },
          ],
        },
      ];
    }

    if (role === 'DELIVERY') {
      return [
        {
          group: 'DELIVERY WORKSPACE',
          items: [
            { label: 'My Deliveries', icon: Truck, path: '/delivery/dashboard' },
          ],
        },
      ];
    }

    // Default: ADMIN
    return [
      {
        group: 'MAIN',
        items: [
          { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
          { label: 'Orders', icon: ClipboardList, path: '/orders' },
          { label: 'Create Order', icon: ShoppingCart, path: '/orders/create' },
          { label: 'Customers', icon: Users, path: '/customers' },
          { label: 'Products', icon: Package, path: '/products' },
        ],
      },
      {
        group: 'OPERATIONS',
        items: [
          { label: 'Inventory', icon: Boxes, path: '/admin/inventory' },
          { label: 'Coupons', icon: Tag, path: '/admin/coupons' },
        ],
      },
      {
        group: 'FINANCE',
        items: [
          { label: 'Invoices', icon: FileText, path: '/admin/invoices' },
          { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
        ],
      },
      {
        group: 'SYSTEM',
        items: [
          { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
          { label: 'Employees', icon: Users, path: '/admin/employees' },
          { label: 'Business Settings', icon: Settings, path: '/admin/settings' },
        ],
      },
    ];
  };

  const navigationGroups = getNavigationGroups();

  const isItemActive = (path: string) => {
    if (path === '/dashboard' || path === '/manager/dashboard' || path === '/delivery/dashboard') {
      return currentPath === path || currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  const isItemEnabled = (_path: string) => {
    return true;
  };

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-64 bg-white dark:bg-[#0F0F0F] border-r border-[#ECECEC] dark:border-[#232323] flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="p-5 space-y-6 overflow-y-auto flex-1">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#ECECEC]/60 dark:border-[#232323]/60 lg:border-none">
          <AvenLogo size="sm" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1A1A1A] text-[#71717A] dark:text-[#A1A1AA] border border-[#ECECEC] dark:border-[#232323]">
              v1.0.0
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] transition-colors"
              aria-label="Close Navigation Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="space-y-5">
          {navigationGroups.map((group) => (
            <div key={group.group} className="space-y-1.5">
              <p className="text-[10px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider px-2">
                {group.group}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.path);
                const enabled = isItemEnabled(item.path);

                return (
                  <button
                    key={item.label}
                    disabled={!enabled}
                    onClick={() => {
                      if (enabled) {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111] cursor-pointer'
                        : enabled
                        ? 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-[#151515] cursor-pointer'
                        : 'text-[#71717A] dark:text-[#A1A1AA] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-[#ECECEC] dark:border-[#232323] flex items-center justify-between">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#1A1A1A] border border-[#ECECEC] dark:border-[#232323] flex items-center justify-center font-semibold text-xs text-[#111111] dark:text-[#FAFAFA] shrink-0">
            {(user?.fullName || user?.username || 'A')[0].toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] truncate">
              {user?.fullName || user?.username}
            </p>
            <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase truncate">
              {formatRoleDisplay(user?.role)}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="h-8 w-8 p-0 text-[#71717A] hover:text-[#111111] dark:text-[#A1A1AA] dark:hover:text-[#FAFAFA]"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </aside>
  );
};
