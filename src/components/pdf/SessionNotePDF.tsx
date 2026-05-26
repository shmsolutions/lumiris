import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

type SessionNotePDFProps = {
  patientName: string;
  birthDate?: string | null;
  diagnosis?: string | null;
  cid?: string | null;
  sessionDateLabel: string;
  generatedAtLabel: string;
  procedures: string;
  intercorrencia: string;
  evolution: string;
  transcript?: string | null;
  therapistName: string;
  therapistCrefito: string;
  studentName?: string | null;
  labels: {
    title: string;
    reference: string;
    section_evolution: string;
    field_procedures: string;
    field_intercorrencia: string;
    field_evolution: string;
    born: string;
    diagnosis: string;
    cid: string;
    session_date: string;
    therapist_line: string;
    student_line: string;
    transcript_title: string;
    transcript_disclaimer: string;
    empty_field: string;
    no_intercorrencia: string;
  };
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#21211D',
    lineHeight: 1.5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0F4C9A',
    textAlign: 'center',
    marginBottom: 4,
  },
  reference: {
    fontSize: 8,
    color: '#9A988C',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  metaBox: {
    borderWidth: 1,
    borderColor: '#21211D',
    padding: 8,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: { flexDirection: 'row', gap: 4 },
  metaLabel: {
    fontSize: 9,
    color: '#4F4E47',
    fontFamily: 'Helvetica-Bold',
  },
  metaValue: { fontSize: 9, color: '#21211D' },
  evolutionBox: {
    borderWidth: 1,
    borderColor: '#21211D',
    marginBottom: 20,
  },
  evolutionHeader: {
    backgroundColor: '#F4F3EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#21211D',
  },
  evolutionHeaderText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0F0F0D',
  },
  fieldRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#21211D',
    minHeight: 60,
  },
  fieldLast: {
    borderBottomWidth: 0,
    minHeight: 100,
  },
  fieldLabel: {
    width: 110,
    padding: 8,
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#21211D',
    borderRightWidth: 1,
    borderRightColor: '#21211D',
    backgroundColor: '#FAFAF7',
  },
  fieldValue: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    color: '#21211D',
    backgroundColor: '#FFFFFF',
  },
  emptyValue: {
    color: '#9A988C',
    fontStyle: 'italic',
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 36,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureMark: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#21211D',
    marginBottom: 4,
  },
  signatureCaption: {
    fontSize: 8.5,
    color: '#4F4E47',
    lineHeight: 1.4,
  },
  transcriptSection: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#FAFAF7',
    borderLeftWidth: 2,
    borderLeftColor: '#E6E5DE',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  transcriptTitle: {
    fontSize: 9,
    color: '#9A988C',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  transcriptDisclaimer: {
    fontSize: 7.5,
    color: '#9A988C',
    fontStyle: 'italic',
  },
  transcriptBody: {
    fontSize: 9,
    color: '#4F4E47',
    lineHeight: 1.55,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9A988C',
    borderTopWidth: 1,
    borderTopColor: '#E6E5DE',
    paddingTop: 8,
  },
});

const FieldValue = (props: { value: string; emptyLabel: string }) => (
  <Text style={[styles.fieldValue, ...(props.value?.trim() ? [] : [styles.emptyValue])]}>
    {props.value?.trim() || props.emptyLabel}
  </Text>
);

export const SessionNotePDF = (props: SessionNotePDFProps) => (
  <Document
    title={`${props.labels.title} - ${props.patientName} - ${props.sessionDateLabel}`}
    author="Lume"
    creator="Lume"
    producer="Lume"
  >
    <Page size="A4" style={styles.page}>
      <View style={styles.brandRow} fixed>
        <View style={styles.brandLeft}>
          <View style={styles.brandDot} />
          <Text style={styles.brandName}>lume</Text>
        </View>
        <Text style={styles.brandMeta}>{props.generatedAtLabel}</Text>
      </View>

      <Text style={styles.title}>{props.labels.title}</Text>
      <Text style={styles.reference}>{props.labels.reference}</Text>

      <View style={styles.metaBox}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{props.labels.session_date}:</Text>
            <Text style={styles.metaValue}>{props.sessionDateLabel}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Paciente:</Text>
            <Text style={styles.metaValue}>{props.patientName}</Text>
          </View>
          {props.birthDate ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{props.labels.born}:</Text>
              <Text style={styles.metaValue}>{props.birthDate}</Text>
            </View>
          ) : null}
          {props.cid ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{props.labels.cid}:</Text>
              <Text style={styles.metaValue}>{props.cid}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.evolutionBox} wrap={false}>
        <View style={styles.evolutionHeader}>
          <Text style={styles.evolutionHeaderText}>{props.labels.section_evolution}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{props.labels.field_procedures}</Text>
          <FieldValue value={props.procedures} emptyLabel={props.labels.empty_field} />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{props.labels.field_intercorrencia}</Text>
          <FieldValue value={props.intercorrencia} emptyLabel={props.labels.no_intercorrencia} />
        </View>

        <View style={[styles.fieldRow, styles.fieldLast]}>
          <Text style={styles.fieldLabel}>{props.labels.field_evolution}</Text>
          <FieldValue value={props.evolution} emptyLabel={props.labels.empty_field} />
        </View>
      </View>

      <View style={styles.signatureRow}>
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureMark}>X</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureCaption}>
            {props.therapistName}
            {props.therapistCrefito ? ` — CREFITO ${props.therapistCrefito}` : ''}
            {'\n'}
            {props.labels.therapist_line}
          </Text>
        </View>
        {props.studentName ? (
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureMark}>X</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureCaption}>
              {props.studentName}
              {'\n'}
              {props.labels.student_line}
            </Text>
          </View>
        ) : null}
      </View>

      {props.transcript?.trim() ? (
        <View style={styles.transcriptSection} wrap={false}>
          <View style={styles.transcriptHeader}>
            <Text style={styles.transcriptTitle}>{props.labels.transcript_title}</Text>
            <Text style={styles.transcriptDisclaimer}>{props.labels.transcript_disclaimer}</Text>
          </View>
          <Text style={styles.transcriptBody}>{props.transcript}</Text>
        </View>
      ) : null}

      <View style={styles.footer} fixed>
        <Text>lume · prontuário inteligente</Text>
        <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  </Document>
);
