import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployee } from "@/lib/actions/employees";
import { getEmployeeDocForEdit } from "@/lib/actions/employee-docs";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/actions/_shared";
import { PageHeader } from "@/components/page-header";
import { EmployeeDocEditor } from "@/components/employee-doc-editor";

export default async function EditEmployeeDocPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;

  const [employee, doc] = await Promise.all([
    getEmployee(id),
    getEmployeeDocForEdit(docId),
  ]);
  if (!employee) notFound();
  if (!doc || doc.employeeId !== id) notFound();

  const { businessId } = await requireMembership();
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) notFound();

  return (
    <div className="mx-auto max-w-[90rem] space-y-6 p-6 lg:p-8">
      <PageHeader
        title={doc.title}
        description={`${employee.firstName} ${employee.lastName} · ${doc.docType.replace(/_/g, " ").toLowerCase()}`}
      />
      <EmployeeDocEditor
        employeeId={id}
        docType={doc.docType}
        initialTitle={doc.title}
        initialBody={doc.body}
        isCustomTemplate={false}
        editingDocId={doc.id}
        business={{
          name: business.name,
          addressLines: business.addressLines,
          email: business.email,
          logoUrl: business.logoUrl,
        }}
      />
      <p className="text-xs text-muted-foreground">
        <Link href={`/employees/${id}`} className="hover:underline">
          ← Back to employee
        </Link>
      </p>
    </div>
  );
}
