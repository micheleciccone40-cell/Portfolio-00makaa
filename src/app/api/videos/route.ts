import { NextResponse } from 'next/server';

/* ─── Configuration ─── */
const CHANNEL_ID = "UCDeppuI2KF-AMmJfvdvwiuA";

// Known video IDs edited by Michele (hardcoded to avoid re-scanning old videos)
const KNOWN_VIDEO_IDS = [
  "3M59E7aQeIs",  // Maes: il primo rapper ricercato dall'Interpol
  "YKQp8Ncj8Hw",  // Michael Jackson è ancora vivo
  "ZLbaSpFQ_LY",  // DEATH ROW: l'etichetta discografica più pericolosa di sempre
  "_FjjohhodPM",  // Come NLE Choppa ha distrutto la sua reputazione
  "BCgCvOU98yQ",  // La Tragica Morte di The Notorious B.I.G.
  "hp4vxRc2Fog",  // Il CROLLO di Lil Baby
  "1-yo3i5g4Bs",  // Perché il mondo si è rivoltato contro Kanye West
];

// Revalidate every hour (3600 seconds) for ISR
export const revalidate = 3600;

/* ─── YouTube Data Fetchers ─── */

interface VideoData {
  videoId: string;
  title: string;
  views: number;
  embedUrl: string;
}

/**
 * Decode HTML entities that YouTube leaves in meta titles (e.g. &#39;)
 */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Fetch video title + view count from a YouTube video page
 */
async function getVideoData(videoId: string): Promise<VideoData | null> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'it-IT,it;q=0.9'
      },
      next: { revalidate: 3600 }
    });
    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]*)"/);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : 'Untitled';

    // Extract view count
    const viewMatch = html.match(/"viewCount":"(\d+)"/);
    const views = viewMatch ? parseInt(viewMatch[1]) : 0;

    return {
      videoId,
      title,
      views,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  } catch {
    return null;
  }
}

/**
 * Check the channel's RSS feed for NEW videos with Michele Ciccone in the description
 */
async function discoverNewVideos(): Promise<string[]> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
    const res = await fetch(rssUrl, { next: { revalidate: 3600 } });
    const xml = await res.text();

    // Extract video IDs from RSS
    const entryRegex = /<entry>[\s\S]*?<yt:videoId>([^<]+)<\/yt:videoId>[\s\S]*?<\/entry>/g;
    const rssVideoIds: string[] = [];
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      rssVideoIds.push(match[1]);
    }

    // Filter out already-known IDs
    const knownSet = new Set(KNOWN_VIDEO_IDS);
    const newIds = rssVideoIds.filter(id => !knownSet.has(id));

    // Check descriptions of new videos for Michele Ciccone
    const newMicheleIds: string[] = [];
    for (const videoId of newIds) {
      try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'it-IT,it;q=0.9'
          },
          next: { revalidate: 3600 }
        });
        const html = await res.text();

        const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
        if (descMatch) {
          const desc = descMatch[1].toLowerCase();
          if (desc.includes('michele ciccone')) {
            newMicheleIds.push(videoId);
          }
        }
      } catch {
        // Skip failed fetches
      }
    }

    return newMicheleIds;
  } catch {
    return [];
  }
}

/* ─── API Route Handler ─── */

export async function GET() {
  try {
    // 1. Discover any new videos from RSS feed
    const newVideoIds = await discoverNewVideos();

    // 2. Combine known + newly discovered IDs
    const allVideoIds = [...new Set([...KNOWN_VIDEO_IDS, ...newVideoIds])];

    // 3. Fetch data for all videos in parallel
    const videoDataPromises = allVideoIds.map(id => getVideoData(id));
    const videoDataResults = await Promise.all(videoDataPromises);

    // 4. Filter out failed fetches and sort by views (descending)
    const videos = videoDataResults
      .filter((v): v is VideoData => v !== null)
      .sort((a, b) => b.views - a.views);

    // 5. Calculate total views
    const totalViews = videos.reduce((sum, v) => sum + v.views, 0);

    return NextResponse.json({
      videos,
      totalViews,
      lastUpdated: new Date().toISOString(),
      count: videos.length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch video data' },
      { status: 500 }
    );
  }
}
