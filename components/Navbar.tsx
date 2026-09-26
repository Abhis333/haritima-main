import { auth, signOut } from "@/lib/auth";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const session = await auth();
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }
  return <NavbarClient user={session?.user ? { name: session.user.name ?? session.user.email ?? "", role: session.user.role } : null} logout={logout} />;
}
