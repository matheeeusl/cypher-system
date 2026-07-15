// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		starlight({
			title: 'Cypher System Reference',
			customCss: ['./src/styles/globals.css'],
			sidebar: [
				{
					label: 'Rules',
					items: [{ label: 'Introduction', slug: 'rules/introduction' }],
				},
			],
		}),
	],
});
