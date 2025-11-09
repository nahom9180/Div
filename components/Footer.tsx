import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-brown-200 dark:border-brown-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-brown-500 dark:text-brown-400">
        <p>&copy; {new Date().getFullYear()} Goodman Bible. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;