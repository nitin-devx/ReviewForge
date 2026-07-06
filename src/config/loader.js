import * as core from '@actions/core';

const VALID_LEVELS = ['strict', 'standard', 'light'];

// Defines which severities get surfaced at each review level.
const SEVERITY_THRESHOLDS = {
  strict: ['critical', 'warning', 'suggestion', 'nitpick'],
  standard: ['critical', 'warning', 'suggestion'],
  light: ['critical', 'warning'],
};


/**
 * Loads and validates ReviewForge's configuration from action inputs.
 * Falls back to 'standard' on missing or invalid input — never crashes
 * the whole action over a config typo.
 *
 * @returns {ReviewConfig}
 */
export function loadConfig() {
  const rawLevel = (core.getInput('review_level') || 'standard').toLowerCase().trim();

  const reviewLevel = VALID_LEVELS.includes(rawLevel) ? rawLevel : 'standard';

  if (rawLevel !== reviewLevel) {
    core.warning(`Invalid review_level "${rawLevel}" — falling back to "standard"`);
  }

  core.info(`Review level: ${reviewLevel}`);

  return {
    reviewLevel,
    allowedSeverities: SEVERITY_THRESHOLDS[reviewLevel],
  };
}