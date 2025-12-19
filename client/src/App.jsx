// App.jsx - UPDATED
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';

// Import components
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load other components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SiteList = lazy(() => import('./pages/Sites/SiteList'));
const CreateSite = lazy(() => import('./pages/Sites/CreateSite'));
const EditSite = lazy(() => import('./pages/Sites/EditSite'));
const SiteDetails = lazy(() => import('./pages/Sites/SiteDetails'));
const ReportList = lazy(() => import('./pages/Reports/ReportList'));
const CreateReport = lazy(() => import('./pages/Reports/CreateReport'));
const AdminReports = lazy(() => import('./pages/Reports/AdminReports'));
const ReportDetails = lazy(() => import('./pages/Reports/ReportDetails'));
const ReportReview = lazy(() => import('./pages/Reports/ReportReview'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Resources = lazy(() => import('./pages/Resources'));
const Notifications = lazy(() => import('./pages/Notifications'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
          </div>
        }>
          <Routes>
            {/* Public routes - accessible to everyone */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes - All authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Sites */}
              <Route path="/sites" element={<SiteList />} />
              <Route path="/engineer/sites" element={<SiteList engineerView={true} />} />
              <Route path="/sites/create" element={<CreateSite />} />
              <Route path="/sites/edit/:id" element={<EditSite />} />
              <Route path="/sites/:id" element={<SiteDetails />} />
              
              {/* Reports */}
              <Route path="/reports" element={<ReportList />} />
              <Route path="/engineer/reports" element={<ReportList engineerView={true} />} />
              <Route path="/reports/create" element={<CreateReport />} />
              <Route path="/reports/:id" element={<ReportDetails />} />
              <Route path="/reports/:id/edit" element={<CreateReport />} />
              
              {/* Other */}
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/resources" element={<Resources />} /> 
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            {/* Admin only routes */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/reports/:id/review" element={<ReportReview />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;