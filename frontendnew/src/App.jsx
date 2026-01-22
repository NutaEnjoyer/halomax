import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import StartCall from './pages/StartCall';
import Templates from './pages/Templates';
import CallStatus from './pages/CallStatus';
import Analytics from './pages/Analytics';
import InboundSettings from './pages/InboundSettings';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <StartCall />
          </ProtectedRoute>
        }
      />
      <Route
        path="/start-call"
        element={
          <ProtectedRoute>
            <StartCall />
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute>
            <Templates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/call-status/:callId"
        element={
          <ProtectedRoute>
            <CallStatus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inbound-settings"
        element={
          <ProtectedRoute>
            <InboundSettings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
