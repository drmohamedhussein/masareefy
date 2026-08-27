import { NextResponse } from "next/server";
import type { Expense } from "@/core/types";
import { normalizeTags } from "@/core/export";

export const runtime = "nodejs";

function notionHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };
}

function pageProperties(expense: Expense) {
  const tags = normalizeTags(expense.tags).map((name) => ({ name }));
  return {
    Name: {
      title: [{ text: { content: expense.itemName || "مصروف" } }],
    },
    Amount: { number: expense.amount },
    Date: { date: { start: expense.spentOn } },
    Tags: { multi_select: tags },
    Notes: {
      rich_text: expense.notes
        ? [{ text: { content: expense.notes.slice(0, 1900) } }]
        : [],
    },
    ExpenseId: {
      rich_text: [{ text: { content: expense.id } }],
    },
  };
}

async function listExisting(
  token: string,
  databaseId: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: notionHeaders(token),
        body: JSON.stringify({ start_cursor: cursor, page_size: 100 }),
      },
    );
    if (!response.ok) break;
    const data = (await response.json()) as {
      results: Array<{
        id: string;
        properties?: {
          ExpenseId?: { rich_text?: Array<{ plain_text?: string }> };
        };
      }>;
      next_cursor?: string | null;
      has_more?: boolean;
    };
    for (const page of data.results) {
      const expenseId = page.properties?.ExpenseId?.rich_text?.[0]?.plain_text;
      if (expenseId) map.set(expenseId, page.id);
    }
    cursor = data.has_more ? data.next_cursor ?? undefined : undefined;
  } while (cursor);
  return map;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      databaseId?: string;
      expenses?: Expense[];
      action?: "verify" | "sync";
    };

    if (!body.token || !body.databaseId) {
      return NextResponse.json({ error: "token و databaseId مطلوبان" }, { status: 400 });
    }

    if (body.action === "verify") {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${body.databaseId}`,
        { headers: notionHeaders(body.token) },
      );
      if (!response.ok) {
        return NextResponse.json(
          { error: "تعذر الوصول لقاعدة Notion" },
          { status: 400 },
        );
      }
      const data = (await response.json()) as {
        title?: Array<{ plain_text?: string }>;
      };
      const title =
        data.title?.map((t) => t.plain_text ?? "").join("") || "Notion DB";
      return NextResponse.json({ title });
    }

    const expenses = body.expenses ?? [];
    const existing = await listExisting(body.token, body.databaseId);

    for (const expense of expenses) {
      const props = pageProperties(expense);
      const pageId = existing.get(expense.id);
      if (pageId) {
        await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: "PATCH",
          headers: notionHeaders(body.token),
          body: JSON.stringify({ properties: props }),
        });
        existing.delete(expense.id);
      } else {
        await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: notionHeaders(body.token),
          body: JSON.stringify({
            parent: { database_id: body.databaseId },
            properties: props,
          }),
        });
      }
    }

    for (const pageId of existing.values()) {
      await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: "PATCH",
        headers: notionHeaders(body.token),
        body: JSON.stringify({ archived: true }),
      });
    }

    return NextResponse.json({ ok: true, count: expenses.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطأ غير متوقع" },
      { status: 500 },
    );
  }
}
