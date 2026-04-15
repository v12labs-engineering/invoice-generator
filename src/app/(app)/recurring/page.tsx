import { Pause, Play, Repeat } from "lucide-react";
import { listSchedules, toggleSchedule } from "@/lib/actions/recurring";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function RecurringPage() {
  const schedules = await listSchedules();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Recurring invoices"
        description="Schedules that automatically generate invoices on a cadence."
      />

      {schedules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring schedules"
          description="Create schedules via the API. A UI creator is coming soon."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4">Client</TableHead>
                <TableHead>Cadence</TableHead>
                <TableHead>Next run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="px-4 font-medium">{s.client.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.cadence} × {s.intervalCount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.nextRunAt.toISOString().slice(0, 10)}
                  </TableCell>
                  <TableCell>
                    {s.active ? (
                      <Badge
                        variant="outline"
                        className="border-green-500/30 bg-green-500/15 text-green-700 dark:text-green-400"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Paused</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <form
                      action={async () => {
                        "use server";
                        await toggleSchedule(s.id, !s.active);
                      }}
                    >
                      <Button size="sm" variant="ghost" type="submit">
                        {s.active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                        {s.active ? "Pause" : "Resume"}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
