import { createRoot } from 'react-dom/client';

import App from './App';
import { bootstrapMockupData } from './mockup';

import './index.css';

try {
  bootstrapMockupData();
} catch (error) {
  console.error('[mockup] bootstrap failed; rendering application without seeded preview data', error);
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Application root element was not found.');
}

createRoot(root).render(<App />);
