import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ResolvedDocument, ResolvedSection } from '@/libs/documents/types';

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
  brandDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8923C', marginRight: 8 },
  brandName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#21211D', letterSpacing: -0.3 },
  title: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#0F4C9A',
    textAlign: 'center',
    marginBottom: 2,
  },
  reference: {
    fontSize: 8,
    color: '#9A988C',
    textAlign: 'center',
    marginBottom: 14,
    fontStyle: 'italic',
  },
  metaBox: { borderWidth: 1, borderColor: '#21211D', padding: 8, marginBottom: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metaItem: { flexDirection: 'row', gap: 4 },
  metaLabel: { fontSize: 9, color: '#4F4E47', fontFamily: 'Helvetica-Bold' },
  metaValue: { fontSize: 9, color: '#21211D' },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#9E5816',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  headerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  headerCell: { width: '47%' },
  fieldLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#4F4E47', marginBottom: 1 },
  fieldValue: { fontSize: 10, color: '#21211D', marginBottom: 6 },
  emptyValue: { color: '#9A988C', fontStyle: 'italic' },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F3EE',
    borderWidth: 1,
    borderColor: '#21211D',
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#21211D',
  },
  tableCell: { flex: 1, padding: 6, fontSize: 9, borderRightWidth: 1, borderColor: '#21211D' },
  tableCellLast: { flex: 1, padding: 6, fontSize: 9 },
  tableHeadCell: { fontFamily: 'Helvetica-Bold' },
  signatureRow: { flexDirection: 'row', gap: 24, marginTop: 36 },
  signatureBlock: { flex: 1 },
  signatureMark: { fontSize: 15, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  signatureImage: { height: 36, width: 130, objectFit: 'contain', marginBottom: 2 },
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

const FieldValueText = (props: { value: string; empty: string }) => (
  <Text style={[styles.fieldValue, ...(props.value.trim() ? [] : [styles.emptyValue])]}>
    {props.value.trim() || props.empty}
  </Text>
);

const SectionView = (props: { section: ResolvedSection; empty: string }) => {
  const { section } = props;

  if (section.kind === 'objectives') {
    return (
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.tableHeaderRow}>
          {section.columns.map((column, index) => (
            <Text
              key={column}
              style={[
                index === section.columns.length - 1 ? styles.tableCellLast : styles.tableCell,
                styles.tableHeadCell,
              ]}
            >
              {column}
            </Text>
          ))}
        </View>
        {section.rows.length === 0 ? (
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLast}>{props.empty}</Text>
          </View>
        ) : (
          section.rows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.tableRow}>
              {row.map((cell, cellIndex) => (
                <Text
                  key={`cell-${rowIndex}-${cellIndex}`}
                  style={cellIndex === row.length - 1 ? styles.tableCellLast : styles.tableCell}
                >
                  {cell.trim() || props.empty}
                </Text>
              ))}
            </View>
          ))
        )}
      </View>
    );
  }

  if (section.kind === 'header') {
    return (
      <View style={styles.metaBox} wrap={false}>
        {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
        <View style={styles.headerGrid}>
          {section.fields.map((field) => (
            <View key={field.label} style={styles.headerCell}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <FieldValueText value={field.value} empty={props.empty} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.fields.map((field) => (
        <View key={field.label || 'field'}>
          {field.label ? <Text style={styles.fieldLabel}>{field.label}</Text> : null}
          <FieldValueText value={field.value} empty={props.empty} />
        </View>
      ))}
    </View>
  );
};

export const TemplatedDocumentPDF = (props: { doc: ResolvedDocument }) => {
  const { doc } = props;
  return (
    <Document title={`${doc.title} - ${doc.patientName}`} author="Lumiris" creator="Lumiris">
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow} fixed>
          <View style={styles.brandLeft}>
            <View style={styles.brandDot} />
            <Text style={styles.brandName}>lumiris</Text>
          </View>
        </View>

        <Text style={styles.title}>{doc.title}</Text>
        {doc.reference ? <Text style={styles.reference}>{doc.reference}</Text> : null}

        {doc.metaItems.length > 0 ? (
          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              {doc.metaItems.map((item) => (
                <View key={item.label} style={styles.metaItem}>
                  <Text style={styles.metaLabel}>{item.label}:</Text>
                  <Text style={styles.metaValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {doc.sections.map((section, index) => (
          <SectionView key={`${section.kind}-${index}`} section={section} empty={doc.emptyLabel} />
        ))}

        <View style={styles.signatureRow}>
          {doc.signatures.map((sig) => (
            <View key={sig.name} style={styles.signatureBlock}>
              {sig.imageDataUrl ? (
                <Image src={sig.imageDataUrl} style={styles.signatureImage} />
              ) : (
                <Text style={styles.signatureMark}>X</Text>
              )}
              <View style={styles.signatureLine} />
              <Text style={styles.signatureCaption}>{sig.name}</Text>
              <Text style={styles.signatureCaption}>{sig.caption}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text>{doc.footer}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
