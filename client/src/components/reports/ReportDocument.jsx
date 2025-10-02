import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// --- FONT REGISTRATION (optional, but recommended for professional look) ---
// In a real app, you would download these font files and place them in your /public folder
// Font.register({ family: 'Inter', fonts: [
//   { src: '/fonts/Inter-Regular.ttf' },
//   { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
// ]});

// --- STYLES ---
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', // A safe fallback if Inter doesn't load
    fontSize: 11,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  coverPage: {
    backgroundColor: '#064e3b', // emerald-900
    color: 'white',
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
  },
  coverLeft: {
    flex: 3,
    padding: 60,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  coverRight: {
    flex: 1,
    backgroundColor: '#6ee7b7', // emerald-300
    borderBottomLeftRadius: 100,
    borderTopLeftRadius: 100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  coverRightText: {
    transform: 'rotate(90deg)',
    fontSize: 14,
    letterSpacing: 2,
    color: '#064e3b',
  },
  coverClientName: {
    fontSize: 14,
    opacity: 0.8,
  },
  coverTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 20,
    lineHeight: 1.2,
  },
  coverDate: {
    marginTop: 30,
    backgroundColor: '#10b981',
    padding: 10,
    fontSize: 12,
    alignSelf: 'flex-start',
  },
  logo: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    width: 60,
    height: 60,
    // Placeholder style for the logo
    backgroundColor: '#f0fdf4',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 10,
    color: '#065f46'
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#065f46',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 10,
    borderBottom: '2px solid #6ee7b7',
    paddingBottom: 5,
  },
  question: {
    fontWeight: 'bold',
    marginTop: 15,
  },
  answer: {
    marginTop: 5,
    color: '#374151',
    lineHeight: 1.5,
  },
});

const ReportDocument = ({ data }) => {
  if (!data) return <Document><Page><Text>Loading...</Text></Page></Document>;

  return (
    <Document>
      {/* --- COVER PAGE --- */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverLeft}>
          <Text style={styles.coverClientName}>{data.client.companyName}</Text>
          <Text style={styles.coverTitle}>{data.reportTitle}</Text>
          <Text style={styles.coverDate}>
            {format(new Date(data.startDate), 'MMMM d, yyyy')} - {format(new Date(data.endDate), 'MMMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.coverRight}>
            <Text style={styles.coverRightText}>Waste Management Services</Text>
        </View>
        <View style={styles.logo}>
            <Text style={styles.logoText}>RecyGlo</Text>
        </View>
      </Page>

      {/* --- CONTENT PAGE --- */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Sustainability Insights</Text>
        <Text style={styles.sectionTitle}>Key Questions & Analysis</Text>
        {data.questions.map(q => (
          <View key={q.id}>
            <Text style={styles.question}>{q.questionText}</Text>
            <Text style={styles.answer}>{q.answerText}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
};

export default ReportDocument;