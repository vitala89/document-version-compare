import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  {
    name: 'app/security',
    rules: {
      // User-provided text is untrusted. Only SafeHtml.vue may render sanitized HTML.
      'vue/no-v-html': 'error',
    },
  },

  {
    // Layers: domain → view-models → components. A layer never imports the ones above it.
    name: 'app/layers-domain',
    files: ['src/domain/**/*.ts', 'src/security/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['vue', '@/components/*', '@/composables/*', '@/view-models/*', '*.vue'],
              message: 'Domain and security code stay free of Vue and screens (docs/architecture.md).',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'app/layers-view-models',
    files: ['src/view-models/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['vue', '@/components/*', '@/composables/*', '*.vue'],
              message:
                'View-models are plain functions that prepare data for screens (docs/architecture.md).',
            },
          ],
        },
      ],
    },
  },
  {
    // Components reach the domain only through useComparison and the view-models.
    // Types are fine: they describe the data, they do not compute anything.
    name: 'app/layers-components',
    files: ['src/components/**/*.vue', 'src/App.vue'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/domain/*', '**/domain/*'],
              allowTypeImports: true,
              message:
                'Components get domain data through useComparison or a view-model (docs/architecture.md).',
            },
            {
              group: ['@/security/*', '**/security/*', 'dompurify'],
              message: 'Only SafeHtml.vue renders sanitized HTML (AGENTS.md, Security).',
            },
          ],
        },
      ],
    },
  },
  {
    // The one component allowed to use the sanitizer.
    name: 'app/safe-html',
    files: ['src/components/SafeHtml.vue'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/domain/*', '**/domain/*'],
              allowTypeImports: true,
              message:
                'Components get domain data through useComparison or a view-model (docs/architecture.md).',
            },
          ],
        },
      ],
    },
  },

  skipFormatting,
)
