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

export const revalidate = 3600;

interface VideoData {
  videoId: string;
  title: string;
  views: number;
  embedUrl: string;
}

// Usa la variabile d'ambiente su Vercel, o questa hardcoded come fallback.
const API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyDSJZ3r0FsoyX9X43uR0Mj88VBoFCzs6Ac";

async function discoverNewVideos(): Promise<string[]> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
    const res = await fetch(rssUrl, { next: { revalidate: 3600 } });
    const xml = await res.text();

    const entryRegex = /<entry>[\s\S]*?<yt:videoId>([^<]+)<\/yt:videoId>[\s\S]*?<\/entry>/g;
    const rssVideoIds: string[] = [];
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      rssVideoIds.push(match[1]);
    }

    const knownSet = new Set(KNOWN_VIDEO_IDS);
    const newIds = rssVideoIds.filter(id => !knownSet.has(id));
    return newIds;
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const newVideoIds = await discoverNewVideos();
    const allVideoIds = [...new Set([...KNOWN_VIDEO_IDS, ...newVideoIds])];

    const videos: VideoData[] = [];
    
    // Possiamo controllare 50 video alla volta per ottimizzare.
    for (let i = 0; i < allVideoIds.length; i += 50) {
      const chunk = allVideoIds.slice(i, i + 50).join(',');
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${chunk}&key=${API_KEY}`;
      
      const res = await fetch(url, { next: { revalidate: 3600 } });
      const data = await res.json();
      
      if (data.items) {
        for (const item of data.items) {
          const desc = item.snippet.description.toLowerCase();
          const isKnown = KNOWN_VIDEO_IDS.includes(item.id);
          
          // Aggiungi se è nella lista di base, oppure se la descrizione menziona michele
          if (isKnown || desc.includes('michele ciccone')) {
            videos.push({
              videoId: item.id,
              title: item.snippet.title,
              views: parseInt(item.statistics.viewCount || '0', 10),
              embedUrl: `https://www.youtube.com/embed/${item.id}`,
            });
          }
        }
      }
    }

    videos.sort((a, b) => b.views - a.views);
    const totalViews = videos.reduce((sum, v) => sum + v.views, 0);

    return NextResponse.json({
      videos,
      totalViews,
      lastUpdated: new Date().toISOString(),
      count: videos.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch video data' },
      { status: 500 }
    );
  }
}
