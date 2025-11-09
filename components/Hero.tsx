import React from 'react';
import { SettingsIcon } from './icons';

interface VerseOfTheDayProps {
    hasBibles: boolean;
}

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`p-8 sm:p-12 bg-brown-100/30 dark:bg-brown-900/30 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-brown-800/50 ${className}`}>
        {children}
    </div>
);


const VerseOfTheDay: React.FC<VerseOfTheDayProps> = ({ hasBibles }) => {
  if (!hasBibles) {
    return (
      <section id="welcome" className="flex items-center justify-center h-full animate-fade-in-up">
        <div className="max-w-3xl mx-auto text-center">
            <Card>
              <h2 className="text-3xl font-bold text-brown-800 dark:text-brown-100 mb-4">
                Welcome to Goodman Bible
              </h2>
              <p className="text-lg text-brown-600 dark:text-brown-300 mb-6">
                It looks like you don't have any Bibles imported yet. Please go to the settings page to import an XML Bible file to begin reading.
              </p>
              <div className="flex justify-center">
                 <div className="text-center p-4 rounded-lg bg-brown-100/50 dark:bg-brown-800/50">
                    <p className="mb-2 font-semibold text-sm">Click the settings icon in the top-right corner.</p>
                    <SettingsIcon className="h-8 w-8 text-accent-light mx-auto" />
                 </div>
              </div>
            </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="home" className="flex items-center justify-center h-full animate-fade-in-up">
      <div className="max-w-3xl mx-auto text-center">
        <Card>
            <h2 className="text-2xl font-semibold text-brown-600 dark:text-brown-300 mb-4 tracking-wide">
              Verse of the Day
            </h2>
            <blockquote className="text-3xl md:text-4xl font-serif text-brown-800 dark:text-brown-50 leading-relaxed">
              <p>"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."</p>
            </blockquote>
            <cite className="block text-right mt-4 text-xl font-sans font-semibold text-accent-light dark:text-accent-dark">
              John 3:16
            </cite>
        </Card>
      </div>
    </section>
  );
};

export default VerseOfTheDay;