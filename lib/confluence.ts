export type ProjectStatus = 'active' | 'draft' | 'archived' | 'coming-soon';

export interface Project {
  id: string;
  title: string;
  description: string;
  link: string;
  thumbnail?: string;
  owner: string;
  category: string;
  audience: string;
  status: ProjectStatus;
  tags: string[];
  searchKeywords: string[];
  lastReviewedAt?: string;
}

const PORTAL_APPROVED_LABEL = 'accelerating-ai-portal-approved';
const PORTAL_TOPIC_PREFIX = 'portal-topic-';

type MetadataField =
  | 'title'
  | 'summary'
  | 'category'
  | 'audience'
  | 'owner'
  | 'status'
  | 'searchKeywords'
  | 'lastReviewedAt'
  | 'thumbnail';

type RawPortalMetadata = Partial<Record<MetadataField, string>>;

interface PortalMetadata {
  title?: string;
  summary: string;
  category: string;
  audience: string;
  owner: string;
  status: ProjectStatus;
  searchKeywords: string[];
  lastReviewedAt?: string;
  thumbnail?: string;
}

interface PortalMetadataResult {
  metadata?: PortalMetadata;
  errors: string[];
}

const FIELD_ALIASES: Record<string, MetadataField> = {
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

const ALLOWED_CATEGORIES = new Map<string, string>([
  ['playbook', 'Playbook'],
  ['tool', 'Tool'],
  ['dashboard', 'Dashboard'],
  ['training', 'Training'],
  ['roadmap', 'Roadmap'],
]);

const ALLOWED_AUDIENCES = new Map<string, string>([
  ['engineering', 'Engineering'],
  ['sales', 'Sales'],
  ['exec', 'Exec'],
  ['customer success', 'Customer Success'],
  ['all sophos', 'All Sophos'],
]);

const ALLOWED_STATUSES = new Map<string, ProjectStatus>([
  ['active', 'active'],
  ['draft', 'draft'],
  ['archived', 'archived'],
  ['coming soon', 'coming-soon'],
  ['coming-soon', 'coming-soon'],
]);

interface ConfluencePageResponse {
  id: string;
  title: string;
  status: string;
  _links: {
    webui: string;
  };
  body?: {
    view?: {
      value: string;
    };
  };
  metadata?: {
    labels?: {
      results: Array<{ name: string }>;
    };
  };
}

interface ConfluenceSearchResponse {
  results: ConfluencePageResponse[];
  start: number;
  limit: number;
  size: number;
}

export class ConfluenceAPI {
  private baseUrl: string;
  private email: string;
  private token: string;

  constructor(baseUrl: string, email: string, token: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.email = email;
    this.token = token;
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.email}:${this.token}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async fetchProjectsByLabel(label: string): Promise<Project[]> {
    const projects: Project[] = [];
    let start = 0;
    const limit = 25;
    let hasMore = true;

    while (hasMore) {
      const cql = `label = "${label}" AND type = page`;
      const url = `${this.baseUrl}/rest/api/content/search?cql=${encodeURIComponent(
        cql
      )}&start=${start}&limit=${limit}&expand=body.view,metadata.labels`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(
            `Confluence API error: ${response.status} ${response.statusText}`
          );
        }

        const data: ConfluenceSearchResponse = await response.json();

        for (const page of data.results) {
          const project = this.convertPageToProject(page);
          if (project) {
            projects.push(project);
          }
        }

        start += data.size;
        hasMore = start < data.size + limit && data.results.length > 0;
      } catch (error) {
        console.error(`Error fetching projects from Confluence:`, error);
        throw error;
      }
    }

    return projects;
  }

  private convertPageToProject(page: ConfluencePageResponse): Project | null {
    const webLink = page._links?.webui || '';
    const resolved = webLink.startsWith('http') ? webLink : `${this.baseUrl}${webLink}`;
    const fullLink = this.toHttpsUrl(resolved) || '#';
    const bodyHtml = page.body?.view?.value || '';
    const metadataResult = this.extractPortalMetadata(bodyHtml);

    if (!metadataResult.metadata) {
      console.warn(
        `Skipping Confluence page ${page.id} (${page.title}): ${metadataResult.errors.join('; ')}`
      );
      return null;
    }

    const labels = page.metadata?.labels?.results?.map((label) => label.name) || [];
    const tags = this.extractPortalTopics(labels);
    const { metadata } = metadataResult;

    return {
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
    };
  }

  private stripHtml(html: string): string {
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

  private extractPortalMetadata(html: string): PortalMetadataResult {
    const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];

    for (const table of tables) {
      const fields = this.extractMetadataFields(table);
      if (fields.summary) {
        return this.validatePortalMetadata(fields);
      }
    }

    return {
      errors: ['missing metadata table with required "Portal summary" field'],
    };
  }

  private extractMetadataFields(tableHtml: string): RawPortalMetadata {
    const fields: RawPortalMetadata = {};
    const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];

    for (const row of rows) {
      const cells = Array.from(row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map(
        (match) => this.stripHtml(match[1])
      );

      if (cells.length < 2) continue;

      const key = this.normalizeFieldName(cells[0]);
      const field = FIELD_ALIASES[key];
      const value = cells.slice(1).join(', ').trim();

      if (field && value) {
        fields[field] = value;
      }
    }

    return fields;
  }

  private validatePortalMetadata(fields: RawPortalMetadata): PortalMetadataResult {
    const errors: string[] = [];
    const summary = fields.summary?.trim();
    const owner = fields.owner?.trim();
    const category = this.normalizeControlledValue(fields.category, ALLOWED_CATEGORIES);
    const audience = this.normalizeControlledValue(fields.audience, ALLOWED_AUDIENCES);
    const status = this.normalizeStatus(fields.status);
    const thumbnail = this.normalizeOptionalHttpsUrl(fields.thumbnail);

    if (!summary) errors.push('missing required field "Portal summary"');
    if (!category) errors.push(`missing or invalid "Category"; allowed: ${this.allowedList(ALLOWED_CATEGORIES)}`);
    if (!audience) errors.push(`missing or invalid "Audience"; allowed: ${this.allowedList(ALLOWED_AUDIENCES)}`);
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
        searchKeywords: this.parseList(fields.searchKeywords),
        lastReviewedAt: fields.lastReviewedAt?.trim(),
        thumbnail,
      },
      errors: [],
    };
  }

  private normalizeFieldName(value: string): string {
    return value
      .toLowerCase()
      .replace(/[:*]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeControlledValue(
    value: string | undefined,
    allowedValues: Map<string, string>
  ): string | undefined {
    if (!value) return undefined;
    return allowedValues.get(this.normalizeFieldName(value));
  }

  private normalizeStatus(value: string | undefined): ProjectStatus | undefined {
    if (!value) return undefined;
    const normalized = value
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return ALLOWED_STATUSES.get(normalized);
  }

  private normalizeOptionalHttpsUrl(value: string | undefined): string | undefined {
    if (!value?.trim()) return undefined;
    return this.toHttpsUrl(value.trim());
  }

  private toHttpsUrl(value: string): string | undefined {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.toString() : undefined;
    } catch {
      return undefined;
    }
  }

  private parseList(value: string | undefined): string[] {
    if (!value) return [];
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private extractPortalTopics(labels: string[]): string[] {
    return labels
      .filter((label) => label.toLowerCase().startsWith(PORTAL_TOPIC_PREFIX))
      .map((label) => label.slice(PORTAL_TOPIC_PREFIX.length))
      .map((topic) => this.formatTopicLabel(topic))
      .filter(Boolean);
  }

  private formatTopicLabel(topic: string): string {
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

  private allowedList(values: Map<string, string>): string {
    return Array.from(values.values()).join(', ');
  }
}

export async function getConfluenceProjects(): Promise<Project[]> {
  const baseUrl = process.env.CONFLUENCE_BASE_URL;
  const email = process.env.CONFLUENCE_EMAIL;
  const token = process.env.CONFLUENCE_API_TOKEN;

  if (!baseUrl || !email || !token) {
    throw new Error(
      'Missing Confluence configuration (CONFLUENCE_BASE_URL, CONFLUENCE_EMAIL, or CONFLUENCE_API_TOKEN)'
    );
  }

  const confluence = new ConfluenceAPI(baseUrl, email, token);
  return confluence.fetchProjectsByLabel(PORTAL_APPROVED_LABEL);
}
