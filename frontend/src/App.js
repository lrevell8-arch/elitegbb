import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CoachAuthProvider, useCoachAuth } from "./context/CoachAuthContext";
import { PlayerAuthProvider, usePlayerAuth } from "./context/PlayerAuthContext";

// Public Pages
import Landing from "./pages/Landing";
import IntakeForm from "./pages/IntakeForm";
import SuccessPage from "./pages/SuccessPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Admin Pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import PipelineBoard from "./pages/PipelineBoard";
import PlayerDirectory from "./pages/PlayerDirectory";
import ProjectDetail from "./pages/ProjectDetail";
import PlayerEvaluation from "./pages/PlayerEvaluation";
import AdminCoaches from "./pages/AdminCoaches";

// Coach Pages
import CoachAuth from "./pages/CoachAuth";
import CoachDashboard from "./pages/CoachDashboard";
import CoachProspectDetail from "./pages/CoachProspectDetail";
import CoachSubscription from "./pages/CoachSubscription";
import CoachMessages from "./pages/CoachMessages";
import CoachCompare from "./pages/CoachCompare";

// Player Pages
import PlayerLogin from "./pages/PlayerLogin";
import PlayerPortal from "./pages/PlayerPortal";

// Protected Route for Admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

// Protected Route for Coach
const CoachRoute = ({ children }) => {
  const { isAuthenticated, loading } = useCoachAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/coach/login" replace />;
  }
  
  return children;
};

// Protected Route for Player
const PlayerRoute = ({ children }) => {
  const { isAuthenticated, loading } = usePlayerAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/player/login" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/intake" element={<IntakeForm />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/pipeline"
        element={
          <AdminRoute>
            <PipelineBoard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/players"
        element={
          <AdminRoute>
            <PlayerDirectory />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/projects/:projectId"
        element={
          <AdminRoute>
            <ProjectDetail />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/projects/:projectId/evaluation"
        element={
          <AdminRoute>
            <PlayerEvaluation />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/coaches"
        element={
          <AdminRoute>
            <AdminCoaches />
          </AdminRoute>
        }
      />
      
      {/* Coach Routes */}
      <Route path="/coach/login" element={<CoachAuth />} />
      <Route
        path="/coach"
        element={
          <CoachRoute>
            <CoachDashboard />
          </CoachRoute>
        }
      />
      <Route
        path="/coach/prospect/:playerId"
        element={
          <CoachRoute>
            <CoachProspectDetail />
          </CoachRoute>
        }
      />
      <Route
        path="/coach/subscription"
        element={
          <CoachRoute>
            <CoachSubscription />
          </CoachRoute>
        }
      />
      <Route
        path="/coach/subscription/success"
        element={
          <CoachRoute>
            <CoachSubscription />
          </CoachRoute>
        }
      />
      <Route
        path="/coach/messages"
        element={
          <CoachRoute>
            <CoachMessages />
          </CoachRoute>
        }
      />
      <Route
        path="/coach/compare"
        element={
          <CoachRoute>
            <CoachCompare />
          </CoachRoute>
        }
      />

      {/* Player Routes */}
      <Route path="/player/login" element={<PlayerLogin />} />
      <Route
        path="/player"
        element={
          <PlayerRoute>
            <PlayerPortal />
          </PlayerRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CoachAuthProvider>
          <PlayerAuthProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#121212',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                },
              }}
            />
          </PlayerAuthProvider>
        </CoachAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
