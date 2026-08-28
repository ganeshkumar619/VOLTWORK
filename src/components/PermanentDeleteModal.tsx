import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface PermanentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  itemType: string; // e.g. 'history record', 'message', 'worker', 'bill', 'customer'
  itemName?: string;
  itemDetails?: React.ReactNode;
}

export const PermanentDeleteModal: React.FC<PermanentDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName,
  itemDetails,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to delete ${itemType}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="permanent-delete-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="permanent-delete-dialog"
        className="bg-zinc-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-zinc-100 relative overflow-hidden ring-1 ring-rose-500/20"
      >
        {/* Top Danger Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-red-500 to-amber-500" />

        {/* Close Button */}
        <button
          id="btn-close-delete-modal"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0 shadow-lg shadow-rose-500/10">
            <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div className="pr-6">
            <h3 className="text-lg font-black text-white tracking-tight">Permanently Delete?</h3>
            <p className="text-xs text-zinc-400 font-medium mt-1 leading-relaxed">
              Are you sure you want to permanently delete this <span className="text-rose-300 font-semibold">{itemType}</span>
              {itemName ? ` (${itemName})` : ''}? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Optional Item Details Card */}
        {itemDetails && (
          <div className="mb-4 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300">
            {itemDetails}
          </div>
        )}

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-600/50 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="btn-cancel-delete"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-permanent-delete"
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/25 flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
