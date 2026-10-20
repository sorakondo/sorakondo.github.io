export const profile = {
  name: "sorakondo",
  role: "Research & Engineering",
  description:
    "つくる、測る、考える。その過程を記録する個人ポートフォリオ・技術ブログ。",
  intro:
    "研究と開発のあいだにある、小さな発見を。コード、実験、ものづくりの記録を、少しずつ蓄積していく場所です。",
  notice:
    "現在はデザイン確認用のサンプルを掲載しています。専門分野・経歴・研究実績は準備中です。",
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
  ["Articles", "/articles/"],
  ["Notes", "/notes/"],
] as const;
