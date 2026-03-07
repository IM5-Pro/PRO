/**
 * ManpowerPlanning Component
 * Dashboard page for workforce planning and forecasting
 * Features: Statistics cards, charts, planning tools, responsive layout
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 * @example
 * <ManpowerPlanning user={currentUser} pageConfig={pageConfig} />
 */

import React, { useMemo, useCallback } from 'react';
import { useTheme } from '../../../context/ThemeContext';

/**
 * Validation constants for planning data
 */
const VALIDATION_RULES = {
  MIN_HEADCOUNT: 0,
  MAX_HEADCOUNT: 10000,
  VALID_DEPARTMENTS: ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing'],
};

/**
 * ManpowerPlanning Component
 * Main dashboard for HR workforce planning
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {Object} props.pageConfig - Page configuration
 * @param {Function} props.onUserUpdate - Callback for user updates
 * @returns {JSX.Element} Manpower planning dashboard
 */
const ManpowerPlanning = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {
  const { colors } = useTheme();

  // ============================================================================
  // MOCKED DATA
  // ============================================================================
  const statsCards = useMemo(
    () => [
      {
        id: 'total-strength',
        title: 'Total Strength',
        value: 1250,
        unit: 'employees',
        icon: '👥',
        color: 'from-blue-500 to-cyan-500',
        change: '+15',
        trend: 'up',
      },
      {
        id: 'open-positions',
        title: 'Open Positions',
        value: 23,
        unit: 'roles',
        icon: '💼',
        color: 'from-purple-500 to-pink-500',
        change: '+5',
        trend: 'up',
      },
      {
        id: 'pending-approvals',
        title: 'Pending Approvals',
        value: 12,
        unit: 'requests',
        icon: '⏳',
        color: 'from-yellow-500 to-orange-500',
        change: '-3',
        trend: 'down',
      },
      {
        id: 'dept-efficiency',
        title: 'Department Efficiency',
        value: 94.2,
        unit: '%',
        icon: '📊',
        color: 'from-green-500 to-emerald-500',
        change: '+2.1',
        trend: 'up',
      },
    ],
    []
  );

  const departmentData = useMemo(
    () => [
      { name: 'IT', strength: 320, budget: 4500000, efficiency: 96 },
      { name: 'HR', strength: 45, budget: 550000, efficiency: 92 },
      { name: 'Finance', strength: 78, budget: 1200000, efficiency: 98 },
      { name: 'Operations', strength: 567, budget: 3200000, efficiency: 89 },
      { name: 'Sales', strength: 234, budget: 2100000, efficiency: 91 },
      { name: 'Marketing', strength: 40, budget: 800000, efficiency: 85 },
    ],
    []
  );

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  /**
   * Validate headcount value
   * @param {number} value - Value to validate
   * @returns {Object} Validation result
   */
  const validateHeadcount = useCallback((value) => {
    if (value < VALIDATION_RULES.MIN_HEADCOUNT || value > VALIDATION_RULES.MAX_HEADCOUNT) {
      return {
        isValid: false,
        error: `Headcount must be between ${VALIDATION_RULES.MIN_HEADCOUNT} and ${VALIDATION_RULES.MAX_HEADCOUNT}`,
      };
    }
    return { isValid: true, error: null };
  }, []);

  /**
   * Validate department
   * @param {string} dept - Department name
   * @returns {Object} Validation result
   */
  const validateDepartment = useCallback((dept) => {
    if (!VALIDATION_RULES.VALID_DEPARTMENTS.includes(dept)) {
      return {
        isValid: false,
        error: `Invalid department. Valid options: ${VALIDATION_RULES.VALID_DEPARTMENTS.join(', ')}`,
      };
    }
    return { isValid: true, error: null };
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle planning form submission
   */
  const handlePlanningSubmit = useCallback((formData) => {
    console.log('Planning form submitted:', formData);
    // TODO: Implement actual API call
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
            📊 Manpower Planning
          </h1>
          <p className={colors.text.tertiary}>
            Workforce forecasting and strategic planning dashboard
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card) => (
          <div
            key={card.id}
            className={`group bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6 hover:${colors.border.secondary} transition-all duration-300 hover:shadow-2xl ${colors.shadow} transform hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <span
                className={`text-xs font-semibold ${
                  card.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {card.change}
              </span>
            </div>

            <p className={`${colors.text.tertiary} text-sm font-medium mb-1`}>{card.title}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${colors.text.primary}`}>{card.value}</p>
              <p className={colors.text.tertiary}>{card.unit}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Statistics */}
        <div className="lg:col-span-2">
          <div
            className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6 hover:${colors.border.secondary} transition-all duration-300`}
          >
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>
              Department Overview
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${colors.border.secondary}`}>
                    <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>
                      Department
                    </th>
                    <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>
                      Strength
                    </th>
                    <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>
                      Budget
                    </th>
                    <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>
                      Efficiency
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {departmentData.map((dept) => (
                    <tr
                      key={dept.name}
                      className={`border-b ${colors.border.secondary} hover:bg-slate-700/50 transition-colors`}
                    >
                      <td className={`py-3 px-4 ${colors.text.primary} font-medium`}>
                        {dept.name}
                      </td>
                      <td className={`py-3 px-4 ${colors.text.secondary}`}>{dept.strength}</td>
                      <td className={`py-3 px-4 ${colors.text.secondary}`}>
                        ₹{(dept.budget / 100000).toFixed(1)}L
                      </td>
                      <td className={`py-3 px-4`}>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                              style={{ width: `${dept.efficiency}%` }}
                            />
                          </div>
                          <span className={`text-sm ${colors.text.secondary}`}>
                            {dept.efficiency}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div
            className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6 h-full`}
          >
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Quick Actions</h2>

            <div className="space-y-3">
              {[
                { label: 'Create Plan', icon: '✏️' },
                { label: 'View Reports', icon: '📈' },
                { label: 'Department Stats', icon: '📊' },
                { label: 'Budget Review', icon: '💰' },
                { label: 'Recruitment', icon: '👨‍💼' },
              ].map((action, idx) => (
                <button
                  key={idx}
                  className={`w-full flex items-center gap-3 px-4 py-3 ${colors.bg.tertiary}/30 border ${colors.border.secondary} rounded-xl ${colors.text.tertiary} hover:${colors.text.primary} hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 hover:border-blue-500/50 transition-all duration-300 font-medium`}
                >
                  <span className="text-lg">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManpowerPlanning;
