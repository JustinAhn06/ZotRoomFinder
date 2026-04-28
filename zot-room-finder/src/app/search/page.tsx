'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
  isAvailable: boolean;
  timeSlot?: string;
  bookingUrl: string;
}

const LIB_CONFIG = {
  langson: { stripe: '#F4C6A8', pill: '#F4C6A8', pillText: '#7a4f30', label: '📚 Langson' },
  science: { stripe: '#C9B8D8', pill: '#C9B8D8', pillText: '#4a3568', label: '🔬 Science' },
  gateway: { stripe: '#A8C5A0', pill: '#A8C5A0', pillText: '#2d5a35', label: '🏫 Gateway' },
} as const;

type LibKey = keyof typeof LIB_CONFIG;

function getLibKey(location: string): LibKey {
  const loc = location.toLowerCase();
  if (loc.includes('langson')) return 'langson';
  if (loc.includes('science')) return 'science';
  return 'gateway';
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function getEarliestStartTime(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  if (m === 0) return `${String(h).padStart(2, '0')}:00`;
  if (m <= 30) return `${String(h).padStart(2, '0')}:30`;
  return `${String(h + 1).padStart(2, '0')}:00`;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function formatDisplayTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function validateInputs(date: string, startTime: string): string | null {
  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');

  if (!date || !startTime) return 'Please fill in all fields.';
  if (date < today) return 'Date cannot be in the past.';
  if (date > maxDate) return 'LibCal only shows availability up to 3 days in advance.';

  if (date === today) {
    const earliest = getEarliestStartTime();
    if (startTime < earliest) {
      return `The earliest bookable time right now is ${formatDisplayTime(earliest)}.`;
    }
  }

  const [, sm] = startTime.split(':').map(Number);
  if (sm !== 0 && sm !== 30) return 'Start time must be on a 30-minute interval.';

  return null;
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-nunito), sans-serif',
  fontSize: '0.95rem',
  background: '#fffdf5',
  border: '1.5px solid #e8dfc8',
  borderRadius: 14,
  padding: '10px 14px',
  width: '100%',
  color: '#2D2D2D',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 700,
  fontSize: '0.78rem',
  color: '#aaa',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function SearchPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');

  const [date, setDate] = useState<string>(today);
  const [startTime, setStartTime] = useState<string>(getEarliestStartTime());
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [minCapacity, setMinCapacity] = useState<number>(1);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [techOnly, setTechOnly] = useState<boolean>(false);

  const [showBooked, setShowBooked] = useState<boolean>(false);
  const [pencilKey, setPencilKey] = useState<number>(0);

  const endTime = addMinutesToTime(startTime, durationMinutes);

  // Generate 30-min time options 7am–midnight
  const timeOptions: { val: string; label: string }[] = [];
  for (let h = 7; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      timeOptions.push({ val, label: formatDisplayTime(val) });
    }
  }

  const handleSearch = async () => {
    const validationError = validateInputs(date, startTime);
    if (validationError) {
      setError(validationError);
      setHasSearched(true);
      setRooms([]);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError('');

    try {
      const response = await fetch('/api/rooms/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, startTime, endTime }),
      });

      if (!response.ok) throw new Error('Failed to fetch rooms');

      const data = await response.json();
      setRooms(data.rooms || []);

      if (data.rooms.length === 0) {
        setError('No rooms found for the selected time.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (locationFilter !== 'all' && !room.location.toLowerCase().includes(locationFilter)) return false;
    if ((room.capacity ?? 0) < minCapacity) return false;
    if (techOnly && !room.name.toLowerCase().includes('tech')) return false;
    return true;
  });

  const availableRooms = filteredRooms.filter((r) => r.isAvailable);
  const bookedRooms = filteredRooms.filter((r) => !r.isAvailable);
  const displayedRooms = showBooked ? filteredRooms : availableRooms;

  const libTabs = [
    { key: 'all', label: '🗺️ All' },
    { key: 'langson', label: LIB_CONFIG.langson.label },
    { key: 'science', label: LIB_CONFIG.science.label },
    { key: 'gateway', label: LIB_CONFIG.gateway.label },
  ];

  function handleTabClick(key: string) {
    setLocationFilter(key);
    setPencilKey((k) => k + 1);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FEFAE0' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{ background: '#fffdf5', borderBottom: '1.5px solid #ede8d8', padding: '14px 24px' }}
      >
        <div
          className="max-w-5xl mx-auto flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{ width: 32, height: 32, background: '#E8A598', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <span className="font-fraunces font-bold text-white" style={{ fontSize: '1rem' }}>Z</span>
              </div>
              <span
                className="font-fraunces italic font-bold"
                style={{ fontSize: '1.25rem', color: '#2D2D2D' }}
              >
                Zot Room Finder
              </span>
            </div>
          </div>
          {hasSearched && !error && (
            <div style={{ fontSize: '0.82rem', color: '#aaa', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span>📅 {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span>·</span>
              <span>⏰ {formatDisplayTime(startTime)}–{formatDisplayTime(endTime)}</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto" style={{ padding: '28px 20px 60px' }}>
        {/* Search form card */}
        <div
          style={{
            background: '#fffdf5',
            borderRadius: 28,
            border: '1.5px solid #ede8d8',
            padding: '28px',
            boxShadow: '0 8px 32px rgba(45,45,45,0.07)',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* Date */}
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={date}
                min={today}
                max={maxDate}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#E8A598')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e8dfc8')}
              />
            </div>

            {/* Start time */}
            <div>
              <label style={labelStyle}>Start Time</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#E8A598')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e8dfc8')}
              >
                {timeOptions.map((o) => (
                  <option key={o.val} value={o.val}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={labelStyle}>Duration</label>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E8A598' }}>
                  {formatDuration(durationMinutes)} · ends {formatDisplayTime(endTime)}
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={600}
                step={30}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#E8A598', marginTop: 8 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#ccc', marginTop: 4 }}>
                <span>30 min</span>
                <span>10 hr</span>
              </div>
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-nunito), sans-serif',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#aaa',
              padding: 0,
              marginBottom: showAdvanced ? 16 : 0,
            }}
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced filters
          </button>

          {/* Advanced panel */}
          {showAdvanced && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16,
                paddingTop: 16,
                borderTop: '1.5px solid #ede8d8',
                marginBottom: 20,
              }}
            >
              <div>
                <label style={labelStyle}>Min Capacity: {minCapacity}</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#E8A598' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#ccc', marginTop: 4 }}>
                  <span>1</span>
                  <span>10+</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
                <input
                  type="checkbox"
                  id="tech-only"
                  checked={techOnly}
                  onChange={(e) => setTechOnly(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#E8A598', cursor: 'pointer' }}
                />
                <label htmlFor="tech-only" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#555', cursor: 'pointer' }}>
                  Tech-enhanced only
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 500 }}>
                    Projector / screen
                  </span>
                </label>
              </div>
            </div>
          )}

          {error && (
            <p style={{ color: '#d4857b', fontSize: '0.88rem', fontWeight: 600, marginBottom: 14, textAlign: 'center' }}>
              {error}
            </p>
          )}

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#f0ece4' : '#E8A598',
              color: loading ? '#aaa' : '#fff',
              border: 'none',
              borderRadius: 18,
              padding: '15px',
              fontFamily: 'var(--font-nunito), sans-serif',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.18s',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#d4857b'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#E8A598'; }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching…
              </>
            ) : (
              'Find My Spot 🔍'
            )}
          </button>
        </div>

        {/* Results */}
        {hasSearched && !loading && !error && filteredRooms.length > 0 && (
          <>
            {/* Summary row */}
            <div
              style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
            >
              <div>
                <h2
                  className="font-fraunces italic font-bold"
                  style={{ fontSize: '1.5rem', color: '#2D2D2D', marginBottom: 2 }}
                >
                  {availableRooms.length} rooms open for you
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: 600 }}>
                  {bookedRooms.length} booked ·{' '}
                  <button
                    onClick={() => setShowBooked((v) => !v)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E8A598',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-nunito), sans-serif',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      padding: 0,
                    }}
                  >
                    {showBooked ? 'hide booked' : 'show booked'}
                  </button>
                </p>
              </div>
              <button
                onClick={() => { setHasSearched(false); setRooms([]); setError(''); }}
                style={{
                  background: '#E8A598',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '10px 20px',
                  fontFamily: 'var(--font-nunito), sans-serif',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#d4857b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#E8A598')}
              >
                New Search 🔍
              </button>
            </div>

            {/* Library filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {libTabs.map((tab) => {
                const isActive = locationFilter === tab.key;
                const cfg = tab.key !== 'all' ? LIB_CONFIG[tab.key as LibKey] : null;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabClick(tab.key)}
                    style={{
                      border: isActive ? 'none' : '1.5px solid #e8dfc8',
                      background: isActive ? (cfg ? cfg.pill : '#E8A598') : '#fffdf5',
                      color: isActive ? (cfg ? cfg.pillText : '#fff') : '#888',
                      borderRadius: 99,
                      padding: '9px 20px',
                      fontFamily: 'var(--font-nunito), sans-serif',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s',
                      boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.1)' : 'none',
                      transform: isActive ? 'scale(1.04)' : 'scale(1)',
                    }}
                  >
                    {isActive && (
                      <span key={pencilKey} className="pencil-spin">📝</span>
                    )}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Cards grid */}
            {displayedRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
                <p style={{ fontWeight: 700, fontSize: '1rem' }}>No rooms match your filters</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16,
                }}
              >
                {displayedRooms.map((room, i) => {
                  const libKey = getLibKey(room.location);
                  const cfg = LIB_CONFIG[libKey];
                  return (
                    <a
                      key={room.id}
                      href={room.isAvailable ? room.bookingUrl : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="room-card card-spring"
                      style={{
                        background: '#fffdf5',
                        borderRadius: 22,
                        boxShadow: '0 4px 18px rgba(45,45,45,0.08)',
                        overflow: 'hidden',
                        display: 'flex',
                        textDecoration: 'none',
                        color: 'inherit',
                        animationDelay: `${Math.min(i * 40, 400)}ms`,
                        cursor: room.isAvailable ? 'pointer' : 'default',
                        pointerEvents: room.isAvailable ? 'auto' : 'none',
                      }}
                    >
                      {/* Library stripe */}
                      <div style={{ width: 7, background: cfg.stripe, flexShrink: 0 }} />

                      <div style={{ padding: '18px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Name + status */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.3, color: '#2D2D2D' }}>
                            {room.name}
                          </span>
                          {room.isAvailable ? (
                            <span style={{
                              background: '#d4edd6', color: '#2a7a35', borderRadius: 99, fontSize: '0.72rem',
                              fontWeight: 700, padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0,
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4caf50', display: 'inline-block' }} />
                              Open!
                            </span>
                          ) : (
                            <span style={{
                              background: '#f0ece4', color: '#888', borderRadius: 99, fontSize: '0.72rem',
                              fontWeight: 600, padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0,
                              textDecoration: 'line-through', textDecorationColor: '#bbb',
                            }}>
                              Booked
                            </span>
                          )}
                        </div>

                        {/* Library pill */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          background: cfg.pill + '55', color: cfg.pillText,
                          borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                          padding: '2px 10px', width: 'fit-content',
                        }}>
                          {cfg.label}
                        </span>

                        {/* Capacity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#666' }}>
                          <span>👥</span>
                          <span>{room.capacity === 1 ? 'Solo pod' : `${room.capacity} people`}</span>
                        </div>

                        {/* CTA */}
                        {room.isAvailable && (
                          <div style={{ marginTop: 4 }}>
                            <span style={{
                              background: '#E8A598', color: '#fff', borderRadius: 12,
                              fontSize: '0.82rem', fontWeight: 700, padding: '6px 14px', display: 'inline-block',
                            }}>
                              View & Reserve →
                            </span>
                          </div>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: '#E8A598',
                    animation: 'dot 1.2s infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            <p style={{ color: '#aaa', fontWeight: 600 }}>Finding available rooms…</p>
          </div>
        )}

        {/* Error state */}
        {hasSearched && !loading && error && (
          <div style={{
            background: '#fff5f4', border: '1.5px solid #f4c6c0',
            borderRadius: 16, padding: '16px 20px',
            color: '#d4857b', fontWeight: 600, fontSize: '0.92rem',
          }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {hasSearched && !loading && !error && filteredRooms.length === 0 && rooms.length > 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 700, fontSize: '1rem' }}>No rooms match your filters</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.7); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
