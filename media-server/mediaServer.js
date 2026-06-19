const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const NodeMediaServer = require('node-media-server');

const RTMP_PORT = 1935;
const HTTP_PORT = 8000;
const MEDIA_ROOT = path.join(__dirname, 'media');
const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5000/api';

const activeHlsProcesses = new Map();

const config = {
  rtmp: {
    port: RTMP_PORT,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
};

function setHlsHeaders(res, filePath = '') {
  const extension = path.extname(filePath).toLowerCase();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, Content-Type, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (extension === '.m3u8') {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  }

  if (extension === '.ts') {
    res.setHeader('Content-Type', 'video/mp2t');
  }
}

function getSafeFilePath(requestUrl) {
  const parsedUrl = new URL(requestUrl, `http://localhost:${HTTP_PORT}`);
  const decodedPath = decodeURIComponent(parsedUrl.pathname);
  const requestedFile = path.normalize(path.join(MEDIA_ROOT, decodedPath));

  if (!requestedFile.startsWith(MEDIA_ROOT)) {
    return null;
  }

  return requestedFile;
}

function serveHlsFile(req, res) {
  const filePath = getSafeFilePath(req.url);

  setHlsHeaders(res, filePath || '');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405);
    res.end('Method not allowed');
    return;
  }

  if (!filePath || !fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('HLS file not found');
    return;
  }

  const fileStats = fs.statSync(filePath);

  if (!fileStats.isFile()) {
    res.writeHead(404);
    res.end('HLS file not found');
    return;
  }

  const range = req.headers.range;

  if (range) {
    const match = range.match(/bytes=(\d*)-(\d*)/);
    const start = match && match[1] ? Number(match[1]) : 0;
    const end = match && match[2] ? Number(match[2]) : fileStats.size - 1;

    if (start >= fileStats.size || end >= fileStats.size) {
      res.writeHead(416, {
        'Content-Range': `bytes */${fileStats.size}`,
      });
      res.end();
      return;
    }

    res.writeHead(206, {
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${fileStats.size}`,
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Length': fileStats.size,
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  fs.createReadStream(filePath).pipe(res);
}

function startHlsHttpServer() {
  const hlsHttpServer = http.createServer(serveHlsFile);

  hlsHttpServer.listen(HTTP_PORT, () => {
    console.log(`HLS HTTP server: http://localhost:${HTTP_PORT}`);
  });
}

function getHlsPaths(streamKey) {
  const outputDir = path.join(MEDIA_ROOT, 'live', streamKey);
  const outputFile = path.join(outputDir, 'index.m3u8');

  return {
    outputDir,
    outputFile,
  };
}

function getStreamKeyFromSession(session) {
  const streamPathParts = session.streamPath.split('/').filter(Boolean);

  return streamPathParts[1] || session.streamName;
}

function prepareFreshHlsFolder(outputDir) {
  console.log(`[HLS] Cleaning old HLS files: ${outputDir}`);
  fs.rmSync(outputDir, { recursive: true, force: true });
  console.log('[HLS] Old HLS files cleaned');

  fs.mkdirSync(outputDir, { recursive: true });
  console.log('[HLS] Fresh HLS folder created');
}

async function updateBackendStreamStatus(streamKey, isLive) {
  const statusText = isLive ? 'live' : 'offline';
  const url = `${BACKEND_API_URL}/streams/status/${streamKey}`;

  console.log(`[Status] Calling backend to mark ${statusText}`);
  console.log(`[Status] Backend URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isLive }),
    });

    const data = await response.json();

    console.log(`[Status] Backend response status: ${response.status}`);
    console.log('[Status] Backend response body:', data);

    if (!response.ok) {
      console.log(`[Status] Failed to mark ${statusText}`);
      return;
    }

    console.log(`[Status] Stream marked ${statusText} successfully`);
  } catch (error) {
    console.log(`[Status] Backend status update failed: ${error.message}`);
    console.log(`[Status] Failed to mark ${statusText}`);
  }
}

function startHlsProcess(session) {
  const streamKey = getStreamKeyFromSession(session);

  if (!streamKey) {
    console.log('[HLS] Cannot start HLS. Missing stream key.');
    return;
  }

  if (activeHlsProcesses.has(streamKey)) {
    console.log(`[HLS] FFmpeg is already running for ${streamKey}`);
    return;
  }

  const inputUrl = `rtmp://localhost:${RTMP_PORT}${session.streamPath}`;
  const { outputDir, outputFile } = getHlsPaths(streamKey);

  updateBackendStreamStatus(streamKey, true);
  prepareFreshHlsFolder(outputDir);

  const ffmpegArgs = [
    '-i',
    inputUrl,
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-f',
    'hls',
    '-hls_time',
    '2',
    '-hls_list_size',
    '5',
    '-hls_flags',
    'delete_segments+append_list',
    outputFile,
  ];

  console.log(`[HLS] postPublish: ${session.streamPath}`);
  console.log(`[HLS] Expected output: ${outputFile}`);
  console.log(`[HLS] FFmpeg command: ${FFMPEG_PATH} ${ffmpegArgs.join(' ')}`);

  const ffmpegProcess = spawn(FFMPEG_PATH, ffmpegArgs, {
    windowsHide: true,
  });

  activeHlsProcesses.set(streamKey, ffmpegProcess);

  ffmpegProcess.stderr.on('data', (data) => {
    console.log(`[FFmpeg:${streamKey}] ${data.toString().trim()}`);
  });

  ffmpegProcess.on('error', (error) => {
    console.log(`[FFmpeg:${streamKey}] Failed to start: ${error.message}`);
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`[FFmpeg:${streamKey}] stopped with code ${code}`);
    activeHlsProcesses.delete(streamKey);
  });
}

function stopHlsProcess(session) {
  const streamKey = getStreamKeyFromSession(session);
  const ffmpegProcess = activeHlsProcesses.get(streamKey);

  console.log(`[HLS] donePublish: ${session.streamPath}`);

  updateBackendStreamStatus(streamKey, false);

  if (!ffmpegProcess) {
    return;
  }

  ffmpegProcess.kill('SIGTERM');
  activeHlsProcesses.delete(streamKey);
  console.log(`[HLS] Stopped FFmpeg for ${streamKey}`);
}

const mediaServer = new NodeMediaServer(config);

mediaServer.on('postPublish', startHlsProcess);
mediaServer.on('donePublish', stopHlsProcess);

mediaServer.run();
startHlsHttpServer();

console.log('StreamForge media server is running');
console.log(`RTMP server: rtmp://localhost:${RTMP_PORT}/live`);
console.log('OBS Server: rtmp://localhost:1935/live');
console.log('OBS Stream Key: use the streamKey from Dashboard');
console.log('HLS URL: http://localhost:8000/live/<streamKey>/index.m3u8');
console.log(`HLS files folder: ${path.join(MEDIA_ROOT, 'live', '<streamKey>')}`);
console.log(`FFmpeg path: ${FFMPEG_PATH}`);
console.log(`Backend API URL: ${BACKEND_API_URL}`);
