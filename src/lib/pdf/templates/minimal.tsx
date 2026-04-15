import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/money";
import type { InvoicePdfData } from "./shared";

const s = StyleSheet.create({
  page: { padding: 56, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 64 },
  logo: { width: 56, height: 56, marginBottom: 12, objectFit: "contain" },
  bizName: { fontSize: 11, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  tiny: { fontSize: 8, color: "#999", letterSpacing: 0.5, textTransform: "uppercase" },
  label: { fontSize: 8, color: "#999", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 },
  value: { fontSize: 10 },
  hero: { marginBottom: 48 },
  heroNumber: { fontSize: 40, fontFamily: "Helvetica-Light", color: "#111", letterSpacing: -1, marginBottom: 4 },
  small: { fontSize: 9, color: "#666", lineHeight: 1.5 },
  datesRow: { flexDirection: "row", gap: 48, marginTop: 32 },
  parties: { flexDirection: "row", gap: 48, marginBottom: 48 },
  partyCol: { flex: 1 },
  clientName: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 4 },
  table: { marginBottom: 24 },
  tr: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 0.5, borderColor: "#e5e5e5" },
  thead: { flexDirection: "row", paddingBottom: 8, borderBottomWidth: 0.5, borderColor: "#111" },
  th: { fontSize: 8, letterSpacing: 0.5, textTransform: "uppercase", color: "#999" },
  col1: { flex: 4 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1.5, textAlign: "right" },
  col4: { flex: 1.5, textAlign: "right" },
  totals: { alignSelf: "flex-end", width: 240, marginTop: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, fontSize: 10, color: "#666" },
  grand: { borderTopWidth: 0.5, borderColor: "#111", paddingTop: 10, marginTop: 10, fontSize: 14, fontFamily: "Helvetica-Bold", color: "#111" },
  footer: { marginTop: 48, paddingTop: 20, borderTopWidth: 0.5, borderColor: "#e5e5e5" },
  footBlock: { marginBottom: 16 },
});

export const MinimalTemplate = ({ data }: { data: InvoicePdfData }) => (
  <Document>
    <Page size="A4" style={s.page}>
      <View style={s.topRow}>
        <View>
          {data.business.logoUrl && <Image src={data.business.logoUrl} style={s.logo} />}
          <Text style={s.bizName}>{data.business.name}</Text>
          {data.business.addressLines.map((l, i) => <Text key={i} style={s.small}>{l}</Text>)}
          <Text style={s.small}>{data.business.email}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.tiny}>Invoice</Text>
        </View>
      </View>

      <View style={s.hero}>
        <Text style={s.heroNumber}>{data.number}</Text>
        <View style={s.datesRow}>
          <View>
            <Text style={s.label}>Issued</Text>
            <Text style={s.value}>{data.issueDate}</Text>
          </View>
          <View>
            <Text style={s.label}>Due</Text>
            <Text style={s.value}>{data.dueDate}</Text>
          </View>
        </View>
      </View>

      <View style={s.parties}>
        <View style={s.partyCol}>
          <Text style={s.label}>From</Text>
          <Text style={s.value}>{data.business.name}</Text>
          {data.business.addressLines.map((l, i) => <Text key={i} style={s.small}>{l}</Text>)}
        </View>
        <View style={s.partyCol}>
          <Text style={s.label}>Bill to</Text>
          <Text style={s.clientName}>{data.client.name}</Text>
          {data.client.addressLines.map((l, i) => <Text key={i} style={s.small}>{l}</Text>)}
          {data.client.email && <Text style={s.small}>{data.client.email}</Text>}
        </View>
      </View>

      <View style={s.table}>
        <View style={s.thead}>
          <Text style={[s.th, s.col1]}>Description</Text>
          <Text style={[s.th, s.col2]}>Qty</Text>
          <Text style={[s.th, s.col3]}>Price</Text>
          <Text style={[s.th, s.col4]}>Amount</Text>
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
        <View style={[s.totalRow, s.grand]}><Text>Total</Text><Text>{formatMoney(data.total, data.currency)}</Text></View>
      </View>

      {(data.notes || data.terms || data.business.bankDetails) && (
        <View style={s.footer}>
          {data.notes && (
            <View style={s.footBlock}>
              <Text style={s.label}>Notes</Text>
              <Text style={s.small}>{data.notes}</Text>
            </View>
          )}
          {data.terms && (
            <View style={s.footBlock}>
              <Text style={s.label}>Terms</Text>
              <Text style={s.small}>{data.terms}</Text>
            </View>
          )}
          {data.business.bankDetails && (
            <View style={s.footBlock}>
              <Text style={s.label}>Payment</Text>
              <Text style={s.small}>{data.business.bankDetails}</Text>
            </View>
          )}
        </View>
      )}
    </Page>
  </Document>
);
