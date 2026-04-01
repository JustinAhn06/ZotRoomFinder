import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const locationId = '6540'; // Science Library
    const url = `https://spaces.lib.uci.edu/spaces?lid=${locationId}`;

    console.log(`[DEBUG] Fetching ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    const html = await response.text();

    // Extract key parts of the HTML for debugging
    const tableMatch = html.match(/<table[^>]*>[\s\S]{0,500}</);
    const rowMatches = html.match(/<tr[^>]*>[\s\S]{0,300}<\/tr>/g) || [];
    const cellMatches = html.match(/<td[^>]*>[\s\S]{0,200}<\/td>/g) || [];

    // Look for color indicators
    const colorMatches = html.match(/#[0-9A-Fa-f]{6}/g) || [];
    const uniqueColors = [...new Set(colorMatches)];

    // Look for room names
    const roomNameMatches = html.match(/InfoScience \d+/g) || [];
    const uniqueRooms = [...new Set(roomNameMatches)];

    // Get a snippet of the actual table structure
    const tableStart = html.indexOf('<table');
    const tableEnd = html.indexOf('</table>') + 8;
    const tableSnippet = html.substring(tableStart, Math.min(tableEnd, tableStart + 2000));

    return NextResponse.json({
      success: true,
      htmlLength: html.length,
      foundTable: !!tableMatch,
      tableRowCount: rowMatches.length,
      tableCellCount: cellMatches.length,
      uniqueColors: uniqueColors.slice(0, 10),
      uniqueRooms: uniqueRooms.slice(0, 10),
      tableSnippet: tableSnippet.substring(0, 1500),
      sampleRows: rowMatches.slice(0, 3).map((r) => r.substring(0, 300)),
      sampleCells: cellMatches.slice(0, 5).map((c) => c.substring(0, 200)),
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}