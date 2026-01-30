import './style.css';
import { init } from './controller.js';

if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
} else if (typeof document !== 'undefined') {
  init();
}
