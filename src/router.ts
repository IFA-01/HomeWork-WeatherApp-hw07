type RouteHandler = (params: Record<string, string>) => void | Promise<void>;

interface Route {
  path: string;
  handler: RouteHandler;
}

class Router {
  routes: Route[] = [];
  currentRoute: Route | null = null;
  params: Record<string, string> = {};

  addRoute(path: string, handler: RouteHandler): void {
    this.routes.push({ path, handler });
  }

  matchRoute(
    routePath: string,
    currentPath: string
  ): Record<string, string> | null {
    if (routePath === '/' && currentPath === '/') {
      return {};
    }

    const routeParts = routePath.split('/').filter((p) => p !== '');
    const pathParts = currentPath.split('/').filter((p) => p !== '');

    if (routeParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

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

  updateActiveNav(path: string | null = null): void {
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

  navigate(path: string | null = null): void {
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

  go(path: string): void {
    window.history.pushState({}, '', path);
    this.navigate(path);
  }

  init(): void {
    window.addEventListener('popstate', () => {
      this.navigate();
    });

    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-router]') as HTMLAnchorElement | null;
      if (link) {
        e.preventDefault();
        const path = link.getAttribute('href');
        if (path) {
          this.go(path);
        }
      }
    });

    this.navigate();
  }
}

export default new Router();
