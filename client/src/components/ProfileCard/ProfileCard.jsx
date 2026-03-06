/**
 * ProfileCard Component
 * Displays user profile information
 */

import React from 'react';
import { FiEdit2, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

/**
 * ProfileCard Component - Shows employee profile details
 * @param {object} props - Component props
 * @param {string} props.name - Employee name
 * @param {string} props.role - Job role/position
 * @param {string} props.department - Department name
 * @param {string} props.email - Email address
 * @param {string} props.phone - Phone number
 * @param {string} props.location - Work location
 * @param {string} props.avatar - Avatar emoji or user image
 * @param {function} props.onEdit - Callback for edit button click
 * @returns {JSX.Element} - ProfileCard component
 */
const ProfileCard = ({
  name = 'John Doe',
  role = 'Senior Developer',
  department = 'Engineering',
  email = 'john@example.com',
  phone = '+1-234-567-8900',
  location = 'New York, USA',
  avatar = '👨‍💼',
  onEdit = () => {},
}) => {
  return (
    <div className="card w-full max-w-sm">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Profile</h2>
        <button
          onClick={onEdit}
          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          aria-label="Edit profile"
        >
          <FiEdit2 size={18} />
        </button>
      </div>

      {/* Avatar and Name */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-3 inline-block">{avatar}</div>
        <h3 className="text-xl font-bold text-gray-800">{name}</h3>
        <p className="text-sm text-gray-600">{role}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
          {department}
        </span>
      </div>

      {/* Contact Information */}
      <div className="space-y-3 border-t border-gray-200 pt-4">
        {/* Email */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <FiMail size={16} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium text-gray-700">{email}</p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-50 rounded-lg text-green-600">
            <FiPhone size={16} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Phone</p>
            <p className="text-sm font-medium text-gray-700">{phone}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <FiMapPin size={16} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Location</p>
            <p className="text-sm font-medium text-gray-700">{location}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-6">
        <button className="flex-1 btn-primary text-sm">
          Update Profile
        </button>
        <button className="flex-1 btn-secondary text-sm">
          Download CV
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;
