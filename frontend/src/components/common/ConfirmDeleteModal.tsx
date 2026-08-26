import React from 'react';
import { Modal } from './Modal';
import { Button } from '../ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  entityType: string; // e.g. "Product", "Customer", "Category", "Coupon", "User", "Order"
  entityName: string; // e.g. "20L Water Jar", "Acme Corp", "Bottles"
  isDeleting?: boolean;
  warningText?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityType,
  entityName,
  isDeleting = false,
  warningText,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || `Delete ${entityType}`}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
            Are you sure you want to delete {entityType.toLowerCase()} <strong className="font-semibold text-rose-900 dark:text-rose-100">"{entityName}"</strong>?
            {warningText && <p className="mt-1">{warningText}</p>}
          </div>
        </div>

        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          This action will delete the {entityType.toLowerCase()} record from the system catalog.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs rounded-xl border-[#ECECEC] dark:border-[#232323] min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl min-h-[44px] px-4 shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${entityType}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
