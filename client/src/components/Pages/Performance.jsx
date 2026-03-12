/**
 * Performance Page
 * Performance metrics and reviews
 */

import React from 'react';
import { FiAward, FiTrendingUp, FiTarget, FiUsers } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import bgImage from '../../assets/Background.png';

const Performance = () => {
  const { colors } = useTheme();
  const metrics = [
    { title: 'Overall Rating', value: '4.6', unit: '/5.0', icon: FiAward, color: 'from-blue-500 to-cyan-500', change: '+0.2' },
    { title: 'Productivity', value: '92%', unit: 'score', icon: FiTrendingUp, color: 'from-green-500 to-emerald-500', change: '+5%' },
    { title: 'Teamwork', value: '4.4', unit: '/5.0', icon: FiUsers, color: 'from-purple-500 to-pink-500', change: '+0.1' },
    { title: 'Goal Progress', value: '85%', unit: 'complete', icon: FiTarget, color: 'from-orange-500 to-red-500', change: '+15%' }
  ];

  const goals = [
    { goal: 'Complete React Migration', progress: 75, deadline: '2024-12-31' },
    { goal: 'Improve Code Coverage', progress: 60, deadline: '2024-12-15' },
    { goal: 'Documentation Updates', progress: 40, deadline: '2024-12-20' },
    { goal: 'Performance Optimization', progress: 85, deadline: '2024-12-10' }
  ];

  const reviews = [
    { reviewer: 'Sarah Johnson', rating: 5, feedback: 'Excellent work on the UI redesign', date: '2024-11-15' },
    { reviewer: 'Mike Chen', rating: 4, feedback: 'Good progress on backend improvements', date: '2024-11-10' },
    { reviewer: 'Emily Davis', rating: 5, feedback: 'Outstanding team collaboration', date: '2024-11-05' }
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-6 md:p-8"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.94)), url(${bgImage})` }}
    >
      {/* Header */}
      <div>
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
          <FiAward className="w-10 h-10" /> Performance
        </h1>
        <p className={`${colors.text.tertiary} mb-8`}>Track your performance metrics and goals</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className={`group bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl ${colors.shadow} transform hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} text-white`}>
                  <Icon size={24} />
                </div>
                <span className="text-green-400 text-xs font-semibold">{metric.change}</span>
              </div>

              <p className="text-slate-400 text-sm font-medium mb-1">{metric.title}</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-white">{metric.value}</p>
                <p className="text-slate-400 text-sm">{metric.unit}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goals & Reviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals */}
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Performance Goals</h2>

          <div className="space-y-4">
            {goals.map((goal, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white font-semibold">{goal.goal}</p>
                  <span className="text-slate-400 text-sm">{goal.progress}%</span>
                </div>
                <div className={`w-full h-3 ${colors.bg.tertiary} rounded-full overflow-hidden mb-1`}>
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <p className={`${colors.text.tertiary} text-xs`}>Due: {goal.deadline}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Recent Reviews</h2>

          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <div key={idx} className="p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <p className={`${colors.text.primary} font-semibold`}>{review.reviewer}</p>
                  <span className="text-yellow-400">{'⭐'.repeat(review.rating)}</span>
                </div>
                <p className={`${colors.text.secondary} text-sm mb-2`}>{review.feedback}</p>
                <p className={colors.text.muted}>{review.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
