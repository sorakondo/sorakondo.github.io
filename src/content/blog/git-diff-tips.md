---
title: "Git：コミット前に差分を確認する"
description: "毎日のCLI作業で使う、3つの確認コマンド。表示確認用のメモです。"
pubDate: 2026-10-19
tags: ["Git", "CLI"]
draft: false
---

デモ用の開発メモです。

## 変更を確認する

```bash
git status --short
git diff
git diff --staged
```

`git diff` は未ステージの差分、`git diff --staged` はコミット対象の差分を表示します。

## 小さく残す

関連する変更をまとめて記録すると、あとから見返しやすくなります。
