import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { verifyPassword } from "./lib/password"
import { prisma } from "./lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password_hash) return null
        if (user.isBanned) throw new Error("حساب کاربری شما مسدود شده است")

        const isValid = await verifyPassword(credentials.password as string, user.password_hash)

        if (isValid) {
          return user
        }

        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (user.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser?.isBanned) {
          throw new Error("حساب کاربری شما مسدود شده است");
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role
        token.name = user.name
        token.email = user.email
      }
      
      // Handle session updates
      if (trigger === "update") {
        if (session?.user) {
          token.name = session.user.name
          token.email = session.user.email
          if (session.user.role) token.role = session.user.role
        } else if (token.sub) {
          // Fallback: re-fetch from database to ensure fresh data
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub }
          })
          if (dbUser) {
            token.name = dbUser.name
            token.email = dbUser.email
            token.role = dbUser.role
          }
        }
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      if (session.user && token.role) {
        session.user.role = token.role as string
      }
      if (session.user && token.name) {
        session.user.name = token.name as string
      }
      if (session.user && token.email) {
        session.user.email = token.email as string
      }
      return session
    }
  }
})
