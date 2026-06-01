

import api from './axios';

/**
 * @param {{ first_name, last_name, email, password, confirm_password }} data
 */
export const register = (data) => api.post('/auth/register/', data);

/**
 * Step 2 of registration — verifies OTP, activates account, sets cookies.
 * @param {{ email, otp }} data
 */
export const registerVerify = (data) => api.post('/auth/register/verify/', data);

/**
 * Login with email and password. Sets auth cookies on success.
 * @param {{ email, password }} data
 */
export const login = (data) => api.post('/auth/login/', data);

/**
 * Send OTP to email for passwordless login.
 * @param {{ email }} data
 */
export const sendOtp = (data) => api.post('/auth/otp/send/', data);

/**
 * Verify OTP for passwordless login. Sets auth cookies on success.
 * @param {{ email, otp }} data
 */
export const verifyOtp = (data) => api.post('/auth/otp/verify/', data);


export const logout = () => api.post('/auth/logout/');


export const getMe = () => api.get('/auth/me/');