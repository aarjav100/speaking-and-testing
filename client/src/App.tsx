import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import ToastContainer from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Communication from './pages/Communication';
import Result from './pages/Result';
import WordPractice from './pages/WordPractice';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <main style={{ flex: 1 }}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/communication"
                    element={
                      <ProtectedRoute>
                        <Communication />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/word-practice"
                    element={
                      <ProtectedRoute>
                        <WordPractice />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/communication/result/:sessionId"
                    element={
                      <ProtectedRoute>
                        <Result />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
            </div>
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
