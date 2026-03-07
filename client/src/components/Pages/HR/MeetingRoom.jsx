/**
 * MeetingRoom Component
 * Meeting room booking and management interface
 * Features: Room booking, availability calendar, equipment management, reservations
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 */

import React, { useMemo, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { FiPlus, FiCalendar, FiMapPin, FiUsers, FiClock } from 'react-icons/fi';

/**
 * Validation constants for meeting room bookings
 */
const VALIDATION_RULES = {
  MIN_DURATION: 30,
  MAX_DURATION: 480,
  MIN_CAPACITY: 1,
  MAX_CAPACITY: 100,
};

/**
 * MeetingRoom Component
 * Full-featured meeting room booking system
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {Object} props.pageConfig - Page configuration
 * @param {Function} props.onUserUpdate - Callback for user updates
 * @returns {JSX.Element} Meeting room management interface
 */
const MeetingRoom = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState('2024-03-07');
  const [selectedRoom, setSelectedRoom] = useState(null);

  // ============================================================================
  // MOCKED DATA
  // ============================================================================

  const meetingRooms = useMemo(
    () => [
      {
        id: 1,
        name: 'Conference Hall A',
        capacity: 50,
        floor: '1st Floor',
        equipment: ['Projector', 'Whiteboard', 'Video Conferencing'],
        availability: 'Available',
        bookings: [
          { id: 1, title: 'Team Meeting', time: '10:00 - 11:00', organizer: 'Rajesh Kumar' },
          { id: 2, title: 'Client Discussion', time: '14:00 - 15:30', organizer: 'Priya Singh' },
        ],
      },
      {
        id: 2,
        name: 'Meeting Room B',
        capacity: 12,
        floor: '2nd Floor',
        equipment: ['TV Screen', 'Phone'],
        availability: 'Available',
        bookings: [
          { id: 3, title: 'Department Sync', time: '09:00 - 09:30', organizer: 'Amit Patel' },
        ],
      },
      {
        id: 3,
        name: 'Executive Suite',
        capacity: 20,
        floor: '3rd Floor',
        equipment: ['Projector', 'Video Conferencing', 'Refreshments'],
        availability: 'Booked',
        bookings: [
          { id: 4, title: 'Board Meeting', time: '11:00 - 12:30', organizer: 'CEO' },
        ],
      },
      {
        id: 4,
        name: 'Training Room',
        capacity: 30,
        floor: '1st Floor',
        equipment: ['Projector', 'Audio System', 'Whiteboard'],
        availability: 'Available',
        bookings: [
          { id: 5, title: 'Skill Development', time: '15:00 - 17:00', organizer: 'HR Team' },
        ],
      },
    ],
    []
  );

  const myBookings = useMemo(
    () => [
      {
        id: 1,
        roomName: 'Conference Hall A',
        date: '2024-03-08',
        time: '10:00 - 11:30',
        attendees: 15,
        status: 'Confirmed',
        purpose: 'Client Presentation',
      },
      {
        id: 2,
        roomName: 'Meeting Room B',
        date: '2024-03-10',
        time: '14:00 - 14:30',
        attendees: 5,
        status: 'Confirmed',
        purpose: 'Team Standup',
      },
      {
        id: 3,
        roomName: 'Training Room',
        date: '2024-03-12',
        time: '09:00 - 11:00',
        attendees: 25,
        status: 'Pending',
        purpose: 'Technical Training',
      },
    ],
    []
  );

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  /**
   * Validate booking duration
   */
  const validateDuration = (duration) => {
    if (duration < VALIDATION_RULES.MIN_DURATION || duration > VALIDATION_RULES.MAX_DURATION) {
      return {
        isValid: false,
        error: `Duration must be between ${VALIDATION_RULES.MIN_DURATION} and ${VALIDATION_RULES.MAX_DURATION} minutes`,
      };
    }
    return { isValid: true, error: null };
  };

  /**
   * Validate attendee count
   */
  const validateAttendeeCount = (count, roomCapacity) => {
    if (count < VALIDATION_RULES.MIN_CAPACITY) {
      return {
        isValid: false,
        error: 'At least 1 attendee is required',
      };
    }
    if (count > roomCapacity) {
      return {
        isValid: false,
        error: `Attendees cannot exceed room capacity of ${roomCapacity}`,
      };
    }
    return { isValid: true, error: null };
  };

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.gradient.primary} p-6 md:p-8`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
            📞 Meeting Room Management
          </h1>
          <p className={colors.text.tertiary}>Book and manage meeting rooms</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2">
          <FiPlus size={20} />
          Book Room
        </button>
      </div>

      {/* Available Rooms */}
      <div className="mb-8">
        <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Available Rooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meetingRooms.map((room) => (
            <div
              key={room.id}
              className={`group bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer`}
              onClick={() => setSelectedRoom(room.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${colors.text.primary}`}>{room.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`${colors.text.tertiary} text-sm flex items-center gap-1`}>
                      <FiMapPin size={14} /> {room.floor}
                    </span>
                    <span className={`${colors.text.tertiary} text-sm flex items-center gap-1`}>
                      <FiUsers size={14} /> {room.capacity} capacity
                    </span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    room.availability === 'Available'
                      ? 'bg-green-600/20 text-green-300'
                      : 'bg-red-600/20 text-red-300'
                  }`}
                >
                  {room.availability}
                </span>
              </div>

              {/* Equipment */}
              <div className="mb-4 pb-4 border-b border-slate-700">
                <p className={`${colors.text.tertiary} text-xs font-semibold mb-2`}>Equipment:</p>
                <div className="flex flex-wrap gap-2">
                  {room.equipment.map((item) => (
                    <span key={item} className={`px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bookings Today */}
              <div className="space-y-2">
                {room.bookings.map((booking) => (
                  <div key={booking.id} className={`flex items-center justify-between p-2 ${colors.bg.tertiary}/30 rounded`}>
                    <div className="flex-1">
                      <p className={`${colors.text.primary} text-sm font-medium`}>{booking.title}</p>
                      <p className={`${colors.text.muted} text-xs`}>{booking.time}</p>
                    </div>
                    <FiClock size={14} className={colors.text.tertiary} />
                  </div>
                ))}
              </div>

              {/* Book Button */}
              <button className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all">
                Book This Room
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* My Bookings */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}>
        <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>My Bookings</h2>
        <div className="space-y-4">
          {myBookings.map((booking) => (
            <div
              key={booking.id}
              className={`flex items-center justify-between p-4 ${colors.bg.tertiary}/30 border ${colors.border.secondary} rounded-lg hover:${colors.bg.tertiary}/50 transition-all`}
            >
              <div>
                <p className={`${colors.text.primary} font-semibold`}>{booking.roomName}</p>
                <p className={`${colors.text.tertiary} text-sm mt-1`}>
                  {booking.date} • {booking.time}
                </p>
                <p className={`${colors.text.muted} text-xs mt-1`}>{booking.purpose}</p>
                <p className={`${colors.text.muted} text-xs`}>{booking.attendees} attendees</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    booking.status === 'Confirmed'
                      ? 'bg-green-600/20 text-green-300'
                      : 'bg-yellow-600/20 text-yellow-300'
                  }`}
                >
                  {booking.status}
                </span>
                <button className={`px-3 py-1 border ${colors.border.secondary} hover:border-red-500/50 text-red-400 rounded text-xs font-semibold transition-all`}>
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
export { VALIDATION_RULES };
