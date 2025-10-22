import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const esgFacts = [
    "Recycling one aluminum can saves enough energy to run a TV for 3 hours.",
    "Over 75% of all aluminum ever produced is still in use today.",
    "Glass is infinitely recyclable and never wears out.",
    "Recycling a ton of paper saves 17 mature trees.",
    "Plastic bags can take up to 1,000 years to decompose in a landfill.",
    "The energy saved from recycling one glass bottle can power a 100-watt bulb for 4 hours.",
    "AI-powered solutions can help companies track and reduce their carbon footprint.",
    "Proper waste management reduces greenhouse gas emissions and protects ecosystems.",
];

const GeneratingAILoader = ({ isLoading, onCancel }) => {
    const [fact, setFact] = useState(esgFacts[0]);

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setFact(prevFact => {
                    const currentIndex = esgFacts.indexOf(prevFact);
                    const nextIndex = (currentIndex + 1) % esgFacts.length;
                    return esgFacts[nextIndex];
                });
            }, 3000); // Change fact every 3 seconds

            return () => clearInterval(interval);
        }
    }, [isLoading]);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-3xl 
        shadow-[0_10px_30px_rgba(0,0,0,0.15)]
        p-8 flex flex-col items-center gap-4 w-full max-w-sm text-center 
        transition-all duration-300
        border border-transparent
        before:absolute before:inset-0 before:rounded-3xl before:border before:border-gradient-to-r before:from-[#007E33] before:via-[#00C853] before:to-[#00E676]
        before:blur-lg before:-z-10"
            >
                {/* Professional Icon Above Title */}
                <Sparkles className="h-10 w-10 text-transparent bg-clip-text bg-gradient-to-r from-[#007E33] via-[#00C853] to-[#00E676]" />

                {/* Gradient Loader */}
                {/* <Loader2 className="h-12 w-12 animate-spin text-transparent bg-clip-text bg-gradient-to-r from-[#007E33] via-[#00C853] to-[#00E676]" /> */}

                {/* Title */}
                <h2 className="text-xl font-semibold text-gray-900">Generating AI...</h2>

                {/* Fact Text with Gradient Accent */}
                <p className="text-sm text-gray-700 transition-opacity duration-500">
                    <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#007E33] via-[#00C853] to-[#00E676]">
                        Did you know?
                    </span> {fact}
                </p>
            </div>
        </div>
    );
};

export default GeneratingAILoader;