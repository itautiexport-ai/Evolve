import React, { useState } from 'react';
import { MOTIVATIONAL_QUOTES } from '../data/initialGoals';
import { RefreshCw, Sparkles } from 'lucide-react';

export const MotivationBanner: React.FC = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  };

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];

  return (
    <div className="motivation-banner glass-card">
      <div className="motivation-content">
        <div className="quote-badge">
          <Sparkles size={16} className="text-accent" />
          <span>Daily Mindset & Focus</span>
        </div>
        <blockquote className="quote-text">
          "{currentQuote.quote}"
        </blockquote>
        <cite className="quote-author">— {currentQuote.author}</cite>
      </div>

      <button 
        onClick={handleNextQuote}
        className="icon-btn quote-refresh-btn"
        title="Get another quote"
      >
        <RefreshCw size={18} />
      </button>
    </div>
  );
};
