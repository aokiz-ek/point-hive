'use client';

import React from 'react';
import { Button } from './button';

interface ModalProps {
  open: boolean;
  onCancel: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  centered?: boolean;
  maskClosable?: boolean;
  destroyOnClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onCancel,
  title,
  children,
  footer,
  width = 520,
  centered = true,
  maskClosable = true,
  destroyOnClose = false,
}) => {
  if (!open && destroyOnClose) return null;

  return (
    <>
      {open && (
        <div className="ak-fixed ak-inset-0 ak-z-50">
          {/* Modal Mask */}
          <div 
            className="ak-fixed ak-inset-0 ak-bg-black ak-bg-opacity-45 ak-transition-opacity ak-duration-200"
            onClick={maskClosable ? onCancel : undefined}
          />
          
          {/* Modal Container */}
          <div 
            className={`ak-fixed ak-inset-0 ak-flex ak-items-center ak-justify-center ak-p-4 ${
              centered ? 'ak-items-center' : 'ak-items-start ak-pt-24'
            }`}
          >
            <div 
              className={`ak-bg-white ak-rounded-lg ak-shadow-2xl ak-max-h-[calc(100vh-48px)] ak-overflow-hidden ak-animate-fade-in ak-transition-all ak-duration-200 ${
                open ? 'ak-scale-100 ak-opacity-100' : 'ak-scale-95 ak-opacity-0'
              }`}
              style={{ width: `${width}px`, maxWidth: '90vw' }}
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Modal Header */}
              <div className="ak-flex ak-items-center ak-justify-between ak-px-6 ak-py-4 ak-border-b ak-border-gray-200">
                <h3 className="ak-text-lg ak-font-semibold ak-text-gray-900 ak-flex ak-items-center ak-gap-2">
                  {title}
                </h3>
                <button
                  className="ak-text-gray-400 ak-hover:text-gray-600 ak-transition-colors ak-duration-200 ak-p-1 ak-rounded ak-hover:bg-gray-100"
                  onClick={onCancel}
                >
                  <svg className="ak-w-5 ak-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="ak-px-6 ak-py-4 ak-max-h-[calc(90vh-120px)] ak-overflow-y-auto">
                {children}
              </div>
              
              {/* Modal Footer */}
              {footer && (
                <div className="ak-flex ak-justify-end ak-space-x-3 ak-px-6 ak-py-4 ak-border-t ak-border-gray-200 ak-bg-gray-50">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Form components for modal content
export const FormItem: React.FC<{
  label: string;
  children: React.ReactNode;
  required?: boolean;
}> = ({ label, children, required }) => (
  <div className="ak-mb-4">
    <label className="ak-block ak-text-sm ak-font-medium ak-text-gray-700 ak-mb-2">
      {label}
      {required && <span className="ak-text-red-500 ak-ml-1">*</span>}
    </label>
    {children}
  </div>
);

export const Select: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  className?: string;
}> = ({ value, onChange, placeholder, options, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`ak-w-full ak-px-3 ak-py-2 ak-border ak-border-gray-300 ak-rounded-md ak-focus:outline-none ak-focus:ring-2 ak-focus:ring-blue-500 ak-focus:border-blue-500 ak-transition-colors ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((option) => (
      <option key={option.value} value={option.value} disabled={option.disabled}>
        {option.label}
      </option>
    ))}
  </select>
);

export const InputNumber: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, min, max, placeholder, className = '' }) => (
  <input
    type="number"
    value={value || ''}
    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
    min={min}
    max={max}
    placeholder={placeholder}
    className={`ak-w-full ak-px-3 ak-py-2 ak-border ak-border-gray-300 ak-rounded-md ak-focus:outline-none ak-focus:ring-2 ak-focus:ring-blue-500 ak-focus:border-blue-500 ak-transition-colors ${className}`}
  />
);

export const TextArea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}> = ({ value, onChange, placeholder, rows = 3, className = '' }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className={`ak-w-full ak-px-3 ak-py-2 ak-border ak-border-gray-300 ak-rounded-md ak-focus:outline-none ak-focus:ring-2 ak-focus:ring-blue-500 ak-focus:border-blue-500 ak-transition-colors ak-resize-none ${className}`}
  />
);