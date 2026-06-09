const { buildAssistantPrompt } = require('../lib/aiPrompt');

function assert(condition, message) {
  if (!condition) {
    console.error('Assertion failed:', message);
    process.exit(2);
  }
}

const prompt = buildAssistantPrompt({
  restaurantName: 'Chez Example',
  tableLabel: '5',
  categoriesSummary: 'Starters, Mains, Desserts',
  menuSummary: 'Category: Starters\n- Garlic Bread: Toasted bread; Ingredients: Bread, Garlic; Price: $4.00.',
  question: 'Does the garlic bread contain dairy?'
});

console.log('Generated prompt preview:\n', prompt.slice(0, 800));

assert(prompt.includes('Chez Example'), 'Prompt should include restaurant name');
assert(prompt.includes('allerg'), 'Prompt should include allergy safety guidance');
assert(prompt.includes('When you reply'), 'Prompt should include response format guidance');

console.log('All prompt checks passed.');
process.exit(0);
