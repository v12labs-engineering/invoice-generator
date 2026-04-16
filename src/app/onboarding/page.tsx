import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import type { Result } from "@/lib/result";
import { listMyBusinesses } from "@/lib/actions/_shared";
import { createBusiness } from "@/lib/actions/businesses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ToastForm } from "@/components/toast-form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const params = await searchParams;
  const memberships = await listMyBusinesses();
  if (memberships.length > 0 && params.new !== "1") redirect("/dashboard");

  async function create(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    const res = await createBusiness({
      name: formData.get("name"),
      email: formData.get("email"),
      defaultCurrency: formData.get("defaultCurrency"),
    });
    if (res.ok) redirect("/dashboard");
    return res;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Receipt className="size-5" />
          </div>
          <CardTitle>Create your business</CardTitle>
          <CardDescription>
            One more step. Invoices and clients are scoped per business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToastForm<{ id: string }>
            action={create}
            successMessage="Business created"
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Business name</Label>
              <Input id="name" name="name" required placeholder="Acme Inc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Business email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default currency</Label>
              <Input
                id="defaultCurrency"
                name="defaultCurrency"
                defaultValue="USD"
                maxLength={3}
              />
            </div>
            <FormSubmitButton className="w-full">Create business</FormSubmitButton>
          </ToastForm>
        </CardContent>
      </Card>
    </div>
  );
}
