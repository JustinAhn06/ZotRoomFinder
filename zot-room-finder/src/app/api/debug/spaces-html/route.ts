import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const uciSpacesUrl = 'https://spaces.lib.uci.edu/allspaces';

    const response = await fetch(uciSpacesUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract sample of actual HTML structure
    const debugInfo = {
      pageTitle: $('title').text(),
      totalElements: html.length,
      
      // Find all common container patterns
      divs_with_data_attrs: $('div[data-*]').length,
      links: $('a').slice(0, 5).map((i, el) => ({
        text: $(el).text().trim().substring(0, 50),
        href: $(el).attr('href'),
        class: $(el).attr('class'),
      })).get(),

      // Look for room/space related text
      roomLikeText: $('*')
        .contents()
        .filter((i, node) => {
          const text = node.type === 'text' ? node.data : '';
          return /room|space|study|library|langson|science|mesa/i.test(text as string);
        })
        .slice(0, 10)
        .map((i, node) => (node.type === 'text' ? (node.data as string).trim().substring(0, 100) : ''))
        .get()
        .filter(Boolean),

      // Check for tables (common for scheduling)
      hasTables: $('table').length > 0,
      tableStructure: $('table').first().html()?.substring(0, 500),

      // Check for common library room patterns
      possibleRoomSelectors: {
        byClass: $('[class*="room"], [class*="space"], [class*="study"]').length,
        byId: $('[id*="room"], [id*="space"], [id*="study"]').length,
        byAriaLabel: $('[aria-label*="room"], [aria-label*="space"]').length,
      },

      // Sample of all text content (first 1000 chars)
      pageContent: html.substring(0, 1000),
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}