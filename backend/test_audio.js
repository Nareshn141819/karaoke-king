// Test youtubei.js with different options
async function test() {
  try {
    const { Innertube } = require('youtubei.js')
    
    console.log('Creating Innertube with fetch...')
    const yt = await Innertube.create({
      cache: null,
      generate_session_locally: false,  // let it fetch session from YouTube
      fetch: (input, init) => {
        // Add browser-like headers
        const headers = new Headers(init?.headers || {})
        headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')
        return fetch(input, { ...init, headers })
      }
    })
    console.log('Innertube created')

    const info = await yt.getInfo('Umqb9KENgmk')
    console.log('Got info:', info.basic_info?.title)
    
    const streamingData = info.streaming_data
    const audioFormats = (streamingData?.adaptive_formats || []).filter(f => f.has_audio && !f.has_video)
    console.log('Audio formats:', audioFormats.length)
    if (audioFormats[0]) {
      console.log('First format URL exists?', !!audioFormats[0].url)
      console.log('First format signatureCipher?', !!audioFormats[0].signature_cipher)
      
      if (audioFormats[0].url) {
        console.log('URL (first 80 chars):', audioFormats[0].url.substring(0, 80))
        console.log('SUCCESS - direct URL available!')
      }
    }
  } catch (e) {
    console.error('FAILED:', e.message)
  }
  process.exit(0)
}
test()
