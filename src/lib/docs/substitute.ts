import { formatMoney } from "@/lib/money";

export type DocContext = {
  employee: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    title: string;
    department: string;
    employmentType: string;
    startDate: string;
    endDate: string;
    salaryAmount: string;
    salaryCurrency: string;
    salaryFormatted: string;
  };
  business: {
    name: string;
    address: string;
    email: string;
  };
  signatory: {
    name: string;
    title: string;
  };
  today: string;
};

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function buildDocContext(args: {
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    title: string | null;
    department: string | null;
    employmentType: string;
    startDate: Date;
    endDate: Date | null;
    salaryAmount: number | null;
    salaryCurrency: string;
  };
  business: {
    name: string;
    addressLines: string[];
    email: string;
  };
  signatory: { name: string; title: string };
}): DocContext {
  const { employee, business, signatory } = args;
  const fullName = `${employee.firstName} ${employee.lastName}`.trim();
  return {
    employee: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName,
      email: employee.email,
      title: employee.title ?? "",
      department: employee.department ?? "",
      employmentType: employee.employmentType.replace("_", "-").toLowerCase(),
      startDate: fmtDate(employee.startDate),
      endDate: fmtDate(employee.endDate),
      salaryAmount: employee.salaryAmount != null ? String(employee.salaryAmount) : "",
      salaryCurrency: employee.salaryCurrency,
      salaryFormatted:
        employee.salaryAmount != null
          ? formatMoney(employee.salaryAmount, employee.salaryCurrency)
          : "—",
    },
    business: {
      name: business.name,
      address: business.addressLines.filter(Boolean).join(", "),
      email: business.email,
    },
    signatory,
    today: fmtDate(new Date()),
  };
}

/** Replace `{{path.to.value}}` with values from ctx. Unknown keys left as-is. */
export function substituteTemplate(body: string, ctx: DocContext): string {
  return body.replace(/\{\{\s*([a-zA-Z_][\w.]*)\s*\}\}/g, (match, path: string) => {
    const parts = path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cur: any = ctx;
    for (const p of parts) {
      if (cur == null) return match;
      cur = cur[p];
    }
    if (cur == null) return match;
    return String(cur);
  });
}
