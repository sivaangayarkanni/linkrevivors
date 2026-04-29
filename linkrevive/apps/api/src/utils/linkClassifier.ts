export function classifyLinkType(url: string, contentType?: string): 'documentation' | 'blog' | 'github_repo' | 'pdf' | 'tutorial' | 'other' {
  const u = url.toLowerCase();
  const path = new URL(u).pathname;

  if (path.endsWith('.pdf') || contentType?.includes('pdf')) return 'pdf';
  if (u.includes('github.com') && u.split('/').length >= 5) return 'github_repo';
  if (path.includes('/docs/') || path.includes('/documentation/') || u.includes('docs.')) return 'documentation';
  if (path.includes('/blog/') || u.includes('blog.')) return 'blog';
  if (path.includes('/tutorial') || path.includes('/guide')) return 'tutorial';
  return 'other';
}
