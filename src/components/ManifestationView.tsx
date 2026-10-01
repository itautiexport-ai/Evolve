import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Image as ImageIcon, CheckCircle, Trophy, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'evolve_manifestation_module_v3';

const MANIFESTATION_QUOTES = [
  "The Universe is listening. What you seek is seeking you.",
  "Your dreams are already in motion. Keep trust in the timing.",
  "Everything is falling into place. Maintain your vibration high.",
  "What you focus on grows. Direct your energy toward your target.",
  "You are capable of manifesting magic. Keep walking with belief.",
  "The cosmos supports your vision. Stand tall and manifest.",
  "Active patience is key. Your creation is loading right now.",
  "Align your heart and thoughts. Watch the universe respond.",
  "Believe in the power of your intentions. Great things are coming.",
  "A clean mind manifests instantly. Breathe and release doubts.",
  "You are the painter of your reality. Boldly design your dream.",
  "Trust the universe. Everything is unfolding for your highest good."
];

export const ManifestationView: React.FC = () => {
  const [current, setCurrent] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.current) return parsed.current;
      } catch (e) {
        console.error(e);
      }
    }
    return {
      title: '',
      imageUrl: '',
      startDate: null as string | null,
      isAccomplished: false,
      accomplishDate: null as string | null,
      daysToAchieve: null as number | null
    };
  });

  const [accomplishedList, setAccomplishedList] = useState<any[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.accomplishedList) return parsed.accomplishedList;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [dailyQuote, setDailyQuote] = useState('');
  const [isWaving, setIsWaving] = useState(false);

  useEffect(() => {
    const day = new Date().getDate();
    const quote = MANIFESTATION_QUOTES[day % MANIFESTATION_QUOTES.length];
    setDailyQuote(quote);
  }, []);

  const saveToStorage = (curr: any, list: any[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ current: curr, accomplishedList: list }));
  };

  const playChimeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      
      gain1.gain.setValueAtTime(0.001, ctx.currentTime);
      if (gain1.gain.linearRampToValueAtTime) {
        gain1.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      } else {
        gain1.gain.setValueAtTime(0.25, ctx.currentTime + 0.05);
      }
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, ctx.currentTime);
      
      gain2.gain.setValueAtTime(0.001, ctx.currentTime);
      if (gain2.gain.linearRampToValueAtTime) {
        gain2.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      } else {
        gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.05);
      }
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(ctx.currentTime + 1.3);
      osc2.stop(ctx.currentTime + 0.9);
    } catch (e) {
      console.warn('AudioContext initialization failed:', e);
    }
  };

  const getDaysElapsed = (startDateStr: string | null) => {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr);
    const today = new Date();
    start.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const next = { ...current, imageUrl: reader.result as string };
        setCurrent(next);
        saveToStorage(next, accomplishedList);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartManifesting = () => {
    if (!current.title.trim()) {
      alert("Please enter what you want to manifest, bestie! 💫");
      return;
    }
    if (!current.imageUrl) {
      alert("Please upload a poster image to visualize your dream! 📸");
      return;
    }
    playChimeSound();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    const next = {
      ...current,
      startDate: new Date().toISOString().split('T')[0],
      isAccomplished: false,
      accomplishDate: null,
      daysToAchieve: null
    };
    setCurrent(next);
    saveToStorage(next, accomplishedList);
  };

  const handleWaveWand = () => {
    setIsWaving(true);
    playChimeSound();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 }
    });
    setTimeout(() => setIsWaving(false), 1000);
  };

  const handleAccomplish = () => {
    playChimeSound();
    confetti({
      particleCount: 150,
      spread: 85,
      origin: { y: 0.5 }
    });
    
    const daysElapsed = getDaysElapsed(current.startDate) + 1;
    const accomplishedItem = {
      ...current,
      isAccomplished: true,
      accomplishDate: new Date().toISOString().split('T')[0],
      daysToAchieve: daysElapsed
    };

    const nextCurrent = {
      ...current,
      isAccomplished: true,
      accomplishDate: accomplishedItem.accomplishDate,
      daysToAchieve: daysElapsed
    };

    const nextList = [accomplishedItem, ...accomplishedList];

    setCurrent(nextCurrent);
    setAccomplishedList(nextList);
    saveToStorage(nextCurrent, nextList);
  };

  const handleResetForNew = () => {
    const next = {
      title: '',
      imageUrl: '',
      startDate: null,
      isAccomplished: false,
      accomplishDate: null,
      daysToAchieve: null
    };
    setCurrent(next);
    saveToStorage(next, accomplishedList);
  };

  const daysElapsed = current.startDate ? getDaysElapsed(current.startDate) + 1 : 0;

  return (
    <div className="manifestation-module-container">
      <div className="pinterest-scrapbook-paper manifestation-paper">
        {/* Animated Background Sparkle Charms */}
        <Sparkles className="sparkle-charm s1" style={{ position: 'absolute', top: '30px', left: '40px' }} size={24} />
        <Sparkles className="sparkle-charm s2" style={{ position: 'absolute', top: '70px', right: '50px' }} size={32} />
        <Sparkles className="sparkle-charm s3" style={{ position: 'absolute', bottom: '40px', left: '80px' }} size={20} />

        {/* Dynamic Header */}
        <div className="manifestation-header">
          <h1 className="pinterest-vision-title">
            <span onClick={handleWaveWand} title="Click to wave magic wand!" style={{ display: 'inline-flex', cursor: 'pointer' }}>
              <Wand2 
                className={`magic-wand-icon ${isWaving ? 'wave-active' : ''}`}
                size={36} 
              />
            </span>
            <span>MANIFEST MY DESTINY</span>
          </h1>
          <p className="pinterest-vision-subtitle">
            Focus on one major dream. Visualize it, track it, and let the universe do the rest.
          </p>
        </div>

        {/* Main Content Split: Form or Active Poster */}
        {!current.startDate ? (
          /* SETUP STATE: Set up a new manifestation */
          <div className="manifestation-setup-layout">
            <div className="manifestation-form-card">
              <h2 className="setup-card-title">What is your next major dream? 🌌</h2>
              
              <div className="form-group">
                <label className="form-label">Write your manifestation in detail:</label>
                <input
                  type="text"
                  placeholder="I want to manifest..."
                  value={current.title}
                  onChange={(e) => setCurrent({ ...current, title: e.target.value })}
                  className="manifestation-setup-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Upload a Visualization Poster:</label>
                <div 
                  className="manifest-upload-zone"
                  onClick={() => document.getElementById('manifest-img-picker')?.click()}
                >
                  {current.imageUrl ? (
                    <div className="manifest-upload-preview-container">
                      <img src={current.imageUrl} alt="Preview" className="manifest-upload-preview" />
                      <span className="manifest-upload-overlay-text">Click to change poster</span>
                    </div>
                  ) : (
                    <div className="manifest-upload-prompt">
                      <ImageIcon size={36} className="upload-icon" />
                      <span>Choose a Pinteresty Poster Image</span>
                    </div>
                  )}
                  <input
                    id="manifest-img-picker"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <button
                onClick={handleStartManifesting}
                className="pinterest-manifest-btn start-manifest-btn"
              >
                <Sparkles size={18} />
                <span>Manifest this dream! ✨</span>
              </button>
            </div>
          </div>
        ) : current.isAccomplished ? (
          /* ACCOMPLISHED CELEBRATION STATE: Trophy screen */
          <div className="manifestation-accomplished-layout">
            <div className="accomplished-trophy-card">
              <Trophy className="big-trophy-badge animate-trophy-pulse" size={72} />
              <h2 className="accomplished-main-title">IT HAPPENED! 🎉</h2>
              <div className="accomplished-poster-mini">
                <img src={current.imageUrl} alt={current.title} className="mini-poster-img" />
              </div>
              <p className="accomplished-details-text">
                Your manifestation: <strong className="accomplished-dream-highlight">"{current.title}"</strong> has become reality!
              </p>
              <div className="accomplished-stats-pill">
                Achieved in {current.daysToAchieve} {current.daysToAchieve === 1 ? 'day' : 'days'}! 🏆
              </div>

              <div className="lets-manifest-block">
                <h3 className="lets-manifest-title">Let's manifest something new! 🌟</h3>
                <button 
                  onClick={handleResetForNew}
                  className="pinterest-manifest-btn reset-btn"
                >
                  <RefreshCw size={16} />
                  <span>Start New Manifestation</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE MANIFESTATION STATE: Displays the poster, quotes, and days elapsed */
          <div className="manifestation-active-layout">
            <div className="manifest-poster-polaroid-card">
              <div className="pinterest-washitape sky-tape" style={{ top: '-14px', width: '120px' }} />
              <div className="pinterest-pushpin rose" />
              
              <div className="active-poster-img-container">
                <img src={current.imageUrl} alt={current.title} className="active-poster-img" />
              </div>

              <div className="active-poster-details">
                <h2 className="active-poster-title">"{current.title}"</h2>
                <div className="active-days-counter">
                  Universe is listening... Day {daysElapsed} of manifesting this dream ✨
                </div>
              </div>
            </div>

            {/* Daily cosmic messages */}
            <div className="daily-cosmic-message-card">
              <div className="pinterest-pushpin gold" style={{ top: '-8px' }} />
              <span className="cosmic-card-label">🌌 Daily Cosmic Whisper</span>
              <p className="cosmic-quote-text">"{dailyQuote}"</p>
              <span className="cosmic-sub-text">Hold the feeling, keep the faith. It's loading.</span>
            </div>

            {/* Accomplish Button */}
            <div className="active-controls-panel">
              <button
                onClick={handleAccomplish}
                className="pinterest-manifest-btn accomplish-btn"
              >
                <CheckCircle size={18} />
                <span>Mark as Accomplished! 🏆</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
