import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (userId) {
    // Return specific user by ID
    const user = db.select().from(users).where(eq(users.id, parseInt(userId, 10))).get();
    return NextResponse.json(user ?? null);
  }

  // Return all users (for profile switcher)
  const allUsers = db.select().from(users).all();
  return NextResponse.json(allUsers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, avatar = "bear" } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  db.insert(users).values({ name: name.trim(), avatar }).run();
  const created = db.select().from(users).all().at(-1);
  return NextResponse.json(created);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  db.update(users).set(updates).where(eq(users.id, id)).run();
  const updated = db.select().from(users).where(eq(users.id, id)).get();
  return NextResponse.json(updated);
}
