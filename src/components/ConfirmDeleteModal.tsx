import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface DeleteConfirmOptions {
  reason?: string;
  hardDelete?: boolean;
  reassignToWorkerId?: string;
  archiveHistory?: boolean;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: DeleteConfirmOptions) => Promise<void> | void;
  title?: string;
  itemName: string;
  itemType: 'worker' | 'customer' | 'history' | 'bulk_history' | 'bill' | 'message';
  itemDetails?: React.ReactNode;
  blockingWarning?: string | null;
  activeJobsCount?: number;
  availableWorkers?: Array<{ id: string; name: string; phone?: string }>;
  isBulk?: boolean;
  itemCount?: number;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  itemDetails,
  blockingWarning,
  isBulk = false,
  itemCount = 1,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayType =
    itemType === 'bulk_history'
      ? `${itemCount} history records`
      : itemType === 'history'
      ? 'history record'
      : itemType === 'worker'
      ? 'worker'
      : itemType === 'bill'
      ? 'bill'
      : itemType === 'message'
      ? 'message'
      : itemType;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await onConfirm({
        reason: 'Deleted by Administrator',
        hardDelete: true,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Deletion failed. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="confirm-delete-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="confirm-delete-dialog"
        className="bg-zinc-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-zinc-100 relative overflow-hidden ring-1 ring-rose-500/20"
      >
        {/* Top Danger Bar Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-red-500 to-amber-500" />

        {/* Close Button */}
        <button
          id="btn-close-modal"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Warning Icon */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0 shadow-lg shadow-rose-500/10">
            <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div className="pr-6">
            <h3 className="text-lg font-black text-white tracking-tight">Permanently Delete?</h3>
            <p className="text-xs text-zinc-400 font-medium mt-1 leading-relaxed">
              Are you sure you want to permanently delete this <span className="text-rose-300 font-semibold">{displayType}</span>
              {itemName ? ` (${itemName})` : ''}? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Item Details Card */}
        {itemDetails && (
          <div className="mb-4 p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300">
            {itemDetails}
          </div>
        )}

        {/* Blocking Warning Alert */}
        {blockingWarning && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{blockingWarning}</span>
          </div>
        )}

        {/* Error message if API rejected */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-600/50 flex items-start gap-2 text-rose-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
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
            id="btn-confirm-delete"
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting || Boolean(blockingWarning)}
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
