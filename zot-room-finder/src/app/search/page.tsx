'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, MapPin, Users, Zap } from 'lucide-react';
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
  if (sm !== 0 && sm !== 30) {
    return `Start time must be on a 30-minute interval.`;
  }

  return null;
}

export default function SearchPage() {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');

  const [date, setDate] = useState<string>(today);
  const [startTime, setStartTime] = useState<string>(getEarliestStartTime());
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [minCapacity, setMinCapacity] = useState<number>(1);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [techOnly, setTechOnly] = useState<boolean>(false);

  const endTime = addMinutesToTime(startTime, durationMinutes);

  const runSearch = async (overrideDate?: string, overrideStart?: string, overrideDuration?: number) => {
    const d = overrideDate ?? date;
    const s = overrideStart ?? startTime;
    const dur = overrideDuration ?? durationMinutes;
    const e = addMinutesToTime(s, dur);

    const validationError = validateInputs(d, s);
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
        body: JSON.stringify({ date: d, startTime: s, endTime: e }),
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

  const handleFindNow = () => {
    const nowDate = format(new Date(), 'yyyy-MM-dd');
    const nowStart = getEarliestStartTime();
    setDate(nowDate);
    setStartTime(nowStart);
    setDurationMinutes(60);
    runSearch(nowDate, nowStart, 60);
  };

  // Apply client-side filters
  const filteredRooms = rooms.filter((room) => {
    if (locationFilter !== 'all' && !room.location.toLowerCase().includes(locationFilter)) return false;
    if ((room.capacity ?? 0) < minCapacity) return false;
    if (techOnly && !room.name.toLowerCase().includes('tech')) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-[#0064A4]">Find a Room</h1>
        </div>
      </header>

      {/* Search Form */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">

          {/* Find Me a Room Now */}
          <Button
            onClick={handleFindNow}
            disabled={loading}
            className="w-full bg-[#FFD200] hover:bg-[#e6be00] text-[#1a1a1a] font-semibold flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Find me a room now
          </Button>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="flex-1 h-px bg-gray-200" />
            or search manually
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Main inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <Input
                type="date"
                value={date}
                min={today}
                max={maxDate}
                onChange={(e) => setDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <Input
                type="time"
                value={startTime}
                step={1800}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration: {formatDuration(durationMinutes)}
                <span className="ml-2 text-[#0064A4] font-normal">
                  → ends {formatDisplayTime(endTime)}
                </span>
              </label>
              <input
                type="range"
                min={30}
                max={600}
                step={30}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full accent-[#0064A4] mt-2"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>30 min</span>
                <span>10 hr</span>
              </div>
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced filters
          </button>

          {/* Advanced panel */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0064A4]"
                >
                  <option value="all">All Libraries</option>
                  <option value="langson">Langson Library</option>
                  <option value="science">Science Library</option>
                  <option value="gateway">Gateway Study Center</option>
                </select>
              </div>

              {/* Min Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Capacity: {minCapacity}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(Number(e.target.value))}
                  className="w-full accent-[#0064A4]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>10+</span>
                </div>
              </div>

              {/* Tech Enhanced */}
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="tech-only"
                  checked={techOnly}
                  onChange={(e) => setTechOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#0064A4]"
                />
                <label htmlFor="tech-only" className="text-sm font-medium text-gray-700">
                  Tech-enhanced only
                  <span className="block text-xs text-gray-400 font-normal">Projector / screen</span>
                </label>
              </div>
            </div>
          )}

          <Button
            onClick={() => runSearch()}
            disabled={loading}
            className="w-full bg-[#0064A4] hover:bg-[#004A7A] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              'Search Available Rooms'
            )}
          </Button>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="mt-8">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#0064A4] mx-auto" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            ) : filteredRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <MapPin className="w-4 h-4" />
                      {room.location}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Users className="w-4 h-4" />
                      Capacity: {room.capacity}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`text-sm font-medium px-3 py-1 rounded-full ${
                          room.isAvailable
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {room.isAvailable ? 'Available' : 'Booked'}
                      </span>

                      {room.isAvailable && (
                        <a
                          href={room.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0064A4] hover:underline text-sm font-medium"
                        >
                          Book Now →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No rooms match your filters. Try adjusting your search.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
