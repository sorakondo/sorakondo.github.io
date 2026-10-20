---
title: "KLayoutをグレー基調のダークモードにする方法【Rubyマクロ・自動起動対応】"
description: "RubyマクロでKLayoutのUIをグレー基調のダークテーマに変更し、起動時に自動適用する方法を紹介します。"
pubDate: 2026-10-20
tags: ["KLayout", "Ruby", "GDS"]
draft: false
---

Pythonで生成したGDSファイルをKLayoutで確認しているが、KLayoutのUIもダークモードにしたくなった。

KLayoutではレイアウト表示領域の背景色は設定画面から変更できるものの、メニューやサイドパネルの色までは変更できない。

そこで、**Rubyマクロを利用してKLayoutのUI全体をダークモード化**することにした。

今回は、黒一色ではなく、少し明るめのグレーを基調としたテーマにする。

## 1. Rubyマクロを作成する

KLayoutにはRuby・Pythonのマクロ実行環境が用意されている。今回はQtのカラーパレットを操作するため、Rubyマクロを利用する。

1. KLayoutを起動する。
2. `Macros → Macro Development` を開く。
3. 左側の一覧で **Ruby** を選択する。
4. `+` ボタンから新しいマクロを作成する。
5. `dark_theme.lym` などの名前を付ける。

## 2. グレー基調のダークテーマを設定する

作成したマクロに次のコードを貼り付ける。

```ruby
# KLayout Dark Theme
# Medium Charcoal Gray

RBA::QApplication::setStyle("Fusion")

palette = RBA::QPalette::new

# UIカラー設定
colors = [
  "#eeeeee", # windowText
  "#545454", # button
  "#656565", # light
  "#303030", # dark
  "#454545", # mid
  "#eeeeee", # text
  "#ffffff", # brightText
  "#383838", # base
  "#484848"  # window
]

# Active / Inactive
[:Active, :Inactive].each do |state|
  brushes = colors.map do |hex|
    RBA::QBrush::new(RBA::QColor::new(hex))
  end

  palette.setColorGroup(
    RBA::QPalette.const_get(state),
    *brushes
  )
end

# Disabled
disabled = colors.dup
disabled[0] = "#999999"
disabled[5] = "#999999"
disabled[6] = "#aaaaaa"

palette.setColorGroup(
  RBA::QPalette::Disabled,
  *disabled.map { |hex|
    RBA::QBrush::new(RBA::QColor::new(hex))
  }
)

RBA::QApplication::setPalette(palette)
```

マクロを保存して実行すると、KLayoutのメニュー、パネル、ボタンなどの配色が変更される。

### 配色について

| 項目 | カラーコード |
|---|---|
| ウィンドウ背景 | `#484848` |
| ボタン | `#545454` |
| 入力欄・リスト | `#383838` |
| 文字色 | `#EEEEEE` |
| 暗い境界色 | `#303030` |

背景をさらに暗くしたければ`window`の色を`#393939`に、もっと明るくしたければ`#585858`などに変更すればよい。

また、`Fusion`スタイルを指定しているのは、Windows環境でもQtのカラーパレットを反映させやすくするためである。

## 3. 起動時に自動適用する

マクロは一度実行するだけでは、次回起動時に自動で適用されるとは限らない。

そこで、KLayoutのマクロ自動実行機能を利用する。

1. `Macros → Macro Development` を開く。
2. 作成したマクロを選択する。
3. **Edit properties** を開く。
4. **Run on start-up** にチェックを入れる。
5. 保存してKLayoutを再起動する。

これで、KLayoutを起動するたびにRubyマクロが自動実行され、ダークテーマが適用される。

毎回手動で実行する必要はない。

## 4. GDS表示領域の背景色を変更する

ここまでのマクロが変更するのは、主にKLayoutのUI部分である。

GDSの表示領域の背景色は別途設定する。

`File → Setup → Display → Background`

ここで`Background color`を変更する。

個人的には`#303030`程度のダークグレーが使いやすい。

レイヤーの色が見づらくなった場合は、Layer Propertiesから各レイヤーの表示色を調整する。

## 5. 注意点

今回の方法は、KLayoutの標準テーマを変更するものではなく、QtのカラーパレットをRubyマクロから上書きする方法である。

そのため、環境によっては一部のアイコンやタイトルバーなどが完全にはダークモードにならないことがある。

特にWindowsではOS標準のスタイルが使われる部分があるため、`Fusion`スタイルを併用している。

元のテーマに戻したい場合は、作成したマクロの**Run on start-upを無効化**し、KLayoutを再起動すればよい。

なお、この方法ではGDSファイルそのものの内容は変更されない。

## まとめ

KLayoutではRubyマクロを使ってQtのカラーパレットを変更することで、UIをダークモード化できる。

さらに、**Run on start-upを設定すれば、起動時に自動適用できる**ため、一度設定すれば手動操作は不要になる。

PythonでGDSを生成し、KLayoutで確認する作業が多いため、こうした開発環境のカスタマイズも進めていきたい。

## 参考資料

- [KLayout公式フォーラム：Dark mode](https://www.klayout.de/forum/discussion/2126/dark-mode)
- [KLayout公式ドキュメント：About Macro Development](https://www.klayout.de/doc/about/macro_editor.html)
- [KLayout公式フォーラム：背景色の変更方法](https://www.klayout.de/forum/discussion/292/how-to-change-background-color-from-white-to-black)
