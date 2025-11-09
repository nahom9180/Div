import React, { useState, useMemo } from 'react';
import { XIcon, SearchIcon } from './icons';
import { NavigationData } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChapter: (book: string, bookNumber: number, chapter: number) => void;
  navigationData: NavigationData;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onSelectChapter, navigationData }) => {
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNavigationData = useMemo(() => {
    if (!searchTerm) {
      return navigationData;
    }
    return navigationData.filter(bookData => 
      bookData.book.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [navigationData, searchTerm]);

  const toggleBook = (book: string) => {
    setExpandedBook(expandedBook === book ? null : book);
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <aside
        className={`fixed top-0 left-0 w-72 h-full bg-brown-900 text-brown-200 shadow-xl z-50 transform transition-transform md:relative md:translate-x-0 md:shadow-none md:flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-4 border-b border-brown-800">
          <h2 className="text-xl font-bold text-brown-100">Navigation</h2>
          <button onClick={onClose} className="md:hidden p-1 rounded-full hover:bg-brown-800">
            <XIcon />
          </button>
        </div>

        <div className="p-2 border-b border-brown-800">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="text-brown-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search for a book..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/20 border border-transparent rounded-md pl-10 pr-4 py-2 text-sm text-brown-100 focus:outline-none focus:ring-2 focus:ring-accent-dark focus:border-transparent"
                />
            </div>
        </div>

        <nav className="overflow-y-auto h-[calc(100vh-128px)]">
          {navigationData.length > 0 ? (
            <ul>
              {filteredNavigationData.map(({ book, bookNumber, chapters }) => (
                <li key={book} className="border-b border-brown-800">
                  <button 
                    onClick={() => toggleBook(book)}
                    className="w-full text-left p-4 font-semibold text-brown-100 hover:bg-brown-800 focus:outline-none flex justify-between items-center transition-colors"
                  >
                    {book}
                    <span className={`transform transition-transform text-brown-400 ${expandedBook === book ? 'rotate-90' : 'rotate-0'}`}>&rsaquo;</span>
                  </button>
                  {expandedBook === book && (
                    <div className="bg-black/20 pl-4 py-2">
                      <ul className="grid grid-cols-4 gap-2">
                        {chapters.map(chapter => (
                          <li key={chapter}>
                            <button 
                              onClick={() => onSelectChapter(book, bookNumber, chapter)}
                              className="w-12 h-12 flex items-center justify-center rounded-lg text-center text-brown-200 hover:bg-accent-light hover:text-brown-50 transition-colors duration-200"
                            >
                              {chapter}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-brown-400">
                <p>No Bible loaded. Please import a Bible from the settings page.</p>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;