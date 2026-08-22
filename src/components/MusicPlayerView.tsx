import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Plus, Play, Pause, Trash2, Volume2, Link as LinkIcon, Compass, AlertCircle
} from 'lucide-react';

interface MusicTrack {
  id: string;
  title: string;
  description: string;
  url: string;
}

const DEFAULT_TRACKS: MusicTrack[] = [
  { id: '1', title: 'Rainforest Rainfall', description: 'Calming rain forest ambience', url: 'https://assets.codepen.io/25868/neutral-rain.mp3' },
  { id: '2', title: 'Ocean Waves', description: 'Rhythmic sea waves for focus', url: 'https://assets.codepen.io/25868/ocean-waves.mp3' },
  { id: '3', title: 'Campfire Crackle', description: 'Cozy fireplace crackling sound', url: 'https://assets.codepen.io/25868/campfire.mp3' },
  { id: '4', title: 'Relaxing Zen Melody', description: 'Peaceful instrumental piano stream', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
];

export const MusicPlayerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('list');
  const [tracks, setTracks] = useState<MusicTrack[]>(() => {
    const saved = localStorage.getItem('evolve_music_urls');
    return saved ? JSON.parse(saved) : DEFAULT_TRACKS;
  });

  // Form inputs state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');

  // Audio playing states
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [loadError, setLoadError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync tracks with localStorage
  useEffect(() => {
    localStorage.setItem('evolve_music_urls', JSON.stringify(tracks));
  }, [tracks]);

  // Audio element setup
  useEffect(() => {
    audioRef.current = new Audio();
    
    const onPlay = () => {
      setIsPlaying(true);
      setLoadError(null);
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTrackId(null);
    };
    const onError = () => {
      setLoadError('Failed to load audio. Verify that this is a direct, valid audio URL.');
      setIsPlaying(false);
      setCurrentTrackId(null);
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('play', onPlay);
      audioRef.current.addEventListener('pause', onPause);
      audioRef.current.addEventListener('ended', onEnded);
      audioRef.current.addEventListener('error', onError);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('play', onPlay);
        audioRef.current.removeEventListener('pause', onPause);
        audioRef.current.removeEventListener('ended', onEnded);
        audioRef.current.removeEventListener('error', onError);
      }
    };
  }, []);

  // YouTube link detection helpers
  const isYouTubeUrl = (urlStr: string) => {
    return urlStr.includes('youtube.com') || urlStr.includes('youtu.be');
  };

  const getYouTubeId = (urlStr: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlStr.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Play/Pause toggle
  const playTrack = (track: MusicTrack) => {
    const isYT = isYouTubeUrl(track.url);

    if (isYT) {
      // Pause native audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setLoadError(null);

      if (currentTrackId === track.id) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentTrackId(track.id);
        setIsPlaying(true);
      }
    } else {
      // Direct audio URL
      if (!audioRef.current) return;

      if (currentTrackId === track.id) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(() => {
            setLoadError('Failed to play track. Verify the URL is directly accessible.');
          });
        }
      } else {
        setLoadError(null);
        audioRef.current.src = track.url;
        audioRef.current.volume = volume;
        setCurrentTrackId(track.id);
        audioRef.current.play().catch(() => {
          setLoadError('Could not load direct audio URL. Please check validity.');
          setCurrentTrackId(null);
        });
      }
    }
  };

  // Adjust volume
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Add new track
  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      alert('Title and Audio URL are required.');
      return;
    }

    const newTrack: MusicTrack = {
      id: `track-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Custom soundscape link',
      url: url.trim()
    };

    setTracks(prev => [...prev, newTrack]);
    setTitle('');
    setDescription('');
    setUrl('');
    setActiveTab('list');
  };

  // Delete track
  const handleDeleteTrack = (id: string) => {
    if (currentTrackId === id && audioRef.current) {
      audioRef.current.pause();
      setCurrentTrackId(null);
      setIsPlaying(false);
    }
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="gj-container animate-fade-in" style={{ padding: '24px' }}>
      {/* Title Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="masters-landing-title text-main">Let The Music Play</h1>
          <p className="masters-landing-desc text-secondary">
            Keep a custom library of calming music links and ambient sound URLs.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="users-tabs-header">
        <button
          onClick={() => setActiveTab('list')}
          className={`users-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
        >
          <Music size={16} />
          <span>Music URL List ({tracks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`users-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
        >
          <Plus size={16} />
          <span>Add Music URL</span>
        </button>
      </div>

      {/* Active Tab Contents */}
      <div className="tab-contents-panel mt-6">
        {loadError && (
          <div className="glass-card flex items-center gap-3 p-4 mb-6" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{loadError}</span>
          </div>
        )}

        {/* TAB 1: MUSIC LIST */}
        {activeTab === 'list' && (
          <div className="music-list-tab animate-fade-in">
            {/* Global player controls if something is selected */}
            {currentTrackId && (
              <div className="glass-card mb-6" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f0fdf4, #e6f4ea)', border: '1px solid #bcf0da' }}>
                <div className="flex items-center gap-4">
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                    <Music size={18} className={isPlaying ? 'animate-bounce' : ''} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currently Playing</span>
                    <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#065f46', margin: 0 }}>
                      {tracks.find(t => t.id === currentTrackId)?.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Master Volume Controller */}
                  <div className="flex items-center gap-3">
                    <Volume2 size={16} style={{ color: '#047857' }} />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      style={{ width: '130px', height: '4px', accentColor: '#10b981' }}
                    />
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#047857', width: '28px', textAlign: 'right' }}>
                      {Math.round(volume * 100)}%
                    </span>
                  </div>

                  {/* Play/Pause control */}
                  <button
                    onClick={() => {
                      const track = tracks.find(t => t.id === currentTrackId);
                      if (track) playTrack(track);
                    }}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                      background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
                  </button>
                </div>
              </div>
            )}

            {/* YouTube Embed Player if current track is YouTube */}
            {currentTrackId && isPlaying && isYouTubeUrl(tracks.find(t => t.id === currentTrackId)?.url || '') && (
              <div className="glass-card mb-6 animate-scale-up" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6366f1', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                  YouTube Ambient Player Widget
                </span>
                <iframe
                  width="100%"
                  height="220"
                  src={`https://www.youtube.com/embed/${getYouTubeId(tracks.find(t => t.id === currentTrackId)?.url || '')}?autoplay=1`}
                  title="YouTube player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '420px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                />
              </div>
            )}

            {/* Tracks table */}
            {tracks.length === 0 ? (
              <div className="glass-card text-center" style={{ padding: '60px 24px' }}>
                <Compass size={48} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>No music URLs added</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                  Click the "Add Music URL" tab to start building your tranquil sounds list.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tracks.map(track => {
                  const isCurrent = currentTrackId === track.id;
                  return (
                    <div 
                      key={track.id} 
                      className="glass-card" 
                      style={{ 
                        padding: '16px 20px', display: 'flex', justifyContent: 'space-between', 
                        alignItems: 'center', transition: 'all 0.2s ease',
                        borderLeft: isCurrent && isPlaying ? '4px solid #10b981' : '4px solid transparent'
                      }}
                    >
                      <div className="flex items-center gap-4" style={{ minWidth: 0, flexGrow: 1 }}>
                        {/* Audio Symbol */}
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '12px',
                          background: isCurrent && isPlaying ? '#ecfdf5' : '#f8fafc',
                          color: isCurrent && isPlaying ? '#10b981' : '#64748b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Music size={18} />
                        </div>
                        {/* Text Stack */}
                        <div style={{ minWidth: 0, paddingRight: '16px' }}>
                          <h3 style={{ margin: '0 0 3px 0', fontSize: '0.94rem', fontWeight: 800, color: '#1e293b' }}>
                            {track.title}
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {track.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Panel Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <LinkIcon size={12} />
                          Audio Direct Link
                        </span>

                        {/* Play Action */}
                        <button
                          onClick={() => playTrack(track)}
                          style={{
                            width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                            background: isCurrent && isPlaying ? '#10b981' : '#f1f5f9',
                            color: isCurrent && isPlaying ? '#ffffff' : '#475569',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s ease'
                          }}
                          title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                        >
                          {isCurrent && isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
                        </button>

                        {/* Delete Action */}
                        <button
                          onClick={() => handleDeleteTrack(track.id)}
                          className="icon-btn"
                          style={{ border: '1px solid #cbd5e1', padding: '8px' }}
                          title="Delete Track"
                        >
                          <Trash2 size={14} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ADD MUSIC URL */}
        {activeTab === 'add' && (
          <div className="custom-goal-form-container animate-fade-in">
            <form onSubmit={handleAddTrack}>
              {/* Audio Direct Title */}
              <div className="form-group-dark mb-6">
                <label className="form-label-purple">MUSIC TRACK TITLE</label>
                <div className="dark-input-box-wrapper">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Calm Ambient Rain, Deep Meditation Stream, Zen Lofi Piano"
                    className="dark-textarea-title"
                    style={{ height: '50px' }}
                    required
                  />
                </div>
              </div>

              {/* URL Description */}
              <div className="form-group-dark mb-6">
                <label className="form-label-purple">TRACK DESCRIPTION / SUBTITLE</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Calming background water loops for meditation and focused writing sessions."
                  className="dark-textarea"
                />
              </div>

              {/* Direct Audio URL */}
              <div className="form-group-dark mb-8">
                <label className="form-label-purple">DIRECT AUDIO URL (MP3, WAV, ETC.)</label>
                <div className="dark-input-box-wrapper">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/audio/relaxing-piano.mp3"
                    className="dark-textarea-title"
                    style={{ height: '50px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    required
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                  ⚠️ Note: Must be a direct audio link (usually ending in .mp3, .wav, or similar audio streaming format).
                </span>
              </div>

              {/* Form Action Buttons */}
              <div className="form-actions-dark" style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setDescription('');
                    setUrl('');
                    setActiveTab('list');
                  }}
                  className="dark-cancel-btn"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="dark-save-btn"
                >
                  <Plus size={16} />
                  <span>Save Audio Track</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
