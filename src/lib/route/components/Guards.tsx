import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RouteKit } from "../core/RouteKit";

export const AuthRoute: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { authCheck, authStore, authSelector, loginPath } = RouteKit.getConfig();

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        let auth = false;
        if (authStore && authSelector) {
          const storeState = authStore();
          auth = authSelector(storeState);
        } else if (authCheck) {
          auth = await authCheck();
        } else {
          auth = true;
        }

        if (!alive) return;
        setIsAuthorized(auth);
        if (!auth) navigate(loginPath ?? "/login");
      } catch {
        if (!alive) return;
        setIsAuthorized(false);
        navigate(loginPath ?? "/login");
      }
    };
    check();
    return () => { alive = false; };
  }, [authCheck, authStore, authSelector, loginPath, navigate]);

  if (isAuthorized === null) return <>{fallback}</>;
  return isAuthorized ? <>{children}</> : null;
};

export const RoleRoute: React.FC<{ children: React.ReactNode; roles: string[] }> = ({
  children,
  roles
}) => {
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { roleStore, roleSelector, getRoles, unauthorizedPath } = RouteKit.getConfig();

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        let userRoles: string[] = [];
        if (roleStore && roleSelector) {
          const storeState = roleStore();
          userRoles = roleSelector(storeState);
        } else if (getRoles) {
          userRoles = await getRoles();
        }

        if (!alive) return;
        const allowed = roles.some(r => userRoles.includes(r));
        setHasRole(allowed);
        if (!allowed) navigate(unauthorizedPath ?? "/403");
      } catch {
        if (!alive) return;
        setHasRole(false);
        navigate(unauthorizedPath ?? "/403");
      }
    };
    check();
    return () => { alive = false; };
  }, [roleStore, roleSelector, getRoles, unauthorizedPath, navigate, roles]);

  if (hasRole === null) return null;
  return hasRole ? <>{children}</> : null;
};
