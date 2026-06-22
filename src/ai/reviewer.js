import * as core from '@actions/core';
import { reviewChunk } from './gemini-service.js';

export async function reviewAllChunks(geminiClient, chunks) {
  const results = [];

  for (const chunk of chunks) {
    core.info(`Reviewing ${chunk.filename}...`);

    try {
      const findings = await reviewChunk(geminiClient, chunk.filename, chunk.formattedDiff);
      results.push({ filename: chunk.filename, findings });
    } catch (error) {
      core.warning(`Skipping ${chunk.filename} — review failed after retries: ${error.message}`);
      results.push({ filename: chunk.filename, findings: [], error: true });
    }
  }

  const totalFindings = results.reduce((sum, r) => sum + r.findings.length, 0);
  core.info(`Review complete — ${totalFindings} total finding(s) across ${results.length} file(s)`);

  return results;
}