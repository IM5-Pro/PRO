/**
 * UserManagement Component
 * Page for managing HR system users and employee accounts
 * Features: User listing, creation, editing, role assignment, bulk operations
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 * @example
 * <HRUserManagement user={currentUser} pageConfig={pageConfig} />
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { FiCheckCircle, FiCheckSquare, FiEdit2, FiMail, FiMoreVertical, FiPlus, FiSearch, FiTrash2, FiUser, FiUsers } from 'react-icons/fi';

const VALIDATION_RULES = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  VALID_ROLES: ['admin', 'hr', 'manager', 'employee'],
};

/**
 * HRUserManagement Component
 * Full-featured user management interface for HR administrators
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {Object} props.pageConfig - Page configuration
 * @param {Function} props.onUserUpdate - Callback for user updates
 * @returns {JSX.Element} User management interface
 */
const HRUserManagement = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // ============================================================================
  // MOCKED USER DATA
  // ============================================================================
  const users = useMemo(
    () => [
      {
        id: 1,
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@company.com',
        department: 'IT',
        role: 'employee',
        status: 'active',
        joinDate: '2022-01-15',
      },
      {
        id: 2,
        name: 'Priya Singh',
        email: 'priya.singh@company.com',
        department: 'HR',
        role: 'manager',
        status: 'active',
        joinDate: '2021-06-10',
      },
      {
        id: 3,
        name: 'Amit Patel',
        email: 'amit.patel@company.com',
        department: 'Finance',
        role: 'employee',
        status: 'active',
        joinDate: '2023-03-22',
      },
      {
        id: 4,
        name: 'Sneha Verma',
        email: 'sneha.verma@company.com',
        department: 'Operations',
        role: 'manager',
        status: 'inactive',
        joinDate: '2020-11-08',
      },
      {
        id: 5,
        name: 'Vikram Sharma',
        email: 'vikram.sharma@company.com',
        department: 'Sales',
        role: 'employee',
        status: 'active',
        joinDate: '2023-07-03',
      },
    ],
    []
  );

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  /**
   * Validate email format
   */
  const validateEmail = useCallback((email) => {
    return VALIDATION_RULES.EMAIL_PATTERN.test(email);
  }, []);

  /**
   * Validate user object
   */
  const validateUser = useCallback((userData) => {
    const errors = [];

    if (!userData.name || userData.name.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
      errors.push('Name must be at least 2 characters');
    }

    if (!validateEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    if (!VALIDATION_RULES.VALID_ROLES.includes(userData.role)) {
      errors.push('Invalid role selected');
    }

    return { isValid: errors.length === 0, errors };
  }, [validateEmail]);

  // ============================================================================
  // FILTER DATA
  // ============================================================================

  /**
   * Filter users based on search query
   */
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle user selection
   */
  const handleSelectUser = useCallback((userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  /**
   * Handle delete user
   */
  const handleDeleteUser = useCallback((userId) => {
    console.log('Deleting user:', userId);
    // TODO: Implement actual delete API call
  }, []);

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      {/* Header */}
      <div className="rounded-2xl p-6 mb-8 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 shadow-xl shadow-slate-900/10 animate-slideInDown">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <FiUser size={36} /> User Management
          </h1>
          <p className="text-slate-600">Create and manage employee accounts</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card mb-8 animate-slideInRight" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <button className="hidden md:inline-flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-all duration-300">
            <FiPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredUsers.map((u, idx) => (
          <div
            key={u.id}
            className="card animate-fadeInUp hover-lift"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            {/* Header with Name and Menu */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{u.name}</h3>
                <p className="text-sm text-gray-600">{u.department}</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                <FiMoreVertical className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Role Badge */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                {u.role.toUpperCase()}
              </span>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-4 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <FiMail className="text-blue-500" size={16} />
                <span className="truncate">{u.email}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Join Date & Status */}
            <div className="flex items-center justify-between mb-4 text-sm">
              <p className="text-gray-500">Joined {new Date(u.joinDate).toLocaleDateString()}</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-xs font-semibold ${u.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button className="flex-1 py-2 px-4 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2">
                <FiEdit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDeleteUser(u.id)}
                className="flex-1 py-2 px-4 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
              >
                <FiTrash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Users', value: users.length, icon: FiUsers, color: 'from-blue-500 to-cyan-500' },
          { label: 'Active Users', value: users.filter((u) => u.status === 'active').length, icon: FiCheckCircle, color: 'from-green-500 to-emerald-500' },
          { label: 'Selected', value: selectedUsers.length, icon: FiCheckSquare, color: 'from-purple-500 to-pink-500' },
        ].map((stat, idx) => {
          const StatIcon = stat.icon;

          return (
            <div
              key={idx}
              className="stat-card animate-fadeInUp"
              style={{ animationDelay: `${0.4 + idx * 0.1}s` }}
            >
              <div className={`icon-box bg-gradient-to-br ${stat.color} text-white`}>
                <StatIcon size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HRUserManagement;
