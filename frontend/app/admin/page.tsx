"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ModernAdminLayout from "./components/ModernAdminLayout";
import ModernDashboard from "./components/ModernDashboard";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user has admin role
    if (user.role_name !== "admin" && user.role_name !== "super_admin") {
      router.push("/");
      return;
    }

    setIsAuthorized(true);
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <ModernAdminLayout>
      <ModernDashboard />
    </ModernAdminLayout>
  );
}