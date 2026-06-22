import * as core from '@actions/core';

/**
 * 
 *
 * @param {import('@actions/github').getOctokit} octokit
 * @param {Object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {number} params.prNumber
 * @param {string} params.commitId - the head SHA of the PR
 * @param {import('./comment-mapper.js').GitHubReviewComment[]} params.comments
 * @param {string} params.summaryMarkdown
 */
export async function postReview(octokit, { owner, repo, prNumber, commitId, comments, summaryMarkdown }) {
  core.info(`Posting review with ${comments.length} inline comment(s)...`);

  try {
    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      commit_id: commitId,
      body: summaryMarkdown,
      event: 'COMMENT',   // COMMENT = leave feedback without approving/blocking
      comments,
    });

    core.info('Review posted successfully.');
  } catch (error) {
    core.warning(`Failed to post full review: ${error.message}`);
    core.warning('Falling back to summary-only comment...');

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: summaryMarkdown,
    });

    core.info('Summary-only comment posted as fallback.');
  }
}