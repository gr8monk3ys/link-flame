import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import tailwindcss from 'eslint-plugin-tailwindcss'
import prettier from 'eslint-config-prettier'

const config = [
  ...nextCoreWebVitals,
  ...tailwindcss.configs['flat/recommended'],
  {
    settings: {
      tailwindcss: {
        callees: ['cn'],
        config: 'tailwind.config.js',
      },
      next: {
        rootDir: ['./'],
      },
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      'react/jsx-key': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'tailwindcss/no-custom-classname': 'off',
    },
  },
  {
    files: ['tests/e2e/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  prettier,
  {
    ignores: ['playwright-report/**', 'test-results/**', 'coverage/**'],
  },
]

export default config
