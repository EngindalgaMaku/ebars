"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  Bot,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  User,
  Home,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import NotificationSystem from "@/components/NotificationSystem";

type TabType = "dashboard" | "sessions" | "upload" | "analytics" | "modules" | "assistant" | "query";

interface TeacherLayoutProps {
  children: React.ReactNode;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

const navigationItems: Array<{
  id: TabType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  path: string;
}> = [
  {
    id: "dashboard",
    name: "Kontrol Paneli",
    icon: LayoutDashboard,
    desc: "Genel Bakış",
    path: "/",
  },
  {
    id: "sessions",
    name: "Ders Oturumları",
    icon: BookOpen,
    desc: "Sınıf Yönetimi",
    path: "/",
  },
  {
    id: "upload",
    name: "Belge Merkezi",
    icon: FolderOpen,
    desc: "Materyal Yükleme",
    path: "/document-center",
  },
  {
    id: "analytics",
    name: "Analytics Dashboard",
    icon: BarChart3,
    desc: "Konu Analizi",
    path: "/",
  },
  {
    id: "modules",
    name: "Modül Sistemi",
    icon: FolderOpen,
    desc: "Eğitim Modülleri",
    path: "/",
  },
  {
    id: "assistant",
    name: "Akıllı Asistan",
    icon: Bot,
    desc: "Soru & Cevap",
    path: "/education-assistant",
  },
];

function TeacherLayout({
  children,
  activeTab,
  onTabChange,
}: TeacherLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Determine active tab - use prop if provided, otherwise fallback to pathname
  const getActiveTabFromPath = (): TabType => {
    // Session detail page - still show sessions as active
    if (pathname?.startsWith("/sessions/")) {
      return "sessions";
    }
    if (pathname === "/document-center") {
      return "upload";
    }
    if (pathname === "/education-assistant") {
      return "assistant";
    }
    // Default to dashboard for home page
    return "dashboard";
  };

  // Use activeTab prop if provided, otherwise determine from pathname
  const currentActiveTab = activeTab || getActiveTabFromPath();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleTabClick = (tabId: TabType) => {
    setSidebarOpen(false);

    // Special handling for upload tab - redirect to document-center
    if (tabId === "upload") {
      if (pathname !== "/document-center") {
        router.push("/document-center");
      }
      return;
    }

    // Special handling for assistant tab - redirect to education-assistant page
    if (tabId === "assistant") {
      if (pathname !== "/education-assistant") {
        router.push("/education-assistant");
      }
      return;
    }

    // For dashboard, sessions, analytics, modules: go to home page
    // If onTabChange is provided, use it (for home page)
    // Otherwise, navigate to home page with tab query param
    if (onTabChange) {
      // We're on the home page, just change the tab
      onTabChange(tabId);
    } else {
      // We're on a different page, navigate to home page with tab query param
      if (tabId === "dashboard") {
        router.push("/");
      } else {
        // Use router.push - Next.js will handle the navigation
        // The home page useEffect will read the tab from URL
        router.push(`/?tab=${tabId}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 top-16 flex bg-gray-50 dark:bg-gray-900 overflow-hidden m-0 p-0">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 bottom-0 left-0 z-40
          ${sidebarCollapsed ? "w-16" : "w-64"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:inset-y-auto
          transition-all duration-300 ease-in-out
          bg-slate-900
          border-r border-slate-700
          flex flex-col
          h-full
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700 bg-slate-900">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RAG</span>
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">
                  Eğitim Asistanı
                </h1>
                <p className="text-xs text-slate-400">Öğretmen Paneli</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4 rotate-180" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            // Only check pathname for specific routes (not for tabs on home page)
            const isPathMatch = 
              (item.id === "sessions" && pathname?.startsWith("/sessions/")) ||
              (item.id === "upload" && pathname === "/document-center") ||
              (item.id === "assistant" && pathname === "/education-assistant");
            // Use activeTab prop as primary source, pathname only for specific routes
            const isActive = currentActiveTab === item.id || isPathMatch;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg 
                  transition-all duration-200 
                  min-h-[44px] touch-manipulation
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }
                  ${sidebarCollapsed ? "justify-center" : ""}
                `}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div
                      className={`text-xs ${
                        isActive ? "text-white/80" : "text-slate-400"
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Footer */}
        <div className="border-t border-slate-700 p-4 space-y-4 bg-slate-900">
          {/* User Profile */}
          {!sidebarCollapsed ? (
            <div className="relative">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto p-2 hover:bg-slate-800 min-h-[44px] touch-manipulation"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {user?.first_name?.charAt(0) ||
                      user?.username?.charAt(0) ||
                      "U"}
                  </span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {user?.email}
                  </div>
                </div>
              </Button>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <Card className="absolute bottom-full left-0 mb-2 w-56 z-50 shadow-xl">
                    <div className="p-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 min-h-[44px] touch-manipulation"
                        onClick={() => {
                          router.push("/profile");
                          setUserMenuOpen(false);
                        }}
                      >
                        <User className="h-4 w-4" />
                        Profil
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 min-h-[44px] touch-manipulation"
                        onClick={() => {
                          router.push("/");
                          setUserMenuOpen(false);
                        }}
                      >
                        <Home className="h-4 w-4" />
                        Ana Sayfa
                      </Button>
                      <div className="border-t my-1" />
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] touch-manipulation"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                      </Button>
                    </div>
                  </Card>
                </>
              )}
            </div>
          ) : (
            <div className="flex justify-center relative">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 min-h-[44px] min-w-[44px] touch-manipulation"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="text-white text-xs font-bold">
                  {user?.first_name?.charAt(0) ||
                    user?.username?.charAt(0) ||
                    "U"}
                </span>
              </Button>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <Card className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-50 shadow-xl">
                    <div className="p-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 min-h-[44px] touch-manipulation"
                        onClick={() => {
                          router.push("/profile");
                          setUserMenuOpen(false);
                        }}
                      >
                        <User className="h-4 w-4" />
                        Profil
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 min-h-[44px] touch-manipulation"
                        onClick={() => {
                          router.push("/");
                          setUserMenuOpen(false);
                        }}
                      >
                        <Home className="h-4 w-4" />
                        Ana Sayfa
                      </Button>
                      <div className="border-t my-1" />
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 min-h-[44px] touch-manipulation"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                      </Button>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Footer - Copyright */}
          {!sidebarCollapsed && (
            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                © 2025 Engin DALGA
                <br />
                MAKÜ Yüksek Lisans Ödevi
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 z-30 h-16 flex-shrink-0 m-0">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden min-h-[44px] min-w-[44px] touch-manipulation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification System - Both Mobile and Desktop */}
            <NotificationSystem />

            {/* User Menu Dropdown - Mobile Header */}
            <div className="relative lg:hidden">
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] touch-manipulation"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {user?.first_name?.charAt(0) ||
                      user?.username?.charAt(0) ||
                      "U"}
                  </span>
                </div>
              </Button>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <Card className="absolute top-full right-0 mt-2 w-56 z-50 shadow-xl">
                    <div className="p-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 min-h-[44px] touch-manipulation"
                        onClick={() => {
                          router.push("/profile");
                          setUserMenuOpen(false);
                        }}
                      >
                        <User className="h-4 w-4" />
                        Profil
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 min-h-[44px] touch-manipulation"
                        onClick={() => {
                          router.push("/");
                          setUserMenuOpen(false);
                        }}
                      >
                        <Home className="h-4 w-4" />
                        Ana Sayfa
                      </Button>
                      <div className="border-t my-1" />
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 min-h-[44px] touch-manipulation"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                      </Button>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 bg-gray-50 dark:bg-gray-900 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default TeacherLayout;
