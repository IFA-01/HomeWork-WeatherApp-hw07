import { useEffect, useState } from 'react';

const SESSION_KEY = 'weatherAppSession';

export type UserSession = {
  sessionId: string;
  startedAt: string;
  visits: number;
  lastVisitedRoute: string;
};

function createSession(pathname: string): UserSession {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return {
    sessionId: `session-${Date.now()}-${randomPart}`,
    startedAt: new Date().toISOString(),
    visits: 0,
    lastVisitedRoute: pathname,
  };
}

function readSession(pathname: string): UserSession {
  if (typeof window === 'undefined') {
    return createSession(pathname);
  }

  try {
    const rawSession = sessionStorage.getItem(SESSION_KEY);
    if (!rawSession) {
      const nextSession = createSession(pathname);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      return nextSession;
    }

    const parsed = JSON.parse(rawSession) as UserSession;
    if (
      !parsed.sessionId ||
      !parsed.startedAt ||
      typeof parsed.visits !== 'number' ||
      !parsed.lastVisitedRoute
    ) {
      const nextSession = createSession(pathname);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      return nextSession;
    }

    return parsed;
  } catch {
    const nextSession = createSession(pathname);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    return nextSession;
  }
}

export function useSession(pathname: string): UserSession {
  const [session, setSession] = useState<UserSession>(() =>
    readSession(pathname)
  );

  useEffect(() => {
    setSession((prev) => {
      if (prev.lastVisitedRoute === pathname) {
        return prev;
      }

      const updated = {
        ...prev,
        visits: prev.visits + 1,
        lastVisitedRoute: pathname,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [pathname]);

  return session;
}
