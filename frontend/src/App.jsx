import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Templates from './pages/Templates';
import StartCall from './pages/StartCall';
import CallStatus from './pages/CallStatus';
import Analytics from './pages/Analytics';

function PrivateRoute({ children }) {
  return isAuthenticated() ? (
    <>
      <Navigation />
      {children}
    </>
  ) : (
    <Navigate to="/login" />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <StartCall />
            </PrivateRoute>
          }
        />
        <Route
          path="/start-call"
          element={
            <PrivateRoute>
              <StartCall />
            </PrivateRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <PrivateRoute>
              <Templates />
            </PrivateRoute>
          }
        />
        <Route
          path="/call-status/:callId"
          element={
            <PrivateRoute>
              <CallStatus />
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <Analytics />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
