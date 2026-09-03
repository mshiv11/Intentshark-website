import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://mshiv11.github.io',
  base: '/astro-agency-template',
  integrations: [tailwind()],
  output: 'static',
});
