/**
 * Converts a string to PascalCase
 * @param v - String to convert (e.g., "my-feature-name", "my_feature_name")
 * @returns PascalCase string (e.g., "MyFeatureName")
 */
export function toPascalCase(v: string): string {
  return v
    .replace(/[-_ ]+/g, ' ')
    .split(' ')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/**
 * Pluralizes a word by adding 's' if it doesn't already end with 's'
 * @param name - Word to pluralize (e.g., "Book", "Category") 
 * @returns Pluralized word (e.g., "Books", "Categories")
 */
export function pluralize(name: string): string {
  return /s$/i.test(name) ? name : name + 's';
}