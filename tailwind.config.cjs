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
    // grid / layout
    'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4',
    'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4',
    'sm:grid-cols-2', 'sm:grid-cols-3',
    'md:flex', 'lg:flex', 'sm:flex', 'md:grid', 'lg:grid',
    'md:items-center', 'md:items-start', 'lg:items-center',
    // spacing & gaps
    'gap-4','gap-6','gap-8','mt-4','mt-6','mb-4','mb-6','py-6','py-8','px-4','px-6','p-3','p-4',
    // typography & headings
    'text-5xl','lg:text-6xl','text-3xl','text-lg','font-extrabold','font-bold','leading-tight',
    // width/height/helpers
    'w-full','max-w-xl','h-14','min-h-screen','container','mx-auto','flex-grow',
    // utility helpers used in markup
    'items-center','items-start','justify-between','justify-center','hidden','block','grid','inline-block',
    // input / form helpers
    'rounded-full','rounded-xl','rounded-lg','border','border-solid','bg-white','bg-gray-100','text-gray-600'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
