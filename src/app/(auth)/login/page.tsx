import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        action={async (formData) => {
          "use server";
          await signIn("resend", formData);
        }}
        className="w-full max-w-sm space-y-4 rounded-lg border p-8"
      >
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <Button type="submit" className="w-full">
          Send magic link
        </Button>
      </form>
    </div>
  );
}
