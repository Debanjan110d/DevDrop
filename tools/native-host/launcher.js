const { spawn } = require('child_process');
const path = require('path');

let inputChunks = [];

process.stdin.on('readable', () => {
  let chunk;
  while ((chunk = process.stdin.read()) !== null) {
    inputChunks.push(chunk);
  }
  handleInput();
});

function sendResponse(msg) {
  try {
    const jsonBuf = Buffer.from(JSON.stringify(msg), 'utf8');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32LE(jsonBuf.length, 0);
    process.stdout.write(lenBuf);
    process.stdout.write(jsonBuf);
  } catch (err) {
    // Ignore stdout pipe errors
  }
}

function handleInput() {
  const totalBuf = Buffer.concat(inputChunks);
  if (totalBuf.length < 4) return;
  const msgLen = totalBuf.readUInt32LE(0);
  if (totalBuf.length < 4 + msgLen) return;

  const msgContent = totalBuf.slice(4, 4 + msgLen).toString('utf8');
  let data = {};
  try {
    data = JSON.parse(msgContent);
  } catch (e) {}

  startDevDropServer();
}

function startDevDropServer() {
  const projectRoot = path.resolve(__dirname, '../../');
  const serverScript = path.join(projectRoot, 'apps/server/dist/index.js');

  try {
    const child = spawn(process.execPath, [serverScript], {
      cwd: projectRoot,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();

    sendResponse({ status: 'started', pid: child.pid });
  } catch (err) {
    sendResponse({ status: 'error', error: err.message });
  }

  setTimeout(() => process.exit(0), 150);
}

