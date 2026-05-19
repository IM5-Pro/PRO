import React from 'react';
import { FaIndianRupeeSign } from 'react-icons/fa6';

/**
 * Indian Rupee icon for payroll / compensation nav (replaces dollar-style icons).
 */
const RupeeIcon = ({ className = '', size, style, ...props }) => (
  <FaIndianRupeeSign className={className} size={size} style={style} aria-hidden {...props} />
);

export default RupeeIcon;
