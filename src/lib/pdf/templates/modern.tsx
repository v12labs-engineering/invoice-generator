import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/money";
import type { InvoicePdfData } from "./shared";

const BRAND = "#2563EB";
const BRAND_2 = "#7C3AED";
const INK = "#0A0A0A";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const s = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Courier", color: INK },
  accentBar: { height: 6, backgroundColor: BRAND },
  accentBar2: { height: 2, backgroundColor: BRAND_2 },
  body: { padding: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  logo: { width: 64, height: 64, marginBottom: 10, objectFit: "contain" },
  bizName: { fontSize: 14, fontFamily: "Courier-Bold", marginBottom: 4 },
  small: { fontSize: 9, color: MUTED, lineHeight: 1.5 },
  invoiceLabel: { fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 4 },
  invoiceNumber: { fontSize: 24, fontFamily: "Courier-Bold", color: BRAND, marginBottom: 8 },
  metaRow: { flexDirection: "row", gap: 24, marginTop: 8 },
  metaCol: {},
  metaLabel: { fontSize: 8, color: MUTED, marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 },
  metaValue: { fontSize: 10, fontFamily: "Courier-Bold" },
  billTo: { marginBottom: 28, padding: 16, backgroundColor: "#F9FAFB", borderLeftWidth: 3, borderLeftColor: BRAND },
  billToLabel: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  clientName: { fontFamily: "Courier-Bold", fontSize: 12, marginBottom: 2 },
  table: { marginTop: 8 },
  thead: { flexDirection: "row", backgroundColor: INK, paddingVertical: 10, paddingHorizontal: 8 },
  th: { fontFamily: "Courier-Bold", color: "#fff", fontSize: 9, letterSpacing: 1 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: BORDER, paddingVertical: 10, paddingHorizontal: 8 },
  col1: { flex: 4 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1.5, textAlign: "right" },
  col4: { flex: 1.5, textAlign: "right" },
  totals: { alignSelf: "flex-end", width: 260, marginTop: 20, padding: 16, backgroundColor: "#F9FAFB" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, fontSize: 10 },
  grand: { borderTopWidth: 2, borderColor: BRAND, paddingTop: 8, marginTop: 8, fontFamily: "Courier-Bold", fontSize: 12, color: BRAND },
  footerBlock: { marginTop: 28 },
  footerLabel: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
});

export const ModernTemplate = ({ data }: { data: InvoicePdfData }) => (
  <Document>
    <Page size="A4" style={s.page}>
      <View style={s.accentBar} />
      <View style={s.accentBar2} />
      <View style={s.body}>
        <View style={s.header}>
          <View>
            {data.business.logoUrl && <Image src={data.business.logoUrl} style={s.logo} />}
            <Text style={s.bizName}>{data.business.name}</Text>
            {data.business.addressLines.map((l, i) => <Text key={i} style={s.small}>{l}</Text>)}
            <Text style={s.small}>{data.business.email}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.invoiceLabel}>INVOICE</Text>
            <Text style={s.invoiceNumber}>{data.number}</Text>
            <View style={s.metaRow}>
              <View style={s.metaCol}>
                <Text style={s.metaLabel}>Issued</Text>
                <Text style={s.metaValue}>{data.issueDate}</Text>
              </View>
              <View style={s.metaCol}>
                <Text style={s.metaLabel}>Due</Text>
                <Text style={s.metaValue}>{data.dueDate}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.billTo}>
          <Text style={s.billToLabel}>Bill to</Text>
          <Text style={s.clientName}>{data.client.name}</Text>
          {data.client.addressLines.map((l, i) => <Text key={i} style={s.small}>{l}</Text>)}
          {data.client.email && <Text style={s.small}>{data.client.email}</Text>}
        </View>

        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, s.col1]}>DESCRIPTION</Text>
            <Text style={[s.th, s.col2]}>QTY</Text>
            <Text style={[s.th, s.col3]}>PRICE</Text>
            <Text style={[s.th, s.col4]}>AMOUNT</Text>
          </View>
          {data.lines.map((l, i) => (
            <View key={i} style={s.tr}>
              <Text style={s.col1}>{l.description}</Text>
              <Text style={s.col2}>{l.quantity}</Text>
              <Text style={s.col3}>{formatMoney(l.unitPrice, data.currency)}</Text>
              <Text style={s.col4}>{formatMoney(l.lineTotal, data.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalRow}><Text>Subtotal</Text><Text>{formatMoney(data.subtotal, data.currency)}</Text></View>
          {data.discountAmount > 0 && (
            <View style={s.totalRow}><Text>Discount</Text><Text>-{formatMoney(data.discountAmount, data.currency)}</Text></View>
          )}
          <View style={s.totalRow}><Text>Tax</Text><Text>{formatMoney(data.taxAmount, data.currency)}</Text></View>
          <View style={[s.totalRow, s.grand]}><Text>Total due</Text><Text>{formatMoney(data.total, data.currency)}</Text></View>
        </View>

        {data.notes && (
          <View style={s.footerBlock}>
            <Text style={s.footerLabel}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        )}
        {data.terms && (
          <View style={s.footerBlock}>
            <Text style={s.footerLabel}>Terms</Text>
            <Text>{data.terms}</Text>
          </View>
        )}
        {data.business.bankDetails && (
          <View style={s.footerBlock}>
            <Text style={s.footerLabel}>Payment</Text>
            <Text>{data.business.bankDetails}</Text>
          </View>
        )}
      </View>
    </Page>
  </Document>
);
