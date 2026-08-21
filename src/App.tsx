import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { ToastProvider } from './components/Toast';
import { router } from './routes/routes';

function App() {
  return (
    <ToastProvider>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ToastProvider>
  )
}

export default App