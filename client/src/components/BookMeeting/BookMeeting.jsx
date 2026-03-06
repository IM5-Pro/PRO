/**
 * BookMeeting Component
 * Allows managers to schedule meetings with team members
 * Features: Member selection, time slot picker, validation, interactive UI
 * 
 * @component
 * @example
 * <BookMeeting 
 *   teamMembers={members}
 *   onBooking={handleBooking}
 * />
 */

import React, { useState } from 'react';
import { FiSearch, FiClock, FiCalendar, FiX, FiCheck } from 'react-icons/fi';

/**
 * Sample team colleagues data
 * @type {Array}
 */
const COLLEAGUES = [
  { id: 1, name: 'Sarah Johnson', avatar: '👩‍💼', status: 'available' },
  { id: 2, name: 'Mike Chen', avatar: '👨‍💻', status: 'available' },
  { id: 3, name: 'Emma Davis', avatar: '👩‍🎨', status: 'busy' },
  { id: 4, name: 'David Wilson', avatar: '👨‍🔬', status: 'available' },
  { id: 5, name: 'Lisa Anderson', avatar: '👩‍💼', status: 'available' },
  { id: 6, name: 'James Miller', avatar: '👨‍💼', status: 'busy' },
];

/**
 * Available time slots for meetings
 * @type {Array<string>}
 */
const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
];

/**
 * Validation rules and error messages
 * @type {Object}
 */
const VALIDATION_RULES = {
  selectedColleagues: {
    minLength: 1,
    message: 'Please select at least one colleague',
  },
  selectedDate: {
    required: true,
    message: 'Please select a date',
  },
  selectedTime: {
    required: true,
    message: 'Please select a time',
  },
};

/**
 * BookMeeting Component
 * Enables managers to schedule meetings with team members
 * 
 * @param {Object} props - Component props
 * @param {Array} props.colleagues - List of available colleagues
 * @param {Function} props.onBooking - Callback when meeting is booked
 * @returns {JSX.Element} Book meeting component
 */
