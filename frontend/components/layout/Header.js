// frontend/components/layout/Header.js
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { useState } from 'react';

const AcademicCapIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.606 50.606 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a .75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const UserPlusIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
  </svg>
);

const LoginIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

const LogoutIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

const CogIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

export default function Header() {
  const pathname = usePathname();
  const { user, logout, loading, isAuthenticated, isAdmin } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setIsUserMenuOpen(false);
      await logout();
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error('Logout failed. Please try again.');
    }
  };

  // Navigation items for the main nav
 const navigationItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon,
    show: isAuthenticated
  },
  { 
    name: 'Home', 
    href: '/', 
    icon: HomeIcon,
    show: !isAuthenticated
  },
  { 
    name: 'Create Profile', 
    href: '/dashboard/create-profile', 
    icon: UserPlusIcon,
    show: isAuthenticated
  },
  { 
    name: 'Admin Dashboard', 
    href: '/admin', 
    icon: CogIcon,
    show: isAuthenticated && isAdmin
  }
].filter(item => item.show);

  return (
    <>
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Section - Left */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <AcademicCapIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                    <div className="h-full w-full bg-yellow-300 rounded-full animate-ping"></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    Agent Guru
                  </span>
                  <span className="text-xs text-gray-500 -mt-1">
                    AI Learning Platform
                  </span>
                </div>
              </Link>
            </div>

            {/* Center Navigation - Desktop Only */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative',
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{item.name}</span>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Section - User Menu or Login */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                /* Authenticated User Menu */
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {/* User Avatar */}
                    <div className="relative">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.name}
                          className="h-8 w-8 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      
                      {/* Admin Crown */}
                      {user.isAdmin && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-white text-xs">👑</span>
                        </div>
                      )}
                    </div>

                    {/* User Info - Desktop Only */}
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-semibold text-gray-900">
                        {user.name?.split(' ')[0] || 'User'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.isAdmin ? 'Administrator' : 'Student'}
                      </div>
                    </div>

                    {/* Dropdown Arrow */}
                    <ChevronDownIcon 
                      className={cn(
                        "h-4 w-4 text-gray-400 transition-transform duration-200",
                        isUserMenuOpen && "rotate-180"
                      )} 
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsUserMenuOpen(false)}
                      ></div>
                      
                      {/* Menu */}
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            {user.photoURL ? (
                              <img 
                                src={user.photoURL} 
                                alt={user.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-white" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {user.name || 'User'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                              <div className="flex items-center mt-1">
                                <span className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                  user.isAdmin 
                                    ? "bg-yellow-100 text-yellow-800" 
                                    : "bg-blue-100 text-blue-800"
                                )}>
                                  {user.isAdmin ? '👑 Administrator' : '🎓 Student'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          {user.isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            >
                              <CogIcon className="h-4 w-4 mr-3 text-gray-400" />
                              Admin Dashboard
                            </Link>
                          )}
                          
                          <Link
                            href="/create-profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <UserPlusIcon className="h-4 w-4 mr-3 text-gray-400" />
                            Create Profile
                          </Link>

                          <hr className="my-1 border-gray-100" />
                          
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                          >
                            <LogoutIcon className="h-4 w-4 mr-3 text-red-500" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Login Button for Unauthenticated Users */
                <Link
                  href="/login"
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <LoginIcon className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Only show when authenticated */}
      {isAuthenticated && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between py-3">
              {/* Mobile User Info */}
              {user && (
                <div className="flex items-center space-x-3">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {user.name?.split(' ')[0] || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.isAdmin ? 'Administrator' : 'Student'}
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Navigation */}
              <div className="flex items-center space-x-2">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="text-xs">
                        {item.name === 'Create Profile' ? 'Profile' : 
                         item.name === 'Admin Dashboard' ? 'Admin' : 
                         item.name}
                      </span>
                    </Link>
                  );
                })}
                
                {/* Mobile Logout */}
                <button
                  onClick={handleLogout}
                  className="flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogoutIcon className="h-5 w-5" />
                  <span className="text-xs">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}