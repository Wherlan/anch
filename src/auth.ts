import NextAuth from "next-auth"
import { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

class UserNotFoundError extends CredentialsSignin {
  code = "user_not_found"
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const emailInput = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!emailInput || !password) return null
        const email = emailInput.trim().toLowerCase()

        const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
        const userAgent = request.headers.get("user-agent")

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) throw new UserNotFoundError()

        const validPassword = await bcrypt.compare(password, user.passwordHash)

        // Log every attempt against this user, success or failure — this is
        // what powers the "recent login activity" security view.
        await prisma.loginActivity.create({
          data: { userId: user.id, ipAddress, userAgent, success: validPassword },
        })

        if (!validPassword) return null

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },
})
