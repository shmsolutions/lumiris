/**
 * Modelo "documento resolvido": representação neutra (sem React, sem docx) de um
 * documento já com valores e labels resolvidos. Alimenta os renderizadores de
 * DOCX (e, futuramente, o PDF genérico) a partir de qualquer fonte — dados
 * legados hoje, modelos personalizados depois.
 */

export type ResolvedField = { label: string; value: string };

export type ResolvedSection =
  | { kind: 'header'; title?: string; fields: ResolvedField[] }
  | { kind: 'narrative'; title: string; fields: ResolvedField[] }
  | { kind: 'objectives'; title: string; columns: string[]; rows: string[][] };

export type ResolvedSignature = {
  /** Nome + credencial (ex: "Ana Silva — CREFITO 3/12345"). */
  name: string;
  /** Legenda da linha (ex: papel profissional). */
  caption: string;
  /** Imagem da assinatura (data URL png/jpeg) embutida acima da linha, se houver. */
  imageDataUrl?: string;
};

export type ResolvedDocument = {
  title: string;
  reference?: string;
  patientName: string;
  /** Itens do cabeçalho meta (data da sessão, paciente, período, CID…). */
  metaItems: ResolvedField[];
  sections: ResolvedSection[];
  signatures: ResolvedSignature[];
  footer: string;
  /** Texto exibido quando um campo está vazio. */
  emptyLabel: string;
};
