import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buildPrefilledDoc } from "@/lib/actions/employee-docs";
import { getEmployee } from "@/lib/actions/employees";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/actions/_shared";
import { PageHeader } from "@/components/page-header";
import { EmployeeDocEditor } from "@/components/employee-doc-editor";
import type { DocType } from "@prisma/client";

const DOC_TYPES: DocType[] = [
  "OFFER_LETTER",
  "EMPLOYMENT_CONTRACT",
  "NDA",
  "RELIEVING_LETTER",
  "EXPERIENCE_LETTER",
  "SALARY_CERTIFICATE",
  "PROMOTION_LETTER",
  "WARNING_LETTER",
  "TERMINATION_LETTER",
  "PAYSLIP",
];

function isDocType(v: string | undefined): v is DocType {
  return !!v && (DOC_TYPES as string[]).includes(v);
}

export default async function GenerateDocPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;

  const employee = await getEmployee(id);
  if (!employee) notFound();

  if (!isDocType(type)) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6 lg:p-8">
        <PageHeader
          title="Generate document"
          description={`For ${employee.firstName} ${employee.lastName}`}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {DOC_TYPES.map((t) => (
            <Link
              key={t}
              href={`/employees/${id}/generate-doc?type=${t}`}
              className="rounded-lg border bg-card p-4 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              {t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <Link href={`/employees/${id}`} className="hover:underline">
            ← Back to employee
          </Link>
        </p>
      </div>
    );
  }

  const prefilled = await buildPrefilledDoc(id, type);
  if (!prefilled.ok) redirect(`/employees/${id}`);

  const { businessId } = await requireMembership();
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) redirect(`/employees/${id}`);

  return (
    <div className="mx-auto max-w-[90rem] space-y-6 p-6 lg:p-8">
      <PageHeader
        title={prefilled.data.title}
        description={`${employee.firstName} ${employee.lastName} · ${type.replace(/_/g, " ").toLowerCase()}`}
      />
      <EmployeeDocEditor
        employeeId={id}
        docType={type}
        initialTitle={prefilled.data.title}
        initialBody={prefilled.data.prefilledBody}
        isCustomTemplate={prefilled.data.isCustomTemplate}
        business={{
          name: business.name,
          addressLines: business.addressLines,
          email: business.email,
          logoUrl: business.logoUrl,
        }}
      />
      <p className="text-xs text-muted-foreground">
        <Link href={`/employees/${id}/generate-doc`} className="hover:underline">
          ← Choose a different document type
        </Link>
      </p>
    </div>
  );
}
