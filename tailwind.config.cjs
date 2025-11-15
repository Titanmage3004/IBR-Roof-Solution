/**
 * Tailwind config used for the local build.
 * Ensures the content paths include all HTML and JS files in the project so
 * responsive utilities (md:, lg:, etc.) are generated during the build.
 */
module.exports = {
  content: [
    './**/*.html',
    './js/**/*.js'
  ],
  // Ensure some commonly used responsive utilities are always included
  // This helps when the content scanner misses classes (rare) or when
  // classes are generated dynamically at runtime. We include common
  // grid/flex breakpoints used across the pages so md:/lg: utilities
  // are present in the built CSS.
  safelist: [
    'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4',
    'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4',
    'sm:grid-cols-2', 'sm:grid-cols-3',
    'md:flex', 'lg:flex', 'sm:flex', 'md:grid', 'lg:grid',
    'md:items-center', 'md:items-start', 'lg:items-center'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
