import * as core from '@actions/core';
import { reviewChunk } from './gemini-service.js';

// Free tier: ~5 req/min. Paid tier: much higher. Default to 0 (no artificial
// delay) so real users aren't penalized — testers on the free tier can opt in.
const THROTTLE_MS = Number(process.env.REVIEW_THROTTLE_MS ?? 0);


export async function reviewAllChunks(geminiClient, chunks) {
  const results = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    core.info(`Reviewing ${chunk.filename}...`);

    try {
      const findings = await reviewChunk(geminiClient, chunk.filename, chunk.formattedDiff);
      results.push({ filename: chunk.filename, findings });
    } catch (error) {
      core.warning(`Skipping ${chunk.filename} — review failed after retries: ${error.message}`);
      results.push({ filename: chunk.filename, findings: [], error: true });
    }

    if (THROTTLE_MS > 0 && i < chunks.length - 1) {
      core.debug(`Throttling ${THROTTLE_MS}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, THROTTLE_MS));
    }
  }

  const totalFindings = results.reduce((sum, r) => sum + r.findings.length, 0);
  core.info(`Review complete — ${totalFindings} total finding(s) across ${results.length} file(s)`);

  return results;
}