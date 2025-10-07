import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font, Link } from '@react-pdf/renderer';

// --- Font Registration (ensure files are in /public/fonts) ---
import OswaldBold from '/fonts/Oswald-Bold.ttf';
import LatoRegular from '/fonts/Lato-Regular.ttf';
import LatoBold from '/fonts/Lato-Bold.ttf';

Font.register({ family: 'Oswald', src: OswaldBold });
Font.register({ family: 'Lato', fonts: [{ src: LatoRegular }, { src: LatoBold, fontWeight: 'bold' }]});

// --- Theme Colors ---
const colors = {
    primary: '#004d40',   // Darker, more corporate green
    secondary: '#00796b', // A slightly brighter teal green
    accent: '#4db6ac',    // Light teal accent
    textPrimary: '#212121', // Almost black
    textSecondary: '#757575', // Gray
    white: '#ffffff',
    bgGray: '#f5f5f5',    // Light gray for content backgrounds
    lightGray: '#e0e0e0',  // Borders
};

// --- Stylesheet ---
const styles = StyleSheet.create({
    // --- LAYOUT & TYPOGRAPHY ---
    body: { fontFamily: 'Lato', color: colors.textPrimary },
    h1: { fontFamily: 'Oswald', fontSize: 24, color: colors.primary, marginBottom: 15 },
    h2: { fontFamily: 'Oswald', fontSize: 18, color: colors.primary, marginBottom: 10, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
    h3: { fontFamily: 'Lato', fontSize: 12, fontWeight: 'bold', color: colors.secondary, marginBottom: 5 },
    paragraph: { fontSize: 10, color: colors.textPrimary, lineHeight: 1.6, textAlign: 'justify' },
    smallText: { fontSize: 8, color: colors.textSecondary },
    pageWrapper: { paddingTop: 50, paddingBottom: 50, paddingHorizontal: 40, backgroundColor: colors.bgGray },
    mainContent: { backgroundColor: colors.white, padding: 20, borderRadius: 5, border: `1px solid ${colors.lightGray}` },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    col: { flexGrow: 1, flexShrink: 1 },
    col30: { width: '30%' },
    col70: { width: '68%' },

    // --- COVER PAGE ---
    coverPage: { position: 'relative' },
    backgroundImage: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' },
    overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0, 77, 64, 0.7)' }, // Dark green overlay
    coverContent: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 40 },
    coverHeader: { display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' },
    coverLogo: { width: 120 },
    coverFooter: { borderTop: '1px solid rgba(255, 255, 255, 0.5)' , paddingTop: 15 },
    coverTitle: { fontFamily: 'Oswald', fontSize: 38, color: colors.white, marginBottom: 10, lineHeight: 1.2 },
    coverSubtitle: { fontSize: 16, color: colors.white, marginBottom: 20 },
    coverClient: { fontFamily: 'Oswald', fontSize: 20, color: colors.white },

    // --- HEADER & FOOTER ---
    header: { fontSize: 9, position: 'absolute', top: 30, left: 40, right: 40, color: colors.textSecondary, fontFamily: 'Oswald', textTransform: 'uppercase' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerLogo: { width: 60 },

    // --- TABLE OF CONTENTS ---
    tocItem: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
    tocLink: { fontSize: 12, textDecoration: 'none', color: colors.primary, fontWeight: 'bold' },
    tocLeader: { flexGrow: 1, borderBottomWidth: 1, borderBottomColor: colors.lightGray, borderStyle: 'dotted', marginHorizontal: 8, transform: 'translateY(-4px)' },
    tocPageNum: { fontSize: 12, color: colors.textPrimary, fontFamily: 'Oswald' },

    // --- KPI GRID ---
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 },
    kpiItem: { width: '32%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lightGray, borderRadius: 5, padding: 12, marginBottom: 10, alignItems: 'center' },
    kpiValue: { fontFamily: 'Oswald', fontSize: 20, color: colors.secondary },
    kpiLabel: { fontSize: 9, color: colors.textSecondary, textAlign: 'center', marginTop: 5 },

    // --- CHARTS & VISUALS ---
    chartImage: { width: '100%', height: 'auto', marginTop: 10, marginBottom: 20 },

    // --- APPENDIX ---
    disclaimer: { marginTop: 30, fontSize: 8, color: colors.textSecondary, fontStyle: 'italic' },
});

// --- Reusable Page Wrapper Component ---
const PageWrapper = ({ children, headerText }) => (
    <Page size="A4" style={styles.body}>
        <View style={styles.pageWrapper}>
            <Header title={headerText} />
            <View style={styles.mainContent}>
                {children}
            </View>
            <Footer clientName={headerText} />
        </View>
    </Page>
);
const Header = ({ title }) => <Text style={styles.header} fixed>{title}</Text>;
const Footer = ({ clientName }) => (
    <View style={styles.footer} fixed>
        <Image src="/logo.png" style={styles.footerLogo} />
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} style={styles.smallText} />
    </View>
);

