"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Trash2, CheckCircle, Info, X } from "lucide-react";
import { Button } from "./button";

type DialogVariant = "danger" | "warning" | "success" | "info";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  loading?: boolean;
  children?: React.ReactNode;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    buttonVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    buttonVariant: "warning" as const,
  },
  success: {
    icon: CheckCircle,
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    buttonVariant: "success" as const,
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    buttonVariant: "default" as const,
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  children,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const config = variantConfig[variant];
  const Icon = config.icon;

  useEffect(() => {
    if (isOpen) {
      // Focus cancel button when dialog opens
      cancelButtonRef.current?.focus();
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-scaleIn"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-4">
              <div className={cn("p-3 rounded-full", config.iconBg)}>
                <Icon className={cn("h-6 w-6", config.iconColor)} />
              </div>
            </div>

            {/* Text */}
            <div className="text-center">
              <h3
                id="dialog-title"
                className="text-lg font-bold text-slate-900 dark:text-white mb-2"
              >
                {title}
              </h3>
              {description && (
                <p
                  id="dialog-description"
                  className="text-sm text-slate-500 dark:text-slate-400"
                >
                  {description}
                </p>
              )}
              {children && <div className="mt-4">{children}</div>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
            <Button
              ref={cancelButtonRef}
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              variant={config.buttonVariant}
              onClick={onConfirm}
              loading={loading}
              className="flex-1"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Preset confirmation dialogs
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  loading,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Item"
      description={
        itemName
          ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
          : "Are you sure you want to delete this item? This action cannot be undone."
      }
      confirmText="Delete"
      variant="danger"
      loading={loading}
    />
  );
}

export function UnsavedChangesDialog({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: Omit<DeleteConfirmDialogProps, "itemName">) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Unsaved Changes"
      description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
      confirmText="Leave"
      cancelText="Stay"
      variant="warning"
      loading={loading}
    />
  );
}

export function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: Omit<DeleteConfirmDialogProps, "itemName">) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Sign Out"
      description="Are you sure you want to sign out of your account?"
      confirmText="Sign Out"
      variant="info"
      loading={loading}
    />
  );
}

// Hook for easy dialog management
import { useState, useCallback } from "react";

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: DialogVariant;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback(
    (options: {
      title: string;
      description?: string;
      confirmText?: string;
      cancelText?: string;
      variant?: DialogVariant;
    }) => {
      return new Promise<boolean>((resolve) => {
        setConfig({
          ...options,
          onConfirm: () => resolve(true),
        });
        setIsOpen(true);
      });
    },
    []
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setConfig(null);
    setLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!config?.onConfirm) return;
    setLoading(true);
    try {
      await config.onConfirm();
    } finally {
      close();
    }
  }, [config, close]);

  const Dialog = config ? (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={close}
      onConfirm={handleConfirm}
      title={config.title}
      description={config.description}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      variant={config.variant}
      loading={loading}
    />
  ) : null;

  return { confirm, Dialog };
}
