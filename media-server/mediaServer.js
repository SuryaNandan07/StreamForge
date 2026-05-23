const fs = require('fs');
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
  http: {
    port: HTTP_PORT,
    allow_origin: '*',
  },
  static: {
    router: '/',
    root: MEDIA_ROOT,
    options: {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      },
    },
  },
};

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

console.log('StreamForge media server is running');
console.log(`RTMP server: rtmp://localhost:${RTMP_PORT}/live`);
console.log('OBS Server: rtmp://localhost:1935/live');
console.log('OBS Stream Key: use the streamKey from Dashboard');
console.log('HLS URL: http://localhost:8000/live/<streamKey>/index.m3u8');
console.log(`HLS files folder: ${path.join(MEDIA_ROOT, 'live', '<streamKey>')}`);
console.log(`FFmpeg path: ${FFMPEG_PATH}`);
console.log(`Backend API URL: ${BACKEND_API_URL}`);
