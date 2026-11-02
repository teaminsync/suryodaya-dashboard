import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "../actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getInstagramTokenStatus } from "@/lib/internal-api";
import { shouldShowBanner, bannerText } from "@/lib/instagram-token";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let instagramStatus = null;
  try {
    instagramStatus = await getInstagramTokenStatus();
  } catch {
    // Ignore fetch errors for banner display
  }

  const showBanner = shouldShowBanner(instagramStatus);
  const bannerMessage = showBanner && instagramStatus ? bannerText(instagramStatus) : "";
  const bannerColor = instagramStatus?.level === "expired" || instagramStatus?.level === "critical" ? "bg-red-100 border-red-300 text-red-900" : "bg-amber-100 border-amber-300 text-amber-900";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold">Suryodaya Ops Dashboard</h1>
          <nav className="flex gap-4">
            <Link href="/" className="text-sm text-gray-700 hover:text-blue-600">
              Enquiries
            </Link>
            <Link href="/surveys" className="text-sm text-gray-700 hover:text-blue-600">
              Surveys
            </Link>
            <Link href="/settings" className="text-sm text-gray-700 hover:text-blue-600">
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </header>
      {showBanner && (
        <div className={`px-6 py-3 border-b ${bannerColor}`}>
          <p className="text-sm">
            {bannerMessage}{" "}
            <Link href="/settings" className="underline font-medium">
              Go to Settings
            </Link>
          </p>
        </div>
      )}
      <main className="p-6">{children}</main>
    </div>
  );
}
