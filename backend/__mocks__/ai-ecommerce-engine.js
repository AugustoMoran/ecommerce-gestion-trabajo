/**
 * Mock for the external ai-ecommerce-engine module.
 *
 * This file is used by Jest (via moduleNameMapper) to stub out the AI engine
 * so that integration tests can load app.js without the engine being installed.
 * It does NOT affect the running application — only the test environment.
 */

'use strict';

// ── utils/fuzzyMatch ─────────────────────────────────────────────────────────
const fuzzyMatch = jest.fn((_term, _list, _threshold) => []);

// ── createAIEngine ────────────────────────────────────────────────────────────
const createAIEngine = jest.fn(() => ({
  chat: jest.fn().mockResolvedValue({ text: 'Mock AI response', products: [] }),
  clearCache: jest.fn(),
}));

// ── createRecommendationPlugin ────────────────────────────────────────────────
const createRecommendationPlugin = jest.fn(() => ({}));

// ── createAnalyticsPlugin ─────────────────────────────────────────────────────
const createAnalyticsPlugin = jest.fn(() => ({}));

module.exports = {
  fuzzyMatch,
  createAIEngine,
  createRecommendationPlugin,
  createAnalyticsPlugin,
};
