import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { Toaster } from 'sonner';

import { SocketProvider } from './lib/socket.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SocketProvider>
      <App />
      <Toaster position="top-right" richColors />
    </SocketProvider>
  </StrictMode>,
);