// --- MAIN DOCUMENT ---
const ReportPDFDocument = ({ report, chartImages }) => {
    const period = `${new Date(report.startDate).toLocaleDateString('en-GB')} to ${new Date(report.endDate).toLocaleDateString('en-GB')}`;

    return (
    <Document author="Your Company" title={`Carbon Emission Report for ${report.client.companyName}`}>
        {/* Page 1: Cover */}
        <Page size="A4" style={styles.coverPage}>
            <Image src="/cover-background.png" style={styles.backgroundImage} />
            <View style={styles.overlay} />
            <View style={styles.coverContent}>
                <View style={styles.coverHeader}><Image src="/logo.png" style={styles.coverLogo} /></View>
                <View style={styles.coverFooter}>
                    <Text style={styles.coverTitle}>CARBON EMISSION REPORT</Text>
                    <Text style={styles.coverSubtitle}>FOR WASTE MANAGEMENT ACTIVITIES</Text>
                    <Text style={styles.coverClient}>{report.client.companyName}</Text>
                </View>
            </View>
        </Page>
        
        {/* Page 2: Table of Contents */}
        <PageWrapper headerText={`Report for ${report.client.companyName} | ${period}`}>
            <Text style={styles.h1}>Table of Contents</Text>
            <View style={{ marginTop: 30 }}>
                <View style={styles.tocItem}><Link style={styles.tocLink} src="#summary">1. Executive Summary</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>3</Text></View>
                <View style={styles.tocItem}><Link style={styles.tocLink} src="#methodology">2. Methodology</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>4</Text></View>
                <View style={styles.tocItem}><Link style={styles.tocLink} src="#kpis">3. Key Performance Indicators</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>5</Text></View>
                <View style={styles.tocItem}><Link style={styles.tocLink} src="#visuals">4. Data Visualizations</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>6</Text></View>
                <View style={styles.tocItem}><Link style={styles.tocLink} src="#insights">5. Insights & Analysis</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>7</Text></View>
                <View style={styles.tocItem}><Link style={styles.tocLink} src="#appendix">6. Appendix & Disclaimer</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>8</Text></View>
            </View>
        </PageWrapper>

        {/* Page 3: Executive Summary */}
        <PageWrapper headerText={`Report for ${report.client.companyName} | ${period}`} id="summary">
            <Text style={styles.h1}>1. Executive Summary</Text>
            <Text style={styles.paragraph}>
                This report quantifies the greenhouse gas (GHG) savings achieved by {report.client.companyName} for the period of {period}, as a result of its sustainable waste management services. The primary purpose is to provide transparent and actionable insights into the company's environmental impact.
            </Text>
            <Text style={styles.paragraph}>
                During this period, a total of <Text style={{fontWeight: 'bold'}}>{report.totalWeightRecycled} kg</Text> of materials were successfully recycled, achieving a waste diversion rate of <Text style={{fontWeight: 'bold'}}>{report.diversionRate}%</Text>. These efforts resulted in a significant net reduction of greenhouse gas emissions, totaling <Text style={{fontWeight: 'bold'}}>{report.netImpact} kg of CO₂ equivalent (CO₂e)</Text>.
            </Text>
            <Text style={styles.paragraph}>
                This positive environmental impact is equivalent to taking approximately <Text style={{fontWeight: 'bold'}}>{report.carsOffRoadEquivalent}</Text> passenger cars off the road for a year. The following pages provide a detailed breakdown of these metrics, our calculation methodologies, and further analysis.
            </Text>
        </PageWrapper>

        {/* Page 4: Methodology */}
        <PageWrapper headerText={`Report for ${report.client.companyName} | ${period}`} id="methodology">
            <Text style={styles.h1}>2. Methodology</Text>
            <Text style={styles.h3}>GHG Assessment Framework</Text>
            <Text style={styles.paragraph}>The GHG emission assessment in this report was conducted using internationally recognized methodologies and country-specific emission factors, adjusted for local conditions. Our framework is consistent with the GHG Protocol Corporate Value Chain (Scope 3) Standard and ISO 14064-1 guidelines.</Text>
            <Text style={styles.h3}>Emission Calculation</Text>
            <Text style={styles.paragraph}>Direct emissions, avoided emissions from virgin material substitution, and avoided emissions from landfilling were quantified. The net emissions balance was derived using the formula:{"\n\n"}
            <Text style={{fontFamily: 'Courier', fontSize: 10, color: colors.primary}}>Net GHG Emissions = Direct Emissions - Avoided Virgin Material Emissions - Avoided Landfill Emissions</Text>{"\n\n"}
            Negative values represent a net climate benefit, confirming that recycling practices reduce overall GHG emissions.
            </Text>
            <Text style={styles.disclaimer}>*While this report provides an overview of the methodologies and frameworks applied, we are unable to disclose the full detailed calculation models, as they constitute proprietary intellectual property and trade secrets. We welcome independent verification and are open to any organization commissioning a qualified third-party auditor to review and validate our methodology and results.</Text>
        </PageWrapper>
        
        {/* Page 5: Key Performance Indicators */}
        <PageWrapper headerText={`Report for ${report.client.companyName} | ${period}`} id="kpis">
            <Text style={styles.h1}>3. Key Performance Indicators</Text>
            <View style={styles.kpiGrid}>
                <View style={styles.kpiItem}><Text style={styles.kpiValue}>{report.totalWeightRecycled} kg</Text><Text style={styles.kpiLabel}>Total Weight Recycled</Text></View>
                <View style={styles.kpiItem}><Text style={styles.kpiValue}>{report.diversionRate}%</Text><Text style={styles.kpiLabel}>Waste Diversion Rate</Text></View>
                <View style={styles.kpiItem}><Text style={styles.kpiValue}>{report.netImpact} kg</Text><Text style={styles.kpiLabel}>Net CO₂e Impact</Text></View>
                <View style={styles.kpiItem}><Text style={styles.kpiValue}>{report.carsOffRoadEquivalent}</Text><Text style={styles.kpiLabel}>Cars Off-Road (Annual Equiv.)</Text></View>
                <View style={styles.kpiItem}><Text style={styles.kpiValue}>{report.treesSaved}</Text><Text style={styles.kpiLabel}>Trees Saved (Equivalent)</Text></View>
                <View style={styles.kpiItem}><Text style={styles.kpiValue}>{report.landfillSpaceSaved} m³</Text><Text style={styles.kpiLabel}>Landfill Space Saved</Text></View>
            </View>
        </PageWrapper>

        {/* Page 6: Data Visualizations */}
        <PageWrapper headerText={`Report for ${report.client.companyName} | ${period}`} id="visuals">
            <Text style={styles.h1}>4. Data Visualizations</Text>
            <View style={styles.row}>
                <View style={styles.col70}>
                    {chartImages.bar && <Image src={chartImages.bar} style={styles.chartImage} />}
                </View>
                <View style={styles.col30}>
                    <Text style={styles.h3}>Emissions Overview</Text>
                    <Text style={styles.paragraph}>This chart illustrates the total emissions breakdown. 'Avoided' represents the significant GHG savings, while 'Logistics' and 'Recycling' represent the emissions generated during the process.</Text>
                </View>
            </View>
            <View style={styles.row}>
                <View style={styles.col30}>
                    <Text style={styles.h3}>Process Emissions</Text>
                    <Text style={styles.paragraph}>This chart shows the proportion of direct emissions generated from logistics (transport) versus the recycling process itself.</Text>
                </View>
                <View style={styles.col70}>
                    {chartImages.pie && <Image src={chartImages.pie} style={styles.chartImage} />}
                </View>
            </View>
        </PageWrapper>

        {/* Page 7: Insights & Analysis */}
        <PageWrapper headerText={`Report for ${report.client.companyName} | ${period}`} id="insights">
            <Text style={styles.h1}>5. Insights & Analysis</Text>
            {report.questions.map((q) => (
                <View key={q.id} style={{ marginBottom: 20 }} wrap={false}>
                    <Text style={styles.h2}>{q.questionText}</Text>
                    <Text style={styles.paragraph}>{q.answerText || "No answer provided for this question."}</Text>
                </View>
            ))}
        </PageWrapper>

         {/* Page 8: Appendix */}
        <PageWrapper headerText={`Report for ${report.client.companyName} | ${period}`} id="appendix">
            <Text style={styles.h1}>6. Appendix & Disclaimer</Text>
            <Text style={styles.h2}>Glossary of Terms</Text>
            <Text style={styles.paragraph}><Text style={{fontWeight: 'bold'}}>CO₂e (Carbon Dioxide Equivalent):</Text> A standard unit for measuring carbon footprints. It converts the impact of different greenhouse gases into the equivalent amount of carbon dioxide.</Text>
            <Text style={styles.paragraph}><Text style={{fontWeight: 'bold'}}>Waste Diversion Rate:</Text> The percentage of total waste generated by an organization that is diverted from landfill disposal through recycling, composting, or reuse.</Text>
            <Text style={styles.paragraph}><Text style={{fontWeight: 'bold'}}>Net GHG Emissions:</Text> The final balance of emissions after subtracting the total avoided emissions from the total direct emissions generated by waste management activities.</Text>
            
            <Text style={styles.disclaimer}>The calculations and equivalencies presented in this report are based on a combination of submitted data and established, publicly available conversion factors from sources including the U.S. Environmental Protection Agency (EPA). These figures are provided for estimation and communication purposes. This report is not an official GHG inventory and has not been verified by a third-party auditor. For official carbon accounting or compliance purposes, a formal third-party verification is recommended.</Text>
        </PageWrapper>
    </Document>
)};

export default ReportPDFDocument;