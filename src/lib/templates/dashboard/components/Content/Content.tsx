import type { FC, ReactNode } from "react";
import { Outlet } from "react-router-dom";

interface ContentProps {
  className?: string;
  children?: ReactNode;
}

/**
 * DashboardContent: The main content area.
 * If children are provided, they are rendered directly.
 * Otherwise, it renders an <Outlet /> for nested routing.
 */
export const Content: FC<ContentProps> = ({ className = "", children }) => {
  return (
    <main className={`flex-1 overflow-y-auto p-6 max-md:p-4 max-md:pb-20 ${className}`}>
      {children ?? <Outlet />}
    </main>
  );
};
