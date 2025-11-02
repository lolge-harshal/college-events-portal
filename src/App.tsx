import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Header from './components/Header'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Profile from './pages/Profile'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import EventForm from './pages/admin/EventForm'
import AdminRegistrations from './pages/admin/Registrations'

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-grow">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<Home />} />
                            <Route path="/events" element={<Events />} />
                            <Route path="/events/:eventId" element={<EventDetail />} />

                            {/* Auth Routes */}
                            <Route path="/auth/login" element={<Login />} />
                            <Route path="/auth/signup" element={<Signup />} />

                            {/* Protected Routes */}
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Admin Routes */}
                            <Route
                                path="/admin/dashboard"
                                element={
                                    <AdminProtectedRoute>
                                        <AdminDashboard />
                                    </AdminProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/events/new"
                                element={
                                    <AdminProtectedRoute>
                                        <EventForm />
                                    </AdminProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/events/:eventId/edit"
                                element={
                                    <AdminProtectedRoute>
                                        <EventForm />
                                    </AdminProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/events/:eventId/registrations"
                                element={
                                    <AdminProtectedRoute>
                                        <AdminRegistrations />
                                    </AdminProtectedRoute>
                                }
                            />

                            {/* Fallback */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </AuthProvider>
        </Router>
    )
}

export default App