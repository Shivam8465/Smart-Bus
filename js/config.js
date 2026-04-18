// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth header
function getAuthHeader() {
  const token = localStorage.getItem('sbf_token');
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Helper function to save login response
function saveLoginData(data) {
  localStorage.setItem('sbf_token', data.token);
  localStorage.setItem('sbf_user',  JSON.stringify(data.user));
  localStorage.setItem('sbf_role',  data.user.role);
}

// Helper function to clear login data
function clearLoginData() {
  localStorage.removeItem('sbf_token');
  localStorage.removeItem('sbf_user');
  localStorage.removeItem('sbf_role');
}

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('sbf_token') !== null;
}