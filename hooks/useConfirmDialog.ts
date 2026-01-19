/**
 * Reusable hook for confirmation dialogs
 * Replaces window.confirm() with in-app modal
 */

import { useState, useCallback } from 'react';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: (() => void) | null;
}

export const useConfirmDialog = () => {
  const [dialog, setDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'info',
    onConfirm: null,
  });

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: 'danger' | 'warning' | 'info';
    }
  ) => {
    setDialog({
      isOpen: true,
      title,
      message,
      confirmText: options?.confirmText || 'Confirm',
      cancelText: options?.cancelText || 'Cancel',
      variant: options?.variant || 'info',
      onConfirm,
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialog.onConfirm) {
      dialog.onConfirm();
    }
    setDialog(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  }, [dialog.onConfirm]);

  const handleCancel = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  }, []);

  return {
    dialog,
    showConfirm,
    handleConfirm,
    handleCancel,
  };
};
