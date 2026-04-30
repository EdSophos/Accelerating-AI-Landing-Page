# Accelerating AI Landing Page

A searchable discovery portal for the Accelerating AI team's products and projects at Sophos. This tool serves as the "front door" for anyone inside Sophos to find information about the team's work, regardless of where content is stored in knowledge bases.

## Features

- 🔍 **Searchable Directory** — Find AI Acceleration projects by title, description, or tags
- 🏷️ **Confluence Integration** — Automatically syncs projects labeled `accelerating-ai-portal-approved` from Confluence
- 🔐 **Internal Access Boundary** — Hosted behind Sophos-controlled network/application access controls; Confluence remains the source of truth for content permissions
- 🌐 **Static Deployment** — Automated sync every 4 hours via GitHub Actions and static export
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile
- 🚀 **Fast & Static** — Pre-rendered static site for optimal performance

## Quick Start

### Prerequisites

- Node.js 20.9+
- npm or yarn
- Sophos Confluence API token
- Sophos Confluence account email for local sync/API testing

### Installation

```bash
# Clone and install dependencies
git clone https://github.com/EdSophos/Accelerating-AI-Landing-Page.git
cd Accelerating-AI-Landing-Page
npm install
```

### Environment Setup

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Then configure:

```env
# Confluence
CONFLUENCE_BASE_URL=https://sophos.atlassian.net/wiki
CONFLUENCE_EMAIL=your_email@sophos.com
CONFLUENCE_API_TOKEN=your_api_token

# Optional: NextAuth routes exist for local/server-hosted experiments only.
# Static production hosting does not use these as the access boundary.
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret

# Optional: Azure AD (Sophos SSO)
NEXTAUTH_AZURE_AD_TENANT_ID=your_tenant_id
NEXTAUTH_AZURE_AD_CLIENT_ID=your_client_id
NEXTAUTH_AZURE_AD_CLIENT_SECRET=your_client_secret
```

If the local template does not include `CONFLUENCE_EMAIL`, add it manually; both the local API wrapper and sync script require the email/token pair for Confluence Basic auth.

### Development

```bash
# Start local dev server
npm run dev

# Open http://localhost:3000
```

The site will auto-reload as you make changes.

### Building

```bash
# Build for production
npm run build
```

`npm run build` writes the static export to `out/` because production builds set `output: "export"` in `next.config.ts`. Do not use the legacy `npm run export` script; `next export` has been removed in current Next.js versions.

## Architecture

### Data Flow

```
Confluence API (approved metadata from pages labeled `accelerating-ai-portal-approved`)
         ↓
GitHub Actions (every 4 hours)
         ↓
scripts/sync.mjs (pre-build Confluence fetch)
         ↓
JSON file (public/data/projects.json)
         ↓
Next.js static build (next build → out/)
         ↓
Internal Sophos-controlled static host
```

### Tech Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Styling:** Tailwind CSS
- **Access Boundary:** Sophos-controlled network/application access controls; Confluence permissions for full content
- **Auth Code:** next-auth + Azure AD routes are present, but are not the production boundary for static hosting
- **Hosting:** Static export served from an internal Sophos-controlled location
- **CI/CD:** GitHub Actions

## Project Structure

```
├── pages/
│   ├── api/
│   │   ├── auth/[...nextauth].ts    # Optional server-hosted SSO routes; disabled by static export
│   │   └── confluence/
│   │       └── sync.ts              # Optional server-hosted sync endpoint; disabled by static export
│   ├── _app.tsx                     # Next.js app wrapper
│   ├── _document.tsx                # Next.js document wrapper
│   └── index.tsx                    # Home page with search
├── components/
│   ├── SearchBar.tsx                # Search + status/tag filters
│   ├── ProjectCard.tsx              # Individual project card
│   └── ProjectGrid.tsx              # Responsive grid layout
├── lib/
│   ├── confluence.ts                # Confluence API wrapper class for optional server-hosted paths
│   └── auth.ts                      # Optional Azure AD config
├── styles/
│   └── globals.css                  # Tailwind CSS directives
├── public/
│   ├── data/
│   │   └── projects.json            # Synced projects data (auto-generated)
│   └── [next.js assets]
├── .github/workflows/
│   └── sync-and-deploy.yml          # GitHub Actions sync/build/deploy workflow
├── .env.local.example               # Environment template
├── CLAUDE.md                        # Project conventions
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript config
```

## Deployment

### Internal Static Hosting

The portal should be served from a Sophos-controlled location that restricts access to the intended internal audience at the network/application layer. The static site itself does not enforce application-layer authorization over `data/projects.json`.

The current GitHub Actions workflow builds a static export and publishes the `out/` directory. If GitHub Pages is used as an intermediate or preview mechanism, do not treat it as the production access boundary unless it is fronted by the required Sophos controls.

**Automatic Sync:**
- GitHub Actions runs every 4 hours
- Pulls latest approved pages from Confluence
- Builds the static export
- Publishes the generated `out/` artifact
- No manual action needed

### Environment Variables

Add these as GitHub Actions secrets (Repo Settings → Secrets):
- `CONFLUENCE_API_TOKEN` — Atlassian API token (Basic auth with `CONFLUENCE_EMAIL`)

The workflow currently sets `CONFLUENCE_EMAIL` directly in `.github/workflows/sync-and-deploy.yml`. If that account changes, update the workflow or move the email to a repository variable.

NextAuth/Azure AD variables are only needed for local development or a future server-hosted deployment path. They are not used by the static production export.

## Configuration

### Confluence

**Mandatory approval label:** Pages must be labeled `accelerating-ai-portal-approved` in Confluence to appear on the landing page.

