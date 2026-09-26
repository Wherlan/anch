import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(`${origin}/sign-in?verify=missing-token`)
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record || record.expires < new Date()) {
    return NextResponse.redirect(`${origin}/sign-in?verify=invalid-or-expired`)
  }

  await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: true },
  })

  await prisma.verificationToken.delete({ where: { token } })

  return NextResponse.redirect(`${origin}/sign-in?verify=success`)
}
