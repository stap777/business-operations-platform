import React, { useEffect, useRef, useState } from 'react';
import { Printer, X, Calendar, ClipboardCheck, Loader2, FileText, Smartphone } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { apiClient } from '../../../../api/apiClient';
import type { DispatchSheetResponse } from '../dispatchSheet.types';
import PrintableDispatchSheet from './PrintableDispatchSheet';

interface DispatchSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DispatchSheetModal: React.FC<DispatchSheetModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dispatchData, setDispatchData] = useState<DispatchSheetResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [printMode, setPrintMode] = useState<'A4' | 'THERMAL'>('A4');

  const printRef = useRef<HTMLDivElement>(null);

  const fetchDispatchSheet = async (dateStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<DispatchSheetResponse>('/print/dispatch-sheet', {
        params: { date: dateStr },
      });
      setDispatchData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch dispatch sheet:', err);
      setError(err?.response?.data?.message || 'Failed to load dispatch sheet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDispatchSheet(selectedDate);
    }
  }, [isOpen, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* On-Screen Modal View */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:hidden">
        <div className="bg-white dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#111111] gap-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#111111] dark:text-[#FAFAFA]" />
              <h2 className="text-base font-bold text-[#111111] dark:text-[#FAFAFA]">
                Today's Dispatch Checklist
              </h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Task 4: Dual Print Mode Selector */}
              <div className="flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-[#1A1A1A] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#111111] dark:text-[#FAFAFA]">
                  <input
                    type="radio"
                    name="dispatchPrintMode"
                    value="A4"
                    checked={printMode === 'A4'}
                    onChange={() => setPrintMode('A4')}
                    className="accent-black dark:accent-white cursor-pointer"
                  />
                  <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  A4 Office Copy
                </label>
                <span className="text-[#ECECEC] dark:text-[#333333]">|</span>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#111111] dark:text-[#FAFAFA]">
                  <input
                    type="radio"
                    name="dispatchPrintMode"
                    value="THERMAL"
                    checked={printMode === 'THERMAL'}
                    onChange={() => setPrintMode('THERMAL')}
                    className="accent-black dark:accent-white cursor-pointer"
                  />
                  <Smartphone className="w-3.5 h-3.5 text-neutral-500" />
                  80mm Delivery Roll
                </label>
              </div>

              {/* Date Input */}
              <div className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                <Calendar className="w-3.5 h-3.5" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2 py-1 border border-[#ECECEC] dark:border-[#232323] rounded bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FAFAFA] text-xs font-mono"
                />
              </div>

              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body / Dispatch Sheet Preview */}
          <div className="p-6 overflow-y-auto flex-1 bg-[#F4F4F5] dark:bg-[#09090B]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#71717A] gap-2">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm font-medium">Generating Dispatch Checklist...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-rose-500 font-medium">{error}</div>
            ) : dispatchData ? (
              <div
                className={`shadow-2xl rounded overflow-hidden mx-auto border border-neutral-300 ${
                  printMode === 'THERMAL' ? 'max-w-[72mm]' : 'max-w-[210mm]'
                }`}
              >
                <PrintableDispatchSheet dispatchSheet={dispatchData} printMode={printMode} />
              </div>
            ) : null}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between p-4 border-t border-[#ECECEC] dark:border-[#232323] bg-[#FAFAFA] dark:bg-[#111111]">
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              {dispatchData ? `Total Delivery Orders: ${dispatchData.totalOrders}` : ''}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs border-[#ECECEC] dark:border-[#232323]"
              >
                Close
              </Button>
              <Button
                size="sm"
                disabled={loading || !dispatchData}
                onClick={handlePrint}
                className="bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111] hover:opacity-90 text-xs font-semibold px-4 h-9 gap-1.5 shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                {printMode === 'THERMAL' ? 'Print 80mm Delivery Roll' : 'Print A4 Dispatch Sheet'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Container Rendered Exclusively During Window.print() */}
      {dispatchData && (
        <div ref={printRef} className="hidden print:block fixed inset-0 bg-white z-[9999]">
          <PrintableDispatchSheet dispatchSheet={dispatchData} printMode={printMode} />
        </div>
      )}
    </>
  );
};

export default DispatchSheetModal;
