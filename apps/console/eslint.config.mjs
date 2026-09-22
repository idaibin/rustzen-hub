import nextVitals from "eslint-config-next/core-web-vitals";

const restrictedUiImports = {
  paths: [
    { name: 'antd', message: 'Import the repository-owned UI adapter instead.' },
    { name: 'element-plus', message: 'Import the repository-owned UI adapter instead.' },
    { name: 'tdesign', message: 'Import the repository-owned UI adapter instead.' },
    { name: 'tdesign-react', message: 'Import the repository-owned UI adapter instead.' },
    { name: 'tdesign-react-next', message: 'Import the repository-owned UI adapter instead.' },
  ],
  patterns: [
    { group: ['antd/*'], message: 'Import the repository-owned UI adapter instead.' },
    { group: ['@mui/*'], message: 'Import the repository-owned UI adapter instead.' },
    { group: ['@radix-ui/*'], message: 'Import the repository-owned UI adapter instead.' },
    { group: ['@headlessui/*'], message: 'Import the repository-owned UI adapter instead.' },
    { group: ['element-plus/*'], message: 'Import the repository-owned UI adapter instead.' },
    { group: ['tdesign/*', 'tdesign-react/*', 'tdesign-react-next/*', '@tdesign/*'], message: 'Import the repository-owned UI adapter instead.' },
  ],
};

const eslintConfig = [
  ...nextVitals,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/components/ui/**/*'],
    rules: {
      'no-restricted-imports': ['error', restrictedUiImports],
    },
  },
];

export default eslintConfig;
