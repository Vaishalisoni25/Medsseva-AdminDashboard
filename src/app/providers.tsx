import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store, persistor } from '../redux/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 7 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 2,
    },
  },
});
interface ProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'text-sm font-medium font-sans select-none rounded-xl shadow-xl border border-border/50',
              style: {
                background: 'var(--background-color, #ffffff)',
                color: 'var(--foreground-color, #1f2937)',
              },
              success: {
                iconTheme: {
                  primary: '#006D6F',
                  secondary: '#fff',
                },
              },
            }}
          />
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
};
