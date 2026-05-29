import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PlusIcon } from '@/components/dashboard/Icons';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { DeleteTemplateButton } from '@/components/templates/DeleteTemplateButton';
import { SetDefaultButton } from '@/components/templates/SetDefaultButton';
import { getEntitlements } from '@/libs/Entitlements';
import { Link } from '@/libs/I18nNavigation';
import { listTemplates } from '@/libs/Templates';
import { getDefaultTemplates } from '@/libs/UserProfile';
import { DOC_TYPES } from '@/validations/TemplateValidation';

type ModelosPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: ModelosPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'TemplatesPage' });
  return { title: t('meta_title') };
}

export default async function ModelosPage(props: ModelosPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TemplatesPage' });
  const tNav = await getTranslations({ locale, namespace: 'DashboardNav' });

  const { userId } = await auth();
  const { limits } = userId
    ? await getEntitlements(userId)
    : { limits: { customTemplates: false } };
  const canEdit = limits.customTemplates;
  const templates = userId ? await listTemplates(userId) : [];
  const defaults = userId ? await getDefaultTemplates(userId) : {};

  return (
    <>
      <TopBar breadcrumb={tNav('section_workspace')} title={t('title')} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader title={t('title')} description={t('description')} />

        {canEdit ? null : (
          <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50/60 px-5 py-4 text-sm text-brand-800">
            {t('upgrade_cta')}{' '}
            <Link href="/dashboard/settings/?tab=plano" className="font-semibold underline">
              {t('upgrade_link')}
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-8">
          {DOC_TYPES.map((docType) => {
            const group = templates.filter((tpl) => tpl.docType === docType);
            return (
              <section key={docType}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-wider text-ink-500 uppercase">
                    {t(`doctype_${docType}` as 'doctype_relatorio')}
                  </h2>
                  {canEdit ? (
                    <Link
                      href={`/dashboard/modelos/novo/?docType=${docType}`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-sm transition hover:bg-brand-600"
                    >
                      <PlusIcon size={14} />
                      {t('new_template')}
                    </Link>
                  ) : null}
                </div>

                <ul className="mt-3 space-y-2">
                  <li className="flex items-center justify-between rounded-xl border border-ink-200 bg-surface-elevated px-5 py-4">
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{t('default_name')}</div>
                      <div className="mt-0.5 text-xs text-ink-500">{t('default_hint')}</div>
                    </div>
                    {canEdit ? (
                      <SetDefaultButton
                        docType={docType}
                        templateId={null}
                        isDefault={!defaults[docType]}
                      />
                    ) : (
                      <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                        {t('badge_default')}
                      </span>
                    )}
                  </li>

                  {group.map((tpl) => (
                    <li
                      key={tpl.id}
                      className="flex items-center justify-between rounded-xl border border-ink-200 bg-surface-elevated px-5 py-4"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink-900">
                          {tpl.name}
                        </div>
                        {tpl.description ? (
                          <div className="mt-0.5 truncate text-xs text-ink-500">
                            {tpl.description}
                          </div>
                        ) : null}
                      </div>
                      {canEdit ? (
                        <div className="flex shrink-0 items-center gap-4">
                          <SetDefaultButton
                            docType={docType}
                            templateId={tpl.id}
                            isDefault={defaults[docType] === tpl.id}
                          />
                          <Link
                            href={`/dashboard/modelos/${tpl.id}/`}
                            className="text-xs font-semibold text-brand-700 transition hover:underline"
                          >
                            {t('edit')}
                          </Link>
                          <DeleteTemplateButton templateId={tpl.id} />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
