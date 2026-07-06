import * as core from '@actions/core';

export async function fetchPRFiles(octokit, owner, repo, prNumber){
    const {data: files} = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        per_page:100,
    })


    const reviewableFiles =files.filter(f=> f.patch !==undefined);

    core.info(`Found ${files.length} changed file(s)__ ${reviewableFiles.length} reviewable`);


    return reviewableFiles.map(f=>({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch,
    }));
}


export async function fetchPRHeadSha(octokit, owner, repo, prNumber) {
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return data.head.sha;
}