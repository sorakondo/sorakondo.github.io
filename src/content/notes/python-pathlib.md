---
title: "Python：pathlibでファイルを扱う"
description: "WindowsとLinuxで同じようにパスを組み立てる、小さなサンプル。"
pubDate: 2026-10-17
tags: ["Python", "CLI"]
draft: false
---

表示確認用のサンプルです。

## パスの結合

```python
from pathlib import Path

notes_dir = Path("src") / "content" / "notes"
for note in sorted(notes_dir.glob("*.md")):
    print(note.name)
```

文字列で区切り文字を組み立てず、`Path` に任せます。
