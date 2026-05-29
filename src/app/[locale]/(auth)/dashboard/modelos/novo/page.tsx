import { auth } from '@clerk/nextjs/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import { getEntitlements } from '@/libs/Entitlements';
import { Link } from '@/libs/I18nNavigation';
import { DocTypeValidation } from '@/validations/TemplateValidation';

type NewTemplatePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ docType?: string }>;
};

export default async function NewTemplatePage(props: NewTemplatePageProps) {
  const { locale } = await props.params;
  const { docType: docTypeParam } = await props.searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TemplatesPage' });

  const { userId } = await auth();
  const { limits } = userId
    ? await getEntitlements(userId)
    : { limits: { customTemplates: false } };
  if (!limits.customTemplates) {
    redirect('/dashboard/modelos/');
  }

  const docTypeParse = DocTypeValidation.safeParse(docTypeParam);
  const docType = docTypeParse.success ? docTypeParse.data : 'relatorio';

  return (
    <>
      <TopBar
        breadcrumb={
          <Link href="/dashboard/modelos/" className="transition hover:text-ink-900">
            {t('title')}
          </Link>
        }
        title={t('new_template')}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow={t(`doctype_${docType}` as 'doctype_relatorio')}
          title={t('new_template')}
          description={t('builder_description')}
        />
        <div className="mt-8">
          <TemplateBuilder
            docType={docType}
            initialValues={{ name: '', description: '', definition: { version: 1, sections: [] } }}
          />
        </div>
      </div>
    </>
  );
}
