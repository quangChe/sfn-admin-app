import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title: string; productType?: string; imageUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, productType = "luxury bag", imageUrl } = body;
  if (!title) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    );
  }

  const prompt = `You are a pricing expert for pre-loved luxury goods.
Search for "${title}" (${productType}) on Vestiaire Collective, The RealReal, eBay sold listings, and Google Shopping.

Based on current market prices for this item in good pre-owned condition, provide a price range in USD.

Respond ONLY with a JSON object (no markdown, no explanation) in this exact format:
{"low": <number>, "mid": <number>, "high": <number>, "sources": ["<source1>", "<source2>"]}

Where low = lower end of market, mid = fair market value, high = premium condition price.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: imageUrl
            ? [
                {
                  type: "image",
                  source: { type: "url", url: imageUrl },
                },
                { type: "text", text: prompt },
              ]
            : [{ type: "text", text: prompt }],
        },
      ],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI price suggest error:", error);
    return NextResponse.json({
      low: 0,
      mid: 0,
      high: 0,
      sources: [],
      error: "Could not retrieve market prices",
    });
  }
}
