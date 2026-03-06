/**
 * AlertMessage Component
 * Reusable alert/message display component
 * Features: Multiple variants (success, error, warning, info)
 * 
 * @component
 * @example
 * <AlertMessage 
 *   type="success"
 *   title="Success"
 *   message="Operation completed"
 *   icon={FiCheck}
 * />
 */

import React from 'react';
import {
  FiCheck,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiX,
} from 'react-icons/fi';

/**
 * Alert type configurations
 * Defines styling and default icon for each alert type
 * @type {Object}
 */
const ALERT_CONFIG = {
  success: {
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    icon: FiCheck,
    textColor: 'text-green-800',
    lightText: 'text-green-700',
    iconColor: 'text-green-600',
  },
  error: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    icon: FiAlertCircle,
    textColor: 'text-red-800',
    lightText: 'text-red-700',
    iconColor: 'text-red-600',
  },
  warning: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500',
    icon: FiAlertTriangle,
    textColor: 'text-yellow-800',
    lightText: 'text-yellow-700',
    iconColor: 'text-yellow-600',
  },
  info: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    icon: FiInfo,
    textColor: 'text-blue-800',
    lightText: 'text-blue-700',
    iconColor: 'text-blue-600',
  },
};

/**
 * AlertMessage - Reusable alert component
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Alert type: 'success', 'error', 'warning', 'info'
 * @param {string} [props.title] - Alert title
 * @param {string} props.message - Alert message
 * @param {React.ComponentType} [props.icon] - Custom icon component
 * @param {Function} [props.onClose] - Close button callback
 * @param {boolean} [props.closable] - Show close button
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} - Alert message component
 */
const AlertMessage = ({
  type = 'info',
  title,
  message,
  icon: CustomIcon,
  onClose,
  closable = true,
  className = '',
}) => {
  const config = ALERT_CONFIG[type] || ALERT_CONFIG.info;
  const DefaultIcon = config.icon;
  const IconComponent = CustomIcon || DefaultIcon;

  return (
    <div
      className={`
        ${config.bgColor} 
        border-l-4 
        ${config.borderColor} 
        p-4 rounded flex items-start space-x-3
        ${className}
      `}
      role="alert"
    >
      {/* Icon */}
      <IconComponent
        className={`${config.iconColor} text-xl flex-shrink-0 mt-0.5`}
      />

      {/* Content */}
      <div className="flex-1">
        {title && (
          <p className={`font-semibold ${config.textColor}`}>
            {title}
          </p>
        )}
        <p className={`text-sm ${config.lightText}`}>
          {message}
        </p>
      </div>

      {/* Close Button */}
      {closable && onClose && (
        <button
          onClick={onClose}
          className={`
            flex-shrink-0 ${config.iconColor} hover:opacity-75 
            transition-opacity p-1
          `}
          aria-label="Close alert"
        >
          <FiX className="text-lg" />
        </button>
      )}
    </div>
  );
};

export default AlertMessage;
