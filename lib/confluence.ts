export interface Project {
  id: string;
  title: string;
  description: string;
  link: string;
  thumbnail: string;
  owner?: string;
  status: 'active' | 'archived';
  tags: string[];
}

const PORTAL_APPROVED_LABEL = 'accelerating-ai-portal-approved';

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

        // Convert Confluence pages to Project format
        for (const page of data.results) {
          const project = this.convertPageToProject(page);
          projects.push(project);
        }

        // Check if there are more results
        start += data.size;
        hasMore = start < data.size + limit && data.results.length > 0;
      } catch (error) {
        console.error(`Error fetching projects from Confluence:`, error);
        throw error;
      }
    }

    return projects;
  }

  private convertPageToProject(page: ConfluencePageResponse): Project {
    const webLink = page._links?.webui || '';
    const resolved = webLink.startsWith('http') ? webLink : `${this.baseUrl}${webLink}`;
    const fullLink = /^https?:\/\//i.test(resolved) ? resolved : '#';

    // Extract description from page body (first 150 chars)
    const bodyHtml = page.body?.view?.value || '';
    const description = this.extractDescription(bodyHtml);

    // Extract tags from metadata labels
    const tags = page.metadata?.labels?.results?.map((label) => label.name) || [];

    // Generate thumbnail URL (Confluence page preview)
    const thumbnailUrl = `${this.baseUrl}/pages/thumbnail.action?pageId=${page.id}`;

    return {
      id: page.id,
      title: page.title,
      description: description || 'No description available',
      link: fullLink,
      thumbnail: thumbnailUrl,
      status: 'active',
      tags: tags,
    };
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractDescription(html: string): string {
    const noTables = html.replace(/<table[\s\S]*?<\/table>/gi, '');
    const pMatch = noTables.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (pMatch) {
      const text = this.stripHtml(pMatch[1]).trim();
      if (text.length > 10) return text.substring(0, 200);
    }
    return this.stripHtml(noTables).substring(0, 150).trim() || 'No description available';
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
