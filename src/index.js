require('./style.css');
const { init } = require('./controller.js');

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { init };
}

if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
} else if (typeof document !== 'undefined') {
  init();
}
