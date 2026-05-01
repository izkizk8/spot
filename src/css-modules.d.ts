/**
 * Ambient declaration so TypeScript can resolve `*.module.css` imports
 * (used by `src/components/animated-icon.web.tsx`). The module exposes
 * a default export mapping class names to their generated identifiers.
 */
declare module '*.module.css' {
  const classes: { readonly [name: string]: string };
  export default classes;
}
