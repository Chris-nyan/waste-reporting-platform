import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font, Link } from '@react-pdf/renderer';

// --- Font Registration (ensure files are in /public/fonts) ---
import OswaldBold from '/fonts/Oswald-Bold.ttf';
import LatoRegular from '/fonts/Lato-Regular.ttf';
import LatoBold from '/fonts/Lato-Bold.ttf';

Font.register({ family: 'Oswald', src: OswaldBold });
Font.register({
    family: 'Lato',
    fonts: [
        { src: LatoRegular },
        { src: LatoBold, fontWeight: 'bold' }
    ]
});

// --- Theme Colors ---
const colors = {
    primary: '#1a3a32',
    secondary: '#5f9e8f',
    accent: '#346154',
    textPrimary: '#374151',
    textSecondary: '#6b7280',
    white: '#ffffff',
    lightGray: '#eeeeee',
};

// --- Styles ---
const styles = StyleSheet.create({
    body: { paddingTop: 35, paddingBottom: 65, paddingHorizontal: 35, fontFamily: 'Lato' },
    h1: { fontFamily: 'Oswald', fontSize: 22, color: colors.primary, marginBottom: 10 },
    h2: { fontFamily: 'Oswald', fontSize: 18, color: colors.primary, marginBottom: 8 },
    h3: { fontFamily: 'Lato', fontSize: 14, fontWeight: 'bold', color: colors.primary, marginBottom: 8 },
    paragraph: { fontSize: 11, color: colors.textPrimary, lineHeight: 1.5, textAlign: 'justify' },

    coverPage: { backgroundColor: colors.primary, color: colors.white, justifyContent: 'center' },
    coverContent: { padding: 50 },
    coverTitle: { fontFamily: 'Oswald', fontSize: 48, marginBottom: 20, fontWeight: 'bold' },
    coverSubText: { fontSize: 18, color: '#d1d5db', marginBottom: 40 },
    coverDate: { backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 12, fontSize: 14, alignSelf: 'flex-start' },
    logo: { position: 'absolute', bottom: 60, right: 95, width: 50, height: 50, borderRadius: 25 },

    header: { fontSize: 10, position: 'absolute', top: 15, left: 35, right: 35, textAlign: 'right', color: colors.textSecondary, fontFamily: 'Oswald' },
    footer: { position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', color: colors.textSecondary, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 35, fontSize: 10 },

    tocItem: { flexDirection: 'row', marginBottom: 10 },
    tocLink: { fontSize: 12, textDecoration: 'none', color: colors.textPrimary },
    tocLeader: { flexGrow: 1, borderBottomWidth: 1, borderBottomColor: colors.lightGray, borderStyle: 'dotted', marginHorizontal: 5 },
    tocPageNum: { fontSize: 12, color: colors.textPrimary },

    kpiContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15 },
    kpiBox: { width: '48%', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: colors.lightGray, borderRadius: 5, padding: 15, marginBottom: 10 },
    kpiValue: { fontFamily: 'Oswald', fontSize: 24, color: colors.accent },
    kpiLabel: { fontSize: 10, color: colors.textSecondary },

    chartImage: { width: '100%', height: 200, marginVertical: 15 },

    backCover: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    backCoverText: { color: colors.white, fontSize: 12, fontFamily: 'Lato' },
});

// --- Reusable Components ---
const Header = ({ title }) => <Text style={styles.header} fixed>{title}</Text>;
const Footer = ({ clientName }) => (
    <View style={styles.footer} fixed>
        <Text>{clientName}</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
);

