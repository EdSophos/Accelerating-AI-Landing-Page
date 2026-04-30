#!/usr/bin/env node
/**
 * Standalone Confluence sync script — runs at build time in CI.
 * Mirrors the portal metadata rules in lib/confluence.ts as plain ESM so no
 * TypeScript toolchain is required during the workflow sync step.
 *
 * Required env vars:
 *   CONFLUENCE_BASE_URL  — e.g. https://sophos.atlassian.net/wiki
 *   CONFLUENCE_EMAIL     — account email paired with the API token
 *   CONFLUENCE_API_TOKEN — Atlassian API token
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const OUTPUT_PATH = new URL('../public/data/projects.json', import.meta.url).pathname;
const PORTAL_APPROVED_LABEL = 'accelerating-ai-portal-approved';
const PORTAL_TOPIC_PREFIX = 'portal-topic-';
const LIMIT = 25;

const FIELD_ALIASES = {
  'portal title': 'title',
  'display title': 'title',
  'approved display title': 'title',
  'portal summary': 'summary',
  category: 'category',
  audience: 'audience',
  'intended audience': 'audience',
  owner: 'owner',
  'owner team': 'owner',
  'owner mailbox': 'owner',
  status: 'status',
  'search keywords': 'searchKeywords',
  keywords: 'searchKeywords',
  'last reviewed': 'lastReviewedAt',
  'last reviewed at': 'lastReviewedAt',
  thumbnail: 'thumbnail',
  'thumbnail url': 'thumbnail',
  'approved thumbnail': 'thumbnail',
};

const ALLOWED_CATEGORIES = new Map([
  ['playbook', 'Playbook'],
  ['tool', 'Tool'],
  ['dashboard', 'Dashboard'],
  ['training', 'Training'],
  ['roadmap', 'Roadmap'],
]);

const ALLOWED_AUDIENCES = new Map([
  ['engineering', 'Engineering'],
  ['sales', 'Sales'],
  ['exec', 'Exec'],
  ['customer success', 'Customer Success'],
  ['all sophos', 'All Sophos'],
]);

const ALLOWED_STATUSES = new Map([
  ['active', 'active'],
  ['draft', 'draft'],
  ['archived', 'archived'],
  ['coming soon', 'coming-soon'],
  ['coming-soon', 'coming-soon'],
]);

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<\/li>/gi, ', ')
    .replace(/<\/(p|div)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeFieldName(value) {
  return value
    .toLowerCase()
    .replace(/[:*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMetadataFields(tableHtml) {
  const fields = {};
  const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  for (const row of rows) {
    const cells = Array.from(row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((match) =>
      stripHtml(match[1])
    );

    if (cells.length < 2) continue;

    const key = normalizeFieldName(cells[0]);
    const field = FIELD_ALIASES[key];
    const value = cells.slice(1).join(', ').trim();

    if (field && value) {
      fields[field] = value;
    }
  }

  return fields;
}

function allowedList(values) {
  return Array.from(values.values()).join(', ');
}

function normalizeControlledValue(value, allowedValues) {
  if (!value) return undefined;
  return allowedValues.get(normalizeFieldName(value));
}

function normalizeStatus(value) {
  if (!value) return undefined;
  const normalized = value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return ALLOWED_STATUSES.get(normalized);
}

function toHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function normalizeOptionalHttpsUrl(value) {
  if (!value?.trim()) return undefined;
  return toHttpsUrl(value.trim());
}

function parseList(value) {
  if (!value) return [];
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function validatePortalMetadata(fields) {
  const errors = [];
  const summary = fields.summary?.trim();
  const owner = fields.owner?.trim();
  const category = normalizeControlledValue(fields.category, ALLOWED_CATEGORIES);
  const audience = normalizeControlledValue(fields.audience, ALLOWED_AUDIENCES);
  const status = normalizeStatus(fields.status);
  const thumbnail = normalizeOptionalHttpsUrl(fields.thumbnail);

  if (!summary) errors.push('missing required field "Portal summary"');
  if (!category) errors.push(`missing or invalid "Category"; allowed: ${allowedList(ALLOWED_CATEGORIES)}`);
  if (!audience) errors.push(`missing or invalid "Audience"; allowed: ${allowedList(ALLOWED_AUDIENCES)}`);
  if (!owner) errors.push('missing required field "Owner"');
  if (!status) errors.push('missing or invalid "Status"; allowed: Active, Draft, Archived, Coming soon');
  if (fields.thumbnail && !thumbnail) errors.push('thumbnail must be an absolute https URL');

  if (errors.length > 0 || !summary || !category || !audience || !owner || !status) {
    return { errors };
  }

  return {
    metadata: {
      title: fields.title?.trim(),
      summary,
      category,
      audience,
      owner,
      status,
      searchKeywords: parseList(fields.searchKeywords),
      lastReviewedAt: fields.lastReviewedAt?.trim(),
      thumbnail,
    },
    errors: [],
  };
}

function extractPortalMetadata(html) {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];

  for (const table of tables) {
    const fields = extractMetadataFields(table);
    if (fields.summary) {
      return validatePortalMetadata(fields);
    }
  }

  return {
    errors: ['missing metadata table with required "Portal summary" field'],
  };
}

function formatTopicLabel(topic) {
  const acronyms = new Set(['ai', 'api', 'llm', 'ml', 'sso']);
  return topic
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (acronyms.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function extractPortalTopics(labels) {
  return labels
    .filter((label) => label.toLowerCase().startsWith(PORTAL_TOPIC_PREFIX))
    .map((label) => label.slice(PORTAL_TOPIC_PREFIX.length))
    .map((topic) => formatTopicLabel(topic))
    .filter(Boolean);
}

async function fetchAllProjects(baseUrl, email, token) {
  const projects = [];
  const skipped = [];
  let start = 0;

  while (true) {
    const cql = `label = "${PORTAL_APPROVED_LABEL}" AND type = page`;
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
      const bodyHtml = page.body?.view?.value ?? '';
      const metadataResult = extractPortalMetadata(bodyHtml);

      if (!metadataResult.metadata) {
        const reason = metadataResult.errors.join('; ');
        skipped.push({ id: page.id, title: page.title, reason });
        console.warn(`Skipping Confluence page ${page.id} (${page.title}): ${reason}`);
        continue;
      }

      const webLink = page._links?.webui ?? '';
      const resolved = webLink.startsWith('http') ? webLink : `${baseUrl}${webLink}`;
      const fullLink = toHttpsUrl(resolved) ?? '#';
      const labels = (page.metadata?.labels?.results ?? []).map((label) => label.name);
      const tags = extractPortalTopics(labels);
      const { metadata } = metadataResult;

      projects.push({
        id: page.id,
        title: metadata.title || page.title,
        description: metadata.summary,
        link: fullLink,
        thumbnail: metadata.thumbnail,
        owner: metadata.owner,
        category: metadata.category,
        audience: metadata.audience,
        status: metadata.status,
        tags,
        searchKeywords: metadata.searchKeywords,
        lastReviewedAt: metadata.lastReviewedAt,
      });
    }

    start += data.results.length;
    if (data.results.length < LIMIT) break;
  }

  return { projects, skipped };
}

async function main() {
  const baseUrl = (process.env.CONFLUENCE_BASE_URL ?? '').replace(/\/$/, '');
  const email = process.env.CONFLUENCE_EMAIL;
  const token = process.env.CONFLUENCE_API_TOKEN;

  if (!baseUrl || !email || !token) {
    console.error('Missing CONFLUENCE_BASE_URL, CONFLUENCE_EMAIL, or CONFLUENCE_API_TOKEN');
    process.exit(1);
  }

  console.log(`Syncing Confluence projects labeled "${PORTAL_APPROVED_LABEL}"...`);
  const { projects, skipped } = await fetchAllProjects(baseUrl, email, token);
  console.log(`Fetched ${projects.length} portal-ready projects`);
  if (skipped.length > 0) {
    console.warn(`Skipped ${skipped.length} approved pages with incomplete portal metadata`);
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      { lastSynced: new Date().toISOString(), count: projects.length, skipped: skipped.length, projects },
      null,
      2
    ),
    'utf-8'
  );

  console.log('Written to public/data/projects.json');
}

main().catch((err) => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
