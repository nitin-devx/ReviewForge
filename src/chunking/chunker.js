import * as core from "@actions/core";


import {formatHunksForPrompt} from "../prompts/review-prompt.js";


const CHARS_PER_TOKEN =4;
const MAX_TOKENS_PER_CHUNKS= 3000;


export function buildChunks(parsedFiles){
    const chunks =[];

    for (const file of parsedFiles){
        const hasAddedLines =file.hunks.some(h=>h.lines.some(l=>l.type ==='added'));

        if(!hasAddedLines){
            core.info(`skipping ${file.filename}- no added lines`);
            continue;
        }
        
        const formattedDiff =formatHunksForPrompt(file.hunks);
        const estimatedTOkens =Math.ceil(formattedDiff.length / CHARS_PER_TOKEN);

        if(estimatedTokens > MAX_TOKENS_PER_CHUNKS){
            core.warning(`${file.filename} is large (-${estimatedTokens} token)- truncating to first ${MAX_TOKENS_PER_CHUNKS} tokens`);
        }

        const safeDiff = truncateTOTokenLimit(formattedDiff, MAX_TOKENS_PER_CHUNKS);


        chunks.push({
            filename: file.filename,
            status: file.status,
            formattedDiff: safeDiff,
            estimatedTokens : Math.min(estimatedTokens, MAX_TOKENS_PER_CHUNKS)
        });

        core.info(`chunks : ${file.filename} (-${estimatedTokens} tokens)`);
    }
        core.info(`Built ${chunks.length} chunk(s) for  review`);
        return chunks;
}



function truncateTOTokenLimit(text, maxTokens){
    const maxChars =maxTokens * CHARS_PER_TOKEN;
    if(text.length<=maxChars) return text;
    return text.slice(0,maxchars) +'\n [truncated due to size]'
}
