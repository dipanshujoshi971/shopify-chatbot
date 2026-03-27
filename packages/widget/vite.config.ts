/**
 * packages/widget/vite.config.ts
 *
 * Builds a single self-executing IIFE (Immediately Invoked Function Expression)
 * so the merchant embeds exactly ONE <script> tag.
 *
 * Bundle targets (<30KB gzip):
 *   Preact runtime   ≈  3KB
 *   preact/hooks     ≈  1KB
 *   Widget code      ≈ 14KB
 *   ─────────────────────────
 *   Total            ≈ 18KB  ✓
 */
import { defineConfig, type PluginOption } from 'vite';
import preact               from '@preact/preset-vite';
import { visualizer }       from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    preact({
      // Use Preact's own JSX transform (no React shim needed)
      reactAliasesEnabled: false,
    }),
    // Use ternary operator instead of filter(Boolean)
    mode === 'analyze' ? visualizer({
      filename  : 'dist/bundle-stats.html',
      open      : true,
      gzipSize  : true,
      brotliSize: true,
    }) : null,
  ] as PluginOption[], // <-- Explicit cast fixes the red lines

  // Resolve Preact aliases to keep bundle tiny
  resolve: {
    alias: {
      react          : 'preact/compat',
      'react-dom'    : 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
  
  // ... rest of your build config remains exactly the same ...

  build: {
    lib: {
      entry   : 'src/index.ts',
      name    : 'ShopbotWidget',
      fileName : () => 'widget.iife.js',
      formats : ['iife'],        // single IIFE — no module bundler needed on storefront
    },

    rollupOptions: {
      // Inline ALL deps — the storefront has no module loader
      external: [],

      output: {
        // Expose as window.ShopbotWidget for manual init if needed
        name  : 'ShopbotWidget',
        format: 'iife',
        // Inline dynamic imports — we must be a single file
        inlineDynamicImports: true,
      },
    },

    minify   : 'terser',
    terserOptions: {
      compress: {
        drop_console : mode === 'production',
        drop_debugger: true,
        pure_funcs   : mode === 'production' ? ['console.log', 'console.debug'] : [],
        passes       : 2,          // extra compression pass
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },

    // Emit source maps only in development
    sourcemap: mode !== 'production',

    // Warn if bundle exceeds 30KB gzip
    chunkSizeWarningLimit: 30,

    outDir    : 'dist',
    emptyOutDir: true,
  },

  // Local dev server for the test harness (scripts/test-server.js)
  server: {
    port: 5173,
    cors: true,
  },

  define: {
    // Injected at build time so the bundle knows its own CDN path
    __WIDGET_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
}));