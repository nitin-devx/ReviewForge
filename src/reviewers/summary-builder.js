

/**
 * @param {import('../ai/reviewer.js').FileReview[]} fileReviews
 * @returns {ReviewSummary}
 */
export function buildSummary(fileReviews) {
  const allFindings = fileReviews.flatMap(r => r.findings);

  const bySeverity = {
    critical: allFindings.filter(f => f.severity === 'critical').length,
    warning: allFindings.filter(f => f.severity === 'warning').length,
    suggestion: allFindings.filter(f => f.severity === 'suggestion').length,
    nitpick: allFindings.filter(f => f.severity === 'nitpick').length,
  };

  const filesWithIssues = fileReviews.filter(r => r.findings.length > 0).length;

  const markdown = `## 🤖 ReviewForge Summary

Reviewed **${fileReviews.length}** file(s) — found **${allFindings.length}** issue(s) across **${filesWithIssues}** file(s).

| Severity | Count |
|---|---|
| 🔴 Critical | ${bySeverity.critical} |
| 🟠 Warning | ${bySeverity.warning} |
| 🟡 Suggestion | ${bySeverity.suggestion} |
| ⚪ Nitpick | ${bySeverity.nitpick} |

${allFindings.length === 0 ? '✅ No issues found — nice work!' : 'See inline comments below for details.'}

*Powered by [ReviewForge](https://github.com) — AI-powered PR review*`;

  return {
    filesReviewed: fileReviews.length,
    totalFindings: allFindings.length,
    bySeverity,
    markdown,
  };
}