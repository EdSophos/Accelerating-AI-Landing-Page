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
Sync Endpoint (/api/confluence/sync)
         ↓
JSON file (public/data/projects.json)
         ↓
Next.js Frontend (client-side search)
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
│   │   ├── auth/[...nextauth].ts    # SSO routes
│   │   └── confluence/sync.ts       # Data sync endpoint
│   ├── _app.tsx                     # App wrapper
│   ├── _document.tsx                # Document wrapper
│   └── index.tsx                    # Home page
├── components/
│   ├── SearchBar.tsx                # Search + filters
│   ├── ProjectCard.tsx              # Project card UI
│   └── ProjectGrid.tsx              # Grid layout
├── lib/
│   ├── confluence.ts                # Confluence API wrapper
│   └── auth.ts                      # Azure AD config
├── styles/
│   └── globals.css                  # Global Tailwind styles
├── public/
│   └── data/
│       └── projects.json            # Synced Confluence data
└── .github/workflows/
    └── sync-and-deploy.yml          # GitHub Actions CI/CD
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
- `CONFLUENCE_API_TOKEN`
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

### Search

Search is **client-side** and filters projects by:
- Title (prefix match)
- Description (keyword match)
- Tags (exact match)

No backend required — all processing happens in the browser.

## Development Workflow

### Phases

This project is tracked as GitHub issues for each phase:

- [x] **Phase 1:** Repo setup + Next.js initialization
- ⏳ **Phase 2:** Confluence API integration
- ⏳ **Phase 3:** UI components + search
- ⏳ **Phase 4:** Authentication setup
- ⏳ **Phase 5:** GitHub Actions CI/CD
- ⏳ **Phase 6:** Testing + refinement

See the [Issues](https://github.com/EdSophos/Accelerating-AI-Landing-Page/issues) tab for detailed task tracking.

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

**Status:** In development  
**Last Updated:** April 29, 2026  
**Maintained by:** Accelerating AI Team @ Sophos
