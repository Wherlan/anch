import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const validCurrent = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!validCurrent) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "SECURITY",
      title: "Password changed",
      body: "Your password was successfully updated.",
    },
  })

  return NextResponse.json({ success: true })
}
