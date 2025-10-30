
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StateProvider } from './components/contexts/StateProvider';
import reducer, { initialState } from './components/contexts/reducer';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <StateProvider initialState={initialState} reducer={reducer}>
      <App />
    </StateProvider>
  </React.StrictMode>
);
