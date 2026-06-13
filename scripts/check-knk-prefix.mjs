#!/usr/bin/env node
/**
 * check-knk-prefix.mjs
 *
 * CI guard: every Postgres table defined in supabase/migrations/ must start
 * with the `knk_` prefix.  Fails with exit code 1 if any violation is found.
 *
 * Usage: node scripts/check-knk-prefix.mjs
 */

import { readdir, readFile } from 'fs/promises'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = resolve(__dirname, '../supabase/migrations')

async function main() {
  // ── 1. Locate migration files ──────────────────────────────────────────
  let files
  try {
    files = await readdir(MIGRATIONS_DIR)
  } catch {
    console.log('✓ supabase/migrations/ not found — skipping knk_ prefix check')
    process.exit(0)
  }

  const sqlFiles = files.filter((f) => f.endsWith('.sql'))
  if (sqlFiles.length === 0) {
    console.log('✓ No SQL migration files found — skipping knk_ prefix check')
    process.exit(0)
  }

  // ── 2. Scan each file for CREATE TABLE statements ─────────────────────
  // Matches:
  //   create table knk_foo
  //   create table if not exists knk_foo
  //   create table public.knk_foo
  //   create table if not exists public.knk_foo
  const CREATE_TABLE_RE =
    /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\s*\.\s*)?(\w+)/gi

  let errors = 0

  for (const file of sqlFiles) {
    const content = await readFile(join(MIGRATIONS_DIR, file), 'utf-8')
    // Strip single-line SQL comments so we don't flag commented-out examples
    const stripped = content.replace(/--[^\n]*/g, '')

    for (const match of stripped.matchAll(CREATE_TABLE_RE)) {
      const tableName = match[1]
      if (!tableName.startsWith('knk_')) {
        console.error(
          `✗  ${file}: table "${tableName}" is missing the knk_ prefix`,
        )
        errors++
      }
    }
  }

  // ── 3. Report ─────────────────────────────────────────────────────────
  if (errors > 0) {
    console.error(
      `\n✗  ${errors} table(s) violate the knk_ naming rule.\n` +
        '   ALL Postgres tables in this project must start with knk_\n' +
        '   See: docs/decisions/0004-knk-prefix-and-rls.md',
    )
    process.exit(1)
  }

  console.log(`✓  All ${sqlFiles.length} migration file(s) pass the knk_ prefix check`)
  process.exit(0)
}

main()
