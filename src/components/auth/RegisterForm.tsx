// src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import { RegisterCredentials } from '../../types/auth';

const RegisterForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
    } as RegisterCredentials,
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        await dispatch(register(values)).unwrap();
        // On successful registration, redirect to login
        navigate('/login', { state: { message: 'Registration successful. Please sign in.' } });
      } catch (error) {
        // Error is handled by the auth slice
      }
    },
  });

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
        
        <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  formik.touched.name && formik.errors.name 
                    ? 'border-red-300 placeholder-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500'
                } text-gray-900 rounded-t-md focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Full name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.name && formik.errors.name ? (
                <p className="mt-2 text-sm text-red-600">{formik.errors.name}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  formik.touched.email && formik.errors.email 
                    ? 'border-red-300 placeholder-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500'
                } text-gray-900 focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email ? (
                <p className="mt-2 text-sm text-red-600">{formik.errors.email}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                    formik.touched.password && formik.errors.password 
                      ? 'border-red-300 placeholder-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500'
                  } text-gray-900 rounded-b-md focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg 
                    className="h-5 w-5 text-gray-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    {showPassword ? (
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    ) : (
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    )}
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {formik.touched.password && formik.errors.password ? (
                <p className="mt-2 text-sm text-red-600">{formik.errors.password}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-sm">
              By registering, you agree to our{' '}
              <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;