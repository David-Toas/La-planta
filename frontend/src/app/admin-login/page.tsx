import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
  redirect(`${adminUrl}/login`);
}
