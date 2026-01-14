import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, Settings, LogOut, UserCircle, Menu, X } from "lucide-react";

export default function TopNav({ user, notifications, unreadCount, onLogout }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    const targetUrl = createPageUrl(path);
    return location.pathname === targetUrl;
  };

  const navItems = [
    { name: "Dashboard", path: "Dashboard" },
    { name: "Budget", path: "BudgetPlan" },
    { name: "Schulden", path: "Debts" },
    { name: "Instellingen", path: "Settings" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-konsensi-dark text-white px-4 md:px-8 py-4 shadow-lg">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center">
          <img
            alt="Konsensi Budgetbeheer Logo"
            className="h-10 w-auto object-contain brightness-0 invert"
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dab075b0ca9b98841bfa1b/61e2744e7_KonsensiBudgetbeheer_Primaire_Beeldmerk3.png"
          />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 bg-white/10 p-1 rounded-full">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={createPageUrl(item.path)}
              className={`px-6 py-2 rounded-full font-medium text-sm transition-colors ${
                isActive(item.path)
                  ? "bg-primary text-konsensi-dark font-bold"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right Side - Search, User */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          {/* Search */}
          <div className="relative hidden sm:block">
            <input
              className="bg-white/10 border-none rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/60 focus:ring-2 focus:ring-primary focus:bg-white/20 transition-all w-48 focus:w-64"
              placeholder="Zoeken..."
              type="text"
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-white/60 text-[20px]">
              search
            </span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right hidden lg:block">
              <p className="text-xs text-primary font-bold">Level {user?.level || 9}</p>
              <p className="text-sm font-bold">
                {user?.voornaam || user?.full_name || user?.name || "Gebruiker"}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="size-10 rounded-full bg-white border-2 border-primary overflow-hidden cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-primary transition-all bg-cover bg-center">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Avatar className="w-full h-full">
                      <AvatarFallback className="bg-primary text-konsensi-dark">
                        {(user?.voornaam?.[0] || user?.full_name?.[0] || user?.name?.[0] || user?.email?.[0] || "G").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium capitalize">
                      {user?.voornaam || user?.full_name || user?.name || user?.email?.split("@")[0] || "Gebruiker"}
                    </span>
                    <span className="text-xs text-gray-500">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = createPageUrl("Settings")}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  Account Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = createPageUrl("Settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Instellingen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex justify-between w-full mt-4 pt-4 border-t border-white/10 overflow-x-auto pb-1 gap-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={createPageUrl(item.path)}
            className={`text-sm whitespace-nowrap transition-colors ${
              isActive(item.path) ? "text-primary font-bold" : "text-white/80"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

