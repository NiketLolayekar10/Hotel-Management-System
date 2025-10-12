#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...rest] = trimmed.split('=');
    out[k] = rest.join('=').trim();
  }
  return out;
}

const envLocal = path.resolve(process.cwd(), '.env.local');
const env = Object.assign({}, process.env, loadDotEnv(envLocal));

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missing = required.filter(k => !env[k] || env[k].startsWith('your-') || env[k].includes('YOUR_'));

if (missing.length) {
  console.warn('\n⚠️  Missing important environment variables: ' + missing.join(', '));
  console.warn('Create a .env.local file (see .env.example) or set the variables in your environment.');
  if (process.env.NODE_ENV === 'production') {
    console.error('In production these variables are required. Aborting.');
    process.exit(1);
  }
} else {
  console.log('✅ Required environment variables present');
}
