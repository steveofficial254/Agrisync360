import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const modalSizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
  '2xl': 'max-w-7xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  contentClassName = '',
  headerClassName = '',
  footer,
  ...props
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  const modalSize = modalSizes[size] || modalSizes.md;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`
          w-full ${modalSize} bg-white rounded-2xl shadow-2xl
          transform transition-all duration-300 ease-out
          animate-slide-up max-h-[90vh] overflow-hidden
          flex flex-col
          ${className}
        `}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${headerClassName}`}>
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900 font-display">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${contentClassName || 'p-6'}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Modal variants for common use cases
export const ModalVariants = {
  // Confirmation modal
  confirm: (props) => (
    <Modal
      size="sm"
      {...props}
    />
  ),
  
  // Form modal
  form: (props) => (
    <Modal
      size="lg"
      closeOnBackdrop={false}
      closeOnEscape={false}
      {...props}
    />
  ),
  
  // Image/video modal
  media: (props) => (
    <Modal
      size="full"
      contentClassName="p-0"
      {...props}
    />
  ),
  
  // Side panel modal
  sidePanel: (props) => {
    const SidePanelModal = ({ isOpen, onClose, children, ...modalProps }) => {
      if (!isOpen) return null;

      return (
        <div
          className="fixed inset-0 z-50 flex animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out animate-slide-up">
            {children}
          </div>
        </div>
      );
    };

    return <SidePanelModal {...props} />;
  },
  
  // Bottom sheet modal (mobile-first)
  bottomSheet: (props) => {
    const BottomSheetModal = ({ isOpen, onClose, children, ...modalProps }) => {
      if (!isOpen) return null;

      return (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 animate-fade-in sm:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="w-full bg-white rounded-t-3xl shadow-2xl transform transition-all duration-300 ease-out animate-slide-up max-h-[80vh] overflow-hidden">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            {children}
          </div>
        </div>
      );
    };

    return <BottomSheetModal {...props} />;
  },
};

// Modal content components
export const ModalHeader = ({ title, subtitle, className = '', ...props }) => (
  <div className={`mb-6 ${className}`} {...props}>
    {title && (
      <h3 className="text-lg font-semibold text-gray-900 mb-1 font-display">
        {title}
      </h3>
    )}
    {subtitle && (
      <p className="text-sm text-gray-500">
        {subtitle}
      </p>
    )}
  </div>
);

export const ModalBody = ({ children, className = '', ...props }) => (
  <div className={`space-y-4 ${className}`} {...props}>
    {children}
  </div>
);

export const ModalFooter = ({ children, className = '', ...props }) => (
  <div className={`flex gap-3 justify-end mt-6 pt-6 border-t border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);
