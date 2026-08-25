import React from 'react';
import { getResolvedLogoUrl } from '../../utils/logoUtils';

interface PrintableReportLayoutProps {
  title: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  logoUrl?: string;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  children: React.ReactNode;
}

export const PrintableReportLayout: React.FC<PrintableReportLayoutProps> = ({
  title,
  subtitle,
  startDate,
  endDate,
  logoUrl,
  businessName = 'A.S. ENTERPRISES',
  businessPhone = '+91 98765 43210',
  businessAddress = 'Main Street, Commercial Complex, Maharashtra, India',
  children,
}) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const resolvedLogoUrl = getResolvedLogoUrl(logoUrl);

  return (
    <div className="printable-report-container hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999] font-sans text-xs overflow-y-auto">
      {/* Header Row */}
      <div className="flex items-start justify-between pb-6 border-b-2 border-neutral-800">
        <div className="space-y-1 max-w-sm">
          {resolvedLogoUrl ? (
            <img
              src={resolvedLogoUrl}
              alt={businessName}
              className="h-10 object-contain mb-2"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <h1 className="text-xl font-extrabold uppercase tracking-wider text-black">
              {businessName}
            </h1>
          )}
          <p className="text-neutral-700 leading-relaxed text-[11px]">{businessAddress}</p>
          <p className="text-neutral-700 font-mono text-[11px]">Ph: {businessPhone}</p>
        </div>

        <div className="text-right space-y-1">
          <h2 className="text-lg font-black uppercase tracking-wider text-neutral-900">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-neutral-600 font-medium">{subtitle}</p>}
          <div className="font-mono text-[11px] text-neutral-700 pt-1 space-y-0.5">
            <p>
              <strong>Report Generated:</strong> {currentDate}
            </p>
            {(startDate || endDate) && (
              <p>
                <strong>Period:</strong> {startDate || 'Start'} to {endDate || 'Present'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="py-6 space-y-6">{children}</div>

      {/* Footer */}
      <div className="pt-6 border-t border-neutral-300 text-center text-[10px] text-neutral-500">
        <p>{businessName} Operations Platform — Confidential Operational Report</p>
      </div>
    </div>
  );
};
