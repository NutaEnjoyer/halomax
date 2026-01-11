export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export const setToken = (token) => {
  localStorage.setItem('access_token', token);
};

export const clearToken = () => {
  localStorage.removeItem('access_token');
};
