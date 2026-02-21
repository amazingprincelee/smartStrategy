import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

const Layout = () => {
  const { token } = useSelector(state => state.auth);
  const isAuthenticated = !!token;
  
  // State for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-brandDark-900">
      <Header 
        onMenuToggle={toggleSidebar} 
        isSidebarOpen={isSidebarOpen}
      />
      
      <div className="flex flex-1 pt-16">
        {isAuthenticated && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={closeSidebar} 
          />
        )}
        
        <main 
          className={`
            flex-1 w-full transition-all duration-300
            ${isAuthenticated ? 'lg:ml-64' : ''}
          `}
        >
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Footer only on public pages — not inside the authenticated app */}
      {!isAuthenticated && <Footer />}
    </div>
  );
};

export default Layout;