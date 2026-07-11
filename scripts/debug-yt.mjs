// Debug: check what description data we actually get from YouTube pages
const TEST_VIDEOS = [
  { id: '3M59E7aQeIs', title: 'Known Michele video (from current site)' },
  { id: 'hp4vxRc2Fog', title: 'Most recent Berry video' },
];

async function checkVideo(videoId, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Checking: ${label} (${videoId})`);
  console.log('='.repeat(60));
  
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8'
    }
  });
  const html = await res.text();
  
  // Method 1: meta description
  const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  console.log('\n📋 Meta description:', metaMatch ? metaMatch[1].substring(0, 200) : 'NOT FOUND');
  
  // Method 2: shortDescription from JSON
  const jsonMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  if (jsonMatch) {
    const desc = jsonMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    console.log('\n📋 shortDescription (first 500 chars):');
    console.log(desc.substring(0, 500));
    console.log('\n🔍 Contains "clipmaker":', desc.toLowerCase().includes('clipmaker'));
    console.log('🔍 Contains "michele":', desc.toLowerCase().includes('michele'));
    console.log('🔍 Contains "ciccone":', desc.toLowerCase().includes('ciccone'));
  } else {
    console.log('\n❌ shortDescription NOT FOUND in JSON');
    
    // Try alternative patterns
    const alt1 = html.match(/"description":\{"simpleText":"((?:[^"\\]|\\.)*)"/);
    console.log('Alt pattern (simpleText):', alt1 ? alt1[1].substring(0, 200) : 'NOT FOUND');
    
    // Check if the page has any mention of clipmaker at all
    console.log('Raw HTML contains "clipmaker":', html.toLowerCase().includes('clipmaker'));
    console.log('Raw HTML contains "michele":', html.toLowerCase().includes('michele'));
    
    // Try to find the description in ytInitialPlayerResponse
    const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
    if (playerMatch) {
      try {
        // Just search for description-like content near "description"
        const descArea = html.substring(
          html.indexOf('"videoDetails"'),
          html.indexOf('"videoDetails"') + 2000
        );
        console.log('\nvideoDetails area (first 1000 chars):');
        console.log(descArea.substring(0, 1000));
      } catch(e) {}
    }
  }
}

async function main() {
  for (const v of TEST_VIDEOS) {
    await checkVideo(v.id, v.title);
  }
}

main().catch(console.error);
