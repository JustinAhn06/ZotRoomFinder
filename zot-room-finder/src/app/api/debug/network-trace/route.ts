import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Fetch the spaces page and look for API calls in JS
    const response = await fetch('https://spaces.lib.uci.edu/spaces?lid=6539', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    const html = await response.text();

    // Extract all URLs from script tags
    const urls = html.match(/https?:\/\/[^\s"'<>]+/g) || [];
    const apiUrls = urls.filter(
      (url) =>
        url.includes('api') ||
        url.includes('spaces') ||
        url.includes('availability') ||
        url.includes('grid')
    );

    // Also look for inline fetch/ajax calls
    const fetchCalls = html.match(/fetch\(['"]([^'"]+)['"]/g) || [];
    const ajaxCalls = html.match(/\/[a-zA-Z0-9/_-]+\.(json|php|aspx)/g) || [];

    return NextResponse.json({
      foundApiUrls: [...new Set(apiUrls)].slice(0, 20),
      fetchCalls: fetchCalls.map((c) => c.replace(/fetch\(['"]|['"]/g, '')),
      ajaxEndpoints: [...new Set(ajaxCalls)],
      totalUrls: urls.length,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}