import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Mail, Home, Settings, Users, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Home", icon: Home, public: true },
    { href: "/automation", label: "Mail Automation", icon: Mail, requiresApproval: true },
    { href: "/admin", label: "Admin", icon: Users, adminOnly: true }
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  const canAccessItem = (item: any) => {
    if (item.public) return true;
    if (!user) return false;
    if (item.adminOnly && user.role !== "admin") return false;
    if (item.requiresApproval && user.approvalStatus !== "approved") return false;
    return true;
  };

  // Debug log to help troubleshoot
  console.log("Navigation - User data:", {
    user,
    role: user?.role,
    approvalStatus: user?.approvalStatus,
    isAdmin: user?.role === "admin"
  });

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b-2 border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Mail className="text-2xl text-primary" />
              <span className="text-xl font-bold text-secondary">Mail Automation</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => {
              if (!canAccessItem(item)) return null;
              
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={`flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-600 hover:text-primary"
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  Welcome, <span className="font-medium text-secondary">{user.username}</span>
                </span>
                {user.role === "admin" && (
                  <Link href="/admin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white bg-red-600 hover:bg-red-700 border-red-600"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-secondary hover:text-primary"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-secondary hover:text-primary"
                  onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white"
                  onClick={() => window.dispatchEvent(new CustomEvent('openRegisterModal'))}
                >
                  Register
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {navItems.map((item) => {
                if (!canAccessItem(item)) return null;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={`flex items-center w-full px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                        isActive(item.href)
                          ? "text-primary bg-primary/10"
                          : "text-gray-600 hover:text-primary hover:bg-gray-50"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </button>
                  </Link>
                );
              })}
            </div>
            
            {/* Mobile Auth */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm text-gray-600">
                    Welcome, <span className="font-medium text-secondary">{user.username}</span>
                  </div>
                  {user.role === "admin" && (
                    <Link href="/admin">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full text-white bg-red-600 hover:bg-red-700 border-red-600"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-secondary hover:text-primary"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-secondary hover:text-primary"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openLoginModal'));
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openRegisterModal'));
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
