import * as core from '@actions/core';

export function parseFileDiff(file) {
  const hunks = [];
  const lines = file.patch.split('\n');

  let currentHunk = null;
  let currentNewLine = 0;

  for (const line of lines) {

    // Hunk header: @@ -oldStart,oldLines +newStart,newLines @@
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
      if (!match) continue;

      currentHunk = {
        oldStart: parseInt(match[1], 10),
        oldLines: parseInt(match[2] || '1', 10),
        newStart: parseInt(match[3], 10),
        newLines: parseInt(match[4] || '1', 10),
        lines: [],
      };

      currentNewLine = currentHunk.newStart;
      hunks.push(currentHunk);
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith('+')) {
      currentHunk.lines.push({
        type: 'added',
        content: line.slice(1),
        lineNumber: currentNewLine++,
      });
    } else if (line.startsWith('-')) {
      currentHunk.lines.push({
        type: 'removed',
        content: line.slice(1),
        lineNumber: null,   // removed lines don't exist in the new file
      });
    } else {
      // Context line — starts with a space
      currentHunk.lines.push({
        type: 'context',
        content: line.slice(1),
        lineNumber: currentNewLine++,
      });
    }
  }

  const addedLineCount = hunks
    .flatMap(h => h.lines)
    .filter(l => l.type === 'added').length;

  const removedLineCount = hunks
    .flatMap(h => h.lines)
    .filter(l => l.type === 'removed').length;

  core.debug(`Parsed ${file.filename}: ${hunks.length} hunk(s), +${addedLineCount} -${removedLineCount}`);

  return {
    filename: file.filename,
    status: file.status,
    hunks,
    addedLineCount,
    removedLineCount,
  };
}

export function parsePRDiff(files) {
  return files.map(parseFileDiff);
}