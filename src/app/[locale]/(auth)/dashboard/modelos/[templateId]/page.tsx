import { auth } from '@clerk/nextjs/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TopBar } from '@/components/dashboard/TopBar';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import { getEntitlements } from '@/libs/Entitlements';
import { Link } from '@/libs/I18nNavigation';
import { getTemplate } from '@/libs/Templates';
import { DocTypeValidation, TemplateDefinitionValidation } from '@/validations/TemplateValidation';

type EditTemplatePageProps = {
  params: Promise<{ locale: string; templateId: string }>;
};

export default async function EditTemplatePage(props: EditTemplatePageProps) {
  const { locale, templateId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TemplatesPage' });

  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }
  const { limits } = await getEntitlements(userId);
  if (!limits.customTemplates) {
    redirect('/dashboard/modelos/');
  }

  const template = await getTemplate(userId, templateId);
  if (!template) {
    notFound();
  }

  const docType = DocTypeValidation.parse(template.docType);
  const definition = TemplateDefinitionValidation.parse(template.definition);

  return (
    <>
      <TopBar
        breadcrumb={
          <Link href="/dashboard/modelos/" className="transition hover:text-ink-900">
            {t('title')}
          </Link>
        }
        title={template.name}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow={t(`doctype_${docType}` as 'doctype_relatorio')}
          title={t('edit_title')}
          description={t('builder_description')}
        />
        <div className="mt-8">
          <TemplateBuilder
            docType={docType}
            templateId={template.id}
            initialValues={{
              name: template.name,
              description: template.description ?? '',
              definition,
            }}
          />
        </div>
      </div>
    </>
  );
}
