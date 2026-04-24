import { CalendarDays, Plus } from "lucide-react";
import {
  listTimeOffRequests,
  createTimeOffRequest,
  decideTimeOffRequest,
  cancelTimeOffRequest,
} from "@/lib/actions/time-off";
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

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
};

export default async function TimeOffPage() {
  const [requests, employees] = await Promise.all([
    listTimeOffRequests(),
    listEmployees(),
  ]);
  const activeEmployees = employees.filter((e) => e.status !== "TERMINATED");

  async function submit(_prev: Result<{ id: string }> | null, formData: FormData) {
    "use server";
    return createTimeOffRequest({
      employeeId: formData.get("employeeId"),
      type: formData.get("type") || "VACATION",
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      reason: formData.get("reason"),
    });
  }

  async function approve(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return decideTimeOffRequest(id, "APPROVED");
  }

  async function reject(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return decideTimeOffRequest(id, "REJECTED");
  }

  async function cancel(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return cancelTimeOffRequest(id);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader title="Time off" description="Requests, approvals, and balances." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Request time off</CardTitle>
            <CardDescription>Submit a new PTO request.</CardDescription>
          </CardHeader>
          <CardContent>
            <ToastForm<{ id: string }>
              className="space-y-4"
              action={submit}
              successMessage="Request submitted"
            >
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee</Label>
                <Select name="employeeId" required>
                  <SelectTrigger id="employeeId" className="w-full h-11">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.ptoBalanceDays}d left)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue="VACATION">
                  <SelectTrigger id="type" className="w-full h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VACATION">Vacation</SelectItem>
                    <SelectItem value="SICK">Sick</SelectItem>
                    <SelectItem value="PERSONAL">Personal</SelectItem>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea id="reason" name="reason" rows={2} />
              </div>
              <FormSubmitButton>
                <Plus className="size-4" />
                Submit request
              </FormSubmitButton>
            </ToastForm>
          </CardContent>
        </Card>

        <div>
          {requests.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No requests yet"
              description="Time-off requests will appear here for review."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="px-4">Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-right">Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-40" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-4 font-medium">
                        {r.employee.firstName} {r.employee.lastName}
                      </TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {r.startDate.toISOString().slice(0, 10)} →{" "}
                        {r.endDate.toISOString().slice(0, 10)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.days}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[r.status] ?? "secondary"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "PENDING" && (
                          <div className="flex justify-end gap-1">
                            <ToastForm<null>
                              action={approve.bind(null, r.id)}
                              successMessage="Approved"
                            >
                              <Button type="submit" variant="ghost" size="sm">
                                Approve
                              </Button>
                            </ToastForm>
                            <ToastForm<null>
                              action={reject.bind(null, r.id)}
                              successMessage="Rejected"
                            >
                              <Button type="submit" variant="ghost" size="sm">
                                Reject
                              </Button>
                            </ToastForm>
                            <ToastForm<null>
                              action={cancel.bind(null, r.id)}
                              successMessage="Cancelled"
                            >
                              <Button type="submit" variant="ghost" size="sm">
                                Cancel
                              </Button>
                            </ToastForm>
                          </div>
                        )}
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
