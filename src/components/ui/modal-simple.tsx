'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ak-fixed ak-inset-0 ak-z-50 ak-flex ak-items-center ak-justify-center">
      {/* Overlay */}
      <div
        className="ak-fixed ak-inset-0 ak-bg-black/80 ak-backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div
        className={cn(
          'ak-relative ak-w-full ak-max-w-lg ak-mx-auto ak-bg-white ak-rounded-lg ak-shadow-lg ak-p-6',
          'ak-max-h-[90vh] ak-overflow-auto ak-animate-ak-scale-in',
          className
        )}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={cn('ak-flex ak-items-center ak-justify-between ak-pb-4 ak-border-b', className)}>
      {children}
    </div>
  );
}

interface ModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalTitle({ children, className }: ModalTitleProps) {
  return (
    <h2 className={cn('ak-text-xl ak-font-semibold', className)}>
      {children}
    </h2>
  );
}

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <div className={cn('ak-py-4', className)}>
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('ak-flex ak-justify-end ak-space-x-2 ak-pt-4 ak-border-t', className)}>
      {children}
    </div>
  );
}

interface ModalCloseButtonProps {
  onClose: () => void;
  className?: string;
}

export function ModalCloseButton({ onClose, className }: ModalCloseButtonProps) {
  return (
    <button
      onClick={onClose}
      className={cn(
        'ak-absolute ak-right-4 ak-top-4 ak-p-1 ak-rounded-full ak-hover:bg-gray-100 ak-transition-colors',
        className
      )}
      aria-label="关闭"
    >
      <svg
        className="ak-w-4 ak-h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}