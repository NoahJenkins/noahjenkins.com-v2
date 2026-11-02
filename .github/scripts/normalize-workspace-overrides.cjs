'use strict'
const fs = require('node:fs')

// pnpm audit --fix rewrites pnpm-workspace.yaml in plain YAML style, and range
// selectors such as `glob@>=9.0.0 <=14.0.1` then have no quotes. The controller
// workspace policy accepts a key with spaces only in quotes, so write overrides
// back in the committed style: a plain package name stays bare, every other key
// and every value is double-quoted. Anything else in the map fails the run.
function unquote(text) {
  return /^(['"]).*\1$/.test(text) ? text.slice(1, -1) : text
}

function normalizeOverrides(text) {
  let inside = false
  return text.split('\n').map(line => {
    if (/^overrides:[ \t]*$/.test(line)) { inside = true; return line }
    if (inside && /^\S/.test(line)) inside = false
    if (!inside || !line.trim()) return line
    const match = line.match(/^  ('[^']+'|"[^"]+"|[^\s'"#][^:#]*?):[ \t]+('[^']+'|"[^"]+"|[^\s'"#]+)[ \t]*$/)
    if (!match) throw new Error(`Unsupported override line: ${line}`)
    const key = unquote(match[1]), value = unquote(match[2])
    if (/["\\]/.test(key + value)) throw new Error(`Unsupported override line: ${line}`)
    return `  ${/^[a-z0-9._-]+$/.test(key) ? key : `"${key}"`}: "${value}"`
  }).join('\n')
}

if (require.main === module) {
  const file = process.argv[2] || 'pnpm-workspace.yaml'
  fs.writeFileSync(file, normalizeOverrides(fs.readFileSync(file, 'utf8')))
}

module.exports = { normalizeOverrides }
