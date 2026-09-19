import { createRoot } from 'react-dom/client';

import App from './App';
import { bootstrapMockupData } from './mockup';

import './index.css';

bootstrapMockupData();

createRoot(document.getElementById('root')!).render(<App />);
