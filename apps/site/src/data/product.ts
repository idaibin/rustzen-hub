export const product = {
  name: 'Rustzen Clear',
  eyebrow: 'Native macOS cleaner for developers',
  eyebrowZh: '为开发者打造的原生 macOS 清理工具',
  // Hero headline (marketing line) — replaces the bare product name as H1.
  heroTitle: "Reclaim disk space you can't see.",
  heroTitleZh: '找回你看不见的磁盘空间。',
  description:
    'A native macOS disk cleanup app for developers. It scans package caches, build outputs, AI tool state, and local development residue, then explains what can be cleaned before any action runs.',
  descriptionZh:
    'Zen Clear 扫描开发缓存、构建产物、AI 工具数据与本地开发残留，并在任何清理动作之前，告诉你什么是可以安全清理的。',
  trust: 'Beta · macOS 13+ · Universal · Restorable',
  trustZh: 'Beta · macOS 13+ · 通用 · 可恢复',
  status: 'Beta',
  accent: 'clear',
  image: {
    src: '/products/zen-clear-product.png',
    alt: 'Zen Clear native macOS GUI screenshot showing scan results and Restore Center cleanup policy',
  },
  purchase: {
    label: 'Get Pro — $10/year',
    labelZh: '升级 Pro — $10/年',
    href: 'https://console.rustzen.dev/api/billing/checkout?product=rustzen-clear&source=site',
    price: '$10/year',
    deviceLimit: 'up to 3 devices',
    free: 'Free scan, preview, permissions & updates',
    pro: 'Pro unlocks cleanup, Restore Center, scan rules & scheduled scans',
  },
  download: {
    label: 'Download for macOS',
    labelZh: '下载 macOS 版',
    href: 'https://console.rustzen.dev/api/updates/download/latest?platform=darwin-universal&download=1',
    version: 'latest',
  },
  highlights: [
    'Native macOS window with source-list navigation, result tables, and an item inspector',
    'Scan developer cache and build output locations across package managers, IDEs, Docker, Xcode, and AI tools',
    'Risk-grade every finding as Safe, Caution, or Danger before cleanup',
    'Preview cleanup scope, move recoverable changes into Zen Clear Restore Center by default, and keep permanent deletion explicit',
    'Surface Restore Center storage in disk analysis so retained cleanup items stay visible',
  ],
  // Feature grid (2x2) — bilingual.
  features: [
    {
      icon: 'scan',
      title: 'Development-aware scan',
      titleZh: '开发环境感知扫描',
      body: 'Covers Node, Rust, Go, Python, JVM, Homebrew, Docker, Xcode, IDEs, AI tools and system cache.',
      bodyZh: '覆盖 Node、Rust、Go、Python、JVM、Homebrew、Docker、Xcode、IDE、AI 工具与系统缓存。',
    },
    {
      icon: 'project',
      title: 'Project-centric analysis',
      titleZh: '以项目为中心的分析',
      body: 'Connects generated data back to the project or tool that produced it, not just a path.',
      bodyZh: '把生成数据关联到产生它的项目或工具，而不只是一条路径。',
    },
    {
      icon: 'safety',
      title: 'Safety levels',
      titleZh: '安全分级',
      body: 'Every item is graded Safe, Caution, or Danger so you clean with intent.',
      bodyZh: '每项数据都被评级为 安全 / 谨慎 / 危险，让清理有的放矢。',
    },
    {
      icon: 'restore',
      title: 'Restore Center',
      titleZh: '恢复中心',
      body: 'Review recoverable items, restore them, or permanently delete selected entries when you are ready.',
      bodyZh: '查看可恢复项目，按需恢复，也可以在确认后永久删除所选条目。',
    },
  ],
  // Safety showcase — the brand centerpiece.
  safety: [
    {
      level: 'safe' as const,
      title: 'Safe',
      titleZh: '安全',
      body: 'Rebuildable cache or temporary data — usually safe to remove.',
      bodyZh: '可重建缓存或临时数据，通常可安全清理。',
    },
    {
      level: 'caution' as const,
      title: 'Caution',
      titleZh: '谨慎',
      body: 'May affect your local development workflow — review first.',
      bodyZh: '可能影响本地开发工作流，请先确认。',
    },
    {
      level: 'danger' as const,
      title: 'Danger',
      titleZh: '危险',
      body: 'Potentially important data — not selected by default.',
      bodyZh: '可能是重要数据，默认不选中。',
    },
  ],
  // Problem band — dev-data categories that quietly fill a Mac.
  problemTitle: "Your Mac fills up with dev data you can't see.",
  problemTitleZh: '你的 Mac 正被看不见的开发数据占满。',
  problem: [
    { label: 'node_modules', size: '6–18 GB' },
    { label: 'target/', size: '4–12 GB' },
    { label: 'DerivedData', size: '3–10 GB' },
    { label: 'Docker', size: '8–30 GB' },
    { label: 'AI models', size: '10–60 GB' },
    { label: '.next/cache', size: '1–4 GB' },
    { label: '.venv / pip', size: '1–5 GB' },
    { label: 'Gradle / Maven', size: '2–8 GB' },
  ],
  // How it works — three steps.
  stepsTitle: 'How it works',
  stepsTitleZh: '工作原理',
  steps: [
    {
      n: '01',
      title: 'Scan every dev cache & build output',
      titleZh: '扫描全部开发缓存与构建产物',
      body: 'One pass across package managers, IDEs, Docker, Xcode, AI tools and system cache.',
      bodyZh: '一次扫描覆盖包管理器、IDE、Docker、Xcode、AI 工具与系统缓存。',
    },
    {
      n: '02',
      title: 'Risk-grade each finding',
      titleZh: '为每项结果评级',
      body: 'Every item is marked Safe, Caution, or Danger — with an explanation, not just a size.',
      bodyZh: '每项数据都被标记为 安全 / 谨慎 / 危险——附带解释，而不仅是体积。',
    },
    {
      n: '03',
      title: 'Preview, confirm, restore or delete',
      titleZh: '预览、确认、恢复或删除',
      body: 'See exactly what will be cleaned before anything runs. Default cleanup goes to Zen Clear Restore Center, where you can restore items or permanently remove them later.',
      bodyZh: '在任何清理发生前看清范围。默认清理会进入 Zen Clear 恢复中心，你可以之后恢复或永久移除。',
    },
  ],
  // Pricing teaser — Free vs Pro.
  pricingTitle: 'Simple, honest pricing',
  pricingTitleZh: '简单诚实的价格',
  pricing: [
    {
      name: 'Free',
      nameZh: '免费',
      price: '$0',
      tagline: 'Scan & preview, forever.',
      taglineZh: '永久免费扫描与预览。',
      features: [
        'Full scan and risk grading',
        'Preview cleanup scope',
        'macOS permission setup',
        'Automatic and manual updates',
        'No license required',
      ],
      featuresZh: [
        '完整扫描与风险分级',
        '预览清理范围',
        'macOS 权限设置',
        '自动与手动更新',
        '无需授权',
      ],
      cta: 'Download',
      ctaZh: '下载',
      href: 'https://console.rustzen.dev/api/updates/download/latest?platform=darwin-universal&download=1',
      featured: false,
    },
    {
      name: 'Pro',
      nameZh: 'Pro',
      price: '$10',
      per: '/year',
      perZh: '/年',
      tagline: 'Clean safely, across your machines.',
      taglineZh: '安全清理，跨设备使用。',
      features: [
        'Everything in Free',
        'One-click cleanup',
        'Restore Center with manual delete',
        'Scan rules and exclusions',
        'Custom rules and scheduled scans',
        'Up to 3 devices',
        'Priority support',
      ],
      featuresZh: [
        '包含免费版全部',
        '一键清理',
        '恢复中心与手动删除',
        '扫描规则与排除策略',
        '自定义规则与定时扫描',
        '最多 3 台设备',
        '优先支持',
      ],
      cta: 'Get Pro',
      ctaZh: '升级 Pro',
      href: 'https://console.rustzen.dev/api/billing/checkout?product=rustzen-clear&source=site',
      featured: true,
    },
  ],
  // FAQ.
  faqTitle: 'Frequently asked questions',
  faqTitleZh: '常见问题',
  faq: [
    {
      q: 'Is Zen Clear safe? Will it delete something important?',
      qZh: 'Zen Clear 安全吗？会删掉重要数据吗？',
      a: 'Cleanup is preview-first. Nothing is removed until you confirm, and every item is risk-graded. Default cleanup moves recoverable changes into Zen Clear Restore Center, not macOS Trash or direct permanent deletion. From there, you can restore items or permanently delete selected entries.',
      aZh: '清理是预览优先的：在你确认之前不会移除任何内容，且每项数据都有风险分级。默认清理会把可恢复的变更移入 Zen Clear 恢复中心，不进入 macOS 废纸篓，也不是直接永久删除。之后你可以恢复，也可以永久删除所选条目。',
    },
    {
      q: 'Which macOS versions are supported?',
      qZh: '支持哪些 macOS 版本？',
      a: 'Zen Clear runs on macOS 13 Ventura and later, as a Universal binary (Apple silicon + Intel).',
      aZh: 'Zen Clear 支持 macOS 13 Ventura 及更高版本，提供通用二进制（Apple 芯片 + Intel）。',
    },
    {
      q: 'Will Restore Center keep growing?',
      qZh: '恢复中心会一直变大吗？',
      a: 'Restore Center keeps recoverable cleanup items until you restore or permanently delete them. Zen Clear surfaces Restore Center storage in disk analysis so retained items are visible instead of silently growing forever.',
      aZh: '恢复中心会保留可恢复清理项目，直到你恢复或永久删除。Zen Clear 会在磁盘分析中显示恢复中心占用，让保留项目保持可见，避免无声膨胀。',
    },
    {
      q: 'What does the scan cover?',
      qZh: '扫描覆盖哪些内容？',
      a: 'Node, Rust, Go, Python, JVM, Homebrew, Docker, Xcode, IDEs (VS Code, Cursor, JetBrains), AI tool state, and system caches.',
      aZh: 'Node、Rust、Go、Python、JVM、Homebrew、Docker、Xcode、IDE（VS Code、Cursor、JetBrains）、AI 工具数据与系统缓存。',
    },
    {
      q: 'Do permissions or updates require Pro?',
      qZh: '权限和自动更新需要 Pro 吗？',
      a: 'No. macOS disk and folder permission setup, automatic update checks, and manual update checks are available without a license. Pro is required for advanced scan configuration such as rules, exclusions, custom rules, and scheduled scans.',
      aZh: '不需要。macOS 磁盘与文件夹权限设置、自动检查更新和手动检查更新都无需授权。扫描规则、排除策略、自定义规则和定时扫描等高级扫描配置需要 Pro。',
    },
    {
      q: 'How does Pro billing work?',
      qZh: 'Pro 如何计费？',
      a: 'Pro is a $10/year subscription billed via Creem. It activates on up to 3 devices and renews annually; cancel anytime.',
      aZh: 'Pro 是通过 Creem 计费的 10 美元/年订阅，最多激活 3 台设备，按年续订，可随时取消。',
    },
  ],
  // Final CTA.
  finalTitle: 'Start reclaiming space',
  finalTitleZh: '开始找回磁盘空间',
  finalBody: 'Download Zen Clear and see exactly what is eating your developer disk — in minutes.',
  finalBodyZh: '下载 Zen Clear，几分钟内看清是什么占满了你的开发磁盘。',
  proof:
    'Cleanup is preview-first: scan results and explanations are shown before any cleanup runs.',
} as const;

export const githubUrl = 'https://github.com/idaibin?tab=repositories';
export const docsUrl = '/docs';

export const products = [
  {
    name: 'Rustzen Clear',
    nameZh: 'Rustzen Clear',
    slug: 'clear',
    href: '/products',
    status: 'Beta',
    statusZh: 'Beta',
    summary: 'A native macOS cleanup tool for developer cache, build output, AI tool state, and local residue.',
    summaryZh: '面向开发缓存、构建产物、AI 工具数据与本地残留的原生 macOS 清理工具。',
    fit: 'For developers whose Mac fills up with generated project data.',
    fitZh: '适合经常被项目生成数据占满磁盘的开发者。',
    downloadHref: '',
    githubHref: '',
    docsHref: '/products',
    accent: 'clear',
  },
] as const;

export const publicProducts = products.filter((item) => item.slug === 'clear');
