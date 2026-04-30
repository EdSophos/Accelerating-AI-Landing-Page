# Accelerating AI Landing Page

A searchable discovery portal for the Accelerating AI team's products and projects at Sophos. This tool serves as the "front door" for anyone inside Sophos to find information about the team's work, regardless of where content is stored in knowledge bases.

## Features

- 🔍 **Searchable Directory** — Find AI Acceleration projects by title, description, or tags
- 🏷️ **Confluence Integration** — Automatically syncs projects labeled "Accelerating AI Team" from Confluence
- 🔐 **Sophos SSO** — Secure access via Azure AD (all pages require authentication)
- 🌐 **GitHub Pages Deployment** — Automated sync every 4 hours via GitHub Actions
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile
- 🚀 **Fast & Static** — Pre-rendered static site for optimal performance

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Sophos Confluence API token
- Azure AD credentials (for SSO setup)

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

# Next.js Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret

# Azure AD (Sophos SSO)
NEXTAUTH_AZURE_AD_TENANT_ID=your_tenant_id
NEXTAUTH_AZURE_AD_CLIENT_ID=your_client_id
NEXTAUTH_AZURE_AD_CLIENT_SECRET=your_client_secret
```

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

# Export as static site (for GitHub Pages)
npm run export
```

## Architecture

### Data Flow

```
Confluence API (labeled pages)
         ↓
GitHub Actions (every 4 hours)
         ↓
scripts/sync.mjs (pre-build Confluence fetch)
         ↓
JSON file (public/data/projects.json)
         ↓
Next.js static build (next build → out/)
         ↓
GitHub Pages (deployed site)
```

### Tech Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** next-auth + Azure AD
- **Hosting:** GitHub Pages
- **CI/CD:** GitHub Actions

## Project Structure

```
├── pages/
│   ├── api/
│   │   ├── auth/[...nextauth].ts    # SSO routes (Phase 4)
│   │   └── confluence/
│   │       └── sync.ts              # Data sync endpoint
│   ├── _app.tsx                     # Next.js app wrapper
│   ├── _document.tsx                # Next.js document wrapper
│   └── index.tsx                    # Home page with search
├── components/
│   ├── SearchBar.tsx                # Search + status/tag filters
│   ├── ProjectCard.tsx              # Individual project card
│   └── ProjectGrid.tsx              # Responsive grid layout
├── lib/
│   ├── confluence.ts                # Confluence API wrapper class
│   └── auth.ts                      # Azure AD config (Phase 4)
├── styles/
│   └── globals.css                  # Tailwind CSS directives
├── public/
│   ├── data/
│   │   └── projects.json            # Synced projects data (auto-generated)
│   └── [next.js assets]
├── .github/workflows/
│   └── sync-and-deploy.yml          # GitHub Actions (Phase 5)
├── .env.local.example               # Environment template
├── CLAUDE.md                        # Project conventions
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript config
```

## Deployment

### GitHub Pages

The site is deployed to GitHub Pages and automatically synced every 4 hours.

**Setup (one-time):**
1. Go to repo Settings → Pages
2. Set source to `gh-pages` branch
3. Site will be live at `https://EdSophos.github.io/Accelerating-AI-Landing-Page`

**Automatic Sync:**
- GitHub Actions runs every 4 hours
- Pulls latest from Confluence
- Builds and deploys to GitHub Pages
- No manual action needed

### Environment Variables

Add these as GitHub Actions secrets (Repo Settings → Secrets):
- `CONFLUENCE_API_TOKEN` — Atlassian API token (Basic auth with `CONFLUENCE_EMAIL`)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_AZURE_AD_TENANT_ID`
- `NEXTAUTH_AZURE_AD_CLIENT_ID`
- `NEXTAUTH_AZURE_AD_CLIENT_SECRET`

## Configuration

### Confluence

**Label:** Pages must be labeled `"Accelerating AI Team"` in Confluence to appear on the landing page.

**Data Model:** Each project includes:
- Title (from page title)
- Description (from page summary)
- Link (to Confluence page)
- Thumbnail (from Confluence page preview)
- Status (active/archived)
- Tags (from Confluence labels)

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
- Projects must match ALL selected tags
- Tags auto-extracted from Confluence labels

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
- [x] **Phase 4:** Authentication setup (Azure AD SSO)
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
- Shows title, description preview (150 chars)
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
- Displays authenticated user info (name, email, avatar)
- Dropdown menu with sign-out button
- Sticky positioning at top of page
- Responsive design for mobile/tablet/desktop

#### Authentication System
- **Provider:** Azure AD via next-auth v4
- **Sign-in Page:** `/auth/signin` (custom branded page)
- **Session Management:** SessionProvider wraps entire app
- **Protected Routes:** All pages require authentication
- **Sign-in Flow:**
  1. User visits site
  2. Redirected to `/auth/signin` if not authenticated
  3. Clicks "Sign in with Sophos" button
  4. Redirected to Azure AD login
  5. After auth, returns to home page with session
  6. User info displays in header
  7. Can sign out from dropdown menu

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
- **Exports:** Named exports (no default exports)

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

### Environment Variable Errors

- Ensure `.env.local` is in the root directory (not tracked in git)
- Double-check all variable names match `.env.local.example`
- For GitHub Actions, verify secrets are set in repo Settings

### Confluence Sync Issues

- Verify API token has read access to Confluence
- Check that pages are labeled `"Accelerating AI Team"`
- Review sync endpoint logs in GitHub Actions

## Support

For questions or issues:
- Open a GitHub issue with detailed description
- Check existing issues for similar problems
- Contact the Accelerating AI team

## License

Internal Sophos tool. Not for external distribution.

---

**Status:** Live — [https://edsophos.github.io/Accelerating-AI-Landing-Page/](https://edsophos.github.io/Accelerating-AI-Landing-Page/)  
**Last Updated:** April 29, 2026  
**Maintained by:** Accelerating AI Team @ Sophos
