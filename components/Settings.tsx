import React from 'react';
import { AppSettings, Translation } from '../App';
import { XIcon, UploadIcon } from './icons';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onBack: () => void;
  translations: Translation[];
  onImportBible: (file: File) => void;
  importStatus: string;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings, onBack, translations, onImportBible, importStatus }) => {

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportBible(file);
    }
  };

  const optionPillClasses = (isActive: boolean) => 
    `relative px-4 py-2 rounded-full text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-light dark:focus:ring-offset-brown-900 ${
      isActive
        ? 'bg-white text-accent-light dark:text-brown-50 shadow-sm dark:bg-brown-700'
        : 'text-brown-600 hover:text-brown-800 dark:text-brown-300 dark:hover:text-brown-100'
    }`;
  
  const formSelectStyles = "mt-1 block w-full pl-3 pr-10 py-2.5 text-base bg-white dark:bg-brown-800 border-brown-300 dark:border-brown-700 focus:outline-none focus:ring-2 focus:ring-accent-light sm:text-sm rounded-md transition-colors";

  return (
    <div className="animate-fade-in-up max-w-2xl mx-auto">
      <div className="p-6 sm:p-8 bg-brown-100/30 dark:bg-brown-900/30 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-brown-800/50">
        <div className="flex justify-between items-center mb-6 border-b border-brown-200/80 dark:border-brown-800/80 pb-4">
          <h1 className="text-3xl font-bold font-serif text-brown-800 dark:text-brown-100">
            Settings
          </h1>
          <button onClick={onBack} className="p-2 rounded-full hover:bg-brown-200/70 dark:hover:bg-brown-800/70" aria-label="Close settings">
            <XIcon className="text-brown-700 dark:text-brown-200"/>
          </button>
        </div>

        <div className="space-y-8">
          {/* Data Management */}
          <div className="p-6 bg-brown-100/30 dark:bg-brown-900/30 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-brown-700 dark:text-brown-200">Data Management</h2>
              <div className="space-y-4">
                  <div>
                      <h3 className="text-md font-medium mb-2 text-brown-600 dark:text-brown-300">Import New Bible</h3>
                      <label htmlFor="bible-upload" className="flex flex-col items-center px-4 py-8 bg-brown-50/50 dark:bg-brown-800/50 text-brown-500 dark:text-brown-300 rounded-lg shadow-sm tracking-wide border-2 border-dashed border-brown-300 dark:border-brown-700 cursor-pointer hover:bg-brown-100/70 dark:hover:bg-brown-800/80 hover:border-accent-light dark:hover:border-accent-dark transition-all duration-200">
                          <UploadIcon className="w-10 h-10 mb-2" />
                          <span className="text-base leading-normal font-semibold">Select an XML file</span>
                          <span className="text-sm">or drag and drop</span>
                      </label>
                      <input id="bible-upload" type="file" accept=".xml" className="hidden" onChange={handleFileChange} />
                      {importStatus && <p className="mt-2 text-sm text-brown-600 dark:text-brown-200">{importStatus}</p>}
                  </div>
                  <div>
                      <h3 className="text-md font-medium mb-2 text-brown-600 dark:text-brown-300">Active Translation</h3>
                      {translations.length > 0 ? (
                          <select
                              value={settings.activeTranslationId ?? ''}
                              onChange={(e) => updateSetting('activeTranslationId', parseInt(e.target.value, 10))}
                              className={formSelectStyles}
                          >
                          {translations.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                          </select>
                      ) : (
                          <p className="text-sm text-brown-500 dark:text-brown-300 mt-2 px-3 py-2 bg-brown-100 dark:bg-brown-800/50 rounded-md">No Bibles have been imported yet.</p>
                      )}
                  </div>
              </div>
          </div>

          {/* --- Display Settings --- */}
          <div className="p-6 bg-brown-100/30 dark:bg-brown-900/30 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-brown-700 dark:text-brown-200">Display Settings</h2>
              <div className="space-y-6">
                  <div>
                  <h3 className="text-md font-medium mb-2 text-brown-600 dark:text-brown-300">Theme</h3>
                  <div className="flex space-x-2 bg-brown-200/60 dark:bg-brown-800/60 rounded-full p-1">
                      <button onClick={() => updateSetting('theme', 'light')} className={optionPillClasses(settings.theme === 'light')}>Light</button>
                      <button onClick={() => updateSetting('theme', 'dark')} className={optionPillClasses(settings.theme === 'dark')}>Dark</button>
                  </div>
                  </div>

                  <div>
                  <h3 className="text-md font-medium mb-2 text-brown-600 dark:text-brown-300">Reader Font Size</h3>
                  <div className="flex space-x-2 bg-brown-200/60 dark:bg-brown-800/60 rounded-full p-1">
                      <button onClick={() => updateSetting('fontSize', 'sm')} className={optionPillClasses(settings.fontSize === 'sm')}>Small</button>
                      <button onClick={() => updateSetting('fontSize', 'md')} className={optionPillClasses(settings.fontSize === 'md')}>Medium</button>
                      <button onClick={() => updateSetting('fontSize', 'lg')} className={optionPillClasses(settings.fontSize === 'lg')}>Large</button>
                  </div>
                  </div>
                  
                  <div>
                  <h3 className="text-md font-medium mb-2 text-brown-600 dark:text-brown-300">Reader Font Family</h3>
                  <div className="flex space-x-2 bg-brown-200/60 dark:bg-brown-800/60 rounded-full p-1">
                      <button onClick={() => updateSetting('fontFamily', 'serif')} className={`${optionPillClasses(settings.fontFamily === 'serif')} font-serif`}>Serif</button>
                      <button onClick={() => updateSetting('fontFamily', 'sans')} className={`${optionPillClasses(settings.fontFamily === 'sans')} font-sans`}>Sans-Serif</button>
                  </div>
                  </div>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;