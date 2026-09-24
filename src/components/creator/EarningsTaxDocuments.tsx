import { useState, type ReactNode } from 'react';
import {
  Calendar,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Info,
  Lightbulb,
  MoreVertical,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CREATOR_TAX_DOCS_DEMO_METRICS,
  CREATOR_TAX_DOCS_DEMO_ROWS,
  CREATOR_TAX_DOCS_DEMO_YEAR,
  CREATOR_TAX_SEASON_TIPS,
  isCreatorTaxDocsDemoId,
  type DemoTaxDoc,
} from '@/lib/creatorTaxDocsDemo';
import { kpiIconTone, resultPillTone } from '@/lib/kpiIconTones';
import { cn } from '@/lib/utils';

function demoActionToast(action: string) {
  toast.message(action, {
    description: 'Sample preview — connect real tax data to use this action.',
  });
}

export function EarningsTaxDocumentsPanel({
  useDemo,
  beforeContent,
}: {
  useDemo: boolean;
  beforeContent?: ReactNode;
}) {
  const [year, setYear] = useState(String(CREATOR_TAX_DOCS_DEMO_YEAR));

  const metrics = useDemo
    ? CREATOR_TAX_DOCS_DEMO_METRICS
    : {
        documentsAvailable: 0,
        documentsDelta: null as number | null,
        taxYear: Number(year) || CREATOR_TAX_DOCS_DEMO_YEAR,
        taxYearRangeLabel: `Jan 1, ${year} – Dec 31, ${year}`,
        taxFormOnFile: '—',
        taxStatus: null as string | null,
        addressLine: 'Not on file',
        addressCity: '',
      };

  const rows: DemoTaxDoc[] = useDemo ? CREATOR_TAX_DOCS_DEMO_ROWS : [];

  return (
    <div id="tax-docs" className="scroll-mt-24 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-heading font-bold tracking-tight text-foreground md:text-heading-lg">
            Tax Documents
          </h1>
          <p className="mt-1.5 text-support text-muted-foreground">
            Access and download your tax documents for reporting purposes.
          </p>
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="h-10 w-[8.5rem] rounded-xl border-border bg-card text-sm font-semibold shadow-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {beforeContent}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                kpiIconTone.violet,
              )}
            >
              <FileText className="h-5 w-5" aria-hidden />
            </span>
            {metrics.documentsDelta != null ? (
              <div className="flex flex-col items-end gap-0.5">
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  ↑ {metrics.documentsDelta}%
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">
                  vs. last year
                </span>
              </div>
            ) : null}
          </div>
          <p className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-3xl">
            {metrics.documentsAvailable}
          </p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Documents available</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="mb-3">
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                kpiIconTone.violet,
              )}
            >
              <Calendar className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <p className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-3xl">
            {metrics.taxYear}
          </p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Current tax year</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {metrics.taxYearRangeLabel}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                kpiIconTone.sky,
              )}
            >
              <Download className="h-5 w-5" aria-hidden />
            </span>
            {metrics.taxStatus ? (
              <span
                className={cn(
                  'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold',
                  resultPillTone.published,
                )}
              >
                {metrics.taxStatus}
              </span>
            ) : null}
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {metrics.taxFormOnFile}
          </p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Tax form on file</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-8">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4">
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Your Tax Documents
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Download your tax forms and annual statements.
              </p>
            </div>

            {rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No tax documents available yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Document</th>
                      <th className="py-2 pr-3">Tax year</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Date issued</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-2">Actions</th>
                      <th className="py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((doc) => (
                      <tr key={doc.id} className="border-b border-border/70 last:border-0">
                        <td className="py-3.5 pr-3 font-semibold text-foreground">{doc.name}</td>
                        <td className="py-3.5 pr-3 tabular-nums text-muted-foreground">
                          {doc.taxYear}
                        </td>
                        <td className="max-w-[14rem] truncate py-3.5 pr-3 text-muted-foreground">
                          {doc.type}
                        </td>
                        <td className="whitespace-nowrap py-3.5 pr-3 text-muted-foreground">
                          {doc.issuedLabel}
                        </td>
                        <td className="py-3.5 pr-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold capitalize',
                              doc.status === 'available'
                                ? resultPillTone.published
                                : resultPillTone.pending,
                            )}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2">
                          <button
                            type="button"
                            className="text-sm font-bold text-primary hover:underline"
                            onClick={() => {
                              if (isCreatorTaxDocsDemoId(doc.id) || useDemo) {
                                demoActionToast(`Download ${doc.name}`);
                                return;
                              }
                              toast.message('Download started');
                            }}
                          >
                            Download
                          </button>
                        </td>
                        <td className="py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                aria-label={`More actions for ${doc.name}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => demoActionToast(`View ${doc.name}`)}
                              >
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => demoActionToast(`Email ${doc.name}`)}
                              >
                                Email copy
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3.5 text-sky-950 dark:text-sky-100">
              <Info
                className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm font-extrabold">Important Information</p>
                <p className="mt-1 text-sm leading-relaxed text-sky-900/80 dark:text-sky-100/80">
                  Tax documents are generated based on your earnings and applicable tax
                  regulations. If you have questions about your tax forms, contact support or
                  consult a qualified tax professional.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4 xl:col-span-4">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-start gap-3">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  kpiIconTone.violet,
                )}
              >
                <Settings2 className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Tax Information
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Manage your tax information and withholding details.
                </p>
              </div>
            </div>
            <ul className="divide-y divide-border border-y border-border">
              <li>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm"
                  onClick={() => demoActionToast('Tax form')}
                >
                  <span className="text-muted-foreground">Tax form</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    {metrics.taxFormOnFile}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm"
                  onClick={() => demoActionToast('Tax status')}
                >
                  <span className="text-muted-foreground">Tax status</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    {metrics.taxStatus ?? '—'}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm"
                  onClick={() => demoActionToast('Address')}
                >
                  <span className="shrink-0 text-muted-foreground">Address</span>
                  <span className="inline-flex items-center gap-1 text-right font-semibold text-foreground">
                    <span>
                      {metrics.addressLine}
                      {metrics.addressCity ? (
                        <>
                          <br />
                          {metrics.addressCity}
                        </>
                      ) : null}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </span>
                </button>
              </li>
            </ul>
            <Button
              type="button"
              variant="secondary"
              className="mt-4 min-h-11 w-full rounded-xl bg-violet-500/10 text-violet-800 hover:bg-violet-500/15 dark:text-violet-200"
              onClick={() => demoActionToast('Update Tax Information')}
            >
              Update Tax Information
            </Button>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-start gap-3">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  kpiIconTone.sky,
                )}
              >
                <HelpCircle className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Need Help?
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Visit our Help Center for more information about tax documents and reporting.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full rounded-xl"
              onClick={() => demoActionToast('View Help Center')}
            >
              View Help Center
              <ExternalLink className="ml-1.5 h-4 w-4" aria-hidden />
            </Button>
          </section>

          <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
              <Lightbulb className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
              Tips for Tax Season
            </h2>
            <ul className="space-y-2.5">
              {CREATOR_TAX_SEASON_TIPS.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
