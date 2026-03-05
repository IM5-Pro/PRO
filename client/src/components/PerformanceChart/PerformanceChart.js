/**
 * PerformanceChart Component
 * Displays performance metrics with interactive charts
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FiTrendingUp } from 'react-icons/fi';

/**
 * PerformanceChart Component - Show performance metrics
 * @returns {JSX.Element} - PerformanceChart component
 */
const PerformanceChart = () => {
  // Sample performance data
  const performanceData = [
    { month: 'Jan', rating: 4.2, projects: 3 },
    { month: 'Feb', rating: 4.4, projects: 4 },
    { month: 'Mar', rating: 4.6, projects: 5 },
    { month: 'Apr', rating: 4.5, projects: 4 },
    { month: 'May', rating: 4.7, projects: 6 },
    { month: 'Jun', rating: 4.8, projects: 5 },
  ];

  // Skill data
  const skillsData = [
    { skill: 'React', level: 90 },
    { skill: 'JavaScript', level: 88 },
    { skill: 'Node.js', level: 82 },
    { skill: 'Database', level: 80 },
    { skill: 'CSS', level: 85 },
  ];

  return (
    <div className="space-y-6">
      {/* Performance Rating Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FiTrendingUp className="text-green-600" size={20} />
            Performance Rating
          </h2>
          <span className="badge badge-success">Excellent</span>
        </div>

        {/* Line Chart */}
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis domain={[0, 5]} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Rating (/5)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Current Rating</p>
            <p className="text-2xl font-bold text-blue-600">4.8/5</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Avg Rating</p>
            <p className="text-2xl font-bold text-green-600">4.5/5</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Projects</p>
            <p className="text-2xl font-bold text-purple-600">27</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Growth</p>
            <p className="text-2xl font-bold text-orange-600">+14%</p>
          </div>
        </div>
      </div>

      {/* Skills Bar Chart */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Skills Assessment</h2>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skillsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="skill" stroke="#9ca3af" />
              <YAxis domain={[0, 100]} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="level" fill="#10b981" radius={[8, 8, 0, 0]} name="Proficiency %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill List */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-3">Detailed Skills</p>
          <div className="space-y-2">
            {skillsData.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-700">{item.skill}</span>
                  <span className="text-sm font-bold text-gray-800">{item.level}%</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div
                    className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${item.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
