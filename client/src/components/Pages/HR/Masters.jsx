/**
 * Masters Component
 * Configuration and master data management interface
 * Features: Department setup, designations, salary structures, employee categories
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const Masters = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {
  const { colors } = useTheme();
  const [activeSection, setActiveSection] = useState('departments');

  const departments = useMemo(
    () => [
      { id: 1, name: 'Information Technology', code: 'IT', head: 'Rajesh Kumar' },
      { id: 2, name: 'Human Resources', code: 'HR', head: 'Priya Singh' },
      { id: 3, name: 'Finance', code: 'FIN', head: 'Amit Patel' },
      { id: 4, name: 'Operations', code: 'OPS', head: 'Sneha Verma' },
    ],
    []
  );

  const designations = useMemo(
    () => [
      { id: 1, name: 'Software Engineer', level: 'Junior', salary: '500000-700000' },
      { id: 2, name: 'Senior Software Engineer', level: 'Senior', salary: '900000-1200000' },
      { id: 3, name: 'Project Manager', level: 'Manager', salary: '800000-1100000' },
      { id: 4, name: 'HR Manager', level: 'Manager', salary: '700000-1000000' },
    ],
    []
  );

  const employeeCategories = useMemo(
    () => [
      { id: 1, name: 'Full Time', description: 'Permanent employees' },
      { id: 2, name: 'Contract', description: 'Contract-based employees' },
      { id: 3, name: 'Intern', description: 'Internship positions' },
      { id: 4, name: 'Part Time', description: 'Part-time employees' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      {/* Header */}
      <div className="rounded-2xl p-6 mb-8 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 shadow-xl shadow-slate-900/10 animate-slideInDown">
        <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          ⚙️ Masters Configuration
        </h1>
        <p className="text-slate-600">Configure master data and organizational structure</p>
      </div>

      {/* Tabs */}
      <div className="card mb-8 p-2 flex gap-2 overflow-x-auto animate-slideInRight" style={{ animationDelay: '0.1s' }}>
        {['departments', 'designations', 'categories'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap ${
              activeSection === section
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            {section.charAt(0).toUpperCase() + section.slice(1).replace('s', '')}
          </button>
        ))}
      </div>

      {/* Departments Section */}
      {activeSection === 'departments' && (
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${colors.text.primary}`}>Departments</h2>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all">
              <FiPlus size={18} />
              Add Department
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className={`p-4 ${colors.bg.tertiary}/30 border ${colors.border.secondary} rounded-lg hover:${colors.bg.tertiary}/50 transition-all`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`${colors.text.primary} font-semibold`}>{dept.name}</p>
                    <p className={`${colors.text.tertiary} text-sm mt-1`}>Code: {dept.code}</p>
                    <p className={`${colors.text.tertiary} text-sm`}>Head: {dept.head}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-700 rounded transition-colors">
                      <FiEdit2 size={16} className={colors.text.secondary} />
                    </button>
                    <button className="p-2 hover:bg-red-600/20 rounded transition-colors">
                      <FiTrash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Designations Section */}
      {activeSection === 'designations' && (
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${colors.text.primary}`}>Designations</h2>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all">
              <FiPlus size={18} />
              Add Designation
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${colors.border.secondary}`}>
                  <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Name</th>
                  <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Level</th>
                  <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Salary Range</th>
                  <th className={`text-left py-3 px-4 ${colors.text.tertiary} font-semibold text-sm`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {designations.map((des) => (
                  <tr key={des.id} className={`border-b ${colors.border.secondary} hover:bg-slate-700/50`}>
                    <td className={`py-3 px-4 ${colors.text.primary}`}>{des.name}</td>
                    <td className={`py-3 px-4 ${colors.text.secondary}`}>
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">{des.level}</span>
                    </td>
                    <td className={`py-3 px-4 ${colors.text.secondary}`}>₹{des.salary}</td>
                    <td className={`py-3 px-4`}>
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-slate-700 rounded">
                          <FiEdit2 size={14} className={colors.text.secondary} />
                        </button>
                        <button className="p-1 hover:bg-red-600/20 rounded">
                          <FiTrash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Categories Section */}
      {activeSection === 'categories' && (
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${colors.text.primary}`}>Employee Categories</h2>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all">
              <FiPlus size={18} />
              Add Category
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employeeCategories.map((cat) => (
              <div key={cat.id} className={`p-4 ${colors.bg.tertiary}/30 border ${colors.border.secondary} rounded-lg hover:${colors.bg.tertiary}/50 transition-all`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`${colors.text.primary} font-semibold`}>{cat.name}</p>
                    <p className={`${colors.text.tertiary} text-sm mt-1`}>{cat.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-700 rounded transition-colors">
                      <FiEdit2 size={16} className={colors.text.secondary} />
                    </button>
                    <button className="p-2 hover:bg-red-600/20 rounded transition-colors">
                      <FiTrash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Masters;
