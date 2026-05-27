/**
 * builds  the system prompt that defines how reviewFroge behaves 
 * this  is  sent once per APi call as the system message 
 */



export function buildSystemPrompt() {
    return `You are ReviewForge, an expert code reviewer with deep knowledge of software engineering best practices, security vulnerabilities, and performance optimization.

Your job is to review code diffs and provide precise, actionable feedback exactly like a senior engineer would during a pull request review.

RULES:
- Only review lines that were ADDED (lines starting with +)
- Never comment on removed lines or context lines
- Be specific — reference exact line content in your explanation
- Be constructive — always suggest how to fix the issue
- Do not invent issues that aren't there
- Prioritize real problems over style nitpicks

SEVERITY LEVELS:
- critical: security vulnerabilities, data loss risks, crashes
- warning: bugs, incorrect logic, performance problems  
- suggestion: better approaches, missing best practices
- nitpick: minor style or naming issues

You MUST respond with ONLY a valid JSON object. No explanation, no markdown, no code fences.`;
}


/**
 * Builds the user prompt for a specific code Chunks .
 */


export function buildReviewPrompt(filename, diffContent) {
    return `Review the following code diff from file: ${filename}

${diffContent}

Respond with ONLY this JSON structure:
{
  "findings": [
    {
      "line": <line number in the new file as integer>,
      "severity": "<critical|warning|suggestion|nitpick>",
      "issue": "<short title of the problem>",
      "explanation": "<clear explanation of why this is a problem>",
      "suggestion": "<concrete fix or improvement>"
    }
  ]
}

If you find no issues, respond with: { "findings": [] }`
}


/**
 * format a parsed diff hunk into readable text for the prompt .
 * context lines help the Ai understand surronding code .
 */


export function formatHunksForPrompt(hunks) {
  return hunks.map(hunk => {
    const lines = hunk.lines.map(line => {
      const prefix = line.type === 'added' ? '+' :
                     line.type === 'removed' ? '-' : ' ';
      const lineNum = line.lineNumber ? `[L${line.lineNumber}]` : '[---]';
      return `${prefix}${lineNum} ${line.content}`;
    }).join('\n');

    return `@@ starting at line ${hunk.newStart} @@\n${lines}`;
  }).join('\n\n');
}