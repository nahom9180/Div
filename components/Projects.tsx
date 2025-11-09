import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, Verse, NavigationData } from '../App';

type Selection = { book: string; bookNumber: number; chapter: number };

interface BibleReaderProps {
  selection: Selection;
  settings: AppSettings;
  getChapterVerses: (bookNumber: number, chapter: number) => Promise<Verse[]>;
}

const fontSizeClasses = {
  sm: 'text-sm sm:text-base',
  md: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl',
};

const fontFamilyClasses = {
  serif: 'font-serif',
  sans: 'font-sans',
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`p-6 sm:p-8 bg-brown-100/30 dark:bg-brown-900/30 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-brown-800/50 ${className}`}>
        {children}
    </div>
);

export const BibleReader: React.FC<BibleReaderProps> = ({ selection, settings, getChapterVerses }) => {
  const { book, bookNumber, chapter } = selection;
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selection) {
      setLoading(true);
      setError(null);
      getChapterVerses(bookNumber, chapter)
        .then(data => {
          setVerses(data);
        })
        .catch(err => {
          console.error("Failed to load verses", err);
          setError("Could not load chapter. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selection, getChapterVerses, bookNumber, chapter]);


  if (loading) {
    return (
        <div className="text-center p-8">
            <h2 className="text-2xl font-bold animate-pulse text-brown-600 dark:text-brown-300">Loading Chapter...</h2>
        </div>
    );
  }

  if (error) {
    return (
        <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600">{error}</h2>
        </div>
    );
  }

  if (verses.length === 0) {
    return (
      <Card>
        <div className="text-center">
            <h2 className="text-2xl font-bold text-brown-700 dark:text-brown-200">Chapter not found or is empty.</h2>
            <p className="text-brown-500 dark:text-brown-400">Please select a valid book and chapter.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <article className="animate-fade-in-up max-w-4xl mx-auto">
      <Card>
        <h1 className="text-4xl font-bold font-serif text-brown-800 dark:text-brown-100 mb-6 border-b-2 border-accent-light/50 dark:border-accent-dark/50 pb-4">
            {book} {chapter}
        </h1>
        <div className={`space-y-4 leading-relaxed text-brown-700 dark:text-brown-200 ${fontSizeClasses[settings.fontSize]} ${fontFamilyClasses[settings.fontFamily]}`}>
            {verses.map(({ verse, text }) => (
            <p key={verse}>
                <sup className="text-sm font-sans font-bold text-accent-light dark:text-accent-dark mr-2 opacity-90">{verse}</sup>
                {text}
            </p>
            ))}
        </div>
      </Card>
    </article>
  );
};


// --- Verse Lookup Component ---

interface VerseLookupProps {
    navigationData: NavigationData;
    getVersesByRange: (bookNumber: number, chapter: number, startVerse: number, endVerse: number) => Promise<Verse[]>;
    settings: AppSettings;
    hasBibles: boolean;
}

const parseVerseRange = (input: string): { start: number; end: number } | null => {
    input = input.trim();
    if (/^\d+$/.test(input)) {
      const verse = parseInt(input, 10);
      if (verse > 0) return { start: verse, end: verse };
    }
    if (/^\d+-\d+$/.test(input)) {
      const parts = input.split('-').map(s => parseInt(s, 10));
      if (parts[0] > 0 && parts[1] >= parts[0]) {
        return { start: parts[0], end: parts[1] };
      }
    }
    return null;
};

export const VerseLookup: React.FC<VerseLookupProps> = ({ navigationData, getVersesByRange, settings, hasBibles }) => {
    const [selectedBookNum, setSelectedBookNum] = useState<number | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
    const [verseInput, setVerseInput] = useState('');
    
    const [verses, setVerses] = useState<Verse[]>([]);
    const [lookupInfo, setLookupInfo] = useState<{book: string, chapter: number, range: string} | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const chaptersForSelectedBook = useMemo(() => {
        if (!selectedBookNum) return [];
        const book = navigationData.find(b => b.bookNumber === selectedBookNum);
        return book ? book.chapters : [];
    }, [selectedBookNum, navigationData]);

    useEffect(() => {
      // Reset chapter and verse when book changes
      setSelectedChapter(null);
      setVerseInput('');
    }, [selectedBookNum]);
    
    if (!hasBibles) {
        return (
            <div className="max-w-4xl mx-auto">
                <Card>
                    <div className="text-center p-8">
                        <h2 className="text-2xl font-bold text-brown-700 dark:text-brown-200">No Bibles Imported</h2>
                        <p className="mt-2 text-brown-500 dark:text-brown-400">Please import a Bible from the settings page to use the Verse Lookup feature.</p>
                    </div>
                </Card>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLookupInfo(null);
        setVerses([]);

        const range = parseVerseRange(verseInput);
        if (!selectedBookNum || !selectedChapter || !range) {
            setError('Please select a book, chapter, and a valid verse or range (e.g., "16" or "1-5").');
            return;
        }

        setLoading(true);
        getVersesByRange(selectedBookNum, selectedChapter, range.start, range.end)
            .then(data => {
                setVerses(data);
                if (data.length > 0) {
                    const bookName = navigationData.find(b => b.bookNumber === selectedBookNum)?.book || `Book ${selectedBookNum}`;
                    setLookupInfo({ book: bookName, chapter: selectedChapter, range: verseInput });
                } else {
                    setError('No verses found for the specified range.');
                }
            })
            .catch(err => {
                console.error("Failed to look up verses", err);
                setError("Could not look up verses. Please try again.");
            })
            .finally(() => setLoading(false));
    };

    const formStyles = "block w-full px-3 py-2.5 text-base bg-brown-100/50 dark:bg-brown-800/50 border border-brown-300/70 dark:border-brown-700/70 rounded-lg shadow-sm placeholder-brown-400 focus:outline-none focus:ring-2 focus:ring-accent-light focus:border-transparent transition-colors";

    return (
      <div className="animate-fade-in-up max-w-4xl mx-auto">
        <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <select 
                        value={selectedBookNum ?? ''} 
                        onChange={e => setSelectedBookNum(Number(e.target.value))}
                        className={formStyles}
                        aria-label="Select a Book"
                    >
                        <option value="" disabled>Select a Book</option>
                        {navigationData.map(b => <option key={b.bookNumber} value={b.bookNumber}>{b.book}</option>)}
                    </select>
                    <select 
                        value={selectedChapter ?? ''} 
                        onChange={e => setSelectedChapter(Number(e.target.value))}
                        disabled={!selectedBookNum}
                        className={formStyles}
                        aria-label="Select a Chapter"
                    >
                        <option value="" disabled>Select a Chapter</option>
                        {chaptersForSelectedBook.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input 
                        type="text" 
                        value={verseInput}
                        onChange={e => setVerseInput(e.target.value)}
                        placeholder='Verse(s) (e.g., 16)'
                        disabled={!selectedChapter}
                        className={formStyles}
                        aria-label="Enter verse or verse range"
                    />
                </div>
                {error && <p className="text-red-500 dark:text-red-400 text-sm font-medium">{error}</p>}
                <button type="submit" disabled={loading} className="w-full sm:w-auto px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-accent-light hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-light disabled:bg-opacity-50 dark:focus:ring-offset-brown-950 transition-colors">
                    {loading ? 'Looking up...' : 'Look Up Verse(s)'}
                </button>
            </form>
        </Card>

        {lookupInfo && verses.length > 0 && (
             <article className="mt-8">
                <Card>
                    <h1 className="text-4xl font-bold font-serif text-brown-800 dark:text-brown-100 mb-6 border-b-2 border-accent-light/50 dark:border-accent-dark/50 pb-4">
                        {lookupInfo.book} {lookupInfo.chapter}:{lookupInfo.range}
                    </h1>
                    <div className={`space-y-4 leading-relaxed text-brown-700 dark:text-brown-200 ${fontSizeClasses[settings.fontSize]} ${fontFamilyClasses[settings.fontFamily]}`}>
                        {verses.map(({ verse, text }) => (
                        <p key={verse}>
                            <sup className="text-sm font-sans font-bold text-accent-light dark:text-accent-dark mr-2 opacity-90">{verse}</sup>
                            {text}
                        </p>
                        ))}
                    </div>
                </Card>
            </article>
        )}
      </div>
    );
};