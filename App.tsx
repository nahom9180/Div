import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/About'; // Repurposed as Sidebar
import { BibleReader, VerseLookup } from './components/Projects'; // Repurposed as BibleReader
import VerseOfTheDay from './components/Hero'; // Repurposed as VerseOfTheDay
import Footer from './components/Footer';
import Settings from './components/Settings';

// --- IndexedDB Service ---
// NOTE: Due to platform constraints preventing the addition of new files,
// all IndexedDB logic is co-located in this component file. In a larger
// application, this would typically be in its own module (e.g., `services/db.ts`).

const DB_NAME = 'GoodmanBibleDB';
const DB_VERSION = 3; // Incremented DB version for schema change
const STORES = {
  TRANSLATIONS: 'translations',
  VERSES: 'verses',
  BOOKS: 'books',
};

export interface Translation {
  id: number;
  name: string;
  status: string;
  link: string;
}

export interface Book {
    id?: number;
    translationId: number;
    bookNumber: number;
    bookName: string;
}

export interface Verse {
  id?: number;
  translationId: number;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

export type NavigationData = { book: string; bookNumber: number, chapters: number[] }[];


let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
        return resolve(db);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject(`Database error: ${(event.target as any).error}`);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as any).result as IDBDatabase;
      const tx = (event.target as any).transaction;

      if (event.oldVersion < 1) {
        dbInstance.createObjectStore(STORES.TRANSLATIONS, { keyPath: 'id', autoIncrement: true });
        const versesStore = dbInstance.createObjectStore(STORES.VERSES, { keyPath: 'id', autoIncrement: true });
        versesStore.createIndex('location', ['translationId', 'book', 'chapter'], { unique: false });
        versesStore.createIndex('book', ['translationId', 'book'], { unique: false });
      }
      if (event.oldVersion < 2) {
         if (!dbInstance.objectStoreNames.contains(STORES.BOOKS)) {
            const booksStore = dbInstance.createObjectStore(STORES.BOOKS, { keyPath: 'id', autoIncrement: true });
            booksStore.createIndex('by_translation_and_book', ['translationId', 'bookNumber'], { unique: true });
         }
      }
      if (event.oldVersion < 3) {
        const versesStore = tx.objectStore(STORES.VERSES);
        if (!versesStore.indexNames.contains('location_full')) {
          // New index for fast verse-level lookups
          versesStore.createIndex('location_full', ['translationId', 'book', 'chapter', 'verse'], { unique: false });
        }
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as any).result as IDBDatabase;
      resolve(db);
    };
  });
};

const parseAndStoreXML = async (xmlString: string, onProgress: (message: string) => void): Promise<void> => {
  const db = await initDB();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const bibleNode = xmlDoc.querySelector('bible');
  if (!bibleNode) throw new Error("Invalid XML format: <bible> tag not found.");

  const translationName = bibleNode.getAttribute('translation') || 'Unknown Translation';
  onProgress(`Importing "${translationName}"...`);

  const tx = db.transaction([STORES.TRANSLATIONS, STORES.VERSES, STORES.BOOKS], 'readwrite');
  const translationsStore = tx.objectStore(STORES.TRANSLATIONS);
  const versesStore = tx.objectStore(STORES.VERSES);
  const booksStore = tx.objectStore(STORES.BOOKS);

  const translationReq = translationsStore.add({
    name: translationName,
    status: bibleNode.getAttribute('status') || '',
    link: bibleNode.getAttribute('link') || '',
  });

  return new Promise((resolve, reject) => {
    translationReq.onsuccess = () => {
        const translationId = translationReq.result as number;
        const books = xmlDoc.querySelectorAll('book');
        let versesCount = 0;
        
        onProgress(`Found ${books.length} books. Storing verses and book names...`);

        books.forEach(bookNode => {
            const bookNum = parseInt(bookNode.getAttribute('number') || '0', 10);
            const bookName = bookNode.getAttribute('name') || `Book ${bookNum}`;
            
            // Store the book name
            booksStore.add({
                translationId,
                bookNumber: bookNum,
                bookName: bookName,
            });

            bookNode.querySelectorAll('chapter').forEach(chapterNode => {
                const chapterNum = parseInt(chapterNode.getAttribute('number') || '0', 10);
                chapterNode.querySelectorAll('verse').forEach(verseNode => {
                    const verseNum = parseInt(verseNode.getAttribute('number') || '0', 10);
                    versesStore.add({
                        translationId,
                        book: bookNum,
                        chapter: chapterNum,
                        verse: verseNum,
                        text: verseNode.textContent || ''
                    });
                    versesCount++;
                });
            });
        });
        
        tx.oncomplete = () => {
            onProgress(`Successfully imported ${versesCount} verses from "${translationName}".`);
            resolve();
        };

        tx.onerror = (event) => {
            onProgress(`Error importing bible: ${(event.target as any).error}`);
            reject((event.target as any).error);
        };
    };
    
    translationReq.onerror = (event) => {
        onProgress(`Error adding translation: ${(event.target as any).error}`);
        reject((event.target as any).error);
    };
  });
};

