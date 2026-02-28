import { NextResponse } from "next/server";
import { getBookMeta } from "@/lib/content";
import type { BookId } from "@/types/exercise";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  const meta = getBookMeta(bookId as BookId);

  if (!meta) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json(meta);
}
