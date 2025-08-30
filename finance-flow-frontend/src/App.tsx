import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { checkHealth } from '@/services/api';

function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900">
        {apiStatus === 'offline' && (
          <div className="bg-yellow-900 p-4 text-center">
            <p className="text-yellow-200">
              ⚠️ Backend server is offline. Please start the backend server.
            </p>
          </div>
        )}
        <Dashboard />
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
  );
}

export default App