const getTranslations = async (): Promise<Translation[]> => {
  const db = await initDB();
  const tx = db.transaction(STORES.TRANSLATIONS, 'readonly');
  const store = tx.objectStore(STORES.TRANSLATIONS);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject((event.target as any).error);
  });
};

const getNavigationData = async (translationId: number): Promise<NavigationData> => {
    const db = await initDB();

    // 1. Get all book names for the translation into a map
    const booksTx = db.transaction(STORES.BOOKS, 'readonly');
    const booksIndex = booksTx.objectStore(STORES.BOOKS).index('by_translation_and_book');
    const booksRange = IDBKeyRange.bound([translationId, 0], [translationId, Infinity]);
    const bookMap = new Map<number, string>();

    await new Promise<void>((resolve, reject) => {
        const cursorReq = booksIndex.openCursor(booksRange);
        cursorReq.onsuccess = (event) => {
            const cursor = (event.target as any).result;
            if (cursor) {
                const book: Book = cursor.value;
                bookMap.set(book.bookNumber, book.bookName);
                cursor.continue();
            } else {
                resolve();
            }
        };
        cursorReq.onerror = (e) => reject((e.target as any).error);
    });

    // 2. Get chapter structure from verses, using the book name map
    const versesTx = db.transaction(STORES.VERSES, 'readonly');
    const versesIndex = versesTx.objectStore(STORES.VERSES).index('book');
    const bookData: Record<number, { name: string; chapters: Set<number> }> = {};
    
    return new Promise((resolve, reject) => {
        const cursorReq = versesIndex.openCursor(IDBKeyRange.bound([translationId, 0], [translationId, Infinity]));
        
        cursorReq.onsuccess = (event) => {
            const cursor = (event.target as any).result;
            if (cursor) {
                const verse: Verse = cursor.value;
                if (!bookData[verse.book]) {
                    const bookName = bookMap.get(verse.book) || `Book ${verse.book}`;
                    bookData[verse.book] = { name: bookName, chapters: new Set() };
                }
                bookData[verse.book].chapters.add(verse.chapter);
                cursor.continue();
            } else {
                const result = Object.entries(bookData).map(([bookNum, data]) => ({
                    book: data.name,
                    bookNumber: parseInt(bookNum, 10),
                    chapters: Array.from(data.chapters).sort((a,b) => a - b),
                })).sort((a,b) => a.bookNumber - b.bookNumber);
                resolve(result);
            }
        };

        cursorReq.onerror = (e) => reject((e.target as any).error);
    });
};

const getVersesForChapter = async (translationId: number, book: number, chapter: number): Promise<Verse[]> => {
    const db = await initDB();
    const tx = db.transaction(STORES.VERSES, 'readonly');
    const index = tx.objectStore(STORES.VERSES).index('location');
    const range = IDBKeyRange.only([translationId, book, chapter]);
    
    return new Promise((resolve, reject) => {
        const request = index.getAll(range);
        request.onsuccess = () => resolve(request.result.sort((a, b) => a.verse - b.verse));
        request.onerror = (event) => reject((event.target as any).error);
    });
};

const getVersesByRange = async (translationId: number, book: number, chapter: number, startVerse: number, endVerse: number): Promise<Verse[]> => {
    const db = await initDB();
    const tx = db.transaction(STORES.VERSES, 'readonly');
    const index = tx.objectStore(STORES.VERSES).index('location_full');
    const range = IDBKeyRange.bound(
        [translationId, book, chapter, startVerse],
        [translationId, book, chapter, endVerse]
    );
    
    return new Promise((resolve, reject) => {
        const request = index.getAll(range);
        request.onsuccess = () => resolve(request.result); // Already sorted by index
        request.onerror = (event) => reject((event.target as any).error);
    });
};

// --- End IndexedDB Service ---

type Selection = { book: string; bookNumber: number; chapter: number };
type View = 'reader' | 'settings';
type ViewMode = 'chapter' | 'entry';
export type Theme = 'light' | 'dark';
export type FontSize = 'sm' | 'md' | 'lg';
export type FontFamily = 'serif' | 'sans';

export interface AppSettings {
  theme: Theme;
  fontSize: FontSize;
  fontFamily: FontFamily;
  activeTranslationId: number | null;
}

