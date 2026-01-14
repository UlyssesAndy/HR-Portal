"use client";

import { PageTransition } from "@/components/ui/page-transition";

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

export function PageTransitionWrapper({ children }: PageTransitionWrapperProps) {
  return <PageTransition>{children}</PageTransition>;
}
