import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";

const BRAND = "#2563EB";
const BRAND_2 = "#7C3AED";
const INK = "#0A0A0A";
const MUTED = "#6B7280";

const s = StyleSheet.create({
  page: { padding: 0, fontSize: 10.5, fontFamily: "Helvetica", color: INK, lineHeight: 1.55 },
  accentBar: { height: 6, backgroundColor: BRAND },
  accentBar2: { height: 2, backgroundColor: BRAND_2 },
  body: { padding: 48 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
  },
  logo: { width: 56, height: 56, marginBottom: 10, objectFit: "contain" },
  bizName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  small: { fontSize: 9, color: MUTED, lineHeight: 1.5 },
  docLabel: { fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 4 },
  docTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: BRAND },
  content: { marginTop: 4 },
  para: { marginBottom: 10 },
  footer: { marginTop: 32, fontSize: 8, color: MUTED, textAlign: "center" },
});

export type EmployeeDocPdfData = {
  title: string;
  body: string;
  business: {
    name: string;
    addressLines: string[];
    email: string;
    logoUrl?: string | null;
  };
};

export function EmployeeDocTemplate({ data }: { data: EmployeeDocPdfData }) {
  const paragraphs = data.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.accentBar} />
        <View style={s.accentBar2} />
        <View style={s.body}>
          <View style={s.header}>
            <View>
              {data.business.logoUrl && <Image src={data.business.logoUrl} style={s.logo} />}
              <Text style={s.bizName}>{data.business.name}</Text>
              {data.business.addressLines.map((l, i) => (
                <Text key={i} style={s.small}>
                  {l}
                </Text>
              ))}
              <Text style={s.small}>{data.business.email}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.docLabel}>DOCUMENT</Text>
              <Text style={s.docTitle}>{data.title.toUpperCase()}</Text>
            </View>
          </View>

          <View style={s.content}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={s.para}>
                {p}
              </Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderEmployeeDocPdf(data: EmployeeDocPdfData): Promise<Buffer> {
  return renderToBuffer(<EmployeeDocTemplate data={data} />);
}
