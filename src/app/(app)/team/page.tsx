import { MailPlus, Trash2, UserMinus } from "lucide-react";
import {
  inviteMember,
  listTeam,
  removeMember,
  revokeInvite,
} from "@/lib/actions/businesses";
import type { Result } from "@/lib/result";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

export default async function TeamPage() {
  const res = await listTeam();
  if (!res.ok) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
        <PageHeader title="Team" description={res.error} />
      </div>
    );
  }
  const { businessName, activeRole, members, invites } = res.data;
  const canManage = activeRole === "OWNER";

  async function invite(_prev: Result<{ id: string }> | null, fd: FormData) {
    "use server";
    return inviteMember({ email: fd.get("email"), role: fd.get("role") });
  }
  async function revoke(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return revokeInvite(id);
  }
  async function remove(id: string, _prev: Result<null> | null, _fd: FormData) {
    "use server";
    return removeMember(id);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
      <PageHeader
        title="Team"
        description={`Members of ${businessName}.`}
      />

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Invite member</CardTitle>
            <CardDescription>
              They&apos;ll be added automatically on their first sign-in with this email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToastForm<{ id: string }>
              action={invite}
              successMessage="Invite created"
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="person@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="MEMBER">
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FormSubmitButton>
                <MailPlus className="size-4" />
                Invite
              </FormSubmitButton>
            </ToastForm>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>{members.length} active</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="px-4">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="px-4 font-medium">{m.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.role.toLowerCase()}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage ? (
                        <ToastForm<null>
                          action={remove.bind(null, m.id)}
                          successMessage="Member removed"
                        >
                          <Button variant="ghost" size="sm" type="submit">
                            <UserMinus className="size-3.5" />
                            Remove
                          </Button>
                        </ToastForm>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invites</CardTitle>
            <CardDescription>
              {invites.length === 0
                ? "No pending invites."
                : `${invites.length} waiting to be accepted`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {invites.length === 0 ? (
              <EmptyState
                icon={MailPlus}
                title="No pending invites"
                description="Invite a teammate above to get them started."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="px-4">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-32" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="px-4 font-medium">{i.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {i.role.toLowerCase()}
                        </TableCell>
                        <TableCell className="text-right">
                          <ToastForm<null>
                            action={revoke.bind(null, i.id)}
                            successMessage="Invite revoked"
                          >
                            <Button variant="ghost" size="sm" type="submit">
                              <Trash2 className="size-3.5" />
                              Revoke
                            </Button>
                          </ToastForm>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