const App: React.FC = () => {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('reader');
  const [viewMode, setViewMode] = useState<ViewMode>('chapter');
  
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [navigationData, setNavigationData] = useState<NavigationData>([]);
  const [importStatus, setImportStatus] = useState('');

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('goodmanBibleSettings');
      return savedSettings ? JSON.parse(savedSettings) : {
        theme: 'light',
        fontSize: 'md',
        fontFamily: 'serif',
        activeTranslationId: null,
      };
    } catch (error) {
        return {
            theme: 'light',
            fontSize: 'md',
            fontFamily: 'serif',
            activeTranslationId: null,
        };
    }
  });

  const loadTranslations = useCallback(() => {
    getTranslations().then(data => {
        setTranslations(data);
        if (!settings.activeTranslationId && data.length > 0) {
            updateSetting('activeTranslationId', data[0].id);
        } else if (settings.activeTranslationId && !data.some(t => t.id === settings.activeTranslationId)) {
            updateSetting('activeTranslationId', data.length > 0 ? data[0].id : null);
        }
    }).catch(console.error);
  }, [settings.activeTranslationId]);

  useEffect(() => {
    initDB().then(() => {
        loadTranslations();
    });
  }, [loadTranslations]);

  useEffect(() => {
    localStorage.setItem('goodmanBibleSettings', JSON.stringify(settings));
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);

    if (settings.activeTranslationId) {
        getNavigationData(settings.activeTranslationId)
            .then(data => {
                setNavigationData(data);
                if (selection && !data.some(b => b.bookNumber === selection.bookNumber)) {
                    setSelection(null);
                }
            })
            .catch(console.error);
    } else {
        setNavigationData([]);
        setSelection(null);
    }
  }, [settings, selection]);
  
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleImportBible = async (file: File) => {
    setImportStatus('Reading file...');
    const reader = new FileReader();
    reader.onload = async (e) => {
        const xmlString = e.target?.result as string;
        try {
            await parseAndStoreXML(xmlString, setImportStatus);
            loadTranslations();
        } catch (error) {
            setImportStatus(`Import failed: ${error}`);
        }
    };
    reader.readAsText(file);
  };
  
  const handleSelectChapter = (book: string, bookNumber: number, chapter: number) => {
    setSelection({ book, bookNumber, chapter });
    setViewMode('chapter');
    setIsSidebarOpen(false);
  };
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getChapterVersesCallback = useCallback((bookNumber: number, chapter: number) => {
    if (!settings.activeTranslationId) return Promise.resolve([]);
    return getVersesForChapter(settings.activeTranslationId, bookNumber, chapter);
  }, [settings.activeTranslationId]);
  
  const getVersesByRangeCallback = useCallback((bookNumber: number, chapter: number, startVerse: number, endVerse: number) => {
    if (!settings.activeTranslationId) return Promise.resolve([]);
    return getVersesByRange(settings.activeTranslationId, bookNumber, chapter, startVerse, endVerse);
  }, [settings.activeTranslationId]);

  const mainContent = () => {
    if (currentView === 'settings') {
      return <Settings 
                settings={settings} 
                setSettings={setSettings} 
                onBack={() => setCurrentView('reader')}
                translations={translations}
                onImportBible={handleImportBible}
                importStatus={importStatus}
             />;
    }

    if (viewMode === 'entry') {
        return <VerseLookup 
                    navigationData={navigationData}
                    getVersesByRange={getVersesByRangeCallback}
                    settings={settings}
                    hasBibles={translations.length > 0}
               />;
    }

    if (selection) {
      return <BibleReader 
                selection={selection} 
                settings={settings} 
                getChapterVerses={getChapterVersesCallback}
             />;
    }

    return <VerseOfTheDay hasBibles={translations.length > 0}/>;
  };

  return (
    <div className="flex flex-col min-h-screen bg-brown-50 dark:bg-brown-950">
      <Header toggleSidebar={toggleSidebar} onNavigateToSettings={() => setCurrentView('settings')} />
      <div className="flex flex-1">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onSelectChapter={handleSelectChapter} 
          navigationData={navigationData}
        />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 transition-all duration-300 w-full overflow-x-hidden">
          { currentView === 'reader' && (
            <div className="max-w-4xl mx-auto mb-6 flex justify-center">
                <div className="p-1 flex space-x-1 bg-brown-100/50 dark:bg-brown-900/50 rounded-full shadow-inner">
                    <button 
                        onClick={() => setViewMode('chapter')}
                        className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${viewMode === 'chapter' ? 'bg-white dark:bg-brown-800 shadow-md text-accent-light dark:text-brown-100' : 'text-brown-600 hover:text-brown-800 dark:text-brown-300 dark:hover:text-brown-100'}`}
                    >
                        Full Chapter
                    </button>
                    <button 
                        onClick={() => setViewMode('entry')}
                         className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${viewMode === 'entry' ? 'bg-white dark:bg-brown-800 shadow-md text-accent-light dark:text-brown-100' : 'text-brown-600 hover:text-brown-800 dark:text-brown-300 dark:hover:text-brown-100'}`}
                    >
                        Verse Lookup
                    </button>
                </div>
            </div>
          )}
          {mainContent()}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default App;