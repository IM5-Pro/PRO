/**
 * Login Component
 * Secure authentication page for user login
 * Validates credentials with reusable components
 * 
 * @component
 * @example
 * <Login onLoginSuccess={handleSuccess} />
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../Auth/AuthLayout';
import FormInput from '../Auth/FormInput';
import SubmitButton from '../Auth/SubmitButton';
import AlertMessage from '../Auth/AlertMessage';

/**
 * Login Component
 * Manages user authentication with email and password
 * Uses reusable auth components for form and messaging
 * 
 * @param {Object} props - Component props
 * @param {Function} [props.onLoginSuccess] - Callback after successful login
 * @returns {JSX.Element} - Login form wrapped in auth layout
 */
const Login = ({ onLoginSuccess = null }) => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState(false);

  // navigation - ensure we leave the login page after a successful sign‑in
  const navigate = useNavigate();

  // authentication helper
  const { login } = useAuth();

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
  };

  /**
   * Handle form submission
   * Validates input and attempts login
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      return;
    }

    setIsLoading(true);

    try {
      // Attempt login
      await login(email, password);

      setSuccess(true);
      setEmail('');
      setPassword('');

      // push the user off the login route so AppContent can render the
      // appropriate dashboard for their role. we navigate to the root
      // because AppContent handles role‑based routing on '/'.
      navigate('/', { replace: true });

      // Call success callback (legacy prop, still supported)
      if (onLoginSuccess) {
        setTimeout(onLoginSuccess, 500);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="HRMS" subtitle="Sign In">
      {/* Success Alert */}
      {success && (
        <AlertMessage
          type="success"
          title="Login Successful!"
          message="Redirecting to dashboard..."
          closable={false}
        />
      )}

      {/* Error Alert */}
      {error && !success && (
        <AlertMessage
          type="error"
          title="Login Failed"
          message={error}
          onClose={() => setError('')}
          closable={true}
        />
      )}

      {/* Form */}
      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <FormInput
            label="Email Address"
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            icon={FiMail}
            placeholder="user@company.com"
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
            disabled={isLoading}
          />

          {/* Submit Button */}
          <SubmitButton
            label="Sign In"
            isLoading={isLoading}
            loadingLabel="Logging in..."
            onClick={handleSubmit}
            disabled={isLoading || !!emailError || !!passwordError}
          />
        </form>
      )}
    </AuthLayout>
  );
};

export default Login;
