import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { getAffirmationVideo, type AffirmationVideo } from '../services/affirmationService';

export const DailyAffirmation: React.FC = () => {
  const [affirmation, setAffirmation] = useState<AffirmationVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const isPlayingRef = useRef(false);
  const activeLineRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalDuration = 12; // 12 seconds total for the affirmation

  // Voice recording states
  const [voiceMode, setVoiceMode] = useState<'ai' | 'custom'>('ai');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(() => {
    return localStorage.getItem('evolve_custom_affirmation_audio');
  });
  const [audioPermissionError, setAudioPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  // Keep refs in sync for speech callbacks
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    activeLineRef.current = activeLineIndex;
  }, [activeLineIndex]);

  // Fetch video data from service
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getAffirmationVideo();
        if (!cancelled) {
          setAffirmation(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load affirmation video.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Update timer simulation when playing
  useEffect(() => {
    if (isPlaying) {
      if (voiceMode === 'custom' && customAudioRef.current) {
        const audio = customAudioRef.current;
        timerRef.current = setInterval(() => {
          const curr = audio.currentTime;
          const dur = audio.duration || totalDuration;
          setCurrentTime(curr);
          setProgress((curr / dur) * 100);
          
          const lineIndex = Math.min(
            Math.floor((curr / dur) * (affirmation?.transcript.length || 4)),
            (affirmation?.transcript.length || 4) - 1
          );
          if (activeLineRef.current !== lineIndex) {
            setActiveLineIndex(lineIndex);
          }

          if (audio.ended || curr >= dur) {
            setIsPlaying(false);
            setProgress(100);
            setActiveLineIndex(null);
            if (timerRef.current) clearInterval(timerRef.current);
          }
        }, 50);
      } else {
        // AI Voice Mode
        timerRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            if (prev >= totalDuration) {
              setIsPlaying(false);
              setProgress(100);
              setActiveLineIndex(null);
              if (timerRef.current) clearInterval(timerRef.current);
              return totalDuration;
            }
            const nextTime = prev + 0.1;
            setProgress((nextTime / totalDuration) * 100);
            
            const lineIndex = Math.min(
              Math.floor((nextTime / totalDuration) * (affirmation?.transcript.length || 4)),
              (affirmation?.transcript.length || 4) - 1
            );
            if (activeLineRef.current !== lineIndex) {
              setActiveLineIndex(lineIndex);
            }

            return nextTime;
          });
        }, 100);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (voiceMode === 'custom') {
        customAudioRef.current?.pause();
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, affirmation, voiceMode]);

  // Trigger text-to-speech for a specific line
  const speakLineText = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.volume = isMuted ? 0 : 1;
    utterance.rate = 0.85; // Slightly slower for mindfulness effect

    // Find Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const hiVoice = voices.find((v) => v.lang.startsWith('hi'));
    if (hiVoice) {
      utterance.voice = hiVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Watch for active line changes to speak the line
  useEffect(() => {
    if (isPlaying && activeLineIndex !== null && affirmation && voiceMode === 'ai') {
      const lineText = affirmation.transcript[activeLineIndex];
      speakLineText(lineText);
    }
  }, [activeLineIndex, isPlaying, affirmation, speakLineText, voiceMode]);

  // Controls
  const togglePlay = useCallback(() => {
    if (voiceMode === 'custom' && !customAudioUrl) {
      setError('Please record your voice first below.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
      setCurrentTime(0);
      setActiveLineIndex(0);
      if (voiceMode === 'custom' && customAudioRef.current) {
        customAudioRef.current.currentTime = 0;
        customAudioRef.current.play().catch(e => console.error(e));
      }
    } else {
      if (isPlaying) {
        if (voiceMode === 'custom') {
          customAudioRef.current?.pause();
        } else {
          window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        if (voiceMode === 'custom' && customAudioRef.current) {
          if (currentTime >= (customAudioRef.current.duration || totalDuration)) {
            setCurrentTime(0);
            setActiveLineIndex(0);
            customAudioRef.current.currentTime = 0;
          } else {
            customAudioRef.current.currentTime = currentTime;
          }
          customAudioRef.current.play().catch(e => console.error(e));
        } else {
          // Speak current line or start over if finished
          if (currentTime >= totalDuration) {
            setCurrentTime(0);
            setActiveLineIndex(0);
          } else {
            const lineIndex = activeLineIndex ?? 0;
            if (affirmation) {
              speakLineText(affirmation.transcript[lineIndex]);
            }
          }
        }
      }
    }
  }, [hasStarted, isPlaying, currentTime, activeLineIndex, affirmation, speakLineText, voiceMode, customAudioUrl]);

  const handleReplay = useCallback(() => {
    if (voiceMode === 'custom' && !customAudioUrl) {
      return;
    }
    if (voiceMode === 'custom' && customAudioRef.current) {
      customAudioRef.current.currentTime = 0;
      customAudioRef.current.play().catch(e => console.error(e));
    } else {
      window.speechSynthesis.cancel();
    }
    setCurrentTime(0);
    setProgress(0);
    setActiveLineIndex(0);
    setIsPlaying(true);
    setHasStarted(true);
  }, [voiceMode, customAudioUrl]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (voiceMode === 'custom') {
        if (customAudioRef.current) {
          customAudioRef.current.muted = nextMuted;
        }
      } else {
        if (nextMuted) {
          window.speechSynthesis.cancel();
        } else if (isPlaying && activeLineIndex !== null && affirmation) {
          // Respeak current line unmuted
          const utterance = new SpeechSynthesisUtterance(affirmation.transcript[activeLineIndex]);
          utterance.lang = 'hi-IN';
          utterance.volume = 1;
          utterance.rate = 0.85;
          const voices = window.speechSynthesis.getVoices();
          const hiVoice = voices.find((v) => v.lang.startsWith('hi'));
          if (hiVoice) utterance.voice = hiVoice;
          window.speechSynthesis.speak(utterance);
        }
      }
      return nextMuted;
    });
  }, [isPlaying, activeLineIndex, affirmation, voiceMode]);

  const handleVoiceModeChange = (mode: 'ai' | 'custom') => {
    window.speechSynthesis.cancel();
    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setHasStarted(false);
    setCurrentTime(0);
    setProgress(0);
    setActiveLineIndex(null);
    setVoiceMode(mode);
  };

  const startRecording = async () => {
    setError('');
    setAudioPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          try {
            localStorage.setItem('evolve_custom_affirmation_audio', base64data);
            setCustomAudioUrl(base64data);
          } catch (e) {
            console.error('LocalStorage write failed:', e);
            setError('Audio recording is too large to save in local storage. Try a shorter recording.');
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 14) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setAudioPermissionError('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
  };

  const deleteRecording = () => {
    localStorage.removeItem('evolve_custom_affirmation_audio');
    setCustomAudioUrl(null);
    if (customAudioRef.current) {
      customAudioRef.current.src = '';
    }
    if (voiceMode === 'custom') {
      setIsPlaying(false);
      setHasStarted(false);
      setCurrentTime(0);
      setProgress(0);
      setActiveLineIndex(null);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Please upload a valid audio file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('File is too large. Please select an audio file under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64data = event.target?.result as string;
      try {
        localStorage.setItem('evolve_custom_affirmation_audio', base64data);
        setCustomAudioUrl(base64data);
      } catch (err) {
        console.error('LocalStorage write failed:', err);
        setError('Failed to save audio file. The file is too large for local storage.');
      }
    };
    reader.onerror = () => {
      setError('Error reading audio file.');
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="da-card">
        <div className="da-loading">
          <div className="da-spinner" />
          <p>Preparing your daily affirmation…</p>
        </div>
      </div>
    );
  }

  if (error && !affirmation) {
    return (
      <div className="da-card">
        <div className="da-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="da-retry-btn">
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!affirmation) return null;

  return (
    <div className="da-card">
      {/* Section Header */}
      <div className="da-header">
        <div className="da-header-badge">
          <span className="da-header-emoji">🧘</span>
        </div>
        <div>
          <h2 className="da-title">Daily Affirmation</h2>
          <p className="da-subtitle">Take a moment. Repeat after me.</p>
        </div>
      </div>

      {/* Media Player Area */}
      <div className="da-player-wrapper">
        <div className="da-player" style={{ position: 'relative', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
          {/* Animated Text Subtitle Overlay (Cinematic style) */}
          <div className="da-text-animation-overlay">
            {isPlaying && activeLineIndex !== null ? (
              <div key={activeLineIndex} className="da-animated-text">
                {affirmation.transcript[activeLineIndex]}
              </div>
            ) : (
              <div className="da-idle-text">
                {hasStarted ? "🧘 Focus on your breath..." : "Press below to begin your daily affirmation"}
              </div>
            )}
          </div>

          {/* Interactive Voice Visualizer Overlay */}
          {isPlaying && (
            <div className="da-visualizer-overlay">
              <div className="da-pulse-ring" />
              <div className="da-pulse-ring" />
              <div className="da-pulse-ring" />
              
              <div className="da-wave-bars">
                <div className="da-wave-bar" />
                <div className="da-wave-bar" />
                <div className="da-wave-bar" />
                <div className="da-wave-bar" />
                <div className="da-wave-bar" />
              </div>
            </div>
          )}

          {/* Start Overlay — shown before first play */}
          {!hasStarted && (
            <div 
              className="da-start-overlay" 
              onClick={voiceMode === 'custom' && !customAudioUrl ? undefined : togglePlay}
              style={{ cursor: voiceMode === 'custom' && !customAudioUrl ? 'default' : 'pointer' }}
            >
              {voiceMode === 'custom' && !customAudioUrl ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🎙️</span>
                  <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>Custom Voice Mode Active</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>Record your voice below first to play the affirmation</div>
                </div>
              ) : (
                <button className="da-start-btn" type="button">
                  <Play size={24} className="da-start-icon" />
                  <span>Start Affirmation</span>
                </button>
              )}
            </div>
          )}

          {/* Click-to-toggle play (after first start) */}
          {hasStarted && (
            <div className="da-click-area" onClick={togglePlay} />
          )}
        </div>

        {/* Custom Controls Bar */}
        {hasStarted && (
          <div className="da-controls">
            {/* Play / Pause */}
            <button onClick={togglePlay} className="da-ctrl-btn" title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* Replay */}
            <button onClick={handleReplay} className="da-ctrl-btn" title="Replay">
              <RotateCcw size={15} />
            </button>

            {/* Time Display */}
            <span className="da-time" style={{ minWidth: '75px' }}>
              {formatTime(currentTime)} / {formatTime(voiceMode === 'custom' && customAudioRef.current?.duration ? customAudioRef.current.duration : totalDuration)}
            </span>

            {/* Progress Bar */}
            <div className="da-progress-track">
              <div className="da-progress-fill" style={{ width: `${progress}%` }} />
              <div className="da-progress-thumb" style={{ left: `${progress}%` }} />
            </div>

            {/* Mute */}
            <button onClick={toggleMute} className="da-ctrl-btn" title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        )}
      </div>

      {/* Error alert inside the card if there is a running error */}
      {error && affirmation && (
        <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '0.78rem', marginBottom: '16px', fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Voice Mode Selector & Recorder Panel */}
      <div className="da-voice-panel">
        <div className="da-voice-panel-header">
          <span className="da-panel-title">Voice Configuration</span>
          <div className="da-mode-switch">
            <button 
              type="button" 
              className={`da-mode-tab ${voiceMode === 'ai' ? 'active' : ''}`}
              onClick={() => handleVoiceModeChange('ai')}
            >
              🎤 AI Voice (Hindi)
            </button>
            <button 
              type="button" 
              className={`da-mode-tab ${voiceMode === 'custom' ? 'active' : ''}`}
              onClick={() => handleVoiceModeChange('custom')}
            >
              👤 My Recorded Voice
            </button>
          </div>
        </div>

        {/* Dynamic Panel Content based on selected mode */}
        {voiceMode === 'custom' ? (
          <div className="da-custom-voice-section">
            {!customAudioUrl && !isRecording ? (
              <div className="da-record-prompt-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%' }}>
                  <div className="da-record-mic-glow">
                    <span className="da-mic-emoji">🎙️</span>
                  </div>
                  <div className="da-prompt-text-group">
                    <h4>Record Your Affirmation</h4>
                    <p>Read the lines shown below to overlay your own voice on the visualizer. Max 15 seconds.</p>
                  </div>
                </div>
                
                {audioPermissionError && (
                  <div className="da-voice-error">
                    ⚠️ {audioPermissionError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="da-voice-btn da-record-btn"
                    onClick={startRecording}
                    style={{ flex: 1, minWidth: '150px' }}
                  >
                    Start Recording
                  </button>
                  
                  <div className="da-upload-area" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="da-upload-label" style={{ margin: 0, height: '100%' }}>
                      📁 Upload Audio File
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleAudioFileUpload} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                </div>
                
                <span className="da-upload-tip" style={{ alignSelf: 'center' }}>Supports MP3, WAV, M4A, OGG up to 2MB</span>
              </div>
            ) : isRecording ? (
              <div className="da-recording-card">
                <div className="da-recording-indicator">
                  <span className="da-record-dot animate-ping" />
                  <span className="da-record-duration">{recordingTime}s / 15s</span>
                </div>
                
                <div className="da-read-helper">
                  <div className="da-helper-label">Read aloud:</div>
                  <div className="da-helper-text-hindi">
                    "मेरे साथ दोहराएँ… मैं स्वस्थ हूँ। मैं मस्त हूँ। मैं जबरदस्त हूँ!"
                  </div>
                </div>

                <div className="da-recording-wave-visual">
                  <span className="bar" />
                  <span className="bar" />
                  <span className="bar" />
                  <span className="bar" />
                  <span className="bar" />
                </div>

                <button 
                  type="button" 
                  className="da-voice-btn da-stop-btn"
                  onClick={stopRecording}
                >
                  Stop & Save
                </button>
              </div>
            ) : (
              <div className="da-saved-voice-card">
                <div className="da-saved-voice-info">
                  <div className="da-voice-check-circle">
                    <span className="da-check-icon">✓</span>
                  </div>
                  <div>
                    <h4>Voice Recording Saved!</h4>
                    <p>Press Play above to listen to your custom affirmation with the animated visualizer.</p>
                  </div>
                </div>
                
                <div className="da-saved-actions">
                  <button 
                    type="button" 
                    className="da-voice-btn-secondary"
                    onClick={deleteRecording}
                  >
                    🗑️ Delete & Re-record
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="da-ai-voice-section">
            <p>Using premium text-to-speech synthesis (Hindi - India) for deep mindfulness, rhythm, and clarity.</p>
          </div>
        )}
      </div>

      {/* Hidden audio tag for custom voice */}
      {customAudioUrl && (
        <audio 
          ref={customAudioRef} 
          src={customAudioUrl} 
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
};

export default DailyAffirmation;
