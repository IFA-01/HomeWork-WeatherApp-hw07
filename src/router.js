class Router {
  constructor() {
    this.routes = [];
    this.currentRoute = null;
    this.params = {};
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
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach((link) => {
      const linkPath = link.getAttribute('href');
      if (
        linkPath === currentPath ||
        (linkPath === '/' && currentPath === '/')
      ) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  navigate(path = null) {
    const targetPath = path || window.location.pathname;

    const cleanPath =
      targetPath === '/' ? '/' : targetPath.replace(/^\/+|\/+$/g, '');

    for (const route of this.routes) {
      const routePath =
        route.path === '/' ? '/' : route.path.replace(/^\/+|\/+$/g, '');
      const params = this.matchRoute(routePath, cleanPath);

      if (params !== null) {
        this.currentRoute = route;
        this.params = params;
        route.handler(params);
        const fullPath = targetPath === '/' ? '/' : targetPath;
        this.updateActiveNav(fullPath);
        return;
      }
    }

    if (targetPath !== '/') {
      this.navigate('/');
    }
  }

  go(path) {
    window.history.pushState({}, '', path);
    this.navigate(path);
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
