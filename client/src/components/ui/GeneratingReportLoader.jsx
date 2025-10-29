import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const recyclingFacts = [
    "Recycling one aluminum can saves enough energy to run a TV for 3 hours.",
    "Glass is infinitely recyclable and never wears out.",
    "Nearly 90% of plastic bottles are not recycled.",
    "Recycling a ton of paper saves 17 mature trees.",
    "The energy saved from recycling one glass bottle can power a 100-watt bulb for 4 hours.",
    "Over 75% of all aluminum ever produced is still in use today.",
    "Plastic bags can take up to 1,000 years to decompose in a landfill.",
    "Recycling electronics helps recover valuable materials like gold and copper.",
];

const GeneratingReportLoader = ({ isLoading, onCancel }) => {
    const [fact, setFact] = useState(recyclingFacts[0]);

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setFact(prevFact => {
                    const currentIndex = recyclingFacts.indexOf(prevFact);
                    const nextIndex = (currentIndex + 1) % recyclingFacts.length;
                    return recyclingFacts[nextIndex];
                });
            }, 3000); // Change fact every 3 seconds

            return () => clearInterval(interval);
        }
    }, [isLoading]);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 w-full max-w-sm text-center">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-800">Generating Report...</h2>
                <p className="text-sm text-gray-600 transition-opacity duration-500">
                    <span className="font-semibold">Did you know?</span> {fact}
                </p>
            </div>
        </div>
    );
};

export default GeneratingReportLoader;