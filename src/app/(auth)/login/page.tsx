import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession(await headers());

  if (session) {
    redirect(params.callbackUrl ?? "/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">SFN Admin</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your Google account to continue.
          </p>
        </div>

        {params.error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Sign-in failed. Please try again.
          </div>
        )}

        <GoogleSignInButton callbackUrl={params.callbackUrl ?? "/"} />
      </div>
    </div>
  );
}
