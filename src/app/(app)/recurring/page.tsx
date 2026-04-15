import { listSchedules, toggleSchedule } from "@/lib/actions/recurring";
import { Button } from "@/components/ui/button";

export default async function RecurringPage() {
  const schedules = await listSchedules();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Recurring invoices</h1>
      <p className="text-sm text-muted-foreground">
        Create schedules via the API; UI creation coming in a follow-up.
      </p>
      <div className="rounded border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3">Client</th>
              <th className="p-3">Cadence</th>
              <th className="p-3">Next run</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-3">{s.client.name}</td>
                <td className="p-3">{s.cadence} × {s.intervalCount}</td>
                <td className="p-3">{s.nextRunAt.toISOString().slice(0, 10)}</td>
                <td className="p-3">{s.active ? "Yes" : "No"}</td>
                <td className="p-3 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await toggleSchedule(s.id, !s.active);
                    }}
                  >
                    <Button size="sm" variant="ghost" type="submit">
                      {s.active ? "Pause" : "Resume"}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
