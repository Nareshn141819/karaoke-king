const { spawn } = require('child_process');
const YT_DLP = 'yt-dlp.exe';
const ytUrl = 'https://www.youtube.com/watch?v=Umqb9KENgmk';

const proc = spawn(YT_DLP, [
  ytUrl,
  '-f', 'bestaudio',
  '--get-url', '--no-playlist', '--quiet',
  '--extractor-args', 'youtube:player_client=ios,android,tv',
  '--js-runtimes', \`node:\${process.execPath || 'node'}\`,
  '--force-ipv4',
  '--no-warnings'
]);

let out = '', err = '';
proc.stdout.on('data', d => out += d);
proc.stderr.on('data', d => err += d);
proc.on('close', code => {
  console.log('Close code:', code);
  console.log('URL:', out.trim().substring(0, 50) + '...');
  console.log('Error:', err);
});
