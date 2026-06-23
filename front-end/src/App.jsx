import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PageLayout from "./components/layout/PageLayout";

import SplashScreen from "./pages/SplashScreen";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import FarmerDashboard from "./pages/farmer/Dashboard";
import MyCrops from "./pages/farmer/MyCrops";
import PurchaseRequests from "./pages/farmer/PurchaseRequests";
import BuyerRequirements from "./pages/farmer/BuyerRequirements";
import FarmerBookings from "./pages/farmer/MyBookings";
import FlashSales from "./pages/farmer/FlashSales";

import Marketplace from "./pages/buyer/Marketplace";
import MyRequests from "./pages/buyer/MyRequests";
import MyRequirementsBuyer from "./pages/buyer/MyRequirements";
import BuyerBookings from "./pages/buyer/MyBookings";

import Chat from "./pages/shared/Chat";
import Notifications from "./pages/shared/Notifications";

import AdminDashboard from "./pages/admin/Dashboard";
import Farmers from "./pages/admin/Farmers";
import Buyers from "./pages/admin/Buyers";
import Analytics from "./pages/admin/Analytics";

import NotFound from "./pages/NotFound";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/home" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/farmer/dashboard" element={<ProtectedRoute allowedRole="farmer"><PageLayout><FarmerDashboard /></PageLayout></ProtectedRoute>} />
      <Route path="/farmer/crops" element={<ProtectedRoute allowedRole="farmer"><PageLayout><MyCrops /></PageLayout></ProtectedRoute>} />
      <Route path="/farmer/requests" element={<ProtectedRoute allowedRole="farmer"><PageLayout><PurchaseRequests /></PageLayout></ProtectedRoute>} />
      <Route path="/farmer/requirements" element={<ProtectedRoute allowedRole="farmer"><PageLayout><BuyerRequirements /></PageLayout></ProtectedRoute>} />
      <Route path="/farmer/bookings" element={<ProtectedRoute allowedRole="farmer"><PageLayout><FarmerBookings /></PageLayout></ProtectedRoute>} />
      <Route path="/farmer/flash-sales" element={<ProtectedRoute allowedRole="farmer"><PageLayout><FlashSales /></PageLayout></ProtectedRoute>} />

      <Route path="/buyer/marketplace" element={<PageLayout><Marketplace /></PageLayout>} />
      <Route path="/buyer/requests" element={<ProtectedRoute allowedRole="buyer"><PageLayout><MyRequests /></PageLayout></ProtectedRoute>} />
      <Route path="/buyer/requirements" element={<ProtectedRoute allowedRole="buyer"><PageLayout><MyRequirementsBuyer /></PageLayout></ProtectedRoute>} />
      <Route path="/buyer/bookings" element={<ProtectedRoute allowedRole="buyer"><PageLayout><BuyerBookings /></PageLayout></ProtectedRoute>} />

      <Route path="/chat" element={<ProtectedRoute><PageLayout maxWidth="max-w-5xl"><Chat /></PageLayout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><PageLayout><Notifications /></PageLayout></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><PageLayout><AdminDashboard /></PageLayout></ProtectedRoute>} />
      <Route path="/admin/farmers" element={<ProtectedRoute allowedRole="admin"><PageLayout><Farmers /></PageLayout></ProtectedRoute>} />
      <Route path="/admin/buyers" element={<ProtectedRoute allowedRole="admin"><PageLayout><Buyers /></PageLayout></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="admin"><PageLayout><Analytics /></PageLayout></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <LanguageProvider>
            <SocketProvider>
              <NotificationProvider>
                <AppRoutes />
              </NotificationProvider>
            </SocketProvider>
          </LanguageProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
