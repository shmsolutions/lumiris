import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

type ReportPDFProps = {
  patientName: string;
  birthDate?: string | null;
  cid?: string | null;
  periodLabel: string;
  generatedAtLabel: string;
  content: {
    initialComplaint: string;
    generalEvolution: string;
    objectiveProgress: { title: string; progress: string }[];
    difficulties: string;
    suggestions: string;
    conclusion: string;
  };
  therapist: { name: string; crefito: string; studentName: string | null };
  labels: Record<string, string>;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 50,
    paddingHorizontal: 52,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#21211D',
    lineHeight: 1.55,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brandLeft: { flexDirection: 'row', alignItems: 'center' },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E8923C',
    marginRight: 8,
  },
  brandName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#21211D',
    letterSpacing: -0.3,
  },
  brandMeta: { fontSize: 8, color: '#9A988C' },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0F0F0D',
    marginBottom: 2,
  },
  subtitle: { fontSize: 11, color: '#4F4E47' },
  metaLine: { fontSize: 9, color: '#6E6D63', marginTop: 2 },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: '#E6E5DE',
    marginVertical: 16,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#9E5816',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  body: { fontSize: 10, color: '#21211D' },
  objectiveItem: { marginBottom: 8 },
  objectiveTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0F0F0D',
    marginBottom: 1,
  },
  signatureRow: { flexDirection: 'row', gap: 24, marginTop: 36 },
  signatureBlock: { flex: 1 },
  signatureMark: { fontSize: 15, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#21211D', marginBottom: 4 },
  signatureCaption: { fontSize: 8, color: '#4F4E47', lineHeight: 1.4 },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 52,
    right: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9A988C',
    borderTopWidth: 1,
    borderTopColor: '#E6E5DE',
    paddingTop: 8,
  },
});

const Section = (props: { title?: string; children: React.ReactNode }) => (
  <View style={styles.section} wrap={false}>
    <Text style={styles.sectionTitle}>{props.title}</Text>
    {props.children}
  </View>
);

export const ReportPDF = (props: ReportPDFProps) => {
  const l = props.labels;
  const c = props.content;
  const empty = l.empty ?? '—';

  return (
    <Document
      title={`${l.title} - ${props.patientName}`}
      author="Lumiris"
      creator="Lumiris"
      producer="Lumiris"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow} fixed>
          <View style={styles.brandLeft}>
            <View style={styles.brandDot} />
            <Text style={styles.brandName}>lumiris</Text>
          </View>
          <Text style={styles.brandMeta}>{props.generatedAtLabel}</Text>
        </View>

        <Text style={styles.title}>{l.title}</Text>
        <Text style={styles.subtitle}>{props.patientName}</Text>
        <Text style={styles.metaLine}>
          {l.period}: {props.periodLabel}
          {props.cid ? `   ·   ${l.cid}: ${props.cid}` : ''}
        </Text>

        <View style={styles.rule} />

        <Section title={l.initial_complaint}>
          <Text style={styles.body}>{c.initialComplaint?.trim() || empty}</Text>
        </Section>

        <Section title={l.general_evolution}>
          <Text style={styles.body}>{c.generalEvolution?.trim() || empty}</Text>
        </Section>

        <Section title={l.objective_progress}>
          {c.objectiveProgress.length === 0 ? (
            <Text style={styles.body}>{empty}</Text>
          ) : (
            c.objectiveProgress.map((o, i) => (
              <View key={i} style={styles.objectiveItem}>
                <Text style={styles.objectiveTitle}>• {o.title}</Text>
                <Text style={styles.body}>{o.progress?.trim() || empty}</Text>
              </View>
            ))
          )}
        </Section>

        <Section title={l.difficulties}>
          <Text style={styles.body}>{c.difficulties?.trim() || empty}</Text>
        </Section>

        <Section title={l.suggestions}>
          <Text style={styles.body}>{c.suggestions?.trim() || empty}</Text>
        </Section>

        <Section title={l.conclusion}>
          <Text style={styles.body}>{c.conclusion?.trim() || empty}</Text>
        </Section>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureMark}>X</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureCaption}>
              {props.therapist.name}
              {props.therapist.crefito ? ` — CREFITO ${props.therapist.crefito}` : ''}
              {'\n'}
              {l.therapist_line}
            </Text>
          </View>
          {props.therapist.studentName ? (
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureMark}>X</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureCaption}>
                {props.therapist.studentName}
                {'\n'}
                {l.student_line}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer} fixed>
          <Text>lumiris · prontuário inteligente</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
