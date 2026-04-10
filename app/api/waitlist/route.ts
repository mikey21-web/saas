import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const WAITLIST_FILE = path.join(process.cwd(), 'waitlist-emails.json');



export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    // Read or init
    let data: { email: string; date: string }[] = [];
    try {
      const raw = await fs.readFile(WAITLIST_FILE, 'utf-8');
      data = JSON.parse(raw);
    } catch { /* Nonexistent file is fine */ }
    // No duplicate emails
    const exists = data.some((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return NextResponse.json(
        { error: 'Already on waitlist!' },
        { status: 200 }
      );
    }
    // Add new record
    data.push({ email, date: new Date().toISOString() });
    await fs.writeFile(WAITLIST_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
