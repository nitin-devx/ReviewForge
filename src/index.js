import * as core from '@actions/core';
import * as github from '@actions/github';

import { createGithubClient } from "./github/client.js";
import { fetchPRFiles } from "./github/pr-fetcher.js"
import { parsePRDiff } from "./parsers/diff_parser.js";


async function run() {
    try {
       
        const { context } = github;

        //Only runs on pr events we should thinks
        const SUPPORTED_ACTIONS = ['opened', 'synchronize', 'reopened'];

        if (!context.payload.pull_request) {
            core.info('not a pull request event - skipping');
            return;
        }

        if (!SUPPORTED_ACTIONS.includes(context.payload.action)) {
            core.info(`Skipping unsupported action type "${context.payload.action}"`);
            return;
        }


        // extract the files wee identified from then event payload 

        const prNumber = context.payload.number;
        const { owner, repo } = context.repo;
        const action = context.payload.action;
        const headSha = context.payload.pull_request.head.sha;

        core.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        core.info('ReviewForge — AI PR Reviewer');
        core.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        core.info(`Repository : ${owner}/${repo}`);
        core.info(`PR Number  : #${prNumber}`);
        core.info(`Trigger    : ${action}`);
        core.info(`Commit SHA : ${headSha}`);
        core.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        core.info('Review pipeline starting...');



        const token = core.getInput('github_token') || process.env.Github_token;

        const octokit = createGithubClient(token);


        const files = await fetchPRFiles(octokit, owner, repo, prNumber);
        const parsedDiff = parsePRDiff(files);

        core.info(`parsed ${parsedDiff.length} file(s) ready for review`)


        for (const file of parsedDiff) {
            core.info(`${file.filename} - ${file.hunks.length} hunks(s), +${file.addedLineCount} -${file.removedLineCount}`);
        }


        core.info('Diff parsing commplete . AI pipeline next')

    } catch (error) {
        core.setFailed(`ReviewForge failed ${error.message}`);
    }
}

run();