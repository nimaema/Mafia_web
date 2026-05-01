import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { verifyPassword } from "./lib/password"
import { prisma } from "./lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 12 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || "",
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
      const email = user.email || (profile as { email?: string } | undefined)?.email;

      if (email) {
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser?.isBanned) {
          throw new Error("حساب کاربری شما مسدود شده است");
        }

        if (account?.provider === "google" && dbUser) {
          const googleImage =
            user.image ||
            (profile as { picture?: string; image?: string } | undefined)?.picture ||
            (profile as { picture?: string; image?: string } | undefined)?.image;

          if (!dbUser.emailVerified) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { emailVerified: new Date() },
            });
          }

          if (googleImage && googleImage !== dbUser.image) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: googleImage },
            });
            user.image = googleImage;
          }
        } else if (account?.provider === "credentials" && dbUser && !dbUser.emailVerified) {
          return "/auth/verify-email";
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role
        token.name = user.name
        token.email = user.email
        token.picture = user.image || token.picture
      }

      if (token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              name: true,
              email: true,
              image: true,
              role: true,
            },
          })
          if (dbUser) {
            token.name = dbUser.name
            token.email = dbUser.email
            token.picture = dbUser.image || undefined
            token.role = dbUser.role
          }
        } catch (error) {
          console.error("Failed to refresh auth token user:", error)
        }
      } else if (trigger === "update" && session?.user) {
        token.name = session.user.name
        token.email = session.user.email
        token.picture = session.user.image || token.picture
        if (session.user.role) token.role = session.user.role
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
      if (session.user && token.picture) {
        session.user.image = token.picture as string
      }
      return session
    }
  },
  events: {
    async createUser({ user }) {
      if (user.email) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    },
  }
})
