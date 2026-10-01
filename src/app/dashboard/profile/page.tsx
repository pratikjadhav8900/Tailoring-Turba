export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      companyName: true,
      gstNumber: true,
      isB2BApproved: true,
    }
  });

  if (!user) {
    redirect("/login");
  }

  return <ProfileClient initialUser={user} />;
}
