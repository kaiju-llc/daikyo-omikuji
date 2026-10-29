import { NextResponse } from "next/server"

import Anthropic from "@anthropic-ai/sdk"
const MODEL = process.env.ANTHROPIC_OMIKUJI_MODEL ?? "claude-haiku-5-5"

interface GenerateRequest {
  boxName?: string
  boxShortName?: string
  fortuneTitle?: string
  fortuneDescription?: string
  fortuneLevel?: number
  lossAmount?: number
}

interface AiOmikujiMessages {
  dangerKeyword: string
  oracle: string
  luckyItem: string
}

function normalizeMessages(value: unknown): AiOmikujiMessages | null {
  if (!value || typeof value !== "object") return null

  const dangerKeyword = (value as { dangerKeyword?: unknown }).dangerKeyword
  const oracle = (value as { oracle?: unknown }).oracle
  const luckyItem = (value as { luckyItem?: unknown }).luckyItem

  if (typeof dangerKeyword !== "string" || typeof oracle !== "string" || typeof luckyItem !== "string") {
    return null
  }

  return {
    dangerKeyword: dangerKeyword.trim().slice(0, 24),
    oracle: oracle.trim().slice(0, 420),
    luckyItem: luckyItem.trim().slice(0, 24),
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 })
  }

  const body = (await request.json()) as GenerateRequest
  const boxName = body.boxName ?? "おみくじ箱"
  const boxShortName = body.boxShortName ?? boxName
  const lossAmount = body.lossAmount ?? 0

  const prompt = `大凶おみくじアプリの結果ページに表示する文言を生成してください。

前提:
- このアプリはギャンブルに行かないきっかけ作りのセルフヘルプコンテンツです。
- ユーザーを責めず、少し笑えるが、最終的には「今日は距離を置こう」と思える文にしてください。
- 医療・治療・診断を名乗らないでください。
- 出力は必ずJSONだけにしてください。
- 毎回違いが出るように、定型文を避けてください。
- oracleは、下記の【お告げ生成プロンプト】だけに従って作成してください。
- oracleでは、おみくじ結果の名称、説明、レベル、運勢名称には絶対に触れないでください。
- ラッキーアイテムは飲み物・本に偏らないでください。
- ラッキーアイテムは、持ち物、行動のきっかけ、家にある小物、外出を避ける道具、スマホ設定、衣類、文具、財布まわり、休息グッズなどから幅広く選んでください。
- ラッキーアイテムにギャンブルを連想させるもの、購入を促すもの、高額なものは出さないでください。

選択された箱: ${boxName}
箱の短い名前: ${boxShortName}
本日の想定負け金額: ${lossAmount}円

【お告げ生成プロンプト】
あなたは「賭内神社（かけないじんじゃ）」の神託を授ける存在である。

参拝者へ向けて、おみくじの結果とは無関係な「お告げ」を作成すること。

【世界観】
・和風
・神社のお告げ
・高級感
・厳かな雰囲気
・少し不吉
・少しユーモア
・神秘的
・読みやすく、現実感のある内容

【目的】
・参拝者が「今日は賭け事をやめておこう」と思える内容にする
・賭け事をしない選択を、前向きで賢い判断として伝える
・賭け事を続ける危険性を、説教ではなく静かに気づかせる
・お金だけでなく、時間、家族、信用、未来、心の余裕の大切さを想起させる
・読後に、賭け事から離れることが自分を守る行動だと感じさせる
・「今日は外に勝ちを探しに行く日ではなく、家で静かに過ごす日である」と感じさせる

【内容方針】
・賭け事は避けた方がよいというニュアンスを必ず含める
・「本日は賭け事に向かう流れが悪い」「何を選んでも噛み合いにくい一日である」という方向性を入れる
・賭け事をやめる、行かない、入金しない、アプリを開かない、予想しない等の行動を自然に後押しする
・家で大人しく過ごすこと、財布を開かないこと、予定を入れず静かに過ごすことを肯定的に描く
・賭け事をすると、お金、時間、家族との空気、信用、心の余裕を失う可能性があることを暗示する
・目先の利益よりも、平穏な一日を守ることが大切であると示唆する
・強い命令口調や説教は避ける
・ただし、賭け事を控えるべきという結論はぼかしすぎない
・読者が「今日はやめる理由をもらえた」と感じる内容にする

【文体】
・詩的すぎず、わかりやすい文章
・少しだけ情景描写を入れる
・比喩は短く、意味が伝わりやすいものにする
・神託らしい厳かな雰囲気を持たせる
・静かに忠告するような文章にする
・説教臭くしない
・毎回異なる切り口にする
・少し不吉だが、最後は「今日はやめておけばよい」と安心できる余韻にする

【口調】
・文末は「である」「のである」「であろう」を中心に統一する
・「じゃ」「おぬし」「〜がよい」「〜してはならぬ」は使用しない
・厳かな神託文のような口調にする
・古風すぎず読みやすくする

【文章ルール】
・200〜300文字程度
・二段落構成
・毎回内容を変える
・同じ表現を繰り返さない
・おみくじ結果の名称には触れない
・神託本文のみをoracleに入れる

【禁止事項】
・人格否定
・脅迫
・絶望的な表現
・暴力表現
・宗教勧誘
・運勢結果への言及
・大吉、大凶、中吉などの運勢名称への言及
・おみくじ結果との関連付け
・過度なスピリチュアル表現
・AIであることへの言及

生成するJSON:
{
  "dangerKeyword": "今日避けたい危険キーワード。12文字以内。ギャンブル種別に合う言葉。",
  "oracle": "【お告げ生成プロンプト】だけに従った神託本文。200〜300文字程度。二段落構成。おみくじ結果には一切触れない。",
  "luckyItem": "今日のラッキーアイテム。12文字以内。飲み物と本以外を優先し、具体的で身近なもの。"
}`

  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            dangerKeyword: { type: "string" },
            oracle: { type: "string" },
            luckyItem: { type: "string" },
          },
          required: ["dangerKeyword", "oracle", "luckyItem"],
        },
      },
    },
    messages: [{ role: "user", content: prompt }],
  })

  if (message.stop_reason === "refusal") {
    return NextResponse.json({ error: "Claude refused" }, { status: 502 })
  }

  const textBlock = message.content.find((block) => block.type === "text")
  const outputText = textBlock?.type === "text" ? textBlock.text : ""
  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(outputText)
  } catch {
    return NextResponse.json({ error: "Claude response was not JSON" }, { status: 502 })
  }

  const parsed = normalizeMessages(parsedJson)

  if (!parsed) {
    return NextResponse.json({ error: "Invalid Claude response" }, { status: 502 })
  }

  return NextResponse.json(parsed)
}
