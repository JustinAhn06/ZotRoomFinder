import { NextRequest, NextResponse } from 'next/server';
import { scrapeLibCalRooms, LIBCAL_LOCATION_KEYS } from '@/lib/scrapers/libcal';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { date, startTime, endTime } = body;

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

    console.log(`[API] Search: ${date} ${startTime}-${endTime}`);

    const results = await Promise.all(
      LIBCAL_LOCATION_KEYS.map((key) =>
        scrapeLibCalRooms(key, date, startTime, endTime)
      )
    );

    const allRooms = results.flat();

    const sorted = allRooms.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      if (a.library !== b.library) return a.library.localeCompare(b.library);
      return a.name.localeCompare(b.name);
    });

    const availableCount = sorted.filter((r) => r.isAvailable).length;

    console.log(`[API] Results: ${sorted.length} rooms (${availableCount} available)`);

    return NextResponse.json({
      rooms: sorted,
      availableCount,
      unavailableCount: sorted.length - availableCount,
      totalCount: sorted.length,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search rooms', details: String(error) },
      { status: 500 }
    );
  }
}
