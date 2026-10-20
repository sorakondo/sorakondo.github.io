---
title: "Pythonで生成したGDSをKLayoutで確認・自動リロードする【WSL2 + KLive】"
description: "Windows 11 + WSL2でPythonによるGDS生成環境を構築し、Windows版KLayoutでの表示とKLiveによる自動リロードを行う方法を紹介します。"
pubDate: 2026-10-20
tags: ["Python", "KLayout", "GDS", "WSL2", "MEMS"]
draft: false
---

## はじめに

MEMSデバイスの設計で、Pythonを使ってGDSファイルを生成し、KLayoutでレイアウトを確認する開発環境を構築した。

普段はWindows 11 + WSL2を使用しており、PythonによるGDS生成はWSL上、レイアウトの確認はWindows版KLayoutで行っている。

この構成では、PythonでGDSを再生成するたびに、KLayout側で手動でReloadする必要があった。

そこで、KLayoutの拡張機能である**KLive**を導入し、GDS生成処理から再読み込みを通知する方法を検討した。

この記事では、Pythonの環境構築からGDS生成、KLayoutでの表示、KLiveによる自動リロードまでを紹介する。

なお、KLiveとの通信はWindows PowerShellから実際に動作確認している。Python統合コードについては、その通信方法を汎用化した実装例として掲載する。

## 1. 開発環境

今回使用した環境は以下のとおり。

| 項目 | 環境 |
|---|---|
| OS | Windows 11 |
| Linux | WSL2 / Ubuntu 24.04 |
| Python | 3.12 |
| パッケージ管理 | uv |
| GDS生成 | `klayout.db` |
| GDSビューア | KLayout 0.30.12（Windows版） |
| 自動リロード | KLive 0.4.3 |
| 通信 | TCP 127.0.0.1:8082 |

全体の構成は次のとおり。

<p class="code-label">構成図：Windows 11 + WSL2</p>

```text
Windows 11
│
├── WSL2 (Ubuntu 24.04)
│   │
│   ├── Python 3.12 / uv
│   ├── klayout.db
│   │
│   └── output/
│       └── rectangle.gds
│
└── Windows版KLayout
    │
    └── KLive
        └── TCP localhost:8082
```

WSL上ではKLayoutのPythonパッケージを使用してGDSを生成する。

Windows版KLayoutは、そのGDSファイルをUNCパス経由で直接読み込む。

**WSL側にKLayoutのGUIアプリケーションをインストールする必要はない。**

## 2. KLayoutとGDSについて

### GDSIIとは

GDSIIは、半導体やMEMSのレイアウトデータを保存するためのファイル形式である。

セル、レイヤー、ポリゴンなどを組み合わせて構造を表現できる。

### KLayoutとは

[KLayout](https://www.klayout.de/)は、GDSIIやOASISなどのレイアウトファイルを表示・編集できるオープンソースソフトウェアである。

レイヤーの切り替え、セル階層の確認、寸法測定、DRCなどに対応している。

また、Python APIが提供されており、GUIを起動せずにPythonからGDSを生成することもできる。

今回は次の2つを使い分ける。

- `klayout.db`：WSL上でGDSを生成
- KLayout GUI：Windows上でレイアウトを表示・確認

## 3. Windows版KLayoutのインストール

まず、公式サイトからWindows版KLayoutをインストールする。

https://www.klayout.de/

インストール後にKLayoutを起動すると、レイアウト表示領域やレイヤー一覧が表示される。

この時点ではKLiveのインストールは不要。

最初にPythonでGDSを生成し、KLayoutで手動表示できることを確認する。

## 4. WSL2にPythonのGDS生成環境を構築する

Pythonのパッケージ管理には`uv`を使用する。

### 4.1 uvのインストール

WSL上で以下を実行する。

<p class="code-label">WSL / Bash</p>

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

シェルを再起動し、`uv`コマンドが使用できることを確認する。

<p class="code-label">WSL / Bash</p>

```bash
uv --version
```

### 4.2 Python 3.12の準備

<p class="code-label">WSL / Bash</p>

```bash
uv python install 3.12
```

プロジェクトを作成する。

<p class="code-label">WSL / Bash</p>

```bash
mkdir -p ~/workspace/klayout-mems
cd ~/workspace/klayout-mems

uv init --python 3.12
```

すでに`pyproject.toml`が存在するプロジェクトでは、`uv init`は実行せず既存の設定を使用する。

### 4.3 KLayout Pythonパッケージの導入

<p class="code-label">WSL / Bash</p>

```bash
uv add klayout
```

インストール後に確認する。

<p class="code-label">WSL / Bash</p>

```bash
uv run python -c "import klayout.db as kdb; print(kdb.Layout())"
```

エラーが出なければ準備完了。

Pythonからは以下のようにインポートする。

<p class="code-label">Python：インポート例</p>

```python
import klayout.db as kdb
```

## 5. Pythonで四角形のGDSを生成する

最小限のサンプルとして、20 µm × 10 µmの四角形を1つ生成する。

`generate_gds.py`を作成する。

<p class="code-label">generate_gds.py</p>

```python
from pathlib import Path
import klayout.db as kdb

# レイアウト作成
layout = kdb.Layout()
layout.dbu = 0.001  # 1 DBU = 1 nm

# セル・レイヤー
cell = layout.create_cell("TOP")
layer = layout.layer(1, 0)

# 20 µm × 10 µm の四角形
cell.shapes(layer).insert(
    kdb.Box(0, 0, 20_000, 10_000)
)

# GDSを保存
output = Path("output/rectangle.gds")
output.parent.mkdir(parents=True, exist_ok=True)

layout.write(str(output))

print(f"Generated: {output.resolve()}")
```

`layout.dbu = 0.001`は、1データベース単位を0.001 µm（1 nm）に設定することを意味する。

そのため、`20_000`は20 µmに相当する。

WSL上で実行する。

<p class="code-label">WSL / Bash</p>

```bash
uv run python generate_gds.py
```

次のファイルが生成される。

<p class="code-label">出力ファイル構成</p>

```text
klayout-mems/
├── pyproject.toml
├── uv.lock
├── generate_gds.py
└── output/
    └── rectangle.gds
```

これでPythonによるGDS生成は完了。

## 6. Windows版KLayoutでWSLのGDSを開く

WSLとWindowsではファイルパスの形式が異なる。

例えば、WSL上のGDSは以下に保存されている。

<p class="code-label">WSLのファイルパス</p>

```text
/home/<user>/workspace/klayout-mems/output/rectangle.gds
```

Windowsからアクセスする場合は、次のUNCパスを使用する。

<p class="code-label">WindowsのUNCパス</p>

```text
\\wsl.localhost\Ubuntu-24.04\home\<user>\workspace\klayout-mems\output\rectangle.gds
```

### 6.1 wslpathでパスを変換する

WSLで以下を実行する。

<p class="code-label">WSL / Bash</p>

```bash
wslpath -w "$(realpath output/rectangle.gds)"
```

Windows形式のパスが出力される。

この方法なら、ディストリビューション名やユーザー名をハードコードする必要がない。

### 6.2 KLayoutでGDSを開く

Windows版KLayoutを起動する。

1. `File → Open`を選択する
2. 取得したUNCパスを入力する
3. `rectangle.gds`を開く
4. 必要に応じてZoom Fitを実行する

四角形が表示されれば成功。

### 6.3 GDSを変更して再生成する

Pythonコードの四角形を、例えば次のように変更する。

<p class="code-label">generate_gds.py：四角形の変更箇所</p>

```python
kdb.Box(0, 0, 40_000, 10_000)
```

再度実行する。

<p class="code-label">WSL / Bash</p>

```bash
uv run python generate_gds.py
```

GDSファイルは更新されるが、KLayoutの表示は以前のままになる場合がある。

その場合はKLayoutで`File → Reload`を実行する。

この手動操作を不要にするため、次にKLiveを導入する。

## 7. KLiveのインストール

[KLive](https://github.com/gdsfactory/klive)は、外部プログラムからKLayoutへGDSの読み込みを指示できる拡張機能である。

KLayoutで以下を開く。

`Tools → Manage Packages`

`klive`を検索してインストールする。

`Apply`を押し、必要に応じて初期スクリプトを実行する。

ツールバーにKLiveのアイコンが追加される。

| 色 | 状態 |
|---|---|
| 緑 | 起動中・待機中 |
| 黄 | リクエスト処理中 |
| 赤 | 起動失敗など |

緑色ならKLiveが起動している状態だが、実際の通信まで成功するとは限らない。

## 8. KLiveのTCP通信を確認する

KLiveは通常、Windows側の`127.0.0.1:8082`で待ち受ける。

Windows PowerShellで確認する。

<p class="code-label">Windows PowerShell</p>

```powershell
Get-NetTCPConnection -LocalPort 8082 -State Listen
```

今回の実行結果：

<p class="code-label">出力例：待ち受けポート</p>

```text
LocalAddress  LocalPort  State
------------  ---------  ------
127.0.0.1     8082       Listen
```

プロセスも確認する。

<p class="code-label">Windows PowerShell</p>

```powershell
Get-NetTCPConnection -LocalPort 8082 -State Listen |
    ForEach-Object {
        Get-Process -Id $_.OwningProcess |
            Select-Object Id, ProcessName
    }
```

今回の結果：

<p class="code-label">出力例：プロセス</p>

```text
Id     ProcessName
-----  ------------
28748  klayout_app
```

KLayoutが8082番ポートで待ち受けていることを確認できた。

## 9. PowerShellからKLiveへ通知する

KLiveにはJSON形式でGDSのパスを送信する。

<p class="code-label">JSON：KLiveリクエスト</p>

```json
{
  "gds": "WINDOWS_GDS_PATH",
  "keep_position": true
}
```

`gds`にはWindows側からアクセス可能なGDSのパスを指定する。

`keep_position`には表示位置の維持を意図する指定を渡している。ただし、実際の挙動はKLiveのバージョンや読み込み経路に依存する。

KLive 0.4.3では、リクエストJSONの末尾に改行を付ける。

### 9.1 PowerShellによる通信テスト

`test-klive.ps1`を作成する。

以下では、TCPの分割受信に対応するため、応答データを蓄積し、JSONとして解析できた時点で読み込みを終了する。

<p class="code-label">test-klive.ps1</p>

```powershell
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)

# 実際のGDSパスに変更
$gds = '\\wsl.localhost\Ubuntu-24.04\home\<user>\workspace\klayout-mems\output\rectangle.gds'

$client = $null
$memory = [IO.MemoryStream]::new()

try {
    # KLiveに接続
    $client = [Net.Sockets.TcpClient]::new(
        '127.0.0.1', 8082
    )

    $stream = $client.GetStream()

    # 各Read()に対するタイムアウト
    $stream.ReadTimeout = 5000

    # リクエストJSON
    $json = @{
        gds = $gds
        keep_position = $true
    } | ConvertTo-Json -Compress

    # 改行を付けて送信
    $bytes = [Text.Encoding]::UTF8.GetBytes(
        $json + "`n"
    )

    $stream.Write($bytes, 0, $bytes.Length)

    # JSONとして完成するまで受信
    $buffer = New-Object byte[] 4096
    $response = $null

    while ($true) {
        $count = $stream.Read(
            $buffer, 0, $buffer.Length
        )

        if ($count -eq 0) {
            throw "Connection closed before complete response"
        }

        $memory.Write($buffer, 0, $count)

        if ($memory.Length -gt 65536) {
            throw "Response too large"
        }

        $responseText = [Text.Encoding]::UTF8.GetString(
            $memory.ToArray()
        )

        try {
            $response = ConvertFrom-Json `
                -InputObject $responseText `
                -ErrorAction Stop
        }
        catch {
            # 分割受信の可能性があるため継続
            continue
        }

        break
    }

    # 成功判定
    if ($response.type -notin @('open', 'reload')) {
        throw "Unexpected KLive response"
    }

    Write-Host "KLive response:"
    $response | ConvertTo-Json
}
finally {
    $memory.Dispose()

    if ($null -ne $client) {
        $client.Dispose()
    }
}
```

`<user>`は各自のWSLユーザー名に置き換える。

実行する。

<p class="code-label">Windows PowerShell</p>

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\test-klive.ps1
```

### 9.2 実際の通信結果

今回の環境では、MEMS設計用の`triple_beam.gds`を指定して動作確認した。

以下は、**同じ通信方式を用いたPowerShellの通信試験で取得したログであり、9.1節の掲載スクリプトそのものの実行結果ではない。**

<p class="code-label">通信ログ：KLiveの応答（JSON）</p>

```json
{
  "version": "0.4.3",
  "klayout_version": "0.30.12",
  "type": "reload",
  "file": "\\\\wsl.localhost\\Ubuntu-24.04\\home\\sora\\workspace\\klayout-mems\\output\\triple_beam.gds"
}
```

`type`の意味は次のとおり。

- `open`：新しいレイアウトを開いた
- `reload`：既存のレイアウトを再読み込みした

これにより、WSL上のGDSをWindowsへコピーせずに、KLive経由で直接再読み込みできることを確認した。

### 9.3 TCPの受信処理について

ここは実装上、特に注意が必要な部分。

TCPはバイトストリームであり、1回の`Read()`でJSON全体を受信できるとは限らない。

また、確認したKLive 0.4.3の実装には、次の特徴がある。

- リクエストは改行区切り
- 応答JSONには末尾改行がない
- 応答送信後、直ちに接続が切断されるわけではない

KLiveは、応答を送信した後もTCP接続が継続している間は受信ループを続ける。

そのため、クライアント側で接続終了まで読み続けると、双方が待機状態になりタイムアウトする可能性がある。

今回は**受信データを蓄積し、JSONとして解析できた時点で受信を終了する方式**を採用した。

1接続で1リクエストを送信し、KLiveから1つのJSON応答を受信する用途を想定している。

また、**各読み取りのタイムアウトと最大応答サイズを設定している。Python統合例では、PowerShellの実行全体にも20秒のタイムアウトを設定している。**

PowerShellの`ReadTimeout = 5000`は、各`Read()`に対して5秒のタイムアウトを設定するものであり、受信処理全体を5秒に制限するものではない。また、TCP接続の確立処理には適用されない。

参考：[KLiveサーバー実装](https://github.com/gdsfactory/klive/blob/main/klayout/python/klive_server.py)

## 10. WSLのPythonからKLiveへ自動通知する

PowerShellからKLiveへ通知できることを確認したので、次はGDS生成スクリプトに組み込む。

### 10.1 なぜPowerShellを経由するのか

KLiveはWindows側の`127.0.0.1:8082`で待ち受けている。

WSL2の標準的なNAT構成では、WSLのlocalhostとWindowsのlocalhostは同じ接続先ではない。

一方、WSL2の`mirrored networking`では、Linux側からWindows側へlocalhostで接続できる場合もある。

本記事では、Windows側で通信を実行するPowerShell経由の方法を使用する。

<p class="code-label">構成図：PowerShell経由の通知</p>

```text
WSL2
  │
  ├── PythonでGDS生成
  │
  ├── wslpath -w
  │
  └── powershell.exe
           │
           ▼
        Windows
           │
           └── 127.0.0.1:8082
                     │
                     ▼
                   KLive
                     │
                     ▼
                  KLayout
```

この方法なら、WSL2のネットワーク設定を変更する必要がない。

### 10.2 PythonからPowerShellを呼び出す

以下は、PowerShellの通信処理をPythonから実行するための実装例。

`klive_reload.py`を作成する。

<p class="code-label">klive_reload.py</p>

```python
import base64
import subprocess
from pathlib import Path


def reload_klayout(gds_path: str | Path) -> bool:
    path = Path(gds_path).expanduser().resolve()

    if not path.is_file():
        print(f"[KLive] File not found: {path}")
        return False

    try:
        # WSLパスからWindowsパスへ変換
        win_path = subprocess.check_output(
            ["wslpath", "-w", str(path)],
            text=True,
        ).strip()

        # PowerShellの単一引用符をエスケープ
        escaped = win_path.replace("'", "''")

        ps = f"""
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)

$gds = '{escaped}'
$client = $null
$memory = [IO.MemoryStream]::new()

try {{
    $client = [Net.Sockets.TcpClient]::new(
        '127.0.0.1', 8082
    )

    $stream = $client.GetStream()

    # 各Read()に対するタイムアウト
    $stream.ReadTimeout = 5000

    # JSONリクエスト
    $json = @{{
        gds = $gds
        keep_position = $true
    }} | ConvertTo-Json -Compress

    $bytes = [Text.Encoding]::UTF8.GetBytes(
        $json + "`n"
    )

    $stream.Write($bytes, 0, $bytes.Length)

    # JSONが完成するまで受信
    $buffer = New-Object byte[] 4096
    $response = $null

    while ($true) {{
        $count = $stream.Read(
            $buffer, 0, $buffer.Length
        )

        if ($count -eq 0) {{
            throw "Connection closed before complete response"
        }}

        $memory.Write($buffer, 0, $count)

        if ($memory.Length -gt 65536) {{
            throw "Response too large"
        }}

        $responseText = [Text.Encoding]::UTF8.GetString(
            $memory.ToArray()
        )

        try {{
            $response = ConvertFrom-Json `
                -InputObject $responseText `
                -ErrorAction Stop
        }}
        catch {{
            # JSONがまだ不完全な可能性
            continue
        }}

        break
    }}

    if ($response.type -notin @('open', 'reload')) {{
        throw "Unexpected KLive response"
    }}

    Write-Output "KLive: $($response.type)"
}}
finally {{
    $memory.Dispose()

    if ($null -ne $client) {{
        $client.Dispose()
    }}
}}
"""

        # EncodedCommandはUTF-16LE
        encoded = base64.b64encode(
            ps.encode("utf-16le")
        ).decode("ascii")

        result = subprocess.run(
            [
                "powershell.exe",
                "-NoProfile",
                "-NonInteractive",
                "-EncodedCommand",
                encoded,
            ],
            capture_output=True,
            timeout=20,
        )

        # PowerShell側でUTF-8出力を指定
        stdout = result.stdout.decode(
            "utf-8", errors="replace"
        ).strip()

        stderr = result.stderr.decode(
            "utf-8", errors="replace"
        ).strip()

        if result.returncode != 0:
            print(f"[KLive] {stderr or stdout}")
            return False

        if not stdout.startswith("KLive: "):
            print(f"[KLive] Unexpected output: {stdout}")
            return False

        print(stdout)
        return True

    except (OSError, subprocess.SubprocessError) as e:
        print(f"[KLive] {e}")
        return False
```

ここでは以下の処理を行っている。

1. `wslpath -w`でWindows形式に変換する
2. WSLから`powershell.exe`を起動する
3. Windows側のKLiveへJSONを送る
4. JSONとして解析できるまでTCP応答を蓄積する
5. `open`または`reload`を確認する

PowerShellの`-EncodedCommand`はUTF-16LEでコマンドを渡す必要がある。

一方、PowerShellの標準出力の文字コードはそれとは別なので、冒頭で`[Console]::OutputEncoding`をUTF-8に指定している。

Python側の`subprocess.run(..., timeout=20)`は、PowerShellプロセスの実行全体に20秒のタイムアウトを設定する。

### 10.3 GDS生成処理に組み込む

`generate_gds.py`の**GDS保存部分を次のように置き換える**。

まず、ファイル冒頭のインポート部分に以下を追加する。

<p class="code-label">generate_gds.py：インポートへの追加</p>

```python
from klive_reload import reload_klayout
```

次に、既存のGDS保存部分を以下に置き換える。

<p class="code-label">generate_gds.py：GDS保存部分の置き換え</p>

```python
# GDSを保存
output = Path("output/rectangle.gds")
output.parent.mkdir(parents=True, exist_ok=True)

layout.write(str(output))
print(f"Generated: {output.resolve()}")

# 保存完了後にKLiveへ通知
reload_klayout(output)
```

既存の`layout.write(str(output))`を残して追加するのではなく、**保存処理が1回だけ実行されるように置き換える**。

これで、GDSの保存が完了した後にKLiveへの通知が実行される。

通常どおりスクリプトを実行する。

<p class="code-label">WSL / Bash</p>

```bash
uv run python generate_gds.py
```

想定する処理は以下のとおり。

<p class="code-label">処理フロー</p>

```text
Python実行
    │
    ▼
GDS生成・保存
    │
    ▼
Windowsパスへ変換
    │
    ▼
PowerShellを呼び出す
    │
    ▼
KLiveへ通知
    │
    ▼
KLayoutが再読み込み
```

KLiveが停止していた場合は警告を表示して`False`を返す構成なので、GDSの生成処理自体を失敗扱いにしない。

なお、掲載したPythonコードは実装例である。この記事で示した`open`・`reload`の実測ログは、Windows PowerShellからの通信試験で取得したものとなる。

## 11. トラブルシューティング

### 11.1 KLiveが緑色なのにタイムアウトする

今回、最も時間がかかった問題。

KLiveのアイコンは緑色で、8082番ポートも正常にListen状態だった。

しかしPowerShellからJSONを送信すると、応答の読み取りでタイムアウトが発生した。

<p class="code-label">エラーメッセージ例</p>

```text
Unable to read data from the transport connection
```

最初はWSLのUNCパスが原因だと考えた。

そこで、GDSファイルを一時的にWindowsのTempフォルダへコピーして再試行したが、同様にタイムアウトした。

このことから、少なくともWSLのUNCパスだけが原因ではないと判断した。

### 11.2 KLiveを再起動する

KLiveの公式READMEでは、ツールバーのKLiveアイコンをクリックすることで再起動できると案内されている。

まずはこの方法を試すとよい。

今回の環境では、KLiveのマクロを手動で再実行する方法で復旧した。

手順は次のとおり。

1. KLayoutで`F5`を押してマクロエディタを開く
2. `Python → Package klive → klive`を選択する
3. `Shift + F5`でマクロを実行する
4. Pythonコンソールを確認する

実際のログ：

<p class="code-label">KLayout Pythonコンソール：実行ログ</p>

```text
Running macro .../klive/pymacros/klive.lym
klive 0.4.3 stopped
klive 0.4.3 is running
```

その後、PowerShellから通信を再実行したところ、`open`の応答が返った。

続けてWSL上のGDSを直接指定すると、`reload`の応答も確認できた。

今回のタイムアウトの根本原因までは特定できていないが、マクロ再実行後に正常化したことは確認できた。

### 11.3 WindowsからWSLのGDSにアクセスできない

PowerShellで次を実行する。

<p class="code-label">Windows PowerShell</p>

```powershell
Test-Path -LiteralPath $gds
```

`False`の場合は、ファイルパスを確認する。

特にディストリビューション名やLinux側のユーザー名が異なると、正しくアクセスできない。

WSL側で次を実行すると、Windows形式のパスを取得できる。

<p class="code-label">WSL / Bash</p>

```bash
wslpath -w "$(realpath output/rectangle.gds)"
```

### 11.4 KLayoutのファイル更新確認と干渉する

KLayoutのファイル更新確認がKLiveの動作に干渉する場合は、次の設定を確認する。

`File → Setup → Application → General → Check files for updates`

必要な場合のみ無効にする。

この設定はKLive以外のファイル変更検知にも影響するため、問題がない場合は変更する必要はない。

## 12. まとめ

今回、Windows 11 + WSL2の環境で、PythonからGDSを生成し、Windows版KLayoutで確認する環境を構築した。

さらにKLiveを導入することで、WSL上のGDSをWindowsへコピーせずに直接再読み込みできることを確認した。

重要なポイントは次のとおり。

- Python 3.12・uv・`klayout.db`を使ってGDSを生成する
- Windows版KLayoutからWSLのGDSをUNCパスで直接開く
- `wslpath -w`でWindows形式にパスを変換する
- KLiveへTCP 8082番ポートでJSONを送信する
- WSLからWindowsのPowerShellを呼び出してKLiveへ通知する
- TCPの応答は分割受信を考慮し、JSONとして完成した時点で読み取りを終了する
- 各読み取りのタイムアウトと、通知プロセス全体のタイムアウトを区別する
- KLiveが緑色でも通信に失敗する場合は、アイコンからの再起動やマクロの再実行を試す

Pythonを使ったMEMSのパラメトリック設計では、梁長、梁幅、梁間距離などの設計パラメータを繰り返し変更する機会が多い。

KLiveを使うことで、GDS生成後の手動Reload操作を省き、設計・生成・確認のサイクルを効率化できる。

## 参考資料

- [KLayout公式サイト](https://www.klayout.de/)
- [KLayout Python API](https://www.klayout.de/doc-qt5/programming/python.html)
- [KLive公式GitHub](https://github.com/gdsfactory/klive)
- [KLiveサーバー実装](https://github.com/gdsfactory/klive/blob/main/klayout/python/klive_server.py)
- [uv公式ドキュメント](https://docs.astral.sh/uv/guides/projects/)
- [Microsoft — WSLのネットワーク](https://learn.microsoft.com/en-us/windows/wsl/networking)
- [Microsoft — WSLとWindowsの相互運用性](https://learn.microsoft.com/ja-jp/windows/dev-environment/wsl-interop)
