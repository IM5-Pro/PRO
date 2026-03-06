/**
 * TimingsChart Component
 * Displays team member work timings with individual performance metrics
 * Features: Grouped bar charts, team member profiles, responsive design, custom tooltips
 * 
 * @component
 * @example
 * <TimingsChart 
 *   selectedMember={teamMember}
 *   onMemberSelect={handleSelect}
 *   period="This Week"
 * />
 */

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FiChevronDown } from 'react-icons/fi';
// FiFilter removed - not used in this component

/**
 * Chart data for week timings
 * Shows hours worked (Last week vs This week) for each day
 * @type {Array}
 */
const CHART_DATA = [
  { day: 'Mon', lastWeek: 8.5, thisWeek: 9 },
  { day: 'Tue', lastWeek: 8, thisWeek: 8.5 },
  { day: 'Wed', lastWeek: 9, thisWeek: 9.2 },
  { day: 'Thu', lastWeek: 8.2, thisWeek: 8.8 },
  { day: 'Fri', lastWeek: 7.5, thisWeek: 8.5 },
  { day: 'Sat', lastWeek: 2, thisWeek: 0 },
  { day: 'Sun', lastWeek: 0, thisWeek: 0 },
];

/**
 * Team members list with performance metrics
 * @type {Array<{id: number, name: string, role: string, avatar: string, lastWeekHours: number, thisWeekHours: number}>}
 */
const TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Miracle Vetrovs',
    role: 'UX Designer - UX03',
    avatar: '👩‍💼',
    lastWeekHours: 34.2,
    thisWeekHours: 32,
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    role: 'Product Manager - PM01',
    avatar: '👩‍💼',
    lastWeekHours: 36,
    thisWeekHours: 34.5,
  },
  {
    id: 3,
    name: 'Mike Chen',
    role: 'Developer - DEV02',
    avatar: '👨‍💻',
    lastWeekHours: 35.5,
    thisWeekHours: 36,
  },
  {
    id: 4,
    name: 'Emma Davis',
    role: 'Designer - DES01',
    avatar: '👩‍🎨',
    lastWeekHours: 32,
    thisWeekHours: 33.5,
  },
];

/**
 * TimingsChart Component
 * Displays bar chart comparing work hours and team member profiles
 * 
 * @param {Object} props - Component props
 * @param {Object} props.selectedMember - Currently selected team member
 * @param {Function} props.onMemberSelect - Callback when member is selected
 * @param {string} props.period - Time period label
 * @param {Function} props.onFilter - Filter button click callback
 * @returns {JSX.Element} Timings chart component
 */
const TimingsChart = ({
  selectedMember = TEAM_MEMBERS[0],
  onMemberSelect = () => {},
  period = 'This Week',
  onFilter = () => {},
}) => {
  // State for dropdown menu
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  /**
   * Custom tooltip for bar chart
   * Shows detailed information on hover
   * 
   * @param {Object} props - Tooltip props
   * @returns {JSX.Element} Custom tooltip
   */
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-800">
            {payload[0].payload.day}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}h
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card w-full h-full flex flex-col">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">Timings</h2>
          <p className="text-xs text-gray-500 mt-1">From 4-10 Sep, 2023</p>
        </div>

        {/* Period Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMemberDropdown(!showMemberDropdown)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm font-semibold text-gray-700"
            aria-label="Filter period"
          >
            {period}
            <FiChevronDown
              size={16}
              className={`transition-transform duration-300 ${
                showMemberDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="flex-1 mb-6 -mx-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={CHART_DATA}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
              height={30}
            />

            {/* Grouped bars for comparison */}
            <Bar
              dataKey="lastWeek"
              fill="#3B82F6"
              name="Last week"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="thisWeek"
              fill="#10B981"
              name="This week"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Team Members Section */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs font-semibold text-gray-600 mb-3">TEAM MEMBERS</p>

        {/* Scrollable Members List */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {TEAM_MEMBERS.map((member) => (
            <button
              key={member.id}
              onClick={() => {
                onMemberSelect(member);
                setShowMemberDropdown(false);
              }}
              className={`
                flex flex-col items-center min-w-fit p-3 rounded-lg transition-all duration-200
                ${
                  selectedMember?.id === member.id
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }
              `}
              title={member.name}
            >
              {/* Avatar */}
              <span className="text-3xl mb-1">{member.avatar}</span>

              {/* Name */}
              <p className="text-xs font-semibold text-gray-800 text-center max-w-12 truncate">
                {member.name.split(' ')[0]}
              </p>

              {/* Hours Info */}
              <p className="text-xs text-gray-600 mt-1 text-center">
                <span className="font-bold text-blue-600">{member.thisWeekHours}h</span>
                <span className="text-gray-400"> / {member.lastWeekHours}h</span>
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Member Details Section */}
      {selectedMember && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start gap-3">
            {/* Member Avatar and Info */}
            <span className="text-3xl flex-shrink-0">{selectedMember.avatar}</span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">{selectedMember.name}</p>
              <p className="text-xs text-gray-600">{selectedMember.role}</p>

              {/* Hours Comparison */}
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-600">This week</p>
                  <p className="text-sm font-bold text-blue-600">
                    {selectedMember.thisWeekHours}h
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Last week</p>
                  <p className="text-sm font-bold text-gray-600">
                    {selectedMember.lastWeekHours}h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimingsChart;
