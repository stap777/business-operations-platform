import React, { useState, useEffect } from 'react';
import { useBusinessSettings, useUpdateBusinessSettings } from './hooks/useBusinessSettings';
import type { BusinessSettingsRequest } from './businessSettings.types';
import { Button } from '../../../components/ui/button';
import { Settings, Save, Loader2, RefreshCw, Building2, FileText, Image as ImageIcon, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export const BusinessSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const { data: settings, isLoading, isError, error, refetch } = useBusinessSettings();
  const updateMutation = useUpdateBusinessSettings();

  const [formData, setFormData] = useState<BusinessSettingsRequest>({
    businessName: '',
    phone: '',
    address: '',
    invoicePrefix: 'INV',
    currency: 'INR',
    logoUrl: '',
    defaultPaymentTerms: '',
    invoiceFooter: '',
  });

  const [initialData, setInitialData] = useState<BusinessSettingsRequest | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form state when backend data loads
  useEffect(() => {
    if (settings) {
      const loadedData: BusinessSettingsRequest = {
        businessName: settings.businessName || '',
        phone: settings.phone || '',
        address: settings.address || '',
        invoicePrefix: settings.invoicePrefix || 'INV',
        currency: settings.currency || 'INR',
        logoUrl: settings.logoUrl || '',
        defaultPaymentTerms: settings.defaultPaymentTerms || '',
        invoiceFooter: settings.invoiceFooter || '',
      };
      setFormData(loadedData);
      setInitialData(loadedData);
    }
  }, [settings]);

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-red-500/20 p-12 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-base font-semibold text-[#111111] dark:text-[#FAFAFA]">Access Restricted</h3>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          You do not have administrative permission to modify global business settings.
        </p>
      </div>
    );
  }

  // Check if form is dirty
  const isDirty = initialData ? JSON.stringify(formData) !== JSON.stringify(initialData) : false;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required.';
    } else if (formData.businessName.trim().length > 150) {
      newErrors.businessName = 'Business name cannot exceed 150 characters.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (formData.phone.trim().length > 20) {
      newErrors.phone = 'Phone number cannot exceed 20 characters.';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required.';
    } else if (formData.address.trim().length > 500) {
      newErrors.address = 'Address cannot exceed 500 characters.';
    }

    if (!formData.invoicePrefix.trim()) {
      newErrors.invoicePrefix = 'Invoice prefix is required.';
    } else if (formData.invoicePrefix.trim().length > 15) {
      newErrors.invoicePrefix = 'Invoice prefix cannot exceed 15 characters.';
    }

    if (!formData.currency.trim()) {
      newErrors.currency = 'Currency is required.';
    } else if (formData.currency.trim().length > 10) {
      newErrors.currency = 'Currency cannot exceed 10 characters.';
    }

    if (formData.logoUrl && formData.logoUrl.trim().length > 500) {
      newErrors.logoUrl = 'Logo URL cannot exceed 500 characters.';
    }

    if (formData.defaultPaymentTerms && formData.defaultPaymentTerms.trim().length > 500) {
      newErrors.defaultPaymentTerms = 'Payment terms cannot exceed 500 characters.';
    }

    if (formData.invoiceFooter && formData.invoiceFooter.trim().length > 500) {
      newErrors.invoiceFooter = 'Invoice footer cannot exceed 500 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    updateMutation.mutate(
      {
        businessName: formData.businessName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        invoicePrefix: formData.invoicePrefix.trim(),
        currency: formData.currency.trim(),
        logoUrl: formData.logoUrl?.trim() || undefined,
        defaultPaymentTerms: formData.defaultPaymentTerms?.trim() || undefined,
        invoiceFooter: formData.invoiceFooter?.trim() || undefined,
      },
      {
        onSuccess: (updated) => {
          const updatedRequestData: BusinessSettingsRequest = {
            businessName: updated.businessName || '',
            phone: updated.phone || '',
            address: updated.address || '',
            invoicePrefix: updated.invoicePrefix || 'INV',
            currency: updated.currency || 'INR',
            logoUrl: updated.logoUrl || '',
            defaultPaymentTerms: updated.defaultPaymentTerms || '',
            invoiceFooter: updated.invoiceFooter || '',
          };
          setFormData(updatedRequestData);
          setInitialData(updatedRequestData);
          setErrors({});
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#ECECEC] dark:border-[#232323]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-[#1A1A1A] animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-neutral-100 dark:bg-[#1A1A1A] animate-pulse rounded" />
              <div className="h-3 w-64 bg-neutral-100 dark:bg-[#1A1A1A] animate-pulse rounded" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl p-5 space-y-4">
              <div className="h-4 w-32 bg-neutral-100 dark:bg-[#1A1A1A] animate-pulse rounded" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-9 bg-neutral-100 dark:bg-[#1A1A1A] animate-pulse rounded-lg" />
                <div className="h-9 bg-neutral-100 dark:bg-[#1A1A1A] animate-pulse rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-red-500/20 p-8 text-center space-y-3 max-w-4xl">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {(error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load business settings.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-xs border-[#ECECEC] dark:border-[#232323]"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ECECEC] dark:border-[#232323]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#111111] dark:text-[#FAFAFA]">Business Settings</h1>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Configure global business identity and invoicing specifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {isDirty && (
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              Unsaved changes
            </span>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={updateMutation.isPending || !isDirty}
            className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5 shadow-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* SECTION 1: BUSINESS IDENTITY */}
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-[#ECECEC] dark:border-[#232323]">
          <Building2 className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
          <h2 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] uppercase tracking-wider">
            Business Identity
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Business Name *
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="e.g. A.S. Enterprises"
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
            />
            {errors.businessName && (
              <p className="text-[10px] text-red-500 mt-1">{errors.businessName}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Contact Phone *
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91-9876543210"
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
            />
            {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Physical Business Address *
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Business Park, Main Street..."
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] resize-none"
            />
            {errors.address && <p className="text-[10px] text-red-500 mt-1">{errors.address}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 2: INVOICE PREFERENCES */}
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-[#ECECEC] dark:border-[#232323]">
          <FileText className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
          <h2 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] uppercase tracking-wider">
            Invoicing & Payment Specifications
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Invoice Prefix *
            </label>
            <input
              type="text"
              value={formData.invoicePrefix}
              onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
              placeholder="e.g. INV"
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] font-mono placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
            />
            {errors.invoicePrefix && (
              <p className="text-[10px] text-red-500 mt-1">{errors.invoicePrefix}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Currency Symbol/Code *
            </label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              placeholder="INR"
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] font-mono placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
            />
            {errors.currency && <p className="text-[10px] text-red-500 mt-1">{errors.currency}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Default Payment Terms
            </label>
            <textarea
              rows={2}
              value={formData.defaultPaymentTerms}
              onChange={(e) => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
              placeholder="e.g. Payment due within 30 days of invoice issuance."
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] resize-none"
            />
            {errors.defaultPaymentTerms && (
              <p className="text-[10px] text-red-500 mt-1">{errors.defaultPaymentTerms}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Invoice Footer Note
            </label>
            <textarea
              rows={2}
              value={formData.invoiceFooter}
              onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
              placeholder="e.g. Thank you for your business!"
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] resize-none"
            />
            {errors.invoiceFooter && (
              <p className="text-[10px] text-red-500 mt-1">{errors.invoiceFooter}</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: BRANDING */}
      <div className="bg-white dark:bg-[#0F0F0F] rounded-xl border border-[#ECECEC] dark:border-[#232323] p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-[#ECECEC] dark:border-[#232323]">
          <ImageIcon className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
          <h2 className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] uppercase tracking-wider">
            Enterprise Branding
          </h2>
        </div>

        <div className="text-xs space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-[#111111] dark:text-[#FAFAFA] mb-1">
              Logo Asset URL
            </label>
            <input
              type="text"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://asenterprises.com/logo.png"
              className="w-full px-3 py-2 bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] font-mono placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
            />
            {errors.logoUrl && <p className="text-[10px] text-red-500 mt-1">{errors.logoUrl}</p>}
          </div>

          {formData.logoUrl && (
            <div className="pt-2 flex items-center gap-3">
              <span className="text-[11px] text-[#71717A]">Preview:</span>
              <img
                src={formData.logoUrl}
                alt="Logo preview"
                className="h-8 object-contain max-w-[120px] rounded border border-[#ECECEC] dark:border-[#232323] bg-neutral-50 dark:bg-neutral-900 p-1"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Save Action Bar */}
      <div className="pt-4 border-t border-[#ECECEC] dark:border-[#232323] flex items-center justify-between">
        <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
          Last Updated:{' '}
          {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'N/A'}
        </span>

        <Button
          type="submit"
          size="sm"
          disabled={updateMutation.isPending || !isDirty}
          className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5 shadow-sm disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default BusinessSettingsPage;