The broader team label is not sufficient for portal publication. Apply `accelerating-ai-portal-approved` only after the page title, summary, labels, link, and thumbnail are appropriate for the full portal audience.

**Current Data Model:** Each project currently includes:
- Title from the Confluence page title
- Description derived from the first 150 characters of the page body
- Link to the Confluence page
- Thumbnail from the Confluence page preview URL
- Status, currently always `active`
- Tags copied from Confluence labels

**Metadata Governance Target:** Issue [#7](https://github.com/EdSophos/Accelerating-AI-Landing-Page/issues/7) tracks the next hardening step. The portal should publish only explicit portal-safe metadata:
- Approved display title
- Portal-safe one-sentence summary
- Category from a controlled set
- Intended audience
- Owner team or mailbox
- Status
- Approved search keywords
- `updatedAt` or `lastReviewedAt`
- Confluence link
- Approved generic/category thumbnail or explicitly approved image

Raw Confluence body excerpts, arbitrary labels, comments, attachments, and page-preview thumbnails should not be treated as portal-safe by default.

### Search & Filtering

Search is **100% client-side** — no backend calls. All filtering happens in the browser in real-time:

**Text Search:**
- Searches project title, description, and tags
- Case-insensitive keyword matching
- Results update as you type

**Status Filter:**
- Active (default) — show active projects only
- Archived — show archived projects
- All — show both active and archived

**Tag Filtering:**
- Multi-select: choose one or more tags
- Projects match if they include any selected tag
- Tags are currently auto-extracted from Confluence labels
- Future metadata hardening should replace arbitrary labels with controlled portal topics

**Performance:**
- Instant filtering on any device
- No network requests during search
- Works offline (after initial page load)

## Development Workflow

### Phases

This project is tracked as GitHub issues for each phase:

- [x] **Phase 1:** Repo setup + Next.js initialization
- [x] **Phase 2:** Confluence API integration (fetch + sync endpoint)
- [x] **Phase 3:** UI components + client-side search
- [x] **Phase 4:** Optional server-hosted auth setup (Azure AD / NextAuth)
- [x] **Phase 5:** GitHub Actions CI/CD (automated sync & deploy)
- ⏳ **Phase 6:** Testing + refinement

See the [Issues](https://github.com/EdSophos/Accelerating-AI-Landing-Page/issues) tab for detailed task tracking.

### UI Components

#### SearchBar (`components/SearchBar.tsx`)
- Text search across project title, description, and tags
- Status filter: Active / Archived / All
- Multi-select tag filtering
- Real-time filtering as user types
- Clear filters button

#### ProjectCard (`components/ProjectCard.tsx`)
- Displays individual project with thumbnail
- Shows title and description preview
- Displays up to 3 tags (with +N indicator for overflow)
- Status badge (green/amber)
- Hover effects and direct link to Confluence source
- Image optimization via Next.js Image component

#### ProjectGrid (`components/ProjectGrid.tsx`)
- Responsive grid layout: 1 col (mobile) → 2 col (tablet) → 3 col (desktop)
- Loading skeleton animation
- Empty state message when no projects match filters

#### Home Page (`pages/index.tsx`)
- Loads projects from `public/data/projects.json`
- Auto-extracts all unique tags from projects
- Implements client-side search and filtering
- Displays result counter
- Sticky header and footer
- Error handling and loading states

#### Header Component (`components/Header.tsx`)
- Displays authenticated user info (name, email, avatar) when a NextAuth session exists
- Dropdown menu with sign-out button
- Sticky positioning at top of page
- Responsive design for mobile/tablet/desktop

#### Authentication System
NextAuth/Azure AD code exists in the repo, but static export disables API routes and middleware. Production access should be enforced by the hosting/network/application layer in front of the static site, and full content access is enforced by Confluence permissions after the user follows a link.

If this app is moved to a server-hosted runtime, revisit the auth implementation before treating it as a security boundary. At minimum, require a Sophos tenant configuration, enforce tenant/domain membership in callbacks, and protect the sync endpoint.

### Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally: `npm run dev`
3. Commit with clear messages: `git commit -m "Add feature description"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a pull request

### Code Conventions

- **TypeScript:** Strict mode, no `any` types
- **Components:** Functional components with React hooks
- **Styling:** Tailwind CSS utilities (no custom CSS unless necessary)
- **Exports:** Next.js pages and React components currently use default exports; follow the existing local pattern unless the project is intentionally refactored.

## Future Plans

### v2 Roadmap

- **SharePoint Integration:** Pull projects from SharePoint sites alongside Confluence
- **Advanced Search:** Full-text search with Algolia
- **Project Filtering:** Filter by team, status, technology stack
- **Analytics:** Track which projects are most viewed
- **Custom Metadata:** User-defined project properties

## Troubleshooting

### Build Issues

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

Use `npm run build` for static export generation. Do not use `npm run export`; the underlying `next export` command has been removed in current Next.js versions.

### Environment Variable Errors

- Ensure `.env.local` is in the root directory (not tracked in git)
- Double-check all variable names match `.env.local.example`
- For GitHub Actions, verify secrets are set in repo Settings

### Confluence Sync Issues

- Verify API token has read access to Confluence
- Check that pages are labeled `accelerating-ai-portal-approved`
- Review the `Sync Confluence data` step in GitHub Actions logs

## Support

For questions or issues:
- Open a GitHub issue with detailed description
- Check existing issues for similar problems
- Contact the Accelerating AI team

## License

Internal Sophos tool. Not for external distribution.

---

**Status:** Static portal under active hardening; production hosting should be Sophos-controlled and internal-only
**Last Updated:** April 30, 2026
**Maintained by:** Accelerating AI Team @ Sophos
