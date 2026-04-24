import { getBusinessProfile, upsertBusinessProfile } from "@/lib/actions/settings";
import type { Result } from "@/lib/result";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { FormSubmitButton } from "@/components/form-submit-button";
import { TemplatePicker } from "@/components/template-picker";
import { ToastForm } from "@/components/toast-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage() {
  const profile = await getBusinessProfile();

  async function save(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return upsertBusinessProfile({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      taxId: formData.get("taxId"),
      bankDetails: formData.get("bankDetails"),
      defaultCurrency: formData.get("defaultCurrency"),
      defaultTaxRate: Number(formData.get("defaultTaxRate")),
      invoicePrefix: formData.get("invoicePrefix"),
      defaultTemplate: formData.get("defaultTemplate"),
      addressLines: String(formData.get("addressLines") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader
        title="Settings"
        description="Business information shown on invoices and used as defaults."
      />
      <ToastForm<{ id: string }>
        action={save}
        successMessage="Settings saved"
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>Appears on every invoice you send.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field name="name" label="Business name" defaultValue={profile?.name} required />
            <Field name="email" label="Email" type="email" defaultValue={profile?.email} required />
            <Field name="phone" label="Phone" defaultValue={profile?.phone ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="addressLines">Address (one line per row)</Label>
              <Textarea
                id="addressLines"
                name="addressLines"
                rows={3}
                defaultValue={profile?.addressLines.join("\n") ?? ""}
              />
            </div>
            <Field name="taxId" label="Tax ID" defaultValue={profile?.taxId ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="bankDetails">Bank details</Label>
              <Textarea
                id="bankDetails"
                name="bankDetails"
                rows={3}
                defaultValue={profile?.bankDetails ?? ""}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice defaults</CardTitle>
            <CardDescription>Used when creating new invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field
                name="defaultCurrency"
                label="Currency"
                defaultValue={profile?.defaultCurrency ?? "USD"}
              />
              <Field
                name="defaultTaxRate"
                label="Tax rate (bps)"
                type="number"
                defaultValue={String(profile?.defaultTaxRate ?? 0)}
              />
              <Field
                name="invoicePrefix"
                label="Invoice prefix"
                defaultValue={profile?.invoicePrefix ?? "INV-"}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default template</CardTitle>
            <CardDescription>Used for new invoices. You can override per invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <TemplatePicker name="defaultTemplate" defaultValue={profile?.defaultTemplate ?? "CLASSIC"} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <FormSubmitButton>Save changes</FormSubmitButton>
        </div>
      </ToastForm>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
    </div>
  );
}
