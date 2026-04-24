/**
 * Default bodies for employee documents.
 *
 * These are *starting scaffolds* intended to be reviewed and edited by the
 * user before issuance. They do not constitute legal advice and are not
 * tailored to any specific jurisdiction. Language that must be verified
 * with counsel is marked with `[REVIEW WITH COUNSEL: ...]`.
 *
 * Variables available at render-time (Mustache-style `{{ }}`):
 *   {{employee.firstName}} {{employee.lastName}} {{employee.fullName}}
 *   {{employee.email}} {{employee.title}} {{employee.department}}
 *   {{employee.startDate}} {{employee.endDate}}
 *   {{employee.salaryAmount}} {{employee.salaryCurrency}} {{employee.salaryFormatted}}
 *   {{employee.employmentType}}
 *   {{business.name}} {{business.address}} {{business.email}}
 *   {{today}}
 *   {{signatory.name}} {{signatory.title}}
 */

import type { DocType } from "@prisma/client";

export type DefaultTemplate = {
  title: string;
  body: string;
};

export const DEFAULT_TEMPLATES: Record<DocType, DefaultTemplate> = {
  OFFER_LETTER: {
    title: "Offer Letter",
    body: `{{today}}

{{employee.fullName}}
{{employee.email}}

Dear {{employee.firstName}},

We are pleased to offer you the position of {{employee.title}} at {{business.name}}, reporting to the {{employee.department}} team. This offer is effective from {{employee.startDate}}.

Compensation
Your annual compensation will be {{employee.salaryFormatted}}, payable in accordance with {{business.name}}'s standard payroll cycle. Your employment type is {{employee.employmentType}}.

Place of work
Your primary place of work will be as communicated separately. {{business.name}} reserves the right to update work location as business needs evolve.

Working hours & leave
You will be expected to adhere to the standard working hours of {{business.name}}. Leave entitlements will be governed by the company's leave policy as applicable from time to time.

Confidentiality & intellectual property
[REVIEW WITH COUNSEL: Insert confidentiality, IP assignment, and data-protection clauses appropriate to your jurisdiction and role. Typical items include: (a) all work product, inventions, and improvements developed during employment belong to the company; (b) confidential information must not be disclosed during or after employment; (c) pre-existing IP must be disclosed in writing.]

Probation & termination
[REVIEW WITH COUNSEL: Insert probation period, notice period, and grounds-for-termination clauses. These vary significantly by jurisdiction — e.g., at-will employment in the US, statutory notice in India/UK, just-cause requirements in parts of Europe.]

Acceptance
This offer is contingent on satisfactory reference checks and your right to work. Please indicate your acceptance by signing below and returning a copy on or before {{employee.startDate}}.

We look forward to welcoming you to the team.

Sincerely,

{{signatory.name}}
{{signatory.title}}
{{business.name}}

Accepted and agreed:


_____________________________
{{employee.fullName}}
Date: _______________`,
  },

  EMPLOYMENT_CONTRACT: {
    title: "Employment Contract",
    body: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into on {{today}} between {{business.name}} ("Company"), having its registered office at {{business.address}}, and {{employee.fullName}} ("Employee"), residing at [EDIT: employee address].

1. Position and duties
The Company employs the Employee as {{employee.title}} in the {{employee.department}} department, effective from {{employee.startDate}}. The Employee's duties shall include those customarily associated with the position and such other duties as reasonably assigned.

2. Compensation
The Company shall pay the Employee an annual compensation of {{employee.salaryFormatted}}, less applicable taxes and deductions, payable in accordance with the Company's standard payroll practices.

3. Benefits
[REVIEW WITH COUNSEL: Insert specific benefits: health insurance, retirement contributions, statutory funds (PF/ESI in India, 401(k) in US), leave entitlement, bonus eligibility.]

4. Confidentiality
The Employee agrees to hold in strict confidence all proprietary and confidential information of the Company during and after the term of employment. [REVIEW WITH COUNSEL: Specify duration, scope, and carve-outs for publicly available information.]

5. Intellectual property
[REVIEW WITH COUNSEL: Insert IP-assignment clause. Consider jurisdiction-specific requirements (e.g., California Labor Code §2870, India Copyright Act §17).]

6. Non-solicitation / non-compete
[REVIEW WITH COUNSEL: Non-compete clauses are unenforceable in California and restricted in India post-termination. Draft carefully or omit.]

7. Termination
[REVIEW WITH COUNSEL: Specify notice period for both sides, grounds for immediate termination, and any severance entitlement. Must comply with local employment statutes.]

8. Governing law
This Agreement shall be governed by and construed in accordance with the laws of [REVIEW WITH COUNSEL: specify jurisdiction]. Any disputes shall be resolved in the courts of [REVIEW WITH COUNSEL: specify venue].

9. Entire agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior negotiations.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For {{business.name}}:


_____________________________
{{signatory.name}}
{{signatory.title}}

Employee:


_____________________________
{{employee.fullName}}`,
  },

  NDA: {
    title: "Non-Disclosure Agreement",
    body: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is made on {{today}} between:

{{business.name}}, with its registered office at {{business.address}} ("Disclosing Party"),

and

{{employee.fullName}} ({{employee.email}}) ("Receiving Party").

1. Purpose
The Receiving Party acknowledges that, in connection with {{employee.employmentType}} engagement as {{employee.title}} commencing {{employee.startDate}}, the Disclosing Party may share Confidential Information.

2. Definition of Confidential Information
"Confidential Information" means all non-public information disclosed by the Disclosing Party, including but not limited to: trade secrets, business plans, financial data, customer lists, source code, product roadmaps, unreleased features, pricing, and personnel information.

3. Obligations
The Receiving Party shall:
(a) use the Confidential Information solely for the Purpose;
(b) protect it with the same degree of care it uses for its own confidential information, but no less than reasonable care;
(c) not disclose it to any third party without prior written consent;
(d) return or destroy all Confidential Information on termination of engagement or on the Disclosing Party's request.

4. Exclusions
Confidential Information does not include information that: (a) was publicly known at the time of disclosure; (b) becomes publicly known through no fault of the Receiving Party; (c) was lawfully received from a third party without restriction; (d) is required to be disclosed by law, provided prompt notice is given to the Disclosing Party.

5. Term
The obligations of confidentiality shall survive for [REVIEW WITH COUNSEL: typical range 2–5 years; perpetual for trade secrets] from the date of termination of engagement.

6. Remedies
The Receiving Party acknowledges that breach of this Agreement may cause irreparable harm and that the Disclosing Party shall be entitled to injunctive relief in addition to any other remedies.

7. Governing law
This Agreement is governed by the laws of [REVIEW WITH COUNSEL: specify jurisdiction].

Signed:

For {{business.name}}:


_____________________________
{{signatory.name}}
{{signatory.title}}

Receiving Party:


_____________________________
{{employee.fullName}}
Date: {{today}}`,
  },

  RELIEVING_LETTER: {
    title: "Relieving Letter",
    body: `{{today}}

{{employee.fullName}}
{{employee.email}}

Subject: Relieving letter

Dear {{employee.firstName}},

This is to confirm that you have been relieved from your duties as {{employee.title}} at {{business.name}} effective end of day on {{employee.endDate}}.

You joined {{business.name}} on {{employee.startDate}} and have served in the {{employee.department}} department. During your tenure, you have fulfilled your responsibilities diligently.

We acknowledge that you have:
- Completed all handover formalities to the best of our knowledge
- Settled all pending dues, reimbursements, and advances
- Returned all company property, access credentials, and confidential material

Your full and final settlement has been processed separately in accordance with company policy.

We thank you for your contributions to {{business.name}} and wish you the very best in your future endeavours.

For {{business.name}},


_____________________________
{{signatory.name}}
{{signatory.title}}`,
  },

  EXPERIENCE_LETTER: {
    title: "Experience Letter",
    body: `{{today}}

TO WHOMSOEVER IT MAY CONCERN

This is to certify that {{employee.fullName}} was employed with {{business.name}} from {{employee.startDate}} to {{employee.endDate}}.

During this period, {{employee.firstName}} held the position of {{employee.title}} in the {{employee.department}} department.

Throughout the tenure, {{employee.firstName}} demonstrated professionalism, commitment, and a strong work ethic. We found {{employee.firstName}} to be sincere, hardworking, and a valuable member of the team.

We wish {{employee.firstName}} all success in future endeavours.

For {{business.name}},


_____________________________
{{signatory.name}}
{{signatory.title}}
{{business.email}}`,
  },

  SALARY_CERTIFICATE: {
    title: "Salary Certificate",
    body: `{{today}}

TO WHOMSOEVER IT MAY CONCERN

This is to certify that {{employee.fullName}} is currently employed with {{business.name}} as {{employee.title}} in the {{employee.department}} department, with effect from {{employee.startDate}}.

The employee's current annual gross compensation is {{employee.salaryFormatted}}.

Employment type: {{employee.employmentType}}

This certificate is issued on the request of the employee for [REVIEW: specify purpose — e.g., visa, loan, rental — as provided by the employee].

For {{business.name}},


_____________________________
{{signatory.name}}
{{signatory.title}}
{{business.email}}`,
  },

  PROMOTION_LETTER: {
    title: "Promotion Letter",
    body: `{{today}}

{{employee.fullName}}
{{employee.email}}

Subject: Promotion and revised compensation

Dear {{employee.firstName}},

We are delighted to inform you that, in recognition of your contributions and performance, you are being promoted to the position of {{employee.title}} in the {{employee.department}} department, effective [EDIT: promotion effective date].

Your revised annual compensation will be {{employee.salaryFormatted}}, with all other terms of your employment remaining unchanged except as specifically amended here.

[EDIT: Add any new responsibilities, reporting line changes, or additional benefits associated with the new role.]

We thank you for your dedication and look forward to your continued contributions in this expanded role.

Congratulations on this well-deserved promotion.

For {{business.name}},


_____________________________
{{signatory.name}}
{{signatory.title}}`,
  },

  WARNING_LETTER: {
    title: "Warning Letter",
    body: `{{today}}

{{employee.fullName}}
{{employee.email}}

Subject: Formal warning

Dear {{employee.firstName}},

This letter serves as a formal warning regarding the following matter(s):

[EDIT: State the specific conduct or performance issue with dates and facts. Be objective and factual. Avoid characterisations.]

On [EDIT: date(s)], the following was observed: [EDIT: describe incident].

This conduct is inconsistent with the expectations set out in your role as {{employee.title}} and with the policies of {{business.name}}. Prior discussions regarding this matter were held on [EDIT: date(s)], if applicable.

Expected corrective action
You are expected to take the following steps immediately:
1. [EDIT: specify]
2. [EDIT: specify]

A follow-up review will be conducted on [EDIT: review date]. Continued issues of this nature may result in further disciplinary action up to and including termination of employment.

You are encouraged to discuss this letter with your manager or HR. You may submit a written response within [EDIT: typically 5–7] business days, which will be placed on file along with this letter.

[REVIEW WITH COUNSEL: Disciplinary procedures must follow any statutory requirements or internal policy. In some jurisdictions, progressive discipline steps (verbal → written → final → termination) are expected.]

For {{business.name}},


_____________________________
{{signatory.name}}
{{signatory.title}}

Acknowledged:


_____________________________
{{employee.fullName}}
Date: _______________`,
  },

  TERMINATION_LETTER: {
    title: "Termination Letter",
    body: `{{today}}

{{employee.fullName}}
{{employee.email}}

Subject: Termination of employment

Dear {{employee.firstName}},

We regret to inform you that your employment with {{business.name}} as {{employee.title}} will be terminated effective [EDIT: last working day].

[REVIEW WITH COUNSEL: State reason for termination concisely and consistently with prior documentation. Grounds and process must comply with local employment law — e.g., PIP documentation, notice requirements, cause vs. no-cause, redundancy vs. misconduct.]

Final settlement
Your full and final settlement, including [EDIT: pending salary, leave encashment, statutory dues, severance if applicable], will be processed within [EDIT: typically 30–45] days of your last working day and credited to your registered bank account.

Company property
You are required to return all company property in your possession on or before [EDIT: return date], including laptop, access cards, ID badges, confidential documents, and any other material belonging to {{business.name}}.

Ongoing obligations
Your obligations of confidentiality and any other post-employment restrictions under your employment agreement survive termination.

[REVIEW WITH COUNSEL: Reference specific clauses of the employment agreement. Include any required statutory notices.]

For queries, please contact [EDIT: HR contact name and email].

We thank you for your contributions and wish you well.

For {{business.name}},


_____________________________
{{signatory.name}}
{{signatory.title}}`,
  },

  PAYSLIP: {
    title: "Payslip",
    body: `PAYSLIP

{{business.name}}
{{business.address}}

Pay period: [EDIT: e.g., 01 Apr 2026 – 30 Apr 2026]
Pay date: {{today}}

Employee details
Name: {{employee.fullName}}
Employee ID: [EDIT]
Designation: {{employee.title}}
Department: {{employee.department}}
Date of joining: {{employee.startDate}}

Earnings
Basic salary:                [EDIT]
House rent allowance:        [EDIT]
Special allowance:            [EDIT]
Other allowances:             [EDIT]
-------------------------------------
Gross earnings:               [EDIT]

Deductions
Provident fund / 401(k):      [EDIT]
Tax deducted at source:       [EDIT]
Professional tax:             [EDIT]
Other deductions:             [EDIT]
-------------------------------------
Total deductions:             [EDIT]

Net pay:                      [EDIT]

Bank account: [EDIT: masked bank account]

[REVIEW WITH COUNSEL: Payslip format and mandatory fields vary by jurisdiction — e.g., India requires PF UAN, ESI number, statutory bonus disclosure; US requires FICA breakdown; UK requires NI number and tax code.]

This is a system-generated document and does not require a signature.`,
  },
};
