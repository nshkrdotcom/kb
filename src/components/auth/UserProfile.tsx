// src/components/auth/UserProfile.tsx
import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile, updateUserProfile } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import authService from '../../services/auth-service';

const UserProfile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);
  
  const profileFormik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
    }),
    onSubmit: async (values) => {
      await dispatch(updateUserProfile(values));
    },
  });
  
  const passwordFormik = useFormik({
    initialValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      oldPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Confirm password is required'),
    }),
    onSubmit: async (values) => {
      setPasswordError(null);
      setPasswordSuccess(false);
      
      try {
        await authService.changePassword(values.oldPassword, values.newPassword);
        setPasswordSuccess(true);
        passwordFormik.resetForm();
      } catch (err: any) {
        setPasswordError(err.message);
      }
    },
  });

  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Profile</h3>
            <p className="mt-1 text-sm text-gray-600">
              This information will be displayed publicly so be careful what you share.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={profileFormik.handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      autoComplete="name"
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        profileFormik.touched.name && profileFormik.errors.name ? 'border-red-300' : ''
                      }`}
                      value={profileFormik.values.name}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                    />
                    {profileFormik.touched.name && profileFormik.errors.name ? (
                      <p className="mt-2 text-sm text-red-600">{profileFormik.errors.name}</p>
                    ) : null}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        profileFormik.touched.email && profileFormik.errors.email ? 'border-red-300' : ''
                      }`}
                      value={profileFormik.values.email}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                    />
                    {profileFormik.touched.email && profileFormik.errors.email ? (
                      <p className="mt-2 text-sm text-red-600">{profileFormik.errors.email}</p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden sm:block" aria-hidden="true">
        <div className="py-5">
          <div className="border-t border-gray-200"></div>
        </div>
      </div>

      <div className="mt-10 sm:mt-0">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Password</h3>
              <p className="mt-1 text-sm text-gray-600">
                Update your password to keep your account secure.
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            {!changePasswordMode ? (
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <p className="text-sm text-gray-700">
                    Your password is securely stored and never shared with anyone.
                  </p>
                  <button
                    type="button"
                    onClick={() => setChangePasswordMode(true)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={passwordFormik.handleSubmit}>
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    {passwordError && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{passwordError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {passwordSuccess && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-green-700">Password updated successfully.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="oldPassword"
                          id="oldPassword"
                          autoComplete="current-password"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            passwordFormik.touched.oldPassword && passwordFormik.errors.oldPassword ? 'border-red-300' : ''
                          }`}
                          value={passwordFormik.values.oldPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                        />
                        {passwordFormik.touched.oldPassword && passwordFormik.errors.oldPassword ? (
                          <p className="mt-2 text-sm text-red-600">{passwordFormik.errors.oldPassword}</p>
                        ) : null}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          autoComplete="new-password"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            passwordFormik.touched.newPassword && passwordFormik.errors.newPassword ? 'border-red-300' : ''
                          }`}
                          value={passwordFormik.values.newPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                        />
                        {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword ? (
                          <p className="mt-2 text-sm text-red-600">{passwordFormik.errors.newPassword}</p>
                        ) : null}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          autoComplete="new-password"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword ? 'border-red-300' : ''
                          }`}
                          value={passwordFormik.values.confirmPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                        />
                        {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword ? (
                          <p className="mt-2 text-sm text-red-600">{passwordFormik.errors.confirmPassword}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setChangePasswordMode(false);
                        passwordFormik.resetForm();
                        setPasswordError(null);
                        setPasswordSuccess(false);
                      }}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;