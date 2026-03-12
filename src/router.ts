type RouteHandler = (params: Record<string, string>) => void | Promise<void>;

interface Route {
  path: string;
  handler: RouteHandler;
}

class Router {
  routes: Route[] = [];
  currentRoute: Route | null = null;
  params: Record<string, string> = {};
  private basePath: string;

  constructor() {
    this.basePath = this.getBasePath();
  }

  getBasePath(): string {
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

  normalizePath(path: string): string {
    if (this.basePath && path.startsWith(this.basePath)) {
      return path.slice(this.basePath.length) || '/';
    }
    return path;
  }

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

  navigate(path: string | null = null): void {
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

  go(path: string): void {
    const fullPath = this.basePath ? `${this.basePath}${path}` : path;
    window.history.pushState({}, '', fullPath);
    this.navigate(fullPath);
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

    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath');
      this.go(redirectPath);
    } else {
      this.navigate();
    }
  }
}

export default new Router();
