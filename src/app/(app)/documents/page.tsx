import { FileBox, Upload, Trash2 } from "lucide-react";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
} from "@/lib/actions/documents";
import { listEmployees } from "@/lib/actions/employees";
import type { Result } from "@/lib/result";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ToastForm } from "@/components/toast-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const [documents, employees] = await Promise.all([
    listDocuments(),
    listEmployees(),
  ]);

  async function upload(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return uploadDocument(formData);
  }

  async function remove(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return deleteDocument(id);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader title="Documents" description="Central vault for contracts, policies, and records." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Upload document</CardTitle>
            <CardDescription>PDF, Word, Excel, images. Max 20MB.</CardDescription>
          </CardHeader>
          <CardContent>
            <ToastForm<{ id: string }>
              className="space-y-4"
              action={upload}
              successMessage="Uploaded"
              encType="multipart/form-data"
            >
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="OTHER">
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="POLICY">Policy</SelectItem>
                    <SelectItem value="TAX">Tax</SelectItem>
                    <SelectItem value="ID">ID</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee (optional)</Label>
                <Select name="employeeId" defaultValue="">
                  <SelectTrigger id="employeeId" className="w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" name="file" type="file" required />
              </div>
              <FormSubmitButton>
                <Upload className="size-4" />
                Upload
              </FormSubmitButton>
            </ToastForm>
          </CardContent>
        </Card>

        <div>
          {documents.length === 0 ? (
            <EmptyState
              icon={FileBox}
              title="No documents yet"
              description="Upload a contract, policy, or record to get started."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="px-4">Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="px-4 font-medium">
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {d.title}
                        </a>
                        <div className="text-xs text-muted-foreground">{d.fileName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{d.category}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.employee
                          ? `${d.employee.firstName} ${d.employee.lastName}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {fmtSize(d.fileSize)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.createdAt.toISOString().slice(0, 10)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ToastForm<null>
                          action={remove.bind(null, d.id)}
                          successMessage="Deleted"
                        >
                          <Button type="submit" variant="ghost" size="sm">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </ToastForm>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
