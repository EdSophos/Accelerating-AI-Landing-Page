#!/usr/bin/env node
/**
 * Standalone Confluence sync script — runs at build time in CI.
 * Mirrors the logic in lib/confluence.ts but as plain ESM so no TypeScript
 * toolchain is required during the workflow sync step.
 *
 * Required env vars:
 *   CONFLUENCE_BASE_URL  — e.g. https://sophos.atlassian.net/wiki
 *   CONFLUENCE_API_TOKEN — Confluence personal access token
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const OUTPUT_PATH = new URL('../public/data/projects.json', import.meta.url).pathname;
const LABEL = 'Accelerating AI Team';
const LIMIT = 25;

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

async function fetchAllProjects(baseUrl, email, token) {
  const projects = [];
  let start = 0;

  while (true) {
    const cql = `label = "${LABEL}" AND status = current`;
    const url = `${baseUrl}/rest/api/content/search?cql=${encodeURIComponent(cql)}&start=${start}&limit=${LIMIT}&expand=body.view,metadata.labels`;

    const credentials = Buffer.from(`${email}:${token}`).toString('base64');
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Confluence API ${res.status}: ${res.statusText}\n${body.substring(0, 500)}`);
    }

    const data = await res.json();

    for (const page of data.results) {
      const webLink = page._links?.webui ?? '';
      const fullLink = webLink.startsWith('http') ? webLink : `${baseUrl}${webLink}`;
      const description = stripHtml(page.body?.view?.value ?? '').substring(0, 150).trim();
      const tags = (page.metadata?.labels ?? []).map((l) => l.name);

      projects.push({
        id: page.id,
        title: page.title,
        description: description || 'No description available',
        link: fullLink,
        thumbnail: `${baseUrl}/pages/thumbnail.action?pageId=${page.id}`,
        status: 'active',
        tags,
      });
    }

    start += data.results.length;
    if (data.results.length < LIMIT) break;
  }

  return projects;
}

async function main() {
  const baseUrl = (process.env.CONFLUENCE_BASE_URL ?? '').replace(/\/$/, '');
  const email = process.env.CONFLUENCE_EMAIL;
  const token = process.env.CONFLUENCE_API_TOKEN;

  if (!baseUrl || !email || !token) {
    console.error('❌ Missing CONFLUENCE_BASE_URL, CONFLUENCE_EMAIL, or CONFLUENCE_API_TOKEN');
    process.exit(1);
  }

  console.log(`🦆 Syncing Confluence projects labeled "${LABEL}"...`);
  const projects = await fetchAllProjects(baseUrl, email, token);
  console.log(`   Fetched ${projects.length} projects`);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({ lastSynced: new Date().toISOString(), count: projects.length, projects }, null, 2),
    'utf-8'
  );

  console.log(`✅ Written to public/data/projects.json`);
}

main().catch((err) => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
