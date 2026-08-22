import React, { useState, useEffect } from 'react';
import { EvolveLogo } from './EvolveLogo';
import { DailyAffirmation } from './DailyAffirmation';
import type { User, MasterItem, Goal } from '../types/goal';
// Unused icon imports removed to prevent lint errors

const MOTIVATIONAL_QUOTES = [
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "Act as if what you do makes a difference. It does.", author: "William James" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
  { quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { quote: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { quote: "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.", author: "Roy T. Bennett" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" }
];

interface EvolveHomePageProps {
  currentUser: User;
  masters: MasterItem[];
  goals: Goal[];
  setActiveNav: (nav: string) => void;
  logoUrl?: string;
  onOpenAuthModal: () => void;
}

export const EvolveHomePage: React.FC<EvolveHomePageProps> = ({
  logoUrl,
}) => {
  const [timeString, setTimeString] = useState('');
  const [greeting, setGreeting] = useState('Happy Morning!');
  const [greetingEmoji, setGreetingEmoji] = useState('🌅');

  // Determine Quote of the Day dynamically based on the current day of the year
  const [quoteOfTheDay] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % MOTIVATIONAL_QUOTES.length;
    return MOTIVATIONAL_QUOTES[index];
  });

  // Live Date & Time Clock matching screenshot: "Friday, August 7, 2026 • 11:57:45 AM"
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();

      if (hours >= 5 && hours < 12) {
        setGreeting('Happy Morning!');
        setGreetingEmoji('🌅');
      } else if (hours >= 12 && hours < 17) {
        setGreeting('Happy Afternoon!');
        setGreetingEmoji('☀️');
      } else {
        setGreeting('Happy Evening!');
        setGreetingEmoji('🌙');
      }

      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      const datePart = now.toLocaleDateString('en-US', options);
      const timePart = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
      });

      setTimeString(`${datePart} • ${timePart}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="screenshot-homepage-container">
      {/* Hero Welcome Card matching screenshot */}
      <div className="hero-welcome-card">
        <div className="hero-card-content">
          {/* Centered Logo Box */}
          <div className="hero-centered-logo">
            <EvolveLogo logoUrl={logoUrl} />
          </div>

          {/* Greeting Title */}
          <h1 className="hero-greeting-title">
            {greeting} <span className="greeting-emoji">{greetingEmoji}</span>
          </h1>

          {/* Welcome Back Subtitle */}
          <h2 className="hero-welcome-name">
            Welcome back, System Admin, this is admin page
          </h2>

          {/* Live Date & Time Stamp */}
          <div className="hero-datetime-stamp">
            {timeString || 'Friday, August 7, 2026 • 11:57:45 AM'}
          </div>

          {/* Divider */}
          <div className="quote-divider" />

          {/* Daily Quote Section */}
          <div className="hero-quote-container">
            <p className="hero-quote-text">"{quoteOfTheDay.quote}"</p>
            <p className="hero-quote-author">— {quoteOfTheDay.author}</p>
          </div>
        </div>
      </div>

      {/* Daily Affirmation Video Section */}
      <DailyAffirmation />
    </div>
  );
};
