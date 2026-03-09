import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from 'sonner';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/app/App';
import { useAuthStore } from '@/stores/auth-store';
import i18n, { ensureI18nReady } from '@/lib/i18n';
import '@/index.css';

const queryClient = new QueryClient();

void ensureI18nReady().then(() => {
  useAuthStore.getState().hydrate();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </QueryClientProvider>
      </I18nextProvider>
    </StrictMode>,
  );
});
