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
import { FiSearch, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

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
    <div className={`min-h-screen bg-gradient-to-br ${colors.gradient.primary} p-6 md:p-8`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
            👤 User Management
          </h1>
          <p className={colors.text.tertiary}>Create and manage employee accounts</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2">
          <FiPlus size={20} />
          Add User
        </button>
      </div>

      {/* Search and Filter */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6 mb-8`}>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${colors.text.tertiary}`} />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 ${colors.bg.secondary} border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${colors.border.secondary} bg-gradient-to-r from-slate-700 to-slate-800`}>
                <th className={`py-4 px-6 text-left ${colors.text.tertiary} font-semibold text-sm`}>
                  <input type="checkbox" className="rounded" />
                </th>
                <th className={`py-4 px-6 text-left ${colors.text.tertiary} font-semibold text-sm`}>
                  Name
                </th>
                <th className={`py-4 px-6 text-left ${colors.text.tertiary} font-semibold text-sm`}>
                  Email
                </th>
                <th className={`py-4 px-6 text-left ${colors.text.tertiary} font-semibold text-sm`}>
                  Department
                </th>
                <th className={`py-4 px-6 text-left ${colors.text.tertiary} font-semibold text-sm`}>
                  Role
                </th>
                <th className={`py-4 px-6 text-left ${colors.text.tertiary} font-semibold text-sm`}>
                  Status
                </th>
                <th className={`py-4 px-6 text-left ${colors.text.tertiary} font-semibold text-sm`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b ${colors.border.secondary} hover:bg-slate-700/50 transition-colors`}
                >
                  <td className="py-4 px-6">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => handleSelectUser(u.id)}
                      className="rounded"
                    />
                  </td>
                  <td className={`py-4 px-6 ${colors.text.primary} font-medium`}>{u.name}</td>
                  <td className={`py-4 px-6 ${colors.text.secondary} text-sm`}>{u.email}</td>
                  <td className={`py-4 px-6 ${colors.text.secondary}`}>{u.department}</td>
                  <td className={`py-4 px-6 ${colors.text.secondary}`}>
                    <span className="inline-block px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded font-medium">
                      {u.role}
                    </span>
                  </td>
                  <td className={`py-4 px-6`}>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        u.status === 'active'
                          ? 'bg-green-600/20 text-green-300'
                          : 'bg-red-600/20 text-red-300'
                      }`}
                    >
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                    </span>
                  </td>
                  <td className={`py-4 px-6`}>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <FiEdit2 size={16} className={colors.text.secondary} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
                      >
                        <FiTrash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          { label: 'Total Users', value: users.length, icon: '👥' },
          { label: 'Active Users', value: users.filter((u) => u.status === 'active').length, icon: '✅' },
          { label: 'Selected', value: selectedUsers.length, icon: '☑️' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}
          >
            <p className={`${colors.text.tertiary} text-sm font-medium mb-2`}>{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${colors.text.primary}`}>{stat.value}</p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HRUserManagement;
