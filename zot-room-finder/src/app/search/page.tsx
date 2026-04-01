'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, MapPin, Users } from 'lucide-react';
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

// Round a time string "HH:MM" up to the next 30-min boundary
function nextHalfHour(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  if (m === 0) return timeStr;
  if (m <= 30) return `${String(h).padStart(2, '0')}:30`;
  const nextH = h + 1;
  return `${String(nextH).padStart(2, '0')}:00`;
}

function getEarliestStartTime(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  // Round up to next 30-min slot
  if (m === 0) return `${String(h).padStart(2, '0')}:00`;
  if (m <= 30) return `${String(h).padStart(2, '0')}:30`;
  return `${String(h + 1).padStart(2, '0')}:00`;
}

function validateInputs(date: string, startTime: string, endTime: string): string | null {
  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');

  if (!date || !startTime || !endTime) {
    return 'Please fill in all fields.';
  }
  if (date < today) {
    return 'Date cannot be in the past.';
  }
  if (date > maxDate) {
    return 'LibCal only shows availability up to 3 days in advance.';
  }
  if (startTime >= endTime) {
    return 'Start time must be before end time.';
  }
  // On today, start time must be at or after the next bookable 30-min slot
  if (date === today) {
    const earliest = getEarliestStartTime();
    if (startTime < earliest) {
      return `The earliest bookable time right now is ${earliest}.`;
    }
  }
  // Times must be on 30-min boundaries
  const [, sm] = startTime.split(':').map(Number);
  const [, em] = endTime.split(':').map(Number);
  if (sm !== 0 && sm !== 30) {
    return `Start time must be on a 30-minute interval (e.g. ${nextHalfHour(startTime)}).`;
  }
  if (em !== 0 && em !== 30) {
    return `End time must be on a 30-minute interval (e.g. ${nextHalfHour(endTime)}).`;
  }

  return null;
}

export default function SearchPage() {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');
  const earliestStart = getEarliestStartTime();

  const [date, setDate] = useState<string>(today);
  const [startTime, setStartTime] = useState<string>(earliestStart);
  const [endTime, setEndTime] = useState<string>(() => {
    const [h, m] = earliestStart.split(':').map(Number);
    const endH = m === 30 ? h + 1 : h;
    const endM = m === 30 ? '00' : '30';
    return `${String(endH).padStart(2, '0')}:${endM}`;
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSearch = async () => {
    const validationError = validateInputs(date, startTime, endTime);
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

      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();
      setRooms(data.rooms || []);

      if (data.rooms.length === 0) {
        setError('No rooms found for the selected time.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <Input
                type="time"
                value={startTime}
                step={1800}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <Input
                type="time"
                value={endTime}
                step={1800}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
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
            ) : rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {room.name}
                    </h3>

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
                  No rooms available for the selected time. Try a different time!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
