import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import MainApp from './components/Main/index.tsx';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  </StrictMode>
);

