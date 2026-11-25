import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const session = await auth();
  async function logout() {
    "use server";
    // Relative redirect, so a proxy's internal host (e.g. localhost:8080) can never leak into the Location header.
    await signOut({ redirect: false });
    redirect("/");
  }
  return <NavbarClient user={session?.user ? { name: session.user.name ?? session.user.email ?? "", role: session.user.role } : null} logout={logout} />;
}
