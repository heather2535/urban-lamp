import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "../lib/utils"
import {
  Home,
  Users,
  Newspaper,
  BarChart2,
  ShoppingBag
} from "lucide-react"

const sidebarNavItems = [
  {
    title: "Home",
    icon: Home,
    href: "/"
  },
  {
    title: "Products",
    icon: ShoppingBag,
    href: "/products"
  },
  {
    title: "Community",
    icon: Users,
    href: "/community"
  },
  {
    title: "Markets",
    icon: BarChart2,
    href: "/markets"
  },
  {
    title: "News",
    icon: Newspaper,
    href: "/news"
  }
]

export function Layout({ children, darkMode, setDarkMode }) {
  const location = useLocation();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-black text-white' : 'bg-white'}`}>
      {/* Fixed Sidebar */}
      <div className={`sidebar ${darkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="flex h-full flex-col">
          {/* Sidebar content */}
          <div className={`flex h-14 items-center border-b px-6 ${
            darkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <Link className="flex items-center gap-2 font-semibold" to="/">
              <span className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Crypto Tracker
              </span>
            </Link>
            <button 
              className="dark-mode-toggle"
              onClick={() => setDarkMode(!darkMode)}
              style={{
                position: 'fixed',
                top: '20px',
                right: '40px',
                backgroundColor: '#ff5733',
                color: 'white',
                padding: '10px 15px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                zIndex: 50
              }}
            >
              Toggle Dark Mode
            </button>
          </div>
          <nav className="grid items-start px-4 text-sm font-medium">
            {sidebarNavItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={index}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                    darkMode
                      ? "text-gray-400 hover:text-white hover:bg-gray-800"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                    isActive && (
                      darkMode
                        ? "text-white bg-gray-800 border-l-4 border-orange-500"
                        : "text-gray-900 bg-gray-100 border-l-4 border-orange-500"
                    )
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive && (
                      darkMode
                        ? "text-orange-500"
                        : "text-orange-500"
                    )
                  )} />
                  <span className={isActive ? "font-bold" : ""}>
                    {item.title}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
} 