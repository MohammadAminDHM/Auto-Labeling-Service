import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FolderKanban,
  ImagePlus,
  History,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";

// SAFE imports
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44client";

// Fallback-safe page URL helper
function safeCreatePageUrl(path) {
  if (!path) return "/";
  return `/${path.toLowerCase()}`;
}

export default function Layout({ children, currentPageName }) {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        console.warn("Auth check failed:", err);
        return null;
      }
    },
    retry: false,
  });

  const navItems = [
    { name: "Home", icon: LayoutDashboard, path: "landing" },
    { name: "Dashboard", icon: LayoutDashboard, path: "dashboard" },
    { name: "Projects", icon: FolderKanban, path: "projects" },
    { name: "Annotate", icon: ImagePlus, path: "annotate" },
    { name: "History", icon: History, path: "history" },
  ];

  const handleLogout = () => {
    try {
      base44.auth.logout();
    } catch (e) {
      console.warn("Logout failed", e);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AutoLabel AI</h1>
              <p className="text-xs text-slate-400">
                Vision Annotation Platform
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPageName?.toLowerCase() === item.path;

            return (
              <Link
                key={item.path}
                to={safeCreatePageUrl(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        {user && (
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.full_name || user.email}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
