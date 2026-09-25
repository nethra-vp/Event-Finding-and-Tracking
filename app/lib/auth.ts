import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getDatabase } from '@/lib/mongodb'

export const { handlers, auth } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') return null
        const database = await getDatabase()
        const user = await database.collection<{ _id: string; email: string; name: string; passwordHash: string }>('users').findOne({ email: credentials.email.toLowerCase().trim() })
        if (!user || !(await bcrypt.compare(credentials.password, user.passwordHash))) return null
        return { id: user._id.toString(), email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.userId = user.id
      return token
    },
    session({ session, token }) {
      if (session.user && token.userId) session.user.id = token.userId as string
      return session
    },
  },
})