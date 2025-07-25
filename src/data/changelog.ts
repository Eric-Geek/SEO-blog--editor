export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'feature' | 'bugfix' | 'improvement';
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: '2025-01-10',
    type: 'feature',
    changes: [
      'Added AI-powered content type detection for OG Title',
      'Added AI-generated OG Description based on article content',
      'OG Title now follows format: Article Name - Brand Name | Content Type',
      'All generated content is now in English'
    ]
  },
  {
    version: '1.2.0',
    date: '2025-01-08',
    type: 'feature',
    changes: [
      'Added automatic OG Image generation based on Canonical URL and second image',
      'Fixed image ordering to match article sequence',
      'Added support for multiple AI providers (DeepSeek, Gemini, OpenAI)'
    ]
  },
  {
    version: '1.1.0',
    date: '2024-12-20',
    type: 'improvement',
    changes: [
      'Enhanced preview mode with desktop/tablet/mobile views',
      'Improved table of contents generation',
      'Added reading progress bar',
      'Better error handling for ZIP file processing'
    ]
  },
  {
    version: '1.0.0',
    date: '2024-12-01',
    type: 'feature',
    changes: [
      'Initial release',
      'SEO metadata editing capabilities',
      'ZIP file import/export',
      'Real-time preview',
      'Preset configurations for different sites'
    ]
  }
]; 