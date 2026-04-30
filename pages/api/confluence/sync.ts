import type { NextApiRequest, NextApiResponse } from 'next';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { getConfluenceProjects } from '@/lib/confluence';

interface SyncResponse {
  success: boolean;
  message: string;
  count?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SyncResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: `Expected GET, got ${req.method}`,
    });
  }

  try {
    console.log('Starting Confluence sync...');

    // Fetch projects from Confluence
    const projects = await getConfluenceProjects();
    console.log(`Fetched ${projects.length} projects from Confluence`);

    // Prepare output path
    const outputPath = `${process.cwd()}/public/data/projects.json`;
    const outputDir = dirname(outputPath);

    // Create directory if it doesn't exist
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore error
    }

    // Write projects to JSON file
    const data = {
      lastSynced: new Date().toISOString(),
      count: projects.length,
      projects: projects,
    };

    await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Successfully synced ${projects.length} projects to ${outputPath}`);

    return res.status(200).json({
      success: true,
      message: `Successfully synced ${projects.length} projects from Confluence`,
      count: projects.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Sync error:', errorMessage);

    return res.status(500).json({
      success: false,
      message: 'Failed to sync projects from Confluence',
      error: errorMessage,
    });
  }
}
