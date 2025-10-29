import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Define supported languages
const languages = [
    { code: 'en', name: 'English'},
    { code: 'vi', name: 'Tiếng Việt'},
    { code: 'zh', name: '中文'},
    { code: 'my', name: 'မြန်မာ'},
    { code: 'th', name: 'ไทย'},
];

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const currentLanguage = languages.some(lang => lang.code === i18n.language)
        ? i18n.language
        : 'en';

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const currentLang = languages.find(l => l.code === currentLanguage);

    return (
        <Select value={currentLanguage} onValueChange={changeLanguage}>
            <SelectTrigger
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white
                   text-gray-700 hover:text-green-700 shadow-sm hover:shadow-md transition-all duration-200
                   focus:ring-2 focus:ring-green-500/20 focus:outline-none w-auto"
            >
                <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-600" />
                    <span className="hidden sm:block font-medium">
                        {currentLang?.flag} {currentLang?.name}
                    </span>
                    <span className="block sm:hidden uppercase">{currentLang?.code}</span>
                </div>
            </SelectTrigger>

            <AnimatePresence>
                <SelectContent
                    align="end"
                    className="rounded-xl border border-gray-100 shadow-lg bg-white overflow-hidden"
                >
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        {languages.map((lang) => (
                            <SelectItem
                                key={lang.code}
                                value={lang.code}
                                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span>{lang.name}</span>
                            </SelectItem>
                        ))}
                    </motion.div>
                </SelectContent>
            </AnimatePresence>
        </Select>
    );
};

export default LanguageSwitcher;