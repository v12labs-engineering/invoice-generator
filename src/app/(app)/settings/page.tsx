import { getBusinessProfile, upsertBusinessProfile } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function SettingsPage() {
  const profile = await getBusinessProfile();

  async function save(formData: FormData) {
    "use server";
    const input = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      taxId: formData.get("taxId"),
      bankDetails: formData.get("bankDetails"),
      defaultCurrency: formData.get("defaultCurrency"),
      defaultTaxRate: Number(formData.get("defaultTaxRate")),
      invoicePrefix: formData.get("invoicePrefix"),
      addressLines: String(formData.get("addressLines") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    await upsertBusinessProfile(input);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <form action={save} className="space-y-4">
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
        <div className="grid grid-cols-3 gap-4">
          <Field
            name="defaultCurrency"
            label="Currency"
            defaultValue={profile?.defaultCurrency ?? "USD"}
          />
          <Field
            name="defaultTaxRate"
            label="Tax rate (basis points)"
            type="number"
            defaultValue={String(profile?.defaultTaxRate ?? 0)}
          />
          <Field
            name="invoicePrefix"
            label="Invoice prefix"
            defaultValue={profile?.invoicePrefix ?? "INV-"}
          />
        </div>
        <Button type="submit">Save</Button>
      </form>
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
