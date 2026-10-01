import React, { useState } from 'react';
import type { Goal } from '../types/goal';
import { Sparkles, Printer, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VisionBoardViewProps {
  goals: Goal[];
  onOpenJournal: (goal: Goal) => void;
}

const CATEGORIES = [
  { key: 'spirituality', label: 'Spirituality', icon: '✨', defaultImg: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80', defaultAspiration: 'Nurture my soul daily' },
  { key: 'finances', label: 'Money & Finances', icon: '💰', defaultImg: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80', defaultAspiration: 'Build financial freedom' },
  { key: 'career', label: 'Career & Work', icon: '💼', defaultImg: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', defaultAspiration: 'Level up in my craft' },
  { key: 'health', label: 'Health & Fitness', icon: '🧘', defaultImg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80', defaultAspiration: 'Strong mind, healthy body' },
  { key: 'recreation', label: 'Fun & Recreation', icon: '🎈', defaultImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', defaultAspiration: 'Adventure awaits!' },
  { key: 'environment', label: 'Environment', icon: '🏡', defaultImg: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=800&q=80', defaultAspiration: 'Organized & peaceful home space' },
  { key: 'community', label: 'Community', icon: '🤝', defaultImg: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80', defaultAspiration: 'Give back & stay connected' },
  { key: 'family', label: 'Family & Friends', icon: '👨‍👩‍👧‍👦', defaultImg: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80', defaultAspiration: 'Deepen family bonds' },
  { key: 'love', label: 'Partner & Love', icon: '❤️', defaultImg: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80', defaultAspiration: 'Choose love and empathy' },
  { key: 'growth', label: 'Personal Growth & Learning', icon: '🌱', defaultImg: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80', defaultAspiration: 'Read 20 books & learn constantly' }
];

export const VisionBoardView: React.FC<VisionBoardViewProps> = () => {
  const [boardData, setBoardData] = useState<{
    [key: string]: { imageUrl: string; aspiration: string };
  }>(() => {
    const saved = localStorage.getItem('evolve_vision_board_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Safety Clean: Remove any old generated URLs to migrate to the new Ghibli Art engine
        let modified = false;
        Object.keys(parsed).forEach(k => {
          if (parsed[k]?.imageUrl && parsed[k].imageUrl.startsWith('http')) {
            parsed[k].imageUrl = '';
            modified = true;
          }
        });
        if (modified) {
          localStorage.setItem('evolve_vision_board_v3', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse vision board storage:", e);
      }
    }
    const initial: any = {};
    CATEGORIES.forEach(c => {
      initial[c.key] = {
        imageUrl: '',
        aspiration: ''
      };
    });
    return initial;
  });

  const [centerQuote, setCenterQuote] = useState(() => {
    return localStorage.getItem('evolve_vision_center_quote') || 'Ready to manifest my main character energy and level up!';
  });

  const [loadedKeys, setLoadedKeys] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem('evolve_vision_board_v3');
    const initial: any = {};
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(k => {
          if (parsed[k]?.imageUrl) {
            initial[k] = true;
          }
        });
      } catch {}
    }
    return initial;
  });

  const [imageErrorKeys, setImageErrorKeys] = useState<{ [key: string]: boolean }>({});
  const [isCollageView, setIsCollageView] = useState<boolean>(() => {
    return localStorage.getItem('evolve_vision_board_completed') === 'true';
  });
  const [activeStep, setActiveStep] = useState<number>(0);
  const lastGeneratedRef = React.useRef<{ [key: string]: string }>({});
  const [retryCounts, setRetryCounts] = useState<{ [key: string]: number }>({});
  const [boardOwner, setBoardOwner] = useState<string>(() => {
    return localStorage.getItem('evolve_vision_board_owner') || 'My';
  });
  
  const getRenderImageUrl = (key: string, baseUrl: string) => {
    if (!baseUrl) return '';
    const retry = retryCounts[key] || 0;
    if (retry > 0) {
      return `${baseUrl}&retry=${retry}`;
    }
    return baseUrl;
  };

  const handleImageError = (key: string) => {
    const currentRetries = retryCounts[key] || 0;
    if (currentRetries < 4) {
      setTimeout(() => {
        setRetryCounts(prev => ({ ...prev, [key]: currentRetries + 1 }));
      }, 2500);
    } else {
      setImageErrorKeys(prev => ({ ...prev, [key]: true }));
    }
  };

  const getGhibliPrompt = (key: string, text: string): string => {
    const query = text.toLowerCase().trim();
    
    // Base Ghibli styling tokens
    const styleSuffix = ", beautiful cozy Studio Ghibli anime illustration, warm sunbeams, soft pastel colors, detailed hand-drawn aesthetic, clean and safe, high quality";
    
    // 1. Baby/Child goals (Specifically human babies)
    if (query.includes('baby') || query.includes('child') || query.includes('kid') || query.includes('born') || query.includes('infant')) {
      return "a cute chubby human baby smiling and sleeping peacefully in a cozy warm wooden crib surrounded by soft toys" + styleSuffix;
    }
    
    // 2. Car/Vehicles
    if (query.includes('car') || query.includes('vehicle') || query.includes('drive')) {
      let carColor = "vintage aesthetic";
      if (query.includes('blue')) carColor = "vintage blue";
      if (query.includes('red')) carColor = "vintage red";
      if (query.includes('black')) carColor = "vintage black";
      return `a cozy classic ${carColor} car parked on a scenic countryside road surrounded by cherry blossoms and wild flowers` + styleSuffix;
    }
    
    // 3. Relationships/Love/Friends/Family (like "only be with people who love me")
    if (query.includes('love me') || query.includes('friends') || query.includes('family') || query.includes('partner') || query.includes('love') || key === 'love' || key === 'community' || key === 'family') {
      return "a warm happy group of friends or family sharing a meal and laughing together in a cozy dining room, peaceful atmosphere" + styleSuffix;
    }
    
    // 4. Finances/Money (like "rich", "millionaire", "house")
    if (key === 'finances' || query.includes('money') || query.includes('rich') || query.includes('million') || query.includes('buy') || query.includes('earn')) {
      if (query.includes('house') || query.includes('home') || query.includes('apartment')) {
        return "a beautiful cozy cottage home with a lovely flower garden, warm light coming from the windows" + styleSuffix;
      }
      return "a wooden writing desk with gold coins, a retro ledger, and a cup of warm tea by a sunny window, prosperous vibes" + styleSuffix;
    }
    
    // 5. Career/Work/Success
    if (key === 'career' || query.includes('job') || query.includes('career') || query.includes('work') || query.includes('office') || query.includes('promotion')) {
      return "a cozy artistic studio workspace with drawing boards, notebooks, plants, and sunlight streaming through a large window" + styleSuffix;
    }
    
    // 6. Health/Fitness/Meditation
    if (key === 'health' || query.includes('meditate') || query.includes('fit') || query.includes('run') || query.includes('health') || query.includes('yoga')) {
      return "a peaceful person sitting in meditation next to a serene lake under a giant cherry blossom tree, tranquil atmosphere" + styleSuffix;
    }
    
    // 7. Fun/Recreation/Travel
    if (key === 'recreation' || query.includes('travel') || query.includes('trip') || query.includes('explore') || query.includes('vacation')) {
      return "a traveler with a backpack looking at a beautiful green valley with rolling hills and a winding path under a blue sky" + styleSuffix;
    }

    // 8. Spirituality/Peace
    if (key === 'spirituality' || query.includes('peace') || query.includes('soul') || query.includes('god')) {
      return "a gentle glowing lantern on a stone path leading into a mystical ancient forest, starry night sky" + styleSuffix;
    }

    // 9. Environment/Home
    if (key === 'environment' || query.includes('room') || query.includes('clean') || query.includes('peaceful')) {
      return "a beautifully organized sunlit living room with green plants, cozy bookshelves, and a sleeping cat on the rug" + styleSuffix;
    }

    // Fallback translation: Combine their input with Ghibli styling
    return `${text}, beautiful cozy Studio Ghibli style anime illustration, warm lighting, pastel tones` + styleSuffix;
  };

  const triggerAutoImage = (key: string, aspirationText: string) => {
    const trimmed = aspirationText.trim();
    if (!trimmed) {
      setBoardData(prev => {
        const next = {
          ...prev,
          [key]: {
            ...prev[key],
            imageUrl: ''
          }
        };
        localStorage.setItem('evolve_vision_board_v3', JSON.stringify(next));
        return next;
      });
      return;
    }

    setLoadedKeys(prev => ({ ...prev, [key]: false }));
    setImageErrorKeys(prev => ({ ...prev, [key]: false }));

    const prompt = getGhibliPrompt(key, trimmed);
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${seed}`;

    setBoardData(prev => {
      const next = {
        ...prev,
        [key]: {
          ...prev[key],
          imageUrl: imageUrl
        }
      };
      localStorage.setItem('evolve_vision_board_v3', JSON.stringify(next));
      return next;
    });
  };

  React.useEffect(() => {
    // Proactively resolve stock images on mount for any existing aspirations that don't have an image
    Object.keys(boardData).forEach(key => {
      const item = boardData[key];
      if (item && item.aspiration) {
        lastGeneratedRef.current[key] = item.aspiration.trim();
        if (!item.imageUrl) {
          triggerAutoImage(key, item.aspiration);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-generation on text input change inside wizard
  const currentKey = (activeStep > 0 && activeStep < 11) ? CATEGORIES[activeStep - 1].key : null;
  const currentAspiration = currentKey ? (boardData[currentKey]?.aspiration || '') : '';

  React.useEffect(() => {
    if (!currentKey || !currentAspiration || currentAspiration.trim() === '') return;

    if (lastGeneratedRef.current[currentKey] === currentAspiration.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      lastGeneratedRef.current[currentKey] = currentAspiration.trim();
      triggerAutoImage(currentKey, currentAspiration);
    }, 1500); // 1.5 seconds debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAspiration, currentKey]);

  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleImageChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLoadedKeys(prev => ({ ...prev, [key]: true }));
        setImageErrorKeys(prev => ({ ...prev, [key]: false }));
        setBoardData(prev => {
          const next = {
            ...prev,
            [key]: {
              ...prev[key],
              imageUrl: reader.result as string
            }
          };
          localStorage.setItem('evolve_vision_board_v3', JSON.stringify(next));
          return next;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAspirationChangeLocal = (key: string, value: string) => {
    setBoardData(prev => {
      const next = {
        ...prev,
        [key]: {
          ...prev[key],
          aspiration: value
        }
      };
      localStorage.setItem('evolve_vision_board_v3', JSON.stringify(next));
      return next;
    });
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

  const handlePrint = () => {
    playChimeSound();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      window.print();
    }, 450);
  };

  const handleOpenPreview = () => {
    playChimeSound();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 }
    });
    setIsPreviewOpen(true);
  };

  const handleConfirmManifest = () => {
    playChimeSound();
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    const targetYear = new Date().getFullYear();
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Pop-up blocked! Please allow pop-ups for Evolve to view your vision board.');
      setIsPromptOpen(false);
      return;
    }

    const boardTitle = boardOwner.trim().toLowerCase() === 'my' || !boardOwner.trim()
      ? `MY ${targetYear} VISION CANVAS`
      : `${boardOwner.trim().toUpperCase()}'S ${targetYear} VISION CANVAS`;

    let cardsHtml = '';
    CATEGORIES.forEach((cat, index) => {
      const data = boardData[cat.key] || { imageUrl: '', aspiration: '' };
      const rotation = (index % 3 === 0) ? -2.2 : (index % 2 === 0) ? 2.5 : -1.5;
      const tapeHue = (index * 36) % 360;
      
      const imgHtml = data.imageUrl 
        ? `<img src="${data.imageUrl}" alt="${cat.label}">`
        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #fafaf9; border: 1px dashed #d1d5db; color: #9ca3af; font-size: 2rem;">${cat.icon}</div>`;
      
      cardsHtml += `
        <div class="polaroid-card" style="transform: rotate(${rotation}deg);">
          <div class="washitape" style="background-color: hsla(${tapeHue}, 70%, 80%, 0.65);"></div>
          <div class="img-container">
            ${imgHtml}
          </div>
          <div class="card-label">${cat.label}</div>
          <div class="card-aspiration">"${data.aspiration || 'Manifesting this...'}"</div>
        </div>
      `;
    });

    const pageHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${boardOwner.trim().toLowerCase() === 'my' || !boardOwner.trim() ? `My ${targetYear} Pinterest Vision Board` : `${boardOwner.trim()}'s ${targetYear} Pinterest Vision Board`}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Quicksand:wght@300..700&display=swap" rel="stylesheet">
          <style>
            body {
              background-color: #f7f4eb;
              background-image: radial-gradient(#d6d3d1 1.2px, transparent 1.2px);
              background-size: 24px 24px;
              color: #44403c;
              margin: 0;
              padding: 50px 20px;
              font-family: 'Quicksand', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              min-height: 100vh;
            }
            .header {
              text-align: center;
              margin-bottom: 50px;
              position: relative;
            }
            .header h1 {
              font-family: 'Playfair Display', serif;
              font-size: 3.2rem;
              font-weight: 800;
              margin: 0 0 10px 0;
              color: #1c1917;
              letter-spacing: 1px;
            }
            .header p {
              font-size: 1.1rem;
              color: #78716c;
              font-style: italic;
              margin: 0;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
              gap: 40px;
              max-width: 1300px;
              width: 100%;
              padding: 20px;
              box-sizing: border-box;
            }
            .polaroid-card {
              background: #ffffff;
              padding: 18px 18px 30px 18px;
              border-radius: 4px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.08), 0 3px 6px rgba(0,0,0,0.05);
              position: relative;
              border: 1px solid #f1f0ea;
              display: flex;
              flex-direction: column;
              align-items: center;
              transition: transform 0.3s ease;
            }
            .polaroid-card:hover {
              transform: scale(1.05) translateY(-5px) !important;
              box-shadow: 0 16px 32px rgba(0,0,0,0.12), 0 5px 12px rgba(0,0,0,0.08);
              z-index: 10;
            }
            .washitape {
              position: absolute;
              top: -14px;
              width: 100px;
              height: 28px;
              transform: rotate(-3deg);
              box-shadow: 0 2px 4px rgba(0,0,0,0.02);
              z-index: 2;
              border-left: 2px dashed rgba(255,255,255,0.4);
              border-right: 2px dashed rgba(255,255,255,0.4);
            }
            .img-container {
              width: 100%;
              aspect-ratio: 1.1;
              overflow: hidden;
              border: 1px solid #e7e5e4;
              border-radius: 1px;
            }
            .img-container img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .card-label {
              font-family: 'Playfair Display', serif;
              font-size: 1.1rem;
              font-weight: 800;
              color: #292524;
              margin-top: 18px;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .card-aspiration {
              font-size: 0.9rem;
              color: #6b7280;
              font-style: italic;
              text-align: center;
              line-height: 1.4;
              padding: 0 5px;
            }
            .footer-note {
              margin-top: 60px;
              font-size: 0.9rem;
              color: #a8a29e;
              display: flex;
              align-items: center;
              gap: 6px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✨ ${boardTitle} ✨</h1>
            <p>Ready to manifest my main character energy and level up</p>
          </div>
          
          <div class="grid-container">
            ${cardsHtml}
          </div>
          
          <div class="footer-note">
            Created with 💖 in Evolve. Print or Save as PDF to pin it to your desk!
          </div>
        </body>
      </html>
    `;

    newWindow.document.open();
    newWindow.document.write(pageHtml);
    newWindow.document.close();
    
    setIsPromptOpen(false);
  };

  // Construct 12 grid items (10 categories, 1 Centerpiece Quote, 1 Sticker Collage)
  const gridItems = [];
  let categoryIdx = 0;
  for (let i = 0; i < 12; i++) {
    if (i === 5) {
      gridItems.push({ type: 'quote' });
    } else if (i === 11) {
      gridItems.push({ type: 'collage' });
    } else {
      gridItems.push({ type: 'category', data: CATEGORIES[categoryIdx] });
      categoryIdx++;
    }
  }

  const targetYear = new Date().getFullYear();

  return (
    <div className="pinterest-vision-container">
      {isCollageView ? (
        <>
          <div className="pinterest-scrapbook-paper">
            {/* Animated Charm Sparkles in the corners */}
            <Sparkles className="sparkle-charm s1" style={{ position: 'absolute', top: '40px', left: '40px' }} size={24} />
            <Sparkles className="sparkle-charm s2" style={{ position: 'absolute', top: '60px', right: '50px' }} size={32} />
            <Sparkles className="sparkle-charm s3" style={{ position: 'absolute', bottom: '60px', left: '45px' }} size={20} />

            <div className="pinterest-vision-header">
              <h1 className="pinterest-vision-title">
                ✨ {boardOwner.trim().toLowerCase() === 'my' || !boardOwner.trim() ? `MY ${targetYear} VISION CANVAS` : `${boardOwner.trim().toUpperCase()}'S ${targetYear} VISION CANVAS`} ✨
              </h1>
              <p className="pinterest-vision-subtitle">
                Ready to manifest my main character energy and level up
              </p>
            </div>

            <div className="pinterest-board-grid">
              {gridItems.map((item, i) => {
                if (item.type === 'quote') {
                  return (
                    <div key="center-quote" className="pinterest-quote-card" style={{ transform: 'rotate(-1.2deg)' }}>
                      <div className="pinterest-pushpin gold" />
                      <div className="pinterest-quote-card-header">2026 Core Focus</div>
                      <textarea
                        value={centerQuote}
                        onChange={(e) => {
                          setCenterQuote(e.target.value);
                          localStorage.setItem('evolve_vision_center_quote', e.target.value);
                        }}
                        className="pinterest-polaroid-input"
                        style={{
                          fontFamily: 'Caveat, cursive',
                          fontSize: '1.5rem',
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          textAlign: 'center',
                          resize: 'none',
                          height: '55px',
                          outline: 'none',
                          color: '#1e293b'
                        }}
                        placeholder="Type your main focus here..."
                      />
                      <div className="pinterest-quote-card-tag">🌸 Affirmation 🌸</div>
                    </div>
                  );
                }

                if (item.type === 'collage') {
                  return (
                    <div key="center-collage" className="pinterest-collage-card">
                      <div className="scrapbook-sticker manifest-tag">
                        Manifest It 💫
                      </div>
                      <div className="scrapbook-sticker dried-flower" title="Growth and Harmony">
                        🌸
                      </div>
                      <div className="scrapbook-sticker cute-coffee" title="Creative morning vibes">
                        ☕
                      </div>
                      <div className="scrapbook-sticker retro-stamp">
                        <span>✨</span>
                        <span>2026</span>
                      </div>
                      <div className="scrapbook-sticker mini-clip" />
                    </div>
                  );
                }

                // Polaroid category card
                const cat = item.data!;
                const data = boardData[cat.key] || { imageUrl: cat.defaultImg, aspiration: cat.defaultAspiration };
                const rotation = (i % 3 === 0) ? -1.8 : (i % 2 === 0) ? 1.5 : -1.2;
                
                // Alternate between Pushpin and Washi Tape
                const isPushpin = (i % 4 === 0 || i % 4 === 2);
                const pinColors = ['gold', 'rose', 'sage'];
                const pinColorClass = pinColors[i % 3];
                
                const tapeStyles = ['rose-tape', 'sky-tape', 'sage-tape'];
                const tapeStyleClass = tapeStyles[i % 3];

                return (
                  <div 
                    key={cat.key} 
                    className="pinterest-polaroid-card"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    {isPushpin ? (
                      <div className={`pinterest-pushpin ${pinColorClass}`} />
                    ) : (
                      <div className={`pinterest-washitape ${tapeStyleClass}`} />
                    )}
                    
                    <div 
                      className="pinterest-polaroid-img-container"
                      onClick={() => document.getElementById(`upload-${cat.key}`)?.click()}
                      title="Click to upload/change photo"
                    >
                      {data.imageUrl ? (
                        <>
                          {imageErrorKeys[cat.key] ? (
                            <div 
                              className="pinterest-upload-placeholder"
                              style={{ color: '#ef4444', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRetryCounts(prev => ({ ...prev, [cat.key]: 0 }));
                                triggerAutoImage(cat.key, data.aspiration);
                              }}
                              title="Click to retry generation"
                            >
                              <Sparkles size={16} style={{ marginBottom: '4px' }} />
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444' }}>Generation Timeout</span>
                              <span style={{ fontSize: '0.55rem', color: '#6b7280' }}>Click to retry</span>
                            </div>
                          ) : (
                            <>
                              <img 
                                src={getRenderImageUrl(cat.key, data.imageUrl)} 
                                alt={cat.label} 
                                className="pinterest-polaroid-img" 
                                style={{ display: loadedKeys[cat.key] ? 'block' : 'none' }}
                                onLoad={() => setLoadedKeys(prev => ({ ...prev, [cat.key]: true }))}
                                onError={() => {
                                  handleImageError(cat.key);
                                }}
                              />
                              {loadedKeys[cat.key] && (
                                <button 
                                  className="pinterest-img-regenerate-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerAutoImage(cat.key, data.aspiration);
                                  }}
                                  title="Regenerate AI Image"
                                >
                                  <Sparkles size={12} />
                                </button>
                              )}
                              {!loadedKeys[cat.key] && (
                                <div className="pinterest-upload-placeholder animate-pulse">
                                  <div className="ai-spinner" />
                                  <span style={{ color: '#059669', fontSize: '0.65rem', marginTop: '4px' }}>Drawing vision...</span>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <div className="pinterest-upload-placeholder" style={{ color: '#a8a29e' }}>
                          <span style={{ fontSize: '1.5rem', marginBottom: '2px' }}>{cat.icon}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Type vision below</span>
                        </div>
                      )}
                      <input
                        id={`upload-${cat.key}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(cat.key, e)}
                        style={{ display: 'none' }}
                      />
                    </div>

                    <div className="pinterest-polaroid-card-body">
                      <div className="pinterest-polaroid-category-label">
                        {cat.icon} {cat.label}
                      </div>
                      <input
                        type="text"
                        placeholder="I will manifest..."
                        value={data.aspiration}
                        onChange={(e) => handleAspirationChangeLocal(cat.key, e.target.value)}
                        onBlur={(e) => triggerAutoImage(cat.key, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="pinterest-polaroid-input"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pinterest-manifest-btn-container" style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '24px' }}>
            <button 
              onClick={() => {
                setActiveStep(0);
                localStorage.setItem('evolve_vision_board_completed', 'false');
                setIsCollageView(false);
              }}
              className="pinterest-manifest-btn secondary-print"
              style={{
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1'
              }}
            >
              <span>✏️ Edit Step-by-Step</span>
            </button>

            <button 
              onClick={handlePrint}
              className="pinterest-manifest-btn secondary-print"
            >
              <Printer size={20} />
              <span>Print Canvas</span>
            </button>

            <button 
              onClick={handleOpenPreview}
              className="pinterest-manifest-btn"
            >
              <Sparkles size={20} />
              <span>Create Vision Board</span>
            </button>
          </div>
        </>
      ) : (
        <div className="pinterest-scrapbook-paper" style={{ padding: '40px' }}>
          <Sparkles className="sparkle-charm s1" style={{ position: 'absolute', top: '40px', left: '40px' }} size={24} />
          <Sparkles className="sparkle-charm s2" style={{ position: 'absolute', top: '60px', right: '50px' }} size={32} />
          <Sparkles className="sparkle-charm s3" style={{ position: 'absolute', bottom: '60px', left: '45px' }} size={20} />

          <div className="pinterest-vision-header" style={{ marginBottom: '16px' }}>
            <h1 className="pinterest-vision-title">
              ✨ CREATE {boardOwner.trim().toLowerCase() === 'my' || !boardOwner.trim() ? `YOUR ${targetYear} VISION CANVAS` : `${boardOwner.trim().toUpperCase()}'S ${targetYear} VISION CANVAS`} ✨
            </h1>
            <p className="pinterest-vision-subtitle">
              Guided Step-by-Step Creation
            </p>
          </div>

          <div className="wizard-progress-container" style={{ margin: '15px auto 35px auto', width: '100%', maxWidth: '800px' }}>
            <div className="wizard-progress-bar-bg" style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
              <div className="wizard-progress-bar-fill" style={{ height: '100%', width: `${((activeStep + 1) / 12) * 100}%`, background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)', transition: 'width 0.4s ease' }} />
            </div>
            <div className="wizard-progress-labels" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.9rem', color: '#475569', fontWeight: 700 }}>
              <span>Step {activeStep + 1} of 12</span>
              <span style={{ color: '#8b5cf6' }}>{activeStep === 0 ? 'Personalize Board' : activeStep < 11 ? CATEGORIES[activeStep - 1].label : 'Core Affirmation'}</span>
            </div>
          </div>

          <div className="wizard-card-layout" style={{
            display: 'flex',
            gap: '40px',
            alignItems: 'stretch',
            justifyContent: 'center',
            minHeight: '440px',
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.75)',
            borderRadius: '24px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
            flexWrap: 'wrap',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div className="wizard-polaroid-side" style={{
              flex: '1 1 320px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {activeStep === 0 ? (
                <div className="pinterest-collage-card" style={{
                  transform: 'rotate(-1deg)',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.06)',
                  width: '320px',
                  height: '280px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  background: '#fdfbf7',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px'
                }}>
                  <div className="pinterest-pushpin gold" />
                  <div className="scrapbook-sticker manifest-tag" style={{ fontSize: '1.2rem', top: '20px', left: '20px' }}>Manifest It 💫</div>
                  <div className="scrapbook-sticker dried-flower" style={{ fontSize: '2.5rem' }}>🌸</div>
                  <div className="scrapbook-sticker cute-coffee" style={{ fontSize: '1.5rem', bottom: '20px', right: '30px' }}>☕</div>
                  <div className="scrapbook-sticker retro-stamp" style={{ bottom: '20px', left: '30px' }}>
                    <span>✨</span>
                    <span>2026</span>
                  </div>
                </div>
              ) : activeStep < 11 ? (
                <div className="pinterest-polaroid-card" style={{
                  transform: 'rotate(-0.8deg)',
                  padding: '16px 16px 24px 16px',
                  width: '100%',
                  maxWidth: '320px',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.06)'
                }}>
                  <div className="pinterest-pushpin gold" />
                  
                  <div 
                    className="pinterest-polaroid-img-container"
                    style={{
                      width: '100%',
                      height: '240px',
                      maxHeight: 'none',
                      minHeight: 'auto',
                      cursor: 'pointer'
                    }}
                    onClick={() => document.getElementById(`wizard-upload-${CATEGORIES[activeStep - 1].key}`)?.click()}
                    title="Click to upload custom image"
                  >
                    {(boardData[CATEGORIES[activeStep - 1].key]?.imageUrl) ? (
                      <>
                        {imageErrorKeys[CATEGORIES[activeStep - 1].key] ? (
                          <div 
                            className="pinterest-upload-placeholder"
                            style={{ color: '#ef4444' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRetryCounts(prev => ({ ...prev, [CATEGORIES[activeStep - 1].key]: 0 }));
                              triggerAutoImage(CATEGORIES[activeStep - 1].key, boardData[CATEGORIES[activeStep - 1].key].aspiration);
                            }}
                          >
                            <Sparkles size={20} style={{ marginBottom: '4px' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Generation Timeout</span>
                            <span style={{ fontSize: '0.7rem' }}>Click to retry</span>
                          </div>
                        ) : (
                          <>
                            <img 
                              src={getRenderImageUrl(CATEGORIES[activeStep - 1].key, boardData[CATEGORIES[activeStep - 1].key].imageUrl)} 
                              alt={CATEGORIES[activeStep - 1].label} 
                              className="pinterest-polaroid-img" 
                              style={{ display: loadedKeys[CATEGORIES[activeStep - 1].key] ? 'block' : 'none' }}
                              onLoad={() => setLoadedKeys(prev => ({ ...prev, [CATEGORIES[activeStep - 1].key]: true }))}
                              onError={() => {
                                handleImageError(CATEGORIES[activeStep - 1].key);
                              }}
                            />
                            {!loadedKeys[CATEGORIES[activeStep - 1].key] && (
                              <div className="pinterest-upload-placeholder animate-pulse">
                                <div className="ai-spinner" style={{ width: '32px', height: '32px' }} />
                                <span style={{ color: '#059669', fontSize: '0.8rem', marginTop: '6px' }}>Drawing vision...</span>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="pinterest-upload-placeholder" style={{ color: '#a8a29e', gap: '12px' }}>
                        <span style={{ fontSize: '3rem' }}>{CATEGORIES[activeStep - 1].icon}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Type your vision or click to upload</span>
                      </div>
                    )}
                    
                    <input
                      id={`wizard-upload-${CATEGORIES[activeStep - 1].key}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(CATEGORIES[activeStep - 1].key, e)}
                      style={{ display: 'none' }}
                    />
                  </div>
                  
                  <div className="pinterest-polaroid-card-body" style={{ marginTop: '16px' }}>
                    <div className="pinterest-polaroid-category-label" style={{ fontSize: '1rem' }}>
                      {CATEGORIES[activeStep - 1].icon} {CATEGORIES[activeStep - 1].label}
                    </div>
                    <div style={{
                      fontFamily: 'Caveat, cursive',
                      fontSize: '1.65rem',
                      color: '#1e3a8a',
                      textAlign: 'center',
                      minHeight: '35px',
                      lineHeight: '1.2'
                    }}>
                      {boardData[CATEGORIES[activeStep - 1].key]?.aspiration || 'Manifesting this...'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pinterest-quote-card" style={{
                  transform: 'rotate(0.8deg)',
                  padding: '24px 20px',
                  width: '100%',
                  maxWidth: '320px',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.06)',
                  minHeight: '260px'
                }}>
                  <div className="pinterest-pushpin gold" />
                  <div className="pinterest-quote-card-header" style={{ fontSize: '1.2rem', marginBottom: '15px' }}>2026 Core Focus</div>
                  <div style={{
                    fontFamily: 'Caveat, cursive',
                    fontSize: '2rem',
                    color: '#1e293b',
                    textAlign: 'center',
                    lineHeight: '1.4',
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 0'
                  }}>
                    {centerQuote || 'Ready to manifest my main character energy and level up!'}
                  </div>
                  <div className="pinterest-quote-card-tag" style={{ fontSize: '0.9rem', marginTop: '15px' }}>🌸 Affirmation 🌸</div>
                </div>
              )}
            </div>

            <div className="wizard-form-side" style={{
              flex: '1 2 360px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '10px 0'
            }}>
              {activeStep === 0 ? (
                <div>
                  <h2 style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#1e293b',
                    margin: '0 0 12px 0'
                  }}>
                    👋 Personalize Your Board
                  </h2>
                  
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#475569',
                    lineHeight: '1.6',
                    margin: '0 0 24px 0',
                    fontWeight: 500
                  }}>
                    Welcome, bestie! Whose goals and dreams are we mapping out today? Enter your name (or "My") to personalize the titles.
                  </p>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>Your Name</label>
                    
                    <input
                      type="text"
                      placeholder="e.g. Simran, Rahul, My"
                      value={boardOwner}
                      onChange={(e) => {
                        setBoardOwner(e.target.value);
                        localStorage.setItem('evolve_vision_board_owner', e.target.value);
                      }}
                      className="pinterest-polaroid-input"
                      style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        fontFamily: 'Caveat, cursive',
                        fontSize: '1.8rem',
                        color: '#1e3a8a',
                        textAlign: 'left',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    />
                  </div>
                </div>
              ) : activeStep < 11 ? (
                <div>
                  <h2 style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '0 0 12px 0'
                  }}>
                    <span>{CATEGORIES[activeStep - 1].icon}</span>
                    <span>{CATEGORIES[activeStep - 1].label}</span>
                  </h2>
                  
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#475569',
                    lineHeight: '1.6',
                    margin: '0 0 24px 0',
                    fontWeight: 500
                  }}>
                    Describe what you want to manifest in your <strong>{CATEGORIES[activeStep - 1].label}</strong> this year. Focus on feelings, goals, and visual details.
                  </p>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>Your Vision Statement</label>
                    
                    <textarea
                      placeholder="I will manifest... (e.g. want to buy a blue car, start running every morning, read 20 books)"
                      value={boardData[CATEGORIES[activeStep - 1].key]?.aspiration || ''}
                      onChange={(e) => handleAspirationChangeLocal(CATEGORIES[activeStep - 1].key, e.target.value)}
                      className="pinterest-polaroid-input"
                      style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '16px',
                        fontFamily: 'Caveat, cursive',
                        fontSize: '1.8rem',
                        color: '#1e3a8a',
                        textAlign: 'left',
                        resize: 'none',
                        height: '110px',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                        lineHeight: '1.4'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => triggerAutoImage(CATEGORIES[activeStep - 1].key, boardData[CATEGORIES[activeStep - 1].key]?.aspiration || '')}
                      className="pinterest-manifest-btn"
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 10px rgba(5, 150, 105, 0.2)'
                      }}
                    >
                      <Sparkles size={14} />
                      <span>Generate AI Art 🎨</span>
                    </button>
                    
                    <button
                      onClick={() => document.getElementById(`wizard-upload-${CATEGORIES[activeStep - 1].key}`)?.click()}
                      className="pinterest-manifest-btn secondary-print"
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        background: '#ffffff'
                      }}
                    >
                      <span>Upload Photo 📷</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#1e293b',
                    margin: '0 0 12px 0'
                  }}>
                    🌸 Core Focus & Affirmation
                  </h2>
                  
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#475569',
                    lineHeight: '1.6',
                    margin: '0 0 24px 0',
                    fontWeight: 500
                  }}>
                    What is the single most important message or theme for your year? Write a short, powerful focus statement or affirmation that will sit in the center of your board.
                  </p>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>Your 2026 Focus Phrase</label>
                    
                    <textarea
                      placeholder="Type your main focus or affirmation here..."
                      value={centerQuote}
                      onChange={(e) => {
                        setCenterQuote(e.target.value);
                        localStorage.setItem('evolve_vision_center_quote', e.target.value);
                      }}
                      className="pinterest-polaroid-input"
                      style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '16px',
                        fontFamily: 'Caveat, cursive',
                        fontSize: '1.8rem',
                        color: '#1e293b',
                        textAlign: 'left',
                        resize: 'none',
                        height: '110px',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                        lineHeight: '1.4'
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button
                  onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                  className="pinterest-manifest-btn secondary-print"
                  disabled={activeStep === 0}
                  style={{
                    padding: '8px 18px',
                    opacity: activeStep === 0 ? 0.5 : 1,
                    cursor: activeStep === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Previous
                </button>
                
                {activeStep < 11 ? (
                  <button
                    onClick={() => {
                      if (activeStep > 0) {
                        const curKey = CATEGORIES[activeStep - 1].key;
                        const curData = boardData[curKey];
                        if (curData && curData.aspiration.trim() !== '' && !curData.imageUrl) {
                          triggerAutoImage(curKey, curData.aspiration);
                        }
                      }
                      setActiveStep(prev => prev + 1);
                    }}
                    className="pinterest-manifest-btn"
                    style={{ padding: '8px 18px' }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      playChimeSound();
                      confetti({
                        particleCount: 120,
                        spread: 80,
                        origin: { y: 0.5 }
                      });
                      localStorage.setItem('evolve_vision_board_completed', 'true');
                      setIsCollageView(true);
                    }}
                    className="pinterest-manifest-btn"
                    style={{
                      padding: '10px 22px',
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                      boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Create My Vision Board 🪄</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collage Preview Modal */}
      {isPreviewOpen && (
        <div className="pinterest-preview-overlay">
          <div className="pinterest-preview-toolbar">
            <span className="pinterest-preview-toolbar-title">✨ {boardOwner.trim().toLowerCase() === 'my' || !boardOwner.trim() ? `My ${targetYear} Vision Board Canvas` : `${boardOwner.trim()}'s ${targetYear} Vision Board Canvas`} ✨</span>
            <div className="pinterest-preview-toolbar-actions">
              <button onClick={handlePrint} className="pinterest-preview-btn primary">
                <Printer size={16} />
                <span>Print or Save PDF</span>
              </button>
              <button onClick={() => setIsPreviewOpen(false)} className="pinterest-preview-btn secondary">
                <X size={16} />
                <span>Edit Canvas</span>
              </button>
            </div>
          </div>
          
          <div className="pinterest-preview-content pinterest-scrapbook-paper" style={{ padding: '40px' }}>
            <Sparkles className="sparkle-charm s1" style={{ position: 'absolute', top: '40px', left: '40px' }} size={24} />
            <Sparkles className="sparkle-charm s2" style={{ position: 'absolute', top: '60px', right: '50px' }} size={32} />
            <Sparkles className="sparkle-charm s3" style={{ position: 'absolute', bottom: '60px', left: '45px' }} size={20} />

            <div className="pinterest-vision-header">
              <h1 className="pinterest-vision-title">✨ {boardOwner.trim().toLowerCase() === 'my' || !boardOwner.trim() ? `MY ${targetYear} VISION CANVAS` : `${boardOwner.trim().toUpperCase()}'S ${targetYear} VISION CANVAS`} ✨</h1>
              <p className="pinterest-vision-subtitle">Ready to manifest my main character energy and level up</p>
            </div>

            <div className="pinterest-board-grid">
              {gridItems.map((item, i) => {
                if (item.type === 'quote') {
                  return (
                    <div key="preview-quote" className="pinterest-quote-card" style={{ transform: 'rotate(-1.2deg)' }}>
                      <div className="pinterest-pushpin gold" />
                      <div className="pinterest-quote-card-header">2026 Core Focus</div>
                      <div 
                        style={{
                          fontFamily: 'Caveat, cursive',
                          fontSize: '1.65rem',
                          fontWeight: 700,
                          textAlign: 'center',
                          color: '#1e293b',
                          lineHeight: '1.4',
                          minHeight: '55px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {centerQuote || 'Ready to manifest my main character energy and level up!'}
                      </div>
                      <div className="pinterest-quote-card-tag">🌸 Affirmation 🌸</div>
                    </div>
                  );
                }

                if (item.type === 'collage') {
                  return (
                    <div key="preview-collage" className="pinterest-collage-card">
                      <div className="scrapbook-sticker manifest-tag">Manifest It 💫</div>
                      <div className="scrapbook-sticker dried-flower">🌸</div>
                      <div className="scrapbook-sticker cute-coffee">☕</div>
                      <div className="scrapbook-sticker retro-stamp">
                        <span>✨</span>
                        <span>2026</span>
                      </div>
                      <div className="scrapbook-sticker mini-clip" />
                    </div>
                  );
                }

                const cat = item.data!;
                const data = boardData[cat.key] || { imageUrl: '', aspiration: '' };
                const rotation = (i % 3 === 0) ? -1.8 : (i % 2 === 0) ? 1.5 : -1.2;
                const isPushpin = (i % 4 === 0 || i % 4 === 2);
                const pinColors = ['gold', 'rose', 'sage'];
                const pinColorClass = pinColors[i % 3];
                const tapeStyles = ['rose-tape', 'sky-tape', 'sage-tape'];
                const tapeStyleClass = tapeStyles[i % 3];

                return (
                  <div 
                    key={`preview-${cat.key}`} 
                    className="pinterest-polaroid-card"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    {isPushpin ? (
                      <div className={`pinterest-pushpin ${pinColorClass}`} />
                    ) : (
                      <div className={`pinterest-washitape ${tapeStyleClass}`} />
                    )}
                    
                    <div className="pinterest-polaroid-img-container" style={{ cursor: 'default' }}>
                      {data.imageUrl ? (
                        <img src={data.imageUrl} alt={cat.label} className="pinterest-polaroid-img" />
                      ) : (
                        <div className="pinterest-upload-placeholder" style={{ color: '#d1d5db' }}>
                          <span style={{ fontSize: '1.75rem', marginBottom: '2px' }}>{cat.icon}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9ca3af' }}>Dreaming...</span>
                        </div>
                      )}
                    </div>

                    <div className="pinterest-polaroid-card-body">
                      <div className="pinterest-polaroid-category-label">
                        {cat.icon} {cat.label}
                      </div>
                      <div 
                        style={{
                          fontFamily: 'Caveat, cursive',
                          fontSize: '1.45rem',
                          fontWeight: 700,
                          color: '#1e3a8a',
                          textAlign: 'center',
                          padding: '2px 0',
                          minHeight: '28px'
                        }}
                      >
                        {data.aspiration || 'Manifesting this...'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Slang Prompt Modal */}
      {isPromptOpen && (
        <div className="pinterest-slang-overlay">
          <div className="pinterest-slang-modal">
            <Sparkles className="pinterest-slang-modal-sparkle" size={24} style={{ position: 'absolute', top: '15px', right: '15px', color: '#f59e0b' }} />
            <h2>Are you ready, bestie? 💫</h2>
            <p>
              We're about to pack up your dreams into pure main character energy. Are you ready to manifest this vision for the year?
            </p>
            <div className="pinterest-slang-btn-group">
              <button 
                onClick={handleConfirmManifest}
                className="pinterest-btn-manifest"
              >
                Yes, let's do this! 🚀
              </button>
              <button 
                onClick={() => setIsPromptOpen(false)}
                className="pinterest-btn-wait"
              >
                Wait, not yet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
