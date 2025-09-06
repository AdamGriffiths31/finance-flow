import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from '@/components/layout/Layout';
import { Navigation } from '@/components/layout/Navigation';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Dashboard } from '@/pages/Dashboard';
import { FinanceFlow } from '@/pages/FinanceFlow';
import { Projections } from '@/pages/Projections';
import { Data } from '@/pages/Data';
import { checkHealth } from '@/services/api';

function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <div className="min-h-screen bg-gray-900 overflow-x-hidden">
            <ErrorBoundary 
              fallback={
                <div className="bg-red-900 p-4 text-center">
                  <p className="text-red-200">⚠️ Navigation component failed to load. Please refresh the page.</p>
                </div>
              }
            >
              <Navigation />
            </ErrorBoundary>
            
            {apiStatus === 'offline' && (
              <div className="bg-yellow-900 p-4 text-center">
                <p className="text-yellow-200">
                  ⚠️ Backend server is offline. Please start the backend server.
                </p>
              </div>
            )}
            
            <ErrorBoundary 
              fallback={
                <div className="container mx-auto px-4 py-8">
                  <div className="bg-red-900 border border-red-700 rounded-lg p-6">
                    <p className="text-red-200 text-center">⚠️ Page failed to load. Please try refreshing or navigate to a different page.</p>
                  </div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/sankey" element={<FinanceFlow />} />
                <Route path="/projections" element={<Projections />} />
                <Route path="/data" element={<Data />} />
              </Routes>
            </ErrorBoundary>
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#374151',
                color: '#fff',
                borderRadius: '8px',
              },
            }}
          />
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App
