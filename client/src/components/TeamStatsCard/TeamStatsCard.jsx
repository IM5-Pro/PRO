/**
 * TeamStatsCard Component
 * Displays team statistics with a donut chart showing team status breakdown
 * Features: Responsive layout, interactive legend, status indicators, custom colors
 * 
 * @component
 * @example
 * <TeamStatsCard 
 *   teamName="Engineering"
 *   periodLabel="4-10 Sep, 2023"
 *   onFilter={() => {}}
 * />
 */

import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { FiFilter } from 'react-icons/fi';

/**
 * Chart colors configuration
 * @type {Object}
 */
const CHART_COLORS = {
  inOffice: '#3B52D6',    // Blue
  workFromHome: '#10B981', // Green
  halfDay: '#F59E0B',      // Amber
  onLeave: '#EF4444',      // Red
};

/**
 * Default team stats data structure
 * @type {Array<{name: string, value: number, color: string}>}
 */
const DEFAULT_STATS = [
  { name: 'In Office', value: 63, color: CHART_COLORS.inOffice },
  { name: 'Work from Home', value: 22, color: CHART_COLORS.workFromHome },
  { name: 'Half Day', value: 6, color: CHART_COLORS.halfDay },
  { name: 'On Leave', value: 9, color: CHART_COLORS.onLeave },
];

/**
 * TeamStatsCard Component
 * Displays team statistics with visual breakdown
 * 
 * @param {Object} props - Component props
 * @param {string} props.teamName - Name of the team
 * @param {string} props.periodLabel - Time period label
 * @param {Array} props.stats - Statistics data array
 * @param {Function} props.onFilter - Filter button click callback
 * @returns {JSX.Element} Team stats card component
 */
const TeamStatsCard = ({
  teamName = 'My Teams',
  periodLabel = 'From 4-10 Sep, 2023',
  stats = DEFAULT_STATS,
  compact = false,
  onFilter = () => {},
}) => {
  /**
   * Render custom label for pie chart center
   * Shows the percentage value for each segment
   * 
   * @param {Object} entry - Chart entry object
   * @returns {string} Formatted percentage
   */
  const renderCustomLabel = ({ name, value }) => {
    return `${value}%`;
  };

  /**
   * Render legend item with status indicator
   * Shows color-coded legend for better readability
   * 
   * @param {Object} props - Legend props
   * @returns {JSX.Element} Legend item
   */
  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap gap-3 justify-center">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-600">{entry.name}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card w-full flex flex-col">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>{teamName}</h2>
          <p className="text-xs text-gray-500 mt-1">{periodLabel}</p>
        </div>

        {/* Filter Button */}
        <button
          onClick={onFilter}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="Filter team stats"
          aria-label="Filter button"
        >
          <FiFilter className="text-gray-600" size={18} />
        </button>
      </div>

      {/* Chart Section */}
      <div className="flex items-center justify-center mb-4">
        <div className={`w-full ${compact ? 'h-48 md:h-52' : 'h-64'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats}
                cx="50%"
                cy="50%"
                innerRadius={compact ? 44 : 60}
                outerRadius={compact ? 76 : 100}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>

              {/* Tooltip for better UX */}
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend Section */}
      <div className="border-t border-gray-200 pt-3">
        <div className={`grid grid-cols-2 ${compact ? 'gap-2' : 'gap-3'}`}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 ${compact ? 'p-1.5' : 'p-2'} bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200`}
            >
              {/* Color Indicator */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: stat.color }}
              />

              {/* Stat Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 truncate">{stat.name}</p>
                <p className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-gray-800`}>{stat.value}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamStatsCard;
