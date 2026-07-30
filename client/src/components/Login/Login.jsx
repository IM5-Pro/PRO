/**
 * Login Component
 * Secure authentication page for user login
 * Validates credentials with reusable components
 * 
 * @component
 * @example
 * <Login onLoginSuccess={handleSuccess} />
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../api/client';
import { AUTH_ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../Auth/AuthLayout';
import FormInput from '../Auth/FormInput';
import SubmitButton from '../Auth/SubmitButton';
import AlertMessage from '../Auth/AlertMessage';
import { createPortal } from 'react-dom';
import { LOGOUT_REASON_IDLE, LOGOUT_REASON_KEY } from '../../constants/session';
import { normalizeRole, ROLES } from '../../utils/roles';

const PUNCH_ROLES = [ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR_ADMIN];

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
  const [sessionInfo, setSessionInfo] = useState('');
  const [activeRecovery, setActiveRecovery] = useState(null);

  // Forgot username state
  const [forgotUsernameEmail, setForgotUsernameEmail] = useState('');
  const [forgotUsernameLoading, setForgotUsernameLoading] = useState(false);
  const [forgotUsernameError, setForgotUsernameError] = useState('');
  const [forgotUsernameSuccess, setForgotUsernameSuccess] = useState('');
  const [, setForgotUsernameHint] = useState('');
  const [forgotUsernameValue, setForgotUsernameValue] = useState('');

  // Forgot password and reset state
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');
  const [showInitialPasswordSetup, setShowInitialPasswordSetup] = useState(false);
  const [initialPassword, setInitialPassword] = useState('');
  const [initialConfirmPassword, setInitialConfirmPassword] = useState('');
  const [initialPasswordLoading, setInitialPasswordLoading] = useState(false);
  const [initialPasswordError, setInitialPasswordError] = useState('');
  const [initialPasswordSuccess, setInitialPasswordSuccess] = useState('');

  // navigation - ensure we leave the login page after a successful sign-in
  const navigate = useNavigate();
  const location = useLocation();

  // authentication helper
  const { isAuthenticated, user: currentUser, login, logout, updateCurrentUser } = useAuth();

  const getRedirectPath = () => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect') || '/';

    if (!redirect.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/login')) {
      return '/';
    }

    return redirect;
  };

  // Punch-required roles land on /punch first so a restored ?page= deep link
  // cannot skip the attendance screen after login.
  const getPostLoginPath = (authenticatedUser) => {
    const role = normalizeRole(authenticatedUser?.role);
    if (PUNCH_ROLES.includes(role)) {
      return '/punch';
    }

    return getRedirectPath();
  };

  useEffect(() => {
    if (isAuthenticated && currentUser?.mustChangePassword) {
      setShowInitialPasswordSetup(true);
    }
  }, [currentUser?.mustChangePassword, isAuthenticated]);

  useEffect(() => {
    try {
      const reason = sessionStorage.getItem(LOGOUT_REASON_KEY);
      if (reason === LOGOUT_REASON_IDLE) {
        setSessionInfo('You were signed out after 15 minutes of inactivity.');
        sessionStorage.removeItem(LOGOUT_REASON_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  /**
   * Validate email format
   * @param {string} emailValue - Email to validate
   * @returns {string} - Error message or empty string
   */
  const validateEmail = (emailValue) => {
    if (!emailValue.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[A-Za-z0-9._%+-]+@ispace\.com$/i;
    if (!emailRegex.test(emailValue)) {
      return 'Email must be a valid @ispace.com address';
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
   * Handle email change - validation only on submit
   */
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
  };

  /**
   * Handle password change - validation only on submit
   */
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
  };

  const validateNewAccountPassword = (passwordValue) => {
    if (!passwordValue.trim()) {
      return 'Password is required';
    }

    const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPattern.test(passwordValue)) {
      return 'Password must be 8+ chars with uppercase, lowercase, number, and special character';
    }

    return '';
  };

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
      const authenticatedUser = await login(email, password);

      setEmail('');
      setPassword('');

      if (authenticatedUser?.mustChangePassword) {
        setShowInitialPasswordSetup(true);
        return;
      }

      setSuccess(true);

      // Punch roles go straight to /punch; other roles keep their redirect.
      navigate(getPostLoginPath(authenticatedUser), { replace: true });

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

  const resetRecoveryState = () => {
    setForgotUsernameEmail('');
    setForgotUsernameError('');
    setForgotUsernameSuccess('');
    setForgotUsernameHint('');
    setForgotUsernameValue('');

    setForgotPasswordEmail('');
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setResetPasswordError('');
    setResetPasswordSuccess('');
  };

  const openRecovery = (type) => {
    resetRecoveryState();
    setActiveRecovery(type);
  };

  const closeRecovery = () => {
    setActiveRecovery(null);
    resetRecoveryState();
  };

  const handleInitialPasswordSetup = async (e) => {
    e.preventDefault();
    setInitialPasswordError('');
    setInitialPasswordSuccess('');

    const passwordValidation = validateNewAccountPassword(initialPassword);
    if (passwordValidation) {
      setInitialPasswordError(passwordValidation);
      return;
    }

    if (initialPassword !== initialConfirmPassword) {
      setInitialPasswordError('Password and confirm password must match');
      return;
    }

    setInitialPasswordLoading(true);
    try {
      await API.post(AUTH_ENDPOINTS.completeInitialPassword, {
        password: initialPassword,
        confirmPassword: initialConfirmPassword,
      });

      updateCurrentUser({ mustChangePassword: false });
      setInitialPassword('');
      setInitialConfirmPassword('');
      setInitialPasswordSuccess('Password created successfully. Redirecting to dashboard...');
      setSuccess(true);

      setTimeout(() => {
        setShowInitialPasswordSetup(false);
        navigate(getPostLoginPath(currentUser), { replace: true });
      }, 500);
    } catch (err) {
      setInitialPasswordError(err?.response?.data?.message || err?.message || 'Failed to create password');
    } finally {
      setInitialPasswordLoading(false);
    }
  };

  const handleForgotUsernameSubmit = async (e) => {
    e.preventDefault();
    setForgotUsernameError('');
    setForgotUsernameSuccess('');
    setForgotUsernameHint('');
    setForgotUsernameValue('');

    if (!forgotUsernameEmail.trim()) {
      setForgotUsernameError('Phone number is required');
      return;
    }

    setForgotUsernameLoading(true);
    try {
      const response = await API.post(AUTH_ENDPOINTS.forgotUsername, {
        phoneNumber: forgotUsernameEmail.trim(),
      });

      const payload = response?.data || {};
      const responseData = payload?.data || {};
      setForgotUsernameSuccess(payload?.message || 'Email ID details were sent successfully');
      setForgotUsernameHint(responseData?.usernameHint || '');
      setForgotUsernameValue(responseData?.username || '');
    } catch (err) {
      setForgotUsernameError(err?.response?.data?.message || err?.message || 'Failed to process forgot email ID request');
    } finally {
      setForgotUsernameLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess('');

    const emailValidation = validateEmail(forgotPasswordEmail);
    if (emailValidation) {
      setForgotPasswordError(emailValidation);
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await API.post(AUTH_ENDPOINTS.forgotPassword, {
        email: forgotPasswordEmail.trim().toLowerCase(),
      });

      const payload = response?.data || {};
      const responseData = payload?.data || {};
      setForgotPasswordSuccess(payload?.message || 'Password reset instructions sent');

      if (responseData?.resetToken) {
        setResetToken(responseData.resetToken);
      }
    } catch (err) {
      setForgotPasswordError(err?.response?.data?.message || err?.message || 'Failed to process forgot password request');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetPasswordError('');
    setResetPasswordSuccess('');

    if (!resetToken.trim()) {
      setResetPasswordError('Reset token is required');
      return;
    }

    if (newPassword.length < 8) {
      setResetPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetPasswordError('Passwords do not match');
      return;
    }

    setResetPasswordLoading(true);
    try {
      const response = await API.post(AUTH_ENDPOINTS.resetPassword, {
        resetToken: resetToken.trim(),
        password: newPassword,
      });

      const payload = response?.data || {};
      setResetPasswordSuccess(payload?.message || 'Password reset successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setResetPasswordError(err?.response?.data?.message || err?.message || 'Failed to reset password');
    } finally {
      setResetPasswordLoading(false);
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

      {/* Idle session alert */}
      {sessionInfo && !success && (
        <AlertMessage
          type="info"
          title="Session ended"
          message={sessionInfo}
          onClose={() => setSessionInfo('')}
          closable={true}
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
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <FormInput
            label=""
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            error={emailError}
            disabled={isLoading}
          />

          {/* Password Input */}
          <FormInput
            label=""
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter your password"
            error={passwordError}
            disabled={isLoading}
          />

          {/* Submit Button */}
          <SubmitButton
            label="Login"
            isLoading={isLoading}
            loadingLabel="Signing in..."
            onClick={handleSubmit}
            disabled={isLoading}
            size="lg"
          />

          {/* Account Recovery Links */}
          <div className="border-t border-gray-200 pt-5">
            {/* All Links in One Row */}
            <div className="flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => openRecovery('username')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Forgot Username?
              </button>
              <button
                type="button"
                onClick={() => openRecovery('password')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Recovery Dialog */}
      {activeRecovery &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-3 sm:p-4">
            <div className="w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {activeRecovery === 'username' ? 'Recover Email ID' : 'Recover Password'}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {activeRecovery === 'username'
                      ? 'Enter your registered phone number to recover your email ID.'
                      : 'Request a reset token and set a new password.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeRecovery}
                  className="text-slate-500 hover:text-slate-700 text-sm font-semibold"
                >
                  Close
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                {activeRecovery === 'username' && (
                  <form onSubmit={handleForgotUsernameSubmit} className="space-y-4">
                    {forgotUsernameError && (
                      <AlertMessage
                        type="error"
                        title="Recovery Failed"
                        message={forgotUsernameError}
                        onClose={() => setForgotUsernameError('')}
                      />
                    )}

                    {forgotUsernameSuccess && (
                      <AlertMessage
                        type="success"
                        title="Request Processed"
                        message={forgotUsernameSuccess}
                        onClose={() => setForgotUsernameSuccess('')}
                      />
                    )}

                    <FormInput
                      label="Phone Number"
                      type="text"
                      id="forgot-username-phone"
                      value={forgotUsernameEmail}
                      onChange={(e) => setForgotUsernameEmail(e.target.value)}
                      placeholder="Enter phone number"
                      disabled={forgotUsernameLoading}
                    />

                    {forgotUsernameValue && (
                      <div className="text-sm text-slate-700 bg-blue-50 border border-blue-200 rounded-lg p-3 break-words">
                        Email ID: <span className="font-semibold">{forgotUsernameValue}</span>
                      </div>
                    )}

                    <SubmitButton
                      label="Recover Email ID"
                      loadingLabel="Processing..."
                      isLoading={forgotUsernameLoading}
                      disabled={forgotUsernameLoading}
                    />
                  </form>
                )}

                {activeRecovery === 'password' && (
                  <div className="space-y-5">
                    <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                      {forgotPasswordError && (
                        <AlertMessage
                          type="error"
                          title="Request Failed"
                          message={forgotPasswordError}
                          onClose={() => setForgotPasswordError('')}
                        />
                      )}

                      {forgotPasswordSuccess && (
                        <AlertMessage
                          type="success"
                          title="Request Submitted"
                          message={forgotPasswordSuccess}
                          onClose={() => setForgotPasswordSuccess('')}
                        />
                      )}

                      <FormInput
                        label="Work Email"
                        type="email"
                        id="forgot-password-email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        placeholder="name@ispace.com"
                        disabled={forgotPasswordLoading}
                      />

                      <SubmitButton
                        label="Request Reset Token"
                        loadingLabel="Requesting..."
                        isLoading={forgotPasswordLoading}
                        disabled={forgotPasswordLoading}
                      />
                    </form>

                    <div className="border-t border-slate-200 pt-5">
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        {resetPasswordError && (
                          <AlertMessage
                            type="error"
                            title="Reset Failed"
                            message={resetPasswordError}
                            onClose={() => setResetPasswordError('')}
                          />
                        )}

                        {resetPasswordSuccess && (
                          <AlertMessage
                            type="success"
                            title="Password Updated"
                            message={resetPasswordSuccess}
                            onClose={() => setResetPasswordSuccess('')}
                          />
                        )}

                        <FormInput
                          label="Reset Token"
                          type="text"
                          id="reset-token"
                          value={resetToken}
                          onChange={(e) => setResetToken(e.target.value)}
                          placeholder="Paste reset token"
                          helperText="In development, token is shown after requesting. In production, use the token from email."
                          disabled={resetPasswordLoading}
                        />

                        <FormInput
                          label="New Password"
                          type="password"
                          id="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          helperText="Must be at least 8 characters and include uppercase, lowercase, number, and symbol."
                          disabled={resetPasswordLoading}
                        />

                        <FormInput
                          label="Confirm New Password"
                          type="password"
                          id="confirm-new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          disabled={resetPasswordLoading}
                        />

                        <SubmitButton
                          label="Reset Password"
                          loadingLabel="Resetting..."
                          isLoading={resetPasswordLoading}
                          disabled={resetPasswordLoading}
                        />
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {showInitialPasswordSetup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-3 sm:p-4 md:items-center">
            <div className="w-full max-w-md max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
                <h2 className="text-xl font-bold text-slate-900">Create Your Password</h2>
                <p className="text-sm text-slate-600 mt-1">
                  You signed in with a generated temporary password. Enter your new password and confirm it to continue.
                </p>
              </div>

              <form onSubmit={handleInitialPasswordSetup} className="min-h-0 flex flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                  <div className="space-y-4">
                    {initialPasswordError && (
                      <AlertMessage
                        type="error"
                        title="Password Setup Failed"
                        message={initialPasswordError}
                        onClose={() => setInitialPasswordError('')}
                      />
                    )}

                    {initialPasswordSuccess && (
                      <AlertMessage
                        type="success"
                        title="Password Created"
                        message={initialPasswordSuccess}
                        closable={false}
                      />
                    )}

                    <FormInput
                      label="Enter Password"
                      type="password"
                      id="initial-password"
                      value={initialPassword}
                      onChange={(e) => setInitialPassword(e.target.value)}
                      placeholder="Enter new password"
                      helperText="Must be at least 8 characters and include uppercase, lowercase, number, and symbol."
                      disabled={initialPasswordLoading}
                    />

                    <FormInput
                      label="Confirm Password"
                      type="password"
                      id="initial-confirm-password"
                      value={initialConfirmPassword}
                      onChange={(e) => setInitialConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={initialPasswordLoading}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        setShowInitialPasswordSetup(false);
                        setInitialPassword('');
                        setInitialConfirmPassword('');
                        setInitialPasswordError('');
                        setInitialPasswordSuccess('');
                      }}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-300 font-medium"
                      disabled={initialPasswordLoading}
                    >
                      Sign Out
                    </button>
                    <div className="flex-1">
                      <SubmitButton
                        label="Save Password"
                        loadingLabel="Saving..."
                        isLoading={initialPasswordLoading}
                        disabled={initialPasswordLoading}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default Login;