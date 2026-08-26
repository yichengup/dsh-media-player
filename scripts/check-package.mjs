// Package integrity check: verify required files/exports/entry points exist.
import { readFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf-8'))

const problems = []
const required = ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'README.md', 'README.en.md', 'LICENSE', 'CHANGELOG.md']
for (const file of required) {
  try {
    await access(path.join(root, file))
  } catch {
    problems.push(`missing ${file}`)
  }
}

if (!pkg.dsh?.bundle?.patch) problems.push('dsh.bundle.patch is required')
if (!pkg.dsh?.client?.inject?.length) problems.push('dsh.client.inject is required')
if (!pkg.exports?.['./client']) problems.push('exports["./client"] is required')

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`check-package OK (${pkg.name}@${pkg.version})`)
