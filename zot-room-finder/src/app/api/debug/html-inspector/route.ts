import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const response = await fetch('https://spaces.lib.uci.edu/spaces?lid=6540', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    const html = await response.text();

    // Find actual table structure
    const tableStart = html.indexOf('<table');
    const tableEnd = html.indexOf('</table>', tableStart);
    const table = html.substring(tableStart, tableEnd + 8);

    // Get room names from the actual page
    const roomNameRegex = /InfoScience\s+\d+[^<]*/g;
    const roomNames = html.match(roomNameRegex) || [];

    // Get script tags that might contain data
    const scriptTags = html.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
    const dataScripts = scriptTags.filter((s) =>
      s.includes('var ') || s.includes('const ')
    );

    return NextResponse.json({
      htmlLength: html.length,
      hasTable: html.includes('<table'),
      roomNamesFound: [...new Set(roomNames)].slice(0, 10),
      tablePreview: table.substring(0, 1000),
      scriptCount: scriptTags.length,
      dataScriptCount: dataScripts.length,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}