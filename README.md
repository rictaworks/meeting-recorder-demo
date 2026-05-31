# meeting-recorder-demo

会議録音・議事録自動生成デモアプリケーション。

## 概要

ブラウザでマイク録音または音声ファイルをアップロードすると、Vosk によるオフライン音声認識で文字起こしを行い、ルールベース処理で議事録・ToDo・要約を自動生成します。

認証不要。外部 API は一切使用しません。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js（TypeScript） |
| バックエンド | FastAPI（Python） |
| 音声認識 | Vosk（オフライン・日本語モデル） |
| 音声変換 | pydub（MP3 → WAV 変換） |
| データベース | SQLite |
| セッション管理 | Cookie + SQLite |

## 機能

| 機能 | 説明 |
|------|------|
| 録音 | ブラウザのマイクから直接録音（WebM/OGG） |
| ファイルアップロード | WAV / WebM / OGG / MP3 をアップロード |
| 文字起こし | Vosk による日本語オフライン音声認識。結果は手動編集可能 |
| 議事録生成 | 決定事項・次回議題・本文をキーワードマッチで構造化 |
| ToDo 抽出 | キーワードマッチで ToDo 候補を抽出。期限自動検出・手動追記対応 |
| 要約生成 | TextRank 簡易版で全体の 15〜20% に圧縮 |
| セッション管理 | Cookie にセッション ID を付与し、他セッションのデータを遮断 |
| 自動リセット | 毎日 JST 03:00 に全データを削除 |

## セットアップ

### 前提条件

- Python 3.10 以上
- Node.js 18 以上
- Vosk 日本語モデル（`vosk-model-ja-0.22`）

### 1. Vosk 日本語モデルのダウンロード

```bash
# モデルをダウンロードして配置する
# 配置先: backend/models/vosk-model-ja-0.22/

mkdir -p backend/models
cd backend/models
wget https://alphacephei.com/vosk/models/vosk-model-ja-0.22.zip
unzip vosk-model-ja-0.22.zip
# vosk-model-ja-0.22.zip は手動で削除してください
cd ../..
```

### 2. バックエンドのセットアップ

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. 環境変数の設定

```bash
cp .env.example .env
# .env を編集して各項目を設定する（ENV/DEVELOPMENT.md 参照）
```

### 4. フロントエンドのセットアップ

```bash
cd frontend
npm install
```

### 5. 開発サーバーの起動

```bash
# バックエンド（別ターミナル）
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# フロントエンド（別ターミナル）
cd frontend
npm run dev   # http://localhost:3000
```

## デモ版の制約事項

- ユーザー認証なし（セッション ID による識別のみ）
- 外部 API 使用禁止（Vosk によるローカル音声認識を使用）
- データベースは SQLite 固定
- 毎日 JST 03:00 に全データ自動削除
- Vosk モデル未インストール時はエラー表示（フォールバックなし）
- アップロードファイルサイズ上限：100MB
- 文字起こし精度：明瞭な日本語音声で 90% 以上（ノイズ環境は精度低下あり）

## 多言語対応

日本語・英語・フランス語・中国語・ロシア語・スペイン語・アラビア語に対応（i18n）。

## ライセンス

デモ版。詳細は別途確認してください。
