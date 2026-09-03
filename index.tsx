
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { StateProvider } from './components/contexts/StateProvider';
import reducer, { initialState } from './components/contexts/reducer';
import ErrorBoundary from './components/ErrorBoundary';
import './scripts/migrateToSupabase'; // Giữ lại script migrate cũ nếu cần
import './scripts/fakeData'; // Import script fake data

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <StateProvider initialState={initialState} reducer={reducer}>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StateProvider>
  </React.StrictMode>
);
