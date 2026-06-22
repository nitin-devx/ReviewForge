import * as core from '@actions/core';



const SEVERITY_EMOJI = {
  critical: '🔴',
  warning: '🟠',
  suggestion: '🟡',
  nitpick: '⚪',
};


export function mapFindingToComment(filename, finding) {
  const emoji = SEVERITY_EMOJI[finding.severity] || '⚪';

  const body = `${emoji} **${finding.severity.toUpperCase()}: ${finding.issue}**

${finding.explanation}

**Suggested fix:** ${finding.suggestion}

*— ReviewForge AI*`;

  return {
    path: filename,
    line: finding.line,
    side: 'RIGHT',   // RIGHT = the new version of the file (what the PR introduces)
    body,
  };
}

/**
 * Converts all file reviews into a flat list of GitHub comments.
 * Skips findings with invalid/missing line numbers defensively —
 * a malformed AI response shouldn't crash the whole posting step.
 *
 * @param {import('../ai/reviewer.js').FileReview[]} fileReviews
 * @returns {GitHubReviewComment[]}
 */
export function buildReviewComments(fileReviews) {
  const comments = [];

  for (const fileReview of fileReviews) {
    for (const finding of fileReview.findings) {
      if (typeof finding.line !== 'number' || finding.line < 1) {
        core.warning(`Skipping finding with invalid line number in ${fileReview.filename}`);
        continue;
      }
      comments.push(mapFindingToComment(fileReview.filename, finding));
    }
  }

  core.info(`Built ${comments.length} GitHub comment(s) from findings`);
  return comments;
}