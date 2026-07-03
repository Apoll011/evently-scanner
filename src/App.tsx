import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ScannerProvider, useScanner } from './contexts/ScannerContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServerSetupPage } from './pages/ServerSetupPage';
import { HomePage } from './pages/HomePage';
import { PairScannerPage } from './pages/PairScannerPage';
import { ScannerPage } from './pages/ScannerPage';
import './index.css';

const queryClient = new QueryClient();

function AppRoutes() {
  const { isConfigured } = useScanner();

  return (
    <Routes>
      {!isConfigured ? (
        <>
          <Route path="/setup" element={<ServerSetupPage />} />
          <Route path="*" element={<Navigate to="/setup" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<HomePage />} />
          <Route path="/pair" element={<PairScannerPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ScannerProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ScannerProvider>
    </QueryClientProvider>
  );
}

export default App;