const BookMeeting = ({
  colleagues = COLLEAGUES,
  onBooking = () => {},
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColleagues, setSelectedColleagues] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [errors, setErrors] = useState({});
  const [bookingSuccess, setBookingSuccess] = useState(false);

  /**
   * Filter colleagues based on search query
   * @returns {Array} Filtered colleagues
   */
  const filteredColleagues = colleagues.filter((colleague) =>
    colleague.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Toggle colleague selection
   * @param {number} colleagueId - ID of colleague to toggle
   */
  const toggleColleagueSelection = (colleagueId) => {
    setSelectedColleagues((prev) =>
      prev.includes(colleagueId)
        ? prev.filter((id) => id !== colleagueId)
        : [...prev, colleagueId]
    );
    // Clear error when user selects a colleague
    if (errors.selectedColleagues) {
      setErrors((prev) => ({ ...prev, selectedColleagues: '' }));
    }
  };

  /**
   * Validate form data
   * @returns {boolean} True if all validations pass
   */
  const validateForm = () => {
    const newErrors = {};

    if (selectedColleagues.length < VALIDATION_RULES.selectedColleagues.minLength) {
      newErrors.selectedColleagues = VALIDATION_RULES.selectedColleagues.message;
    }

    if (!selectedDate) {
      newErrors.selectedDate = VALIDATION_RULES.selectedDate.message;
    }

    if (!selectedTime) {
      newErrors.selectedTime = VALIDATION_RULES.selectedTime.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle meeting booking
   * Validates form and calls onBooking callback
   */
  const handleBookMeeting = async () => {
    if (!validateForm()) return;

    const bookingData = {
      colleagues: selectedColleagues.map((id) =>
        colleagues.find((c) => c.id === id)
      ),
      date: selectedDate,
      time: selectedTime,
    };

    // Simulate API call
    await onBooking(bookingData);

    // Show success message
    setBookingSuccess(true);

    // Reset form after 2 seconds
    setTimeout(() => {
      setSelectedColleagues([]);
      setSelectedDate('');
      setSelectedTime('');
      setBookingSuccess(false);
    }, 2000);
  };

  /**
   * Get today's date in YYYY-MM-DD format
   * @returns {string} Today's date
   */
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  /**
   * Get selected colleagues display text
   * @returns {string} Formatted colleagues string
   */
  const getSelectedColleaguesText = () => {
    if (selectedColleagues.length === 0) return 'Select colleagues';
    if (selectedColleagues.length === 1) return '1 selected';
    return `${selectedColleagues.length} selected`;
  };

  return (
    <div className="card w-full max-w-md">
      {/* Header */}
      <h2 className="text-xl font-bold text-gray-800 mb-6">Book 1 on 1</h2>

      {/* Success Message */}
      {bookingSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <FiCheck className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-green-700 font-semibold">Meeting scheduled successfully!</p>
        </div>
      )}

      {/* Colleagues Selection Section */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          Colleagues <span className="text-red-500">*</span>
        </label>

        {/* Search Input */}
        <div className="relative mb-3">
          <FiSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Find people with '@'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
              ${
                errors.selectedColleagues
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            aria-label="Search colleagues"
          />
        </div>

        {/* Colleagues List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredColleagues.length > 0 ? (
            filteredColleagues.map((colleague) => (
              <button
                key={colleague.id}
                onClick={() => toggleColleagueSelection(colleague.id)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200
                  ${
                    selectedColleagues.includes(colleague.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }
                `}
              >
                {/* Checkbox */}
                <div
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                    transition-all duration-200
                    ${
                      selectedColleagues.includes(colleague.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }
                  `}
                >
                  {selectedColleagues.includes(colleague.id) && (
                    <FiCheck size={14} className="text-white" />
                  )}
                </div>

                {/* Avatar and Name */}
                <span className="text-2xl flex-shrink-0">{colleague.avatar}</span>

                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {colleague.name}
                  </p>
                  {/* Status indicator */}
                  <p className="text-xs text-gray-600">
                    {colleague.status === 'available' ? (
                      <span className="text-green-600 font-semibold">● Available</span>
                    ) : (
                      <span className="text-red-600 font-semibold">● Busy</span>
                    )}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="py-4 text-center text-gray-500">
              <p className="text-sm">No colleagues found</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {errors.selectedColleagues && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <FiX size={14} />
            {errors.selectedColleagues}
          </p>
        )}

        {/* Selected Count */}
        {selectedColleagues.length > 0 && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-700">
              {getSelectedColleaguesText()}
            </p>
          </div>
        )}
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          <FiCalendar size={14} className="inline mr-2" />
          Select Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            if (errors.selectedDate) {
              setErrors((prev) => ({ ...prev, selectedDate: '' }));
            }
          }}
          min={getTodayDate()}
          className={`
            w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
            ${
              errors.selectedDate
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }
          `}
          aria-label="Select meeting date"
        />

        {/* Error Message */}
        {errors.selectedDate && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <FiX size={14} />
            {errors.selectedDate}
          </p>
        )}
      </div>

      {/* Time Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          <FiClock size={14} className="inline mr-2" />
          Select Time <span className="text-red-500">*</span>
        </label>

        {/* Time Slots Grid */}
        <div className="grid grid-cols-2 gap-2">
          {TIME_SLOTS.map((timeSlot) => (
            <button
              key={timeSlot}
              onClick={() => {
                setSelectedTime(timeSlot);
                if (errors.selectedTime) {
                  setErrors((prev) => ({ ...prev, selectedTime: '' }));
                }
              }}
              className={`
                py-2 px-3 rounded-lg border-2 text-sm font-semibold transition-all duration-200
                ${
                  selectedTime === timeSlot
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {timeSlot}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {errors.selectedTime && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <FiX size={14} />
            {errors.selectedTime}
          </p>
        )}
      </div>

      {/* Book Button */}
      <button
        onClick={handleBookMeeting}
        disabled={bookingSuccess}
        className={`
          w-full py-3 rounded-lg font-bold transition-all duration-300
          ${
            bookingSuccess
              ? 'bg-green-500 text-white cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 active:scale-95 text-white'
          }
        `}
      >
        {bookingSuccess ? '✓ Meeting Scheduled' : 'Book a Meeting'}
      </button>
    </div>
  );
};

export default BookMeeting;
