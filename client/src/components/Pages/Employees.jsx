/**
 * Employees Management Page
 * View, manage, and organize employees with modern UI
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiSearch, FiFilter, FiPlus, FiMail, FiPhone, FiBriefcase, FiMapPin, FiMoreVertical } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import bgImage from '../../assets/Background.png';

const Employees = () => {
  const { colors, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  const employees = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      phone: '+1 (555) 001-2345',
      position: 'Senior Product Manager',
      department: 'Product',
      location: 'San Francisco',
      avatar: '👩‍💼',
      status: 'active',
      joinDate: '2020-06-15'
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      phone: '+1 (555) 002-3456',
      position: 'Lead Developer',
      department: 'Engineering',
      location: 'New York',
      avatar: '👨‍💻',
      status: 'active',
      joinDate: '2019-08-20'
    },
    {
      id: 3,
      name: 'Emily Davis',
      email: 'emily.davis@company.com',
      phone: '+1 (555) 003-4567',
      position: 'UX/UI Designer',
      department: 'Design',
      location: 'Los Angeles',
      avatar: '👩‍🎨',
      status: 'active',
      joinDate: '2021-02-10'
    },
    {
      id: 4,
      name: 'Alex Rodriguez',
      email: 'alex.rodriguez@company.com',
      phone: '+1 (555) 004-5678',
      position: 'QA Engineer',
      department: 'Quality',
      location: 'Austin',
      avatar: '👨‍🔬',
      status: 'active',
      joinDate: '2020-11-05'
    }
  ];

  const departments = ['all', 'Product', 'Engineering', 'Design', 'Quality', 'Marketing'];

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filterDept === 'all' || employee.department === filterDept;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-6 md:p-8"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Header */}
      <div className="glass rounded-2xl p-6 mb-8 backdrop-blur-xl">
        <div>
          <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
            <FiUsers className="w-10 h-10" /> Employees
          </h1>
          <p className={colors.text.tertiary}>Manage and view all employees</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass rounded-2xl p-4 mb-8 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${colors.border.primary} rounded-xl ${colors.text.primary} placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all duration-300`}
            />
          </div>

          <div className={`flex items-center gap-2 bg-white/10 border ${colors.border.primary} rounded-xl px-4 py-3 hover:border-slate-600 transition-all duration-300`}>
            <FiFilter className="text-slate-400" size={20} />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className={`bg-transparent ${colors.text.primary} outline-none font-medium flex-1`}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept} className="bg-slate-800">
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className={`group glass rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl ${colors.shadow} transform hover:-translate-y-1`}
          >
            {/* Avatar & Name */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl">
                  {employee.avatar}
                </div>
                <div>
                  <h3 className={`${colors.text.primary} font-bold text-lg`}>{employee.name}</h3>
                  <p className={colors.text.tertiary}>{employee.position}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors duration-300"
              >
                <FiMoreVertical className="text-slate-400 hover:text-white" size={20} />
              </button>
            </div>

            {/* Department Badge */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xs font-semibold">
                {employee.department}
              </span>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className={`flex items-center gap-3 ${colors.text.secondary} text-sm`}>
                <FiMail className="text-blue-400" size={16} />
                <span className="truncate">{employee.email}</span>
              </div>
              <div className={`flex items-center gap-3 ${colors.text.secondary} text-sm`}>
                <FiPhone className="text-blue-400" size={16} />
                <span>{employee.phone}</span>
              </div>
              <div className={`flex items-center gap-3 ${colors.text.secondary} text-sm`}>
                <FiMapPin className="text-blue-400" size={16} />
                <span>{employee.location}</span>
              </div>
            </div>

            {/* Divider */}
            <div className={`border-t ${colors.border.primary} my-4`}></div>

            {/* Join Date & Status */}
            <div className="flex items-center justify-between mb-4">
              <p className={`${colors.text.tertiary} text-xs`}>Joined {new Date(employee.joinDate).toLocaleDateString()}</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-green-400 text-xs font-semibold">Active</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="py-2 px-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all duration-300 text-sm font-medium"
              >
                View Profile
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="py-2 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-all duration-300 text-sm font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Employees;
