import { NextRequest, NextResponse } from 'next/server';
import { scrapeLibCalRooms } from '@/lib/scrapers/libcal';

interface Room {
  id: string;
  name: string;
  location: string;
  library: string;
  isAvailable: boolean;
  timeSlot?: string;
  bookingUrl: string;
}

const LIBCAL_LOCATIONS: Record<string, { id: string; name: string }> = {
  langson: { id: '6539', name: 'Langson Library' },
  science: { id: '6540', name: 'Science Library' },
  arboretum: { id: '6541', name: 'Arboretum' },
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { date, startTime, endTime } = body;

    // Validate inputs
    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: date, startTime, endTime' },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    console.log(`[API] Searching for rooms: ${date}, ${startTime}-${endTime}`);

    // Fetch rooms from all libraries
    const allRooms: Room[] = [];

    for (const [key] of Object.entries(LIBCAL_LOCATIONS)) {
      console.log(`[API] Fetching ${key}...`);
      const rooms = await scrapeLibCalRooms(key, date, startTime, endTime);
      allRooms.push(...rooms);
    }

    if (allRooms.length === 0) {
      console.log('[API] No rooms found');
      return NextResponse.json({
        rooms: [],
        message: 'No rooms found for the selected date and time range.',
        availableCount: 0,
        unavailableCount: 0,
      });
    }

    // Sort: available first, then by name
    const sorted = allRooms.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    const availableCount = sorted.filter((r) => r.isAvailable).length;
    const unavailableCount = sorted.filter((r) => !r.isAvailable).length;

    console.log(
      `[API] Returning ${sorted.length} rooms (${availableCount} available, ${unavailableCount} unavailable)`
    );

    return NextResponse.json({
      rooms: sorted,
      availableCount,
      unavailableCount,
    });
  } catch (error) {
    console.error('[API] Search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search for rooms. Please try again later.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}