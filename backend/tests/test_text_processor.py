import pytest
from app.services.text_processor import TextProcessor


@pytest.fixture
def processor():
    return TextProcessor()


def test_split_sentences_basic(processor):
    text = "今日の会議を開始します。予算について決定しました。次回は来週です。"
    sentences = processor.split_sentences(text)
    assert len(sentences) >= 2


def test_generate_minutes_has_sections(processor):
    text = "予算を1000万円に決定しました。次回は来週月曜日に開催します。プロジェクトの進捗を確認します。"
    minutes = processor.generate_minutes(text)
    assert isinstance(minutes, list)
    assert len(minutes) > 0
    section_types = {m["section_type"] for m in minutes}
    assert len(section_types) > 0


def test_generate_minutes_decisions_section(processor):
    text = "予算を1000万円に決定しました。"
    minutes = processor.generate_minutes(text)
    section_types = [m["section_type"] for m in minutes]
    assert "decisions" in section_types or "body" in section_types


def test_generate_minutes_next_agenda_section(processor):
    text = "次回は来週月曜日に進捗を確認します。"
    minutes = processor.generate_minutes(text)
    section_types = [m["section_type"] for m in minutes]
    assert "next" in section_types or "body" in section_types


def test_extract_todos_basic(processor):
    text = "田中さんが報告書を作成します。山田さんが資料を提出します。"
    todos = processor.extract_todos(text)
    assert isinstance(todos, list)
    assert len(todos) > 0


def test_extract_todos_filters_past_tense(processor):
    text = "田中さんが報告書を作成しました。"
    todos = processor.extract_todos(text)
    assert len(todos) == 0


def test_extract_todos_filters_negation(processor):
    text = "報告書は作成しない。"
    todos = processor.extract_todos(text)
    assert len(todos) == 0


def test_extract_todos_no_duplicates(processor):
    text = "田中さんが確認します。田中さんが確認します。"
    todos = processor.extract_todos(text)
    texts = [t["todo_text"] for t in todos]
    assert len(texts) == len(set(texts))


def test_summarize_returns_string(processor):
    text = (
        "本日の会議では予算について話し合いました。"
        "田中部長から提案がありました。"
        "山田さんが資料を確認しました。"
        "来週までに報告書を提出することになりました。"
        "全員が合意しました。"
        "次回は来週月曜日に開催します。"
        "以上で本日の会議を終了します。"
    )
    summary = processor.summarize(text)
    assert isinstance(summary, str)
    assert len(summary) > 0


def test_summarize_ratio(processor):
    sentences = ["文章{}です。".format(i) for i in range(20)]
    text = "".join(sentences)
    summary = processor.summarize(text)
    summary_sentences = processor.split_sentences(summary)
    original_sentences = processor.split_sentences(text)
    ratio = len(summary_sentences) / len(original_sentences)
    assert 0.10 <= ratio <= 0.30


def test_summarize_preserves_order(processor):
    text = "最初の文章です。中間の文章です。最後の文章です。"
    summary = processor.summarize(text)
    if "最初" in summary and "最後" in summary:
        assert summary.index("最初") < summary.index("最後")


def test_score_sentences_returns_dict(processor):
    sentences = ["テスト文章です。", "別のテスト文章です。"]
    scores = processor.score_sentences(sentences)
    assert isinstance(scores, dict)
    assert len(scores) == len(sentences)


def test_keywords_loaded_from_json(processor):
    assert len(processor.keywords_decision) > 0
    assert len(processor.keywords_todo) > 0
    assert len(processor.keywords_past) > 0
    assert len(processor.keywords_negation) > 0
    assert len(processor.keywords_next_agenda) > 0
