import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface AvailableSlot {
  date: string;
  time: string;
  rooms: string[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const uciSpacesUrl = 'https://spaces.lib.uci.edu/allspaces';

    const response = await fetch(uciSpacesUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch UCI Spaces' }, { status: 500 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Strategy 1: Look for embedded JSON data in script tags
    const jsonData = extractEmbeddedJSON($);
    if (jsonData) {
      return NextResponse.json({
        source: 'embedded_json',
        data: jsonData,
      });
    }

    // Strategy 2: Parse calendar/table structure
    const calendarData = parseCalendarStructure($);
    if (calendarData.availableSlots.length > 0) {
      return NextResponse.json({
        source: 'calendar_structure',
        availableSlots: calendarData.availableSlots,
        totalRoomsFound: calendarData.totalRoomsFound,
      });
    }

    // Strategy 3: Look for LibCal API references
    const libcalInfo = extractLibCalReferences(html);
    if (libcalInfo.hasLibCal) {
      return NextResponse.json({
        source: 'libcal_api',
        ...libcalInfo,
      });
    }

    // Strategy 4: Extract all visible text and rooms
    const visibleRooms = extractVisibleRooms($);
    
    return NextResponse.json({
      source: 'fallback_analysis',
      pageTitle: $('title').text(),
      visibleRooms,
      htmlSize: html.length,
      hasDataAttributes: $('[data-*]').length > 0,
      hasTables: $('table').length > 0,
      suggestion: 'Page may load content via JavaScript. Consider using Puppeteer.',
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function extractEmbeddedJSON($: cheerio.CheerioAPI): Record<string, unknown> | null {
  let jsonData: Record<string, unknown> | null = null;

  $('script').each((i, el) => {
    const content = $(el).html() || '';
    
    // Look for JSON patterns
    const jsonMatches = content.match(/\{[\s\S]*?"room"[\s\S]*?\}/g);
    if (jsonMatches) {
      try {
        jsonData = JSON.parse(jsonMatches[0]);
        return false; // Break
      } catch (e) {
        // Continue searching
      }
    }

    // Look for window data assignments
    const windowDataMatches = content.match(/window\.\w+\s*=\s*(\{[\s\S]*?\});/);
    if (windowDataMatches) {
      try {
        jsonData = JSON.parse(windowDataMatches[1]);
        return false;
      } catch (e) {
        // Continue
      }
    }
  });

  return jsonData;
}

function parseCalendarStructure($: cheerio.CheerioAPI): {
  availableSlots: AvailableSlot[];
  totalRoomsFound: number;
} {
  const availableSlots: AvailableSlot[] = [];
  let totalRoomsFound = 0;

  // Parse table structure
  $('table').each((tableIdx, table) => {
    const $table = $(table);
    const headers = $table.find('thead tr th, thead tr td').map((i, el) => $(el).text().trim()).get();

    $table.find('tbody tr').each((rowIdx, row) => {
      const $row = $(row);
      const cells = $row.find('td, th');
      let dateTime = '';
      const availableRooms: string[] = [];

      cells.each((cellIdx, cell) => {
        const $cell = $(cell);
        const text = $cell.text().trim();
        const status = $cell.attr('class') || '';

        // First cell usually contains date/time
        if (cellIdx === 0 && /\d{1,2}[:\/]\d{1,2}|am|pm|morning|afternoon/i.test(text)) {
          dateTime = text;
        }

        // Look for "available" or "open" indicators
        if (/available|open|free/i.test(status) || /available|open|free/i.test(text)) {
          availableRooms.push(text);
        }
      });

      if (dateTime && availableRooms.length > 0) {
        availableSlots.push({
          date: new Date().toISOString().split('T')[0],
          time: dateTime,
          rooms: availableRooms,
        });
      }
    });
  });

  // Parse div-based calendar grid
  $('[data-date], .calendar-day, [class*="time-slot"]').each((i, el) => {
    const $el = $(el);
    const date = $el.attr('data-date') || $el.text();
    
    $el.find('[data-available="true"], .available, [class*="available"]').each((j, room) => {
      const $room = $(room);
      const roomName = $room.text().trim() || $room.attr('data-room');
      
      if (roomName) {
        availableSlots.push({
          date,
          time: new Date().toLocaleTimeString(),
          rooms: [roomName],
        });
        totalRoomsFound++;
      }
    });
  });

  return { availableSlots, totalRoomsFound };
}

function extractLibCalReferences(html: string): Record<string, unknown> {
  const libcalMatches = html.match(/libcal\.com|/i);
  const libcalAPI = html.match(/https?:\/\/[^"']*libcal[^"']*api[^"']*/gi) || [];

  return {
    hasLibCal: !!libcalMatches,
    apiEndpoints: libcalAPI,
    recommendation: 'Consider direct LibCal API integration for Langson & Science Library',
  };
}

function extractVisibleRooms($: cheerio.CheerioAPI): string[] {
  const rooms: string[] = [];

  // Extract text that looks like room names
  $('*').each((i, el) => {
    const text = $(el).text().trim();
    
    // Match patterns like "Study Room A", "Room 101", etc.
    if (/study room|room \d+|meeting room|group study|quiet study|conference/i.test(text)) {
      rooms.push(text.substring(0, 100));
    }
  });

  return [...new Set(rooms)].slice(0, 20);
}