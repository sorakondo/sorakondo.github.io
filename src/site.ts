export const profile = {
  name: "Sora Kondo",
  role: "Research & Engineering",
  description:
    "Sora Kondo のポートフォリオ・技術ブログ。",
  intro:
    "研究・開発の記録。",
  fields: ["研究ノート", "ソフトウェア", "ものづくり"],
  stack: ["Python", "TypeScript", "FPGA", "MEMS"], // 表示例。実際の使用技術に置き換えてください。
  education: ["学歴・経歴は準備中です。"],
  activities: ["活動歴は準備中です。"],
  research: [
    {
      title: "研究テーマを準備中",
      summary: "研究の背景、解決したい課題、手法と成果をここに記載します。",
      technologies: ["使用技術を記載"],
      publications: ["論文・学会発表は準備中です。"],
    },
  ],
  links: [{ label: "GitHub", url: "https://github.com/sorakondo" }],
};
export const nav = [
  ["Home", "/"],
  ["About", "/about/"],
  ["Research", "/research/"],
  ["Projects", "/projects/"],
  ["Blog", "/blog/"],
] as const;
