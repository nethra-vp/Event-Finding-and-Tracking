import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDatabase } from '@/lib/mongodb'

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown; name?: unknown }
  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Send a valid JSON body.' } }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !name) {
    return NextResponse.json({ error: { code: 'INVALID_REGISTRATION', message: 'Name, valid email, and an 8-character password are required.' } }, { status: 400 })
  }

  try {
    const database = await getDatabase()
    const users = database.collection('users')
    await users.createIndex({ email: 1 }, { unique: true })
    const existing = await users.findOne({ email })
    if (existing) return NextResponse.json({ error: { code: 'EMAIL_EXISTS', message: 'Unable to create this account.' } }, { status: 409 })
    const result = await users.insertOne({ email, name, passwordHash: await bcrypt.hash(password, 12), createdAt: new Date() })
    return NextResponse.json({ data: { id: result.insertedId.toString(), email, name } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Registration is unavailable.' } }, { status: 503 })
  }
}