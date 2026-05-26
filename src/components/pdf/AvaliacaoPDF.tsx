import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

type PlanObjective = {
  title: string;
  estimatedSessions: number;
  procedures: string;
};

type AvaliacaoPDFProps = {
  generatedAtLabel: string;
  patient: {
    fullName: string;
    age: string;
    naturality: string;
    maritalStatus: string;
    gender: string;
    profession: string;
    residentialAddress: string;
    commercialAddress: string;
  };
  clinicalHistory: {
    mainComplaint: string;
    diseaseHistory: string;
    lifeHabits: string;
    treatments: string;
    antecedents: string;
    others: string;
  };
  clinicalExam: string;
  complementaryExams: string;
  otDiagnosis: string;
  otPrognosis: string;
  plan: {
    frequency: string;
    objectives: PlanObjective[];
  };
  therapist: { name: string; crefito: string; studentName: string | null };
  labels: Record<string, string>;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#21211D',
    lineHeight: 1.4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandLeft: { flexDirection: 'row', alignItems: 'center' },
  brandDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E8923C',
    marginRight: 7,
  },
  brandName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#21211D',
    letterSpacing: -0.3,
  },
  brandMeta: { fontSize: 7.5, color: '#9A988C' },
  title: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0F4C9A',
    textAlign: 'center',
  },
  reference: {
    fontSize: 7.5,
    color: '#9A988C',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  outerBox: {
    borderWidth: 1,
    borderColor: '#21211D',
    marginBottom: 10,
  },
  sectionBar: {
    backgroundColor: '#F4F3EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#21211D',
  },
  sectionBarText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F0F0D',
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#21211D',
  },
  gridRowLast: { borderBottomWidth: 0 },
  cell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#21211D',
  },
  cellLast: { borderRightWidth: 0 },
  cellLabel: {
    fontSize: 7,
    color: '#6E6D63',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  cellValue: { fontSize: 9, color: '#21211D' },
  emptyValue: { color: '#C9C7BC' },
  fieldBlock: {
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#21211D',
  },
  fieldBlockLast: { borderBottomWidth: 0 },
  fieldLabel: {
    fontSize: 7,
    color: '#6E6D63',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  fieldValue: { fontSize: 9, color: '#21211D', minHeight: 12 },
  freeBlock: {
    padding: 6,
    minHeight: 26,
  },
  planHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#21211D',
    backgroundColor: '#FAFAF7',
  },
  planCol1: { flex: 3 },
  planCol2: { flex: 1 },
  planCol3: { flex: 3 },
  planHeaderCell: {
    padding: 4,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#6E6D63',
    borderRightWidth: 1,
    borderRightColor: '#21211D',
  },
  planCell: {
    padding: 5,
    fontSize: 8.5,
    color: '#21211D',
    borderRightWidth: 1,
    borderRightColor: '#21211D',
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 30,
  },
  signatureBlock: { flex: 1 },
  signatureMark: { fontSize: 15, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#21211D',
    marginBottom: 4,
  },
  signatureCaption: { fontSize: 8, color: '#4F4E47', lineHeight: 1.4 },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#9A988C',
    borderTopWidth: 1,
    borderTopColor: '#E6E5DE',
    paddingTop: 6,
  },
});

const Value = (props: { value?: string; empty?: string }) => (
  <Text style={[styles.fieldValue, ...(props.value?.trim() ? [] : [styles.emptyValue])]}>
    {props.value?.trim() || props.empty || '—'}
  </Text>
);

export const AvaliacaoPDF = (props: AvaliacaoPDFProps) => {
  const l = props.labels;
  const empty = l.empty_field;

  return (
    <Document
      title={`${l.title} - ${props.patient.fullName}`}
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

        <Text style={styles.title}>{l.title}</Text>
        <Text style={styles.reference}>{l.reference}</Text>

        {/* IDENTIFICAÇÃO DO PACIENTE */}
        <View style={styles.outerBox}>
          <View style={styles.sectionBar}>
            <Text style={styles.sectionBarText}>{l.section_identification}</Text>
          </View>
          <View style={styles.gridRow}>
            <View style={[styles.cell, { flex: 3 }]}>
              <Text style={styles.cellLabel}>{l.field_full_name}</Text>
              <Value value={props.patient.fullName} empty={empty} />
            </View>
            <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
              <Text style={styles.cellLabel}>{l.field_age}</Text>
              <Value value={props.patient.age} empty={empty} />
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text style={styles.cellLabel}>{l.field_naturality}</Text>
              <Value value={props.patient.naturality} empty={empty} />
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text style={styles.cellLabel}>{l.field_marital_status}</Text>
              <Value value={props.patient.maritalStatus} empty={empty} />
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text style={styles.cellLabel}>{l.field_gender}</Text>
              <Value value={props.patient.gender} empty={empty} />
            </View>
            <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
              <Text style={styles.cellLabel}>{l.field_profession}</Text>
              <Value value={props.patient.profession} empty={empty} />
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
              <Text style={styles.cellLabel}>{l.field_residential_address}</Text>
              <Value value={props.patient.residentialAddress} empty={empty} />
            </View>
          </View>
          <View style={[styles.gridRow, styles.gridRowLast]}>
            <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
              <Text style={styles.cellLabel}>{l.field_commercial_address}</Text>
              <Value value={props.patient.commercialAddress} empty={empty} />
            </View>
          </View>
        </View>

        {/* HISTÓRIA CLÍNICA */}
        <View style={styles.outerBox} wrap={false}>
          <View style={styles.sectionBar}>
            <Text style={styles.sectionBarText}>{l.section_clinical_history}</Text>
          </View>
          {(
            [
              ['field_main_complaint', props.clinicalHistory.mainComplaint],
              ['field_disease_history', props.clinicalHistory.diseaseHistory],
              ['field_life_habits', props.clinicalHistory.lifeHabits],
              ['field_treatments', props.clinicalHistory.treatments],
              ['field_antecedents', props.clinicalHistory.antecedents],
              ['field_others', props.clinicalHistory.others],
            ] as const
          ).map(([labelKey, value], index, arr) => (
            <View
              key={labelKey}
              style={[
                styles.fieldBlock,
                ...(index === arr.length - 1 ? [styles.fieldBlockLast] : []),
              ]}
            >
              <Text style={styles.fieldLabel}>{l[labelKey]}</Text>
              <Value value={value} empty={empty} />
            </View>
          ))}
        </View>

        {/* Free-text sections */}
        {(
          [
            ['section_clinical_exam', props.clinicalExam],
            ['section_complementary_exams', props.complementaryExams],
            ['section_ot_diagnosis', props.otDiagnosis],
            ['section_ot_prognosis', props.otPrognosis],
          ] as const
        ).map(([sectionKey, value]) => (
          <View key={sectionKey} style={styles.outerBox} wrap={false}>
            <View style={styles.sectionBar}>
              <Text style={styles.sectionBarText}>{l[sectionKey]}</Text>
            </View>
            <View style={styles.freeBlock}>
              <Value value={value} empty={empty} />
            </View>
          </View>
        ))}

        {/* PLANO TERAPÊUTICO OCUPACIONAL */}
        <View style={styles.outerBox} wrap={false}>
          <View style={styles.sectionBar}>
            <Text style={styles.sectionBarText}>
              {l.section_plan}
              {props.plan.frequency ? `  ·  ${l.field_frequency}: ${props.plan.frequency}` : ''}
            </Text>
          </View>
          <View style={styles.planHeaderRow}>
            <Text style={[styles.planHeaderCell, styles.planCol1]}>{l.plan_objectives}</Text>
            <Text style={[styles.planHeaderCell, styles.planCol2]}>{l.plan_sessions}</Text>
            <Text style={[styles.planHeaderCell, styles.planCol3, styles.cellLast]}>
              {l.plan_procedures}
            </Text>
          </View>
          {props.plan.objectives.length === 0 ? (
            <View style={[styles.gridRow, styles.gridRowLast]}>
              <Text style={[styles.planCell, styles.cellLast, { flex: 1 }]}>
                <Text style={styles.emptyValue}>{empty}</Text>
              </Text>
            </View>
          ) : (
            props.plan.objectives.map((obj, index, arr) => (
              <View
                key={index}
                style={[styles.gridRow, ...(index === arr.length - 1 ? [styles.gridRowLast] : [])]}
              >
                <Text style={[styles.planCell, styles.planCol1]}>{obj.title}</Text>
                <Text style={[styles.planCell, styles.planCol2]}>
                  {obj.estimatedSessions > 0 ? obj.estimatedSessions : '—'}
                </Text>
                <Text style={[styles.planCell, styles.planCol3, styles.cellLast]}>
                  {obj.procedures?.trim() || '—'}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* IDENTIFICAÇÃO DO PROFISSIONAL ASSISTENTE */}
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
          <Text>lume · prontuário inteligente</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
