import { watch } from 'fs';
import { spawn } from 'child_process';

const WATCH_DIRS = ['posts', 'photos', 'static', 'templates'];
const DEBOUNCE_MS = 2000;

let timeout = null;
let building = false;
let rebuildQueued = false;

function runBuild() {
  if (building) {
    rebuildQueued = true;
    return;
  }

  building = true;
  console.log('\nRebuilding...');

  const child = spawn('node', ['build.js'], { stdio: 'inherit' });
  child.on('close', (code) => {
    building = false;
    if (code !== 0) {
      console.error(`Build failed with code ${code}`);
    }
    if (rebuildQueued) {
      rebuildQueued = false;
      runBuild();
    }
  });
}

function onChange(dir, filename) {
  if (building) return;
  if (!filename || filename.includes('_exiftool_tmp')) return;
  console.log(`Changed: ${dir}/${filename}`);
  clearTimeout(timeout);
  timeout = setTimeout(runBuild, DEBOUNCE_MS);
}

// Initial build
runBuild();

// Watch directories
for (const dir of WATCH_DIRS) {
  try {
    watch(dir, (eventType, filename) => {
      onChange(dir, filename);
    });
    console.log(`Watching ${dir}/`);
  } catch {
    console.log(`Skipping ${dir}/ (not found)`);
  }
}

console.log(`Waiting for changes (${DEBOUNCE_MS}ms debounce)...`);
