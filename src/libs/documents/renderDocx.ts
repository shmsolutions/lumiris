import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { ResolvedDocument, ResolvedSection } from './types';

const INK = '21211D';
const MUTED = '6E6D63';
const ACCENT = '9E5816';
const BAR_FILL = 'F4F3EE';

const emptyOr = (value: string, empty: string) => value.trim() || empty;

const sectionTitle = (title: string) =>
  new Paragraph({
    spacing: { before: 280, after: 80 },
    children: [new TextRun({ text: title.toUpperCase(), bold: true, color: ACCENT, size: 21 })],
  });

const objectivesTable = (
  section: Extract<ResolvedSection, { kind: 'objectives' }>,
  empty: string,
) => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: section.columns.map(
      (column) =>
        new TableCell({
          shading: { fill: BAR_FILL },
          children: [
            new Paragraph({ children: [new TextRun({ text: column, bold: true, size: 18 })] }),
          ],
        }),
    ),
  });

  const bodyRows = section.rows.length
    ? section.rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: emptyOr(cell, empty), size: 18 })],
                    }),
                  ],
                }),
            ),
          }),
      )
    : [
        new TableRow({
          children: section.columns.map(
            () =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: empty, size: 18, color: MUTED })],
                  }),
                ],
              }),
          ),
        }),
      ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
};

const sectionToBlocks = (section: ResolvedSection, empty: string): (Paragraph | Table)[] => {
  if (section.kind === 'objectives') {
    return [sectionTitle(section.title), objectivesTable(section, empty)];
  }

  const blocks: (Paragraph | Table)[] = [];
  if (section.kind === 'narrative') {
    blocks.push(sectionTitle(section.title));
  } else if (section.title) {
    blocks.push(sectionTitle(section.title));
  }

  const showLabels = section.kind === 'header' || section.fields.length > 1;
  for (const field of section.fields) {
    if (section.kind === 'header') {
      blocks.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${field.label}: `, bold: true, size: 18 }),
            new TextRun({ text: emptyOr(field.value, empty), size: 18 }),
          ],
        }),
      );
      continue;
    }
    if (showLabels) {
      blocks.push(
        new Paragraph({
          spacing: { before: 60 },
          children: [new TextRun({ text: field.label, bold: true, size: 20 })],
        }),
      );
    }
    blocks.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: emptyOr(field.value, empty), size: 20 })],
      }),
    );
  }
  return blocks;
};

const dataUrlToImage = (dataUrl: string): { data: Buffer; type: 'png' | 'jpg' } | null => {
  const match = dataUrl.match(/^data:image\/(png|jpe?g);base64,(.+)$/);
  if (!match) {
    return null;
  }
  return { data: Buffer.from(match[2] ?? '', 'base64'), type: match[1] === 'png' ? 'png' : 'jpg' };
};

const signatureBlocks = (doc: ResolvedDocument): Paragraph[] =>
  doc.signatures.flatMap((sig) => {
    const image = sig.imageDataUrl ? dataUrlToImage(sig.imageDataUrl) : null;
    return [
      ...(image
        ? [
            new Paragraph({
              spacing: { before: 480 },
              children: [
                new ImageRun({
                  data: image.data,
                  type: image.type,
                  transformation: { width: 150, height: 52 },
                }),
              ],
            }),
          ]
        : []),
      new Paragraph({
        spacing: { before: image ? 0 : 520, after: 20 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: INK, space: 1 } },
        children: [new TextRun({ text: ' ', size: 20 })],
      }),
      new Paragraph({ children: [new TextRun({ text: sig.name, bold: true, size: 18 })] }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: sig.caption, size: 15, color: MUTED })],
      }),
    ];
  });

/** Renderiza um documento resolvido como um arquivo .docx (Buffer). */
export const renderDocx = async (doc: ResolvedDocument): Promise<Buffer> => {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: doc.reference ? 40 : 160 },
      children: [new TextRun({ text: doc.title, bold: true, size: 26, color: INK })],
    }),
  ];

  if (doc.reference) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({ text: doc.reference, italics: true, size: 15, color: MUTED })],
      }),
    );
  }

  if (doc.metaItems.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: doc.metaItems.flatMap((item, index) => [
          new TextRun({ text: `${item.label}: `, bold: true, size: 18 }),
          new TextRun({ text: item.value, size: 18 }),
          ...(index < doc.metaItems.length - 1 ? [new TextRun({ text: '    ', size: 18 })] : []),
        ]),
      }),
    );
  }

  for (const section of doc.sections) {
    children.push(...sectionToBlocks(section, doc.emptyLabel));
  }

  children.push(...signatureBlocks(doc));

  const document = new Document({
    title: `${doc.title} - ${doc.patientName}`,
    creator: 'Lumiris',
    sections: [
      {
        children,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${doc.footer}    `, size: 14, color: MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, color: MUTED }),
                  new TextRun({ text: ' / ', size: 14, color: MUTED }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: MUTED }),
                ],
              }),
            ],
          }),
        },
      },
    ],
  });

  return await Packer.toBuffer(document);
};
