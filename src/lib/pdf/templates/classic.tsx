import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/money";
import type { InvoicePdfData } from "./shared";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  h1: { fontSize: 22, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  small: { fontSize: 9, color: "#666" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  section: { marginBottom: 24 },
  logo: { width: 80, height: 80, marginBottom: 8, objectFit: "contain" },
  table: { borderTopWidth: 1, borderColor: "#ddd", marginTop: 16 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee", paddingVertical: 6 },
  th: { fontFamily: "Helvetica-Bold", paddingVertical: 6 },
  col1: { flex: 4 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1.5, textAlign: "right" },
  col4: { flex: 1.5, textAlign: "right" },
  totals: { alignSelf: "flex-end", width: 220, marginTop: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: { borderTopWidth: 1, borderColor: "#000", paddingTop: 6, marginTop: 6, fontFamily: "Helvetica-Bold" },
});

export const ClassicTemplate = ({ data }: { data: InvoicePdfData }) => (
  <Document>
    <Page size="A4" style={s.page}>
      <View style={[s.row, s.section]}>
        <View>
          {data.business.logoUrl && <Image src={data.business.logoUrl} style={s.logo} />}
          <Text style={s.h1}>{data.business.name}</Text>
          {data.business.addressLines.map((l, i) => <Text key={i} style={s.small}>{l}</Text>)}
          <Text style={s.small}>{data.business.email}</Text>
        </View>
        <View>
          <Text style={s.h1}>INVOICE</Text>
          <Text style={s.small}>{data.number}</Text>
          <Text style={s.small}>Issued: {data.issueDate}</Text>
          <Text style={s.small}>Due: {data.dueDate}</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.small}>Bill to</Text>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.client.name}</Text>
        {data.client.addressLines.map((l, i) => <Text key={i} style={s.small}>{l}</Text>)}
        {data.client.email && <Text style={s.small}>{data.client.email}</Text>}
      </View>

      <View style={s.table}>
        <View style={s.tr}>
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

      {data.notes && <View style={{ marginTop: 32 }}><Text style={s.small}>Notes</Text><Text>{data.notes}</Text></View>}
      {data.terms && <View style={{ marginTop: 16 }}><Text style={s.small}>Terms</Text><Text>{data.terms}</Text></View>}
      {data.business.bankDetails && <View style={{ marginTop: 24 }}><Text style={s.small}>Payment</Text><Text>{data.business.bankDetails}</Text></View>}
    </Page>
  </Document>
);
