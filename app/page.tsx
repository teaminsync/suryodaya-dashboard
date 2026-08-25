import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Suryodaya Ops Dashboard</CardTitle>
          <CardDescription>
            Welcome to the admin operations dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <strong>Logged in as:</strong> {user.email}
            </p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
