import { CsvImport } from "@/components/csv-import";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ImportExpensesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Import expenses"
        description="Upload a CSV file to bulk-import expenses."
      />
      <Card>
        <CardHeader>
          <CardTitle>CSV import</CardTitle>
          <CardDescription>
            Map your CSV columns to expense fields and preview before importing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CsvImport />
        </CardContent>
      </Card>
    </div>
  );
}
