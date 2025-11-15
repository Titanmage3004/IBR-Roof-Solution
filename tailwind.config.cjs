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
  theme: {
    extend: {},
  },
  plugins: [],
}
