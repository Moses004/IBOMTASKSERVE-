import { Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import TaskerOnboarding from './pages/TaskerOnboarding'
import Dashboard from './pages/Dashboard'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOverview from './pages/admin/AdminOverview'
import AdminVerifications from './pages/admin/AdminVerifications'
import AdminVerificationHistory from './pages/admin/AdminVerificationHistory'
import AdminBookings from './pages/admin/AdminBookings'
import AdminPayouts from './pages/admin/AdminPayouts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminUsers from './pages/admin/AdminUsers'
import Home from './pages/Home'
import CategoryList from './pages/CategoryList'
import TaskerProfile from './pages/TaskerProfile'
import BookTasker from './pages/BookTasker'
import Bookings from './pages/Bookings'
import Save from './pages/Save'
import Account from './pages/Account'
import Chat from './pages/Chat'
import TaskerServices from './pages/TaskerServices'
import TaskerJobs from './pages/TaskerJobs'
import TaskerPayouts from './pages/TaskerPayouts'
import TaskerMessages from './pages/TaskerMessages'
import ChatThread from './pages/ChatThread'
import EditProfile from './pages/EditProfile'
import SavedAddresses from './pages/SavedAddresses'
import PaymentHistory from './pages/PaymentHistory'
import TrustAndSafety from './pages/TrustAndSafety'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Notifications from './pages/Notifications'
import { useAuth } from './contexts/AuthContext'

function RoleAwareRoot() {
  const { profile } = useAuth()
  if (profile?.role === 'customer') return <Home />
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  return <Dashboard />
}

export default function App() {
  return (
    <>
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={['customer', 'tasker']}>
            <Notifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tasker/onboarding"
        element={
          <ProtectedRoute allowedRoles={['tasker']}>
            <TaskerOnboarding />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="verifications" element={<AdminVerifications />} />
        <Route path="verification-history" element={<AdminVerificationHistory />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      <Route
        path="/category/:categoryId"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CategoryList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tasker/:taskerId"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <TaskerProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/book/:taskerId"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <BookTasker />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Bookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/save"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Save />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Chat />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Account />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute allowedRoles={['customer', 'tasker']}>
            <EditProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/addresses"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <SavedAddresses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/payment-history"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <PaymentHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/trust-safety"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <TrustAndSafety />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tasker/services"
        element={
          <ProtectedRoute allowedRoles={['tasker']}>
            <TaskerServices />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tasker/jobs"
        element={
          <ProtectedRoute allowedRoles={['tasker']}>
            <TaskerJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tasker/payouts"
        element={
          <ProtectedRoute allowedRoles={['tasker']}>
            <TaskerPayouts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tasker/messages"
        element={
          <ProtectedRoute allowedRoles={['tasker']}>
            <TaskerMessages />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat/:bookingId"
        element={
          <ProtectedRoute allowedRoles={['customer', 'tasker']}>
            <ChatThread />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleAwareRoot />
          </ProtectedRoute>
        }
      />
      </Routes>
      <Analytics />
    </>
  )
}
