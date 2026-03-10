/**
 * Register Component
 * Secure registration page for admin registration
 * Validates credentials with reusable components
 *
 * @component
 * @example
 * <Register onRegisterSuccess={handleSuccess} />
 */

import React, { useState } from 'react';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../Auth/AuthLayout';
import FormInput from '../Auth/FormInput';
import SubmitButton from '../Auth/SubmitButton';
import AlertMessage from '../Auth/AlertMessage';

/**
 * Register Component
 * Manages admin registration with email, password, and confirm password
 * Uses reusable auth components for form and messaging
 *
 * @param {Object} props - Component props
 * @param {Function} [props.onRegisterSuccess] - Callback after successful registration
 * @returns {JSX.Element} - Register form wrapped in auth layout
 */
const Register = ({ onRegisterSuccess = null }) => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auth context
  const { registerAdmin } = useAuth();

  /**
   * Validate email format
   * @param {string} emailValue - Email to validate
   * @returns {string} - Error message or empty string
   */
  const validateEmail = (emailValue) => {
    if (!emailValue.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return 'Invalid email format';
    }
    return '';
  };

  /**
   * Validate password
   * @param {string} passwordValue - Password to validate
   * @returns {string} - Error message or empty string
   */
  const validatePassword = (passwordValue) => {
    if (!passwordValue.trim()) {
      return 'Password is required';
    }
    if (passwordValue.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  /**
   * Validate confirm password
   * @param {string} confirmPasswordValue - Confirm password to validate
   * @returns {string} - Error message or empty string
   */
  const validateConfirmPassword = (confirmPasswordValue) => {
    if (!confirmPasswordValue.trim()) {
      return 'Confirm password is required';
    }
    if (confirmPasswordValue !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  /**
   * Validate name
   * @param {string} nameValue - Name to validate
   * @returns {string} - Error message or empty string
   */
  const validateName = (nameValue) => {
    if (!nameValue.trim()) {
      return 'Name is required';
    }
    return '';
  };

  /**
   * Handle email change with validation
   */
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  /**
   * Handle password change with validation
   */
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    // Also validate confirm password if it's filled
    if (confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword));
    }
  };

  /**
   * Handle confirm password change with validation
   */
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordError(validateConfirmPassword(value));
  };

  /**
   * Handle name change with validation
   */
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    setNameError(validateName(value));
  };

  /**
   * Handle form submission
   * Validates input and attempts registration
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword);
    const nameErr = validateName(name);

    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);
    setNameError(nameErr);

    if (emailErr || passwordErr || confirmPasswordErr || nameErr) {
      return;
    }

    setIsLoading(true);

    try {
      // Attempt registration
      await registerAdmin(email, password, name);

      setSuccess(true);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');

      // Call success callback
      if (onRegisterSuccess) {
        setTimeout(onRegisterSuccess, 500);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="HRMS Admin" subtitle="Register">
      {/* Success Alert */}
      {success && (
        <AlertMessage
          type="success"
          title="Registration Successful!"
          message="Admin account created successfully. You can now login."
          closable={false}
        />
      )}

      {/* Error Alert */}
      {error && !success && (
        <AlertMessage
          type="error"
          title="Registration Failed"
          message={error}
          onClose={() => setError('')}
          closable={true}
        />
      )}

      {/* Form */}
      {!success && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Input */}
          <FormInput
            label="Full Name"
            type="text"
            id="name"
            value={name}
            onChange={handleNameChange}
            icon={FiUser}
            placeholder="John Doe"
            error={nameError}
            disabled={isLoading}
          />

          {/* Email Input */}
          <FormInput
            label="Email Address"
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            icon={FiMail}
            placeholder="admin@company.com"
            error={emailError}
            disabled={isLoading}
          />

          {/* Password Input */}
          <FormInput
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            icon={FiLock}
            placeholder="••••••••"
            error={passwordError}
            helperText="Minimum 6 characters"
            disabled={isLoading}
          />

          {/* Confirm Password Input */}
          <FormInput
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            icon={FiLock}
            placeholder="••••••••"
            error={confirmPasswordError}
            disabled={isLoading}
          />

          {/* Submit Button */}
          <SubmitButton
            label="Register Admin"
            isLoading={isLoading}
            loadingLabel="Registering..."
            onClick={handleSubmit}
            disabled={isLoading || !!emailError || !!passwordError || !!confirmPasswordError || !!nameError}
          />
        </form>
      )}
    </AuthLayout>
  );
};

export default Register;