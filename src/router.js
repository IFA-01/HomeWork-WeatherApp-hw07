class Router {
  constructor() {
    this.routes = [];
    this.currentRoute = null;
    this.params = {};
    this.basePath = this.getBasePath();
  }

  getBasePath() {
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;

    if (hostname !== 'ifa-01.github.io' && !hostname.endsWith('.github.io')) {
      return '';
    }
    const possibleBasePaths = ['/HomeWork-WeatherApp-hw07'];

    for (const basePath of possibleBasePaths) {
      if (pathname.startsWith(basePath)) {
        return basePath;
      }
    }

    return '';
  }

  normalizePath(path) {
    if (this.basePath && path.startsWith(this.basePath)) {
      return path.slice(this.basePath.length) || '/';
    }
    return path;
  }

  addRoute(path, handler) {
    this.routes.push({ path, handler });
  }

  matchRoute(routePath, currentPath) {
    if (routePath === '/' && currentPath === '/') {
      return {};
    }

    const routeParts = routePath.split('/').filter((p) => p !== '');
    const pathParts = currentPath.split('/').filter((p) => p !== '');

    if (routeParts.length !== pathParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        const paramName = routeParts[i].slice(1);
        params[paramName] = decodeURIComponent(pathParts[i]);
      } else if (routeParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return params;
  }

  updateActiveNav(path = null) {
    const currentPath = path || window.location.pathname;
    const normalizedPath = this.normalizePath(currentPath);
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach((link) => {
      const linkPath = link.getAttribute('href');
      if (
        linkPath === normalizedPath ||
        (linkPath === '/' && normalizedPath === '/')
      ) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  navigate(path = null) {
    const targetPath = path || window.location.pathname;
    const normalizedPath = this.normalizePath(targetPath);

    const cleanPath =
      normalizedPath === '/' ? '/' : normalizedPath.replace(/^\/+|\/+$/g, '');

    for (const route of this.routes) {
      const routePath =
        route.path === '/' ? '/' : route.path.replace(/^\/+|\/+$/g, '');
      const params = this.matchRoute(routePath, cleanPath);

      if (params !== null) {
        this.currentRoute = route;
        this.params = params;
        route.handler(params);
        const fullPath = normalizedPath === '/' ? '/' : normalizedPath;
        this.updateActiveNav(fullPath);
        return;
      }
    }

    if (normalizedPath !== '/') {
      this.navigate('/');
    }
  }

  go(path) {
    const fullPath = this.basePath ? `${this.basePath}${path}` : path;
    window.history.pushState({}, '', fullPath);
    this.navigate(fullPath);
  }

  init() {
    window.addEventListener('popstate', () => {
      this.navigate();
    });

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-router]');
      if (link) {
        e.preventDefault();
        const path = link.getAttribute('href');
        this.go(path);
      }
    });

    this.navigate();
  }
}

export default new Router();