const ReportPDFDocument = ({ report, chartImages }) => {
    const period = `${new Date(report.startDate).toLocaleDateString('en-GB')} - ${new Date(report.endDate).toLocaleDateString('en-GB')}`;

    return (
        <Document author="Rec/Glo" title={`Waste Management Report for ${report.client.companyName}`}>

            {/* Page 1: Cover */}
            <Page size="A4" style={styles.coverPage}>
                <View style={styles.coverContent}>
                    <Text style={styles.coverSubText}>{report.client.companyName}</Text>
                    <Text style={styles.coverTitle}>Waste Management Report</Text>
                    <Text style={styles.coverDate}>{period}</Text>
                </View>
                <Image src="/logo.png" style={styles.logo} />
            </Page>

            {/* Page 2: Table of Contents */}
            <Page size="A4" style={styles.body}>
                <Header title={report.reportTitle} />
                <Text style={styles.h1}>Table of Contents</Text>
                <View style={{ marginTop: 20 }}>
                    <View style={styles.tocItem}><Link style={styles.tocLink} src="#about">1. About This Report</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>3</Text></View>
                    <View style={styles.tocItem}><Link style={styles.tocLink} src="#summary">2. Executive Summary & Methodology</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>4</Text></View>
                    <View style={styles.tocItem}><Link style={styles.tocLink} src="#kpis">3. Key Performance Indicators</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>5</Text></View>
                    <View style={styles.tocItem}><Link style={styles.tocLink} src="#visuals">4. Data Visualizations</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>6</Text></View>
                    <View style={styles.tocItem}><Link style={styles.tocLink} src="#insights">5. Insights & Analysis</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>7</Text></View>
                    <View style={styles.tocItem}><Link style={styles.tocLink} src="#appendix">6. Appendix</Link><Text style={styles.tocLeader}></Text><Text style={styles.tocPageNum}>8</Text></View>
                </View>
                <Footer clientName={report.client.companyName} />
            </Page>

            {/* Page 3: About This Report */}
            <Page size="A4" style={styles.body} id="about">
                <Header title="About This Report" />
                <Text style={styles.h1}>1. About This Report</Text>

                <Text style={[styles.paragraph, { marginTop: 20 }]}>
                    This report has been prepared to provide a clear and holistic account of
                    {report.client.companyName}'s waste management and recycling performance during
                    the reporting period of {period}. It is designed as a communication tool to inform
                    stakeholders, employees, and partners about the progress made in reducing waste,
                    improving recycling practices, and contributing to environmental sustainability.
                </Text>

                <Text style={styles.paragraph}>
                    The scope of the report covers all major waste streams generated by
                    {report.client.companyName}, including recyclables, general waste, and any
                    materials sent to landfill. By consolidating data from operations, disposal
                    partners, and monitoring systems, the report offers both high-level
                    performance indicators and detailed insights into environmental impact.
                </Text>

                <Text style={styles.paragraph}>
                    The purpose of this document is twofold: firstly, to present verifiable
                    performance metrics that demonstrate transparency and accountability; and
                    secondly, to highlight the broader social and environmental value of
                    responsible waste management. In doing so, the report goes beyond
                    numerical data to show how sustainability practices align with global
                    objectives, such as the United Nations Sustainable Development Goals (SDGs).
                </Text>

                <Text style={styles.paragraph}>
                    The report is intended for multiple audiences — including management teams,
                    employees, customers, and external stakeholders — each of whom plays a
                    role in advancing sustainability. For management, it serves as a tool to
                    evaluate progress and set future targets. For employees, it provides
                    recognition of their contributions and reinforces a culture of
                    environmental responsibility. For customers and partners, it builds trust
                    by demonstrating a measurable commitment to sustainability.
                </Text>

                <Text style={styles.paragraph}>
                    While this edition provides a snapshot of current performance, the structure
                    has been designed to support ongoing monitoring and future comparison.
                    Subsequent reports will allow for year-on-year analysis, trend evaluation,
                    and benchmarking against industry standards. This ensures that
                    {report.client.companyName} not only measures its impact but also builds
                    a roadmap toward continuous improvement and long-term resilience.
                </Text>

                <Footer clientName={report.client.companyName} />
            </Page>

            {/* Page 4: Executive Summary + Methodology */}
            <Page size="A4" style={styles.body} id="summary">
                <Header title={report.reportTitle} />
                <Text style={styles.h1}>2. Executive Summary & Methodology</Text>

                {/* Executive Summary */}
                <Text style={[styles.paragraph, { marginTop: 20 }]}>
                    This waste management and recycling report presents a detailed overview of the performance
                    of {report.client.companyName} for the reporting period of {period}. The primary aim is to
                    provide both quantitative results and qualitative insights into the impact of current
                    sustainability practices.
                </Text>
                <Text style={styles.paragraph}>
                    During this period, {report.client.companyName} successfully diverted
                    <Text style={{ fontWeight: "bold" }}> {report.totalWeightRecycled} kg</Text> of waste from landfills.
                    This achievement translates into a measurable environmental benefit of
                    <Text style={{ fontWeight: "bold" }}> {report.netImpact} kg CO₂e avoided</Text>,
                    comparable to removing {report.carsOffRoadEquivalent} passenger cars from the road for a year.
                    Additionally, the recycling efforts contributed to the conservation of natural resources,
                    equivalent to saving {report.treesSaved} mature trees and preserving approximately
                    {report.landfillSpaceSaved} m³ of landfill space.
                </Text>
                <Text style={styles.paragraph}>
                    Beyond the metrics, these results reflect a strong organizational commitment to environmental
                    responsibility, aligning with global climate targets and sustainable development goals.
                    The report underscores how effective waste management not only reduces costs and regulatory risks
                    but also enhances corporate reputation and stakeholder trust.
                </Text>

                {/* Methodology */}
                <Text style={[styles.h2, { marginTop: 25 }]}>Methodology</Text>
                <Text style={styles.paragraph}>
                    To ensure accuracy and transparency, this report was developed through a structured methodology
                    that combined data collection, processing, and analysis. Waste stream data was obtained from
                    operational records, disposal partners, and on-site monitoring. All figures were standardized
                    to kilograms for comparability, and cross-checked with verified third-party conversion factors.
                </Text>
                <Text style={styles.paragraph}>
                    Recycling and diversion rates were calculated by comparing the weight of materials sent for
                    recycling against the total waste generated. Environmental impact indicators, such as CO₂e
                    reduction, were derived using internationally recognized emission factors. To enhance readability,
                    the results are presented both in numerical form (Key Performance Indicators) and visually
                    (charts and graphs).
                </Text>
                <Text style={styles.paragraph}>
                    Qualitative insights were gathered from responses to sustainability questionnaires completed
                    by {report.client.companyName}. These responses were integrated into the “Insights & Analysis”
                    section to provide context for the quantitative results, highlight ongoing challenges, and
                    identify opportunities for improvement.
                </Text>
                <Text style={styles.paragraph}>
                    Together, this methodology ensures that the report is not only a snapshot of past performance
                    but also a strategic tool to guide future sustainability planning and continuous improvement.
                </Text>

                <Footer clientName={report.client.companyName} />
            </Page>

            {/* Page 5: KPIs */}
            <Page size="A4" style={styles.body}>
                <Header title={report.reportTitle} />
                <Text style={styles.h1} id="kpis">3. Key Performance Indicators</Text>
                <View style={styles.kpiContainer}>
                    <View style={styles.kpiBox}><Text style={styles.kpiValue}>{report.totalWeightRecycled} kg</Text><Text style={styles.kpiLabel}>Total Weight Recycled</Text></View>
                    <View style={styles.kpiBox}><Text style={styles.kpiValue}>{report.diversionRate}%</Text><Text style={styles.kpiLabel}>Waste Diversion Rate</Text></View>
                    <View style={styles.kpiBox}><Text style={styles.kpiValue}>{report.netImpact} kg</Text><Text style={styles.kpiLabel}>Net CO2e Impact</Text></View>
                    <View style={styles.kpiBox}><Text style={styles.kpiValue}>{report.carsOffRoadEquivalent}</Text><Text style={styles.kpiLabel}>Cars Off-Road Equivalent (Annual)</Text></View>
                    <View style={styles.kpiBox}><Text style={styles.kpiValue}>{report.treesSaved}</Text><Text style={styles.kpiLabel}>Trees Saved (Equivalent)</Text></View>
                    <View style={styles.kpiBox}><Text style={styles.kpiValue}>{report.landfillSpaceSaved} m³</Text><Text style={styles.kpiLabel}>Landfill Space Saved (Approx.)</Text></View>
                </View>
                <Footer clientName={report.client.companyName} />
            </Page>

            {/* Page 6: Data Visualizations */}
            <Page size="A4" style={styles.body} id="visuals">
                <Header title={report.reportTitle} />
                <Text style={styles.h1}>4. Data Visualizations</Text>
                {chartImages.bar && (<View><Text style={styles.h3}>Emissions Overview</Text><Image src={chartImages.bar} style={styles.chartImage} /></View>)}
                {chartImages.pie && (<View><Text style={styles.h3}>Emissions Breakdown</Text><Image src={chartImages.pie} style={styles.chartImage} /></View>)}
                <Footer clientName={report.client.companyName} />
            </Page>

            {/* Page 7: Insights */}
            <Page size="A4" style={styles.body} id="insights">
                <Header title={report.reportTitle} />
                <Text style={styles.h1}>5. Insights & Analysis</Text>
                {report.questions.map((q) => (
                    <View key={q.id} style={{ marginBottom: 20 }}>
                        <Text style={styles.h3}>{q.text}</Text>
                        <Text style={styles.paragraph}>{q.answerText || "No answer provided."}</Text>
                    </View>
                ))}
                <Footer clientName={report.client.companyName} />
            </Page>

            {/* Page 8: Appendix */}
            <Page size="A4" style={styles.body} id="appendix">
                <Header title="Appendix" />
                <Text style={styles.h1}>6. Appendix</Text>
                <Text style={[styles.paragraph, { marginTop: 20 }]}>
                    Glossary of Terms:
                </Text>
                <Text style={styles.paragraph}>
                    • Diversion Rate: % of waste diverted from landfill.{"\n"}
                    • Net Impact: Net carbon emissions impact after accounting for logistics + recycling.
                </Text>
                <Text style={styles.paragraph}>
                    Additional Notes: This appendix provides definitions and reference details for interpreting the results.
                </Text>
                <Footer clientName={report.client.companyName} />
            </Page>

            {/* Final Page: Back Cover */}
            <Page size="A4" style={styles.backCover}>
                <Image src="/logo.png" style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 20 }} />
                <Text style={styles.backCoverText}>Thank you for your commitment to sustainability.</Text>
            </Page>
        </Document>
    );
};

export default ReportPDFDocument;