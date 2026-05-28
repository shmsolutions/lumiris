import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, ilike, isNull } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ArrowRightIcon, PatientsIcon, PlusIcon } from '@/components/dashboard/Icons';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { PatientSearch } from '@/components/patients/PatientSearch';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { patientSchema } from '@/models/Schema';

type PatientsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata(props: PatientsPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'PatientsPage' });
  return { title: t('meta_title') };
}

export default async function PatientsPage(props: PatientsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PatientsPage' });
  const tNav = await getTranslations({ locale, namespace: 'DashboardNav' });

  const { userId } = await auth();
  const { q } = await props.searchParams;
  const query = q?.trim() ?? '';

  const conditions = userId
    ? [eq(patientSchema.ownerId, userId), isNull(patientSchema.archivedAt)]
    : [];
  if (query) {
    conditions.push(ilike(patientSchema.fullName, `%${query}%`));
  }

  const patients = userId
    ? await db
        .select()
        .from(patientSchema)
        .where(and(...conditions))
        .orderBy(desc(patientSchema.updatedAt))
    : [];

  const isFiltering = query.length > 0;

  return (
    <>
      <TopBar
        breadcrumb={tNav('section_workspace')}
        title={t('title')}
        actions={
          <Link
            href="/dashboard/patients/new/"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            <PlusIcon size={14} />
            <span className="hidden sm:inline">{t('new_patient')}</span>
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          title={t('title')}
          description={t('description')}
          actions={
            <div className="flex items-center gap-2">
              <PatientSearch />
              <Link
                href="/dashboard/patients/new/"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand-500 px-3 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-sm transition hover:bg-brand-600"
              >
                <PlusIcon size={14} />
                {t('new_patient')}
              </Link>
            </div>
          }
        />

        <div className="mt-6">
          {patients.length === 0 ? (
            isFiltering ? (
              <EmptyState
                icon={<PatientsIcon />}
                title={t('search_empty_title', { query })}
                description={t('search_empty_description')}
              />
            ) : (
              <EmptyState
                icon={<PatientsIcon />}
                title={t('empty_title')}
                description={t('empty_description')}
                action={
                  <Link
                    href="/dashboard/patients/new/"
                    className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-sm transition hover:bg-brand-600"
                  >
                    <PlusIcon size={14} />
                    {t('new_patient')}
                  </Link>
                }
              />
            )
          ) : (
            <div className="overflow-hidden rounded-xl border border-ink-200 bg-surface-elevated">
              <div className="hidden border-b border-ink-200 bg-ink-50/60 px-5 py-3 text-[10px] font-semibold tracking-wider text-ink-500 uppercase sm:grid sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:gap-4">
                <span>{t('col_name')}</span>
                <span>{t('col_diagnosis')}</span>
                <span>{t('col_cid')}</span>
                <span className="text-right">{t('col_updated')}</span>
              </div>
              <ul className="divide-y divide-ink-200">
                {patients.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/patients/${p.id}/`}
                      className="grid items-center gap-2 px-5 py-4 transition hover:bg-ink-50 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 ring-1 ring-brand-200/70">
                          {p.fullName
                            .split(' ')
                            .slice(0, 2)
                            .map((s) => s[0]?.toUpperCase())
                            .join('')}
                        </span>
                        <span className="truncate text-sm font-semibold text-ink-900">
                          {p.fullName}
                        </span>
                      </div>
                      <span className="truncate text-sm text-ink-600">
                        {p.diagnosis ?? <span className="text-ink-400">—</span>}
                      </span>
                      <span className="truncate text-sm text-ink-600">
                        {p.cid ?? <span className="text-ink-400">—</span>}
                      </span>
                      <span className="flex items-center justify-end gap-3 text-xs text-ink-500">
                        {p.updatedAt.toLocaleDateString(locale)}
                        <ArrowRightIcon size={16} className="text-ink-400" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
