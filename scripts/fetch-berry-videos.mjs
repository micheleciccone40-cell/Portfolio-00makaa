// FULL SCAN: Get ALL videos from Berry's channel and check for Michele Ciccone
const CHANNEL_ID = "UCDeppuI2KF-AMmJfvdvwiuA";

async function getFullDescription(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'it-IT,it;q=0.9'
    }
  });
  const html = await res.text();
  
  // Get title too
  const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]*)"/) ||
                     html.match(/<title>([^<]*)<\/title>/);
  let title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'Unknown';
  
  // Get view count
  const viewMatch = html.match(/"viewCount":"(\d+)"/);
  const views = viewMatch ? parseInt(viewMatch[1]) : 0;
  
  const jsonMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  let desc = '';
  if (jsonMatch) {
    desc = jsonMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  
  // Check if it's a short
  const isShort = html.includes('"isShort":true') || desc.toLowerCase().includes('#shorts') || title.toLowerCase().includes('#short');
  
  return { title, desc, views, isShort };
}

async function getAllVideoIds() {
  // Get from uploads playlist page - scroll through all
  const uploadsPlaylistId = CHANNEL_ID.replace("UC", "UU");
  const url = `https://www.youtube.com/playlist?list=${uploadsPlaylistId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'it-IT,it;q=0.9'
    }
  });
  const html = await res.text();
  
  // Extract all unique video IDs
  const videoIdRegex = /"videoId":"([A-Za-z0-9_-]{11})"/g;
  const seenIds = new Set();
  const ids = [];
  let m;
  while ((m = videoIdRegex.exec(html)) !== null) {
    if (!seenIds.has(m[1])) {
      seenIds.add(m[1]);
      ids.push(m[1]);
    }
  }
  
  // Also add the known ones from the current site
  const knownIds = ['3M59E7aQeIs', 'YKQp8Ncj8Hw', '_FjjohhodPM'];
  for (const id of knownIds) {
    if (!seenIds.has(id)) {
      seenIds.add(id);
      ids.push(id);
    }
  }
  
  return ids;
}

async function main() {
  console.log("📡 Getting all video IDs from uploads playlist...\n");
  const allIds = await getAllVideoIds();
  console.log(`Found ${allIds.length} unique video IDs\n`);
  
  const results = [];
  let checked = 0;
  
  for (const videoId of allIds) {
    checked++;
    process.stdout.write(`[${checked}/${allIds.length}] ${videoId}... `);
    
    try {
      const { title, desc, views, isShort } = await getFullDescription(videoId);
      
      if (isShort) {
        console.log(`SKIP (Short) - ${title}`);
        continue;
      }
      
      const descLower = desc.toLowerCase();
      const hasMichele = descLower.includes('michele ciccone');
      
      if (hasMichele) {
        const lines = desc.split('\n');
        const creditLine = lines.find(l => l.toLowerCase().includes('michele')) || '';
        console.log(`✅ "${title}" - ${creditLine.trim()}`);
        
        results.push({
          videoId,
          title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          views,
          creditLine: creditLine.trim(),
        });
      } else {
        console.log(`❌ ${title}`);
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Sort by views descending
  results.sort((a, b) => b.views - a.views);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 FINAL RESULTS: ${results.length} videos by Michele Ciccone`);
  console.log('='.repeat(60));
  
  results.forEach((v, i) => {
    const viewsFormatted = v.views >= 1000 ? `${Math.floor(v.views / 1000)}K` : v.views;
    console.log(`\n${i+1}. ${v.title}`);
    console.log(`   ID: ${v.videoId}`);
    console.log(`   Embed: ${v.embedUrl}`);
    console.log(`   Views: ${viewsFormatted} (${v.views})`);
    console.log(`   Credit: ${v.creditLine}`);
  });
  
  // Save JSON
  const fs = await import('fs');
  fs.writeFileSync('./scripts/michele-videos.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Results saved to scripts/michele-videos.json');
}

main().catch(console.error);
