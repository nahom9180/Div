import React from 'react';
import { MenuIcon, BookOpenIcon, SettingsIcon } from './icons';

interface HeaderProps {
  toggleSidebar: () => void;
  onNavigateToSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, onNavigateToSettings }) => {
  return (
    <header className="bg-brown-50/70 dark:bg-brown-950/70 backdrop-blur-md shadow-sm sticky top-0 z-40 text-brown-800 dark:text-brown-100 border-b border-brown-200 dark:border-brown-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
             <button
              onClick={toggleSidebar}
              className="p-2 rounded-full text-brown-600 dark:text-brown-300 hover:bg-brown-200 dark:hover:bg-brown-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-light"
              aria-label="Open navigation menu"
            >
              <MenuIcon />
            </button>
            <div className="flex items-center ml-4">
              <BookOpenIcon className="h-8 w-8 text-accent-light"/>
              <span className="ml-2 text-2xl font-bold tracking-tight text-brown-800 dark:text-brown-100">
                Goodman Bible
              </span>
            </div>
          </div>
          
          <button
            onClick={onNavigateToSettings}
            className="p-2 rounded-full text-brown-600 dark:text-brown-300 hover:bg-brown-200 dark:hover:bg-brown-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-light"
            aria-label="Open settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;