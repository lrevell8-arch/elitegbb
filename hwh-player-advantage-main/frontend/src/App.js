import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CoachAuthProvider, useCoachAuth } from "./context/CoachAuthContext";

// Public Pages
import IntakeForm from "./pages/IntakeForm";
import SuccessPage from "./pages/SuccessPage";

// Admin Pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import PipelineBoard from "./pages/PipelineBoard";
import PlayerDirectory from "./pages/PlayerDirectory";
import ProjectDetail from "./pages/ProjectDetail";
import AdminCoaches from "./pages/AdminCoaches";

// Coach Pages
import CoachAuth from "./pages/CoachAuth";
import CoachDashboard from "./pages/CoachDashboard";
import CoachProspectDetail from "./pages/CoachProspectDetail";
import CoachSubscription from "./pages/CoachSubscription";
import CoachMessages from "./pages/CoachMessages";
import CoachCompare from "./pages/CoachCompare";

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

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/intake" replace />} />
      <Route path="/intake" element={<IntakeForm />} />
      <Route path="/success" element={<SuccessPage />} />
      
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
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CoachAuthProvider>
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
        </CoachAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
