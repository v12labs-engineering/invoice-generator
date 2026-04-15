import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/money";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  h1: { fontSize: 22, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  small: { fontSize: 9, color: "#666" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  section: { marginBottom: 24 },
  table: { borderTopWidth: 1, borderColor: "#ddd", marginTop: 16 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee", paddingVertical: 6 },
  th: { fontFamily: "Helvetica-Bold", paddingVertical: 6 },
  col1: { flex: 4 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1.5, textAlign: "right" },
  col4: { flex: 1.5, textAlign: "right" },
  logo: { width: 80, height: 80, marginBottom: 8, objectFit: "contain" },
  totals: { alignSelf: "flex-end", width: 220, marginTop: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: { borderTopWidth: 1, borderColor: "#000", paddingTop: 6, marginTop: 6, fontFamily: "Helvetica-Bold" },
});

export type InvoicePdfData = {
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
  business: {
    name: string;
    addressLines: string[];
    email: string;
    phone?: string | null;
    taxId?: string | null;
    bankDetails?: string | null;
    logoUrl?: string | null;
  };
  client: { name: string; email?: string | null; addressLines: string[]; taxId?: string | null };
  lines: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
};

export const InvoiceDocument = ({ data }: { data: InvoicePdfData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={[styles.row, styles.section]}>
        <View>
          {data.business.logoUrl && <Image src={data.business.logoUrl} style={styles.logo} />}
          <Text style={styles.h1}>{data.business.name}</Text>
          {data.business.addressLines.map((l, i) => <Text key={i} style={styles.small}>{l}</Text>)}
          <Text style={styles.small}>{data.business.email}</Text>
        </View>
        <View>
          <Text style={styles.h1}>INVOICE</Text>
          <Text style={styles.small}>{data.number}</Text>
          <Text style={styles.small}>Issued: {data.issueDate}</Text>
          <Text style={styles.small}>Due: {data.dueDate}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.small}>Bill to</Text>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.client.name}</Text>
        {data.client.addressLines.map((l, i) => <Text key={i} style={styles.small}>{l}</Text>)}
        {data.client.email && <Text style={styles.small}>{data.client.email}</Text>}
      </View>

      <View style={styles.table}>
        <View style={styles.tr}>
          <Text style={[styles.th, styles.col1]}>Description</Text>
          <Text style={[styles.th, styles.col2]}>Qty</Text>
          <Text style={[styles.th, styles.col3]}>Price</Text>
          <Text style={[styles.th, styles.col4]}>Amount</Text>
        </View>
        {data.lines.map((l, i) => (
          <View key={i} style={styles.tr}>
            <Text style={styles.col1}>{l.description}</Text>
            <Text style={styles.col2}>{l.quantity}</Text>
            <Text style={styles.col3}>{formatMoney(l.unitPrice, data.currency)}</Text>
            <Text style={styles.col4}>{formatMoney(l.lineTotal, data.currency)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totals}>
        <View style={styles.totalRow}><Text>Subtotal</Text><Text>{formatMoney(data.subtotal, data.currency)}</Text></View>
        {data.discountAmount > 0 && (
          <View style={styles.totalRow}><Text>Discount</Text><Text>-{formatMoney(data.discountAmount, data.currency)}</Text></View>
        )}
        <View style={styles.totalRow}><Text>Tax</Text><Text>{formatMoney(data.taxAmount, data.currency)}</Text></View>
        <View style={[styles.totalRow, styles.grand]}><Text>Total</Text><Text>{formatMoney(data.total, data.currency)}</Text></View>
      </View>

      {data.notes && <View style={{ marginTop: 32 }}><Text style={styles.small}>Notes</Text><Text>{data.notes}</Text></View>}
      {data.terms && <View style={{ marginTop: 16 }}><Text style={styles.small}>Terms</Text><Text>{data.terms}</Text></View>}
      {data.business.bankDetails && <View style={{ marginTop: 24 }}><Text style={styles.small}>Payment</Text><Text>{data.business.bankDetails}</Text></View>}
    </Page>
  </Document>
);
