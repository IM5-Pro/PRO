/**
 * LetterTemplates Component
 * Letter template management for HR correspondence
 * Features: Template creation, editing, preview, bulk sending
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 */

import React, { useMemo, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { FiPlus, FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';

const LetterTemplates = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {
  const { colors } = useTheme();
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = useMemo(
    () => [
      {
        id: 1,
        name: 'Offer Letter',
        category: 'Recruitment',
        description: 'Job offer letter for new candidates',
        usageCount: 45,
      },
      {
        id: 2,
        name: 'Joining Letter',
        category: 'Onboarding',
        description: 'Welcome letter for new employees',
        usageCount: 48,
      },
      {
        id: 3,
        name: 'Promotion Letter',
        category: 'Promotion',
        description: 'Promotion notification letter',
        usageCount: 12,
      },
      {
        id: 4,
        name: 'Salary Revision',
        category: 'Compensation',
        description: 'Salary revision letter',
        usageCount: 25,
      },
      {
        id: 5,
        name: 'Warning Letter',
        category: 'Disciplinary',
        description: 'Official warning letter',
        usageCount: 8,
      },
      {
        id: 6,
        name: 'Termination Letter',
        category: 'Exit',
        description: 'Employee termination letter',
        usageCount: 5,
      },
    ],
    []
  );

  const categories = useMemo(
    () => ['All', 'Recruitment', 'Onboarding', 'Promotion', 'Compensation', 'Disciplinary', 'Exit'],
    []
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.gradient.primary} p-6 md:p-8`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
            📄 Letter Templates
          </h1>
          <p className={colors.text.tertiary}>Manage letter templates for HR correspondence</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2">
          <FiPlus size={20} />
          New Template
        </button>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`group bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`text-lg font-bold ${colors.text.primary}`}>{template.name}</h3>
                <span className="inline-block px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded font-medium mt-2">
                  {template.category}
                </span>
              </div>
            </div>

            <p className={`${colors.text.tertiary} text-sm mb-4 min-h-10`}>{template.description}</p>

            <div className={`flex items-center justify-between py-3 border-t border-t-${colors.border.secondary}`}>
              <div className={`${colors.text.muted} text-xs`}>Used {template.usageCount} times</div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg hover:bg-slate-700 transition-colors group/btn" title="Preview">
                  <FiEye size={16} className={`${colors.text.secondary} group-hover/btn:${colors.text.primary}`} />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-700 transition-colors group/btn" title="Edit">
                  <FiEdit2 size={16} className={`${colors.text.secondary} group-hover/btn:${colors.text.primary}`} />
                </button>
                <button className="p-2 rounded-lg hover:bg-red-600/20 transition-colors group/btn" title="Delete">
                  <FiTrash2 size={16} className="text-red-400 group-hover/btn:text-red-300" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Stats */}
      <div className="mt-12">
        <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Templates by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const count = cat === 'All' ? templates.length : templates.filter((t) => t.category === cat).length;
            return (
              <div
                key={cat}
                className={`bg-gradient-to-br ${colors.gradient.card} rounded-lg border ${colors.border.primary} p-4 hover:border-blue-500/50 transition-all cursor-pointer`}
              >
                <p className={`${colors.text.primary} font-semibold`}>{cat}</p>
                <p className={`${colors.text.muted} text-2xl font-bold mt-2`}>{count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LetterTemplates;
