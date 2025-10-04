// Professional Medical Report PDF Generator
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JournalEntry, HealthInsights, MOOD_LABELS, Attachment } from './healthJournalTypes';
import { format } from 'date-fns';

interface PatientInfo {
  name?: string;
  age?: string;
  gender?: string;
}

interface DoctorReportOptions {
  entries: JournalEntry[];
  insights?: HealthInsights;
  patientInfo?: PatientInfo;
  dateRange?: { start: string; end: string };
}

export const generateDoctorReport = async (options: DoctorReportOptions): Promise<void> => {
  const { entries, insights, patientInfo, dateRange } = options;

  if (entries.length === 0) {
    throw new Error('No entries to generate report');
  }

  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT HEALTH JOURNAL REPORT', 105, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, 105, yPosition, { align: 'center' });

  yPosition += 15;

  // Patient Information Section
  if (patientInfo && (patientInfo.name || patientInfo.age || patientInfo.gender)) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', 20, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (patientInfo.name) {
      doc.text(`Name: ${patientInfo.name}`, 25, yPosition);
      yPosition += 5;
    }
    if (patientInfo.age) {
      doc.text(`Age: ${patientInfo.age}`, 25, yPosition);
      yPosition += 5;
    }
    if (patientInfo.gender) {
      doc.text(`Gender: ${patientInfo.gender}`, 25, yPosition);
      yPosition += 5;
    }
    
    yPosition += 5;
  }

  // Reporting Period
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporting Period', 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const startDate = dateRange?.start || entries[entries.length - 1].date;
  const endDate = dateRange?.end || entries[0].date;
  doc.text(`From: ${format(new Date(startDate), 'MMMM dd, yyyy')}`, 25, yPosition);
  yPosition += 5;
  doc.text(`To: ${format(new Date(endDate), 'MMMM dd, yyyy')}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Total Entries: ${entries.length}`, 25, yPosition);
  yPosition += 10;

  // Clinical Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Clinical Summary', 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Calculate statistics
  const avgMood = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
  const avgSleep = entries.reduce((sum, e) => sum + e.sleepHours, 0) / entries.length;
  const avgSleepQuality = entries.reduce((sum, e) => sum + e.sleepQuality, 0) / entries.length;
  const avgStress = entries.reduce((sum, e) => sum + e.stressLevel, 0) / entries.length;

  doc.text(`• Average Mood: ${avgMood.toFixed(1)}/5 (${MOOD_LABELS[Math.round(avgMood) as 1 | 2 | 3 | 4 | 5]})`, 25, yPosition);
  yPosition += 5;
  doc.text(`• Average Sleep: ${avgSleep.toFixed(1)} hours/night (Quality: ${avgSleepQuality.toFixed(1)}/5)`, 25, yPosition);
  yPosition += 5;
  doc.text(`• Average Stress Level: ${avgStress.toFixed(1)}/5`, 25, yPosition);
  yPosition += 10;

  // Symptom Frequency Analysis
  const symptomFrequency: Record<string, number> = {};
  entries.forEach(entry => {
    entry.symptoms.forEach(symptom => {
      symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
    });
  });

  if (Object.keys(symptomFrequency).length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Symptom Frequency', 20, yPosition);
    yPosition += 7;

    const symptomData = Object.entries(symptomFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([symptom, count]) => [
        symptom,
        count.toString(),
        `${((count / entries.length) * 100).toFixed(1)}%`
      ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Symptom', 'Occurrences', 'Frequency']],
      body: symptomData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20 },
      styles: { fontSize: 9 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Attachments Summary
  const totalAttachments = entries.reduce((total, entry) => {
    return total + (entry.attachments?.length || 0);
  }, 0);

  if (totalAttachments > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Medical Attachments', 20, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Count attachment types
    const attachmentTypes: Record<string, number> = {};
    entries.forEach(entry => {
      entry.attachments?.forEach(att => {
        const type = att.type.replace('_', ' ');
        attachmentTypes[type] = (attachmentTypes[type] || 0) + 1;
      });
    });

    doc.text(`Total Attachments: ${totalAttachments}`, 25, yPosition);
    yPosition += 5;

    Object.entries(attachmentTypes).forEach(([type, count]) => {
      doc.text(`• ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`, 25, yPosition);
      yPosition += 5;
    });

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Note: Attachments are stored digitally and available in the journal history.', 25, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
  }

  // Add new page if needed
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // AI-Detected Patterns
  if (insights && insights.patterns.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI-Detected Health Patterns', 20, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    insights.patterns.slice(0, 5).forEach((pattern, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${pattern.pattern}`, 25, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Type: ${pattern.type} | Confidence: ${Math.round(pattern.confidence * 100)}% | Occurrences: ${pattern.occurrences}`, 30, yPosition);
      yPosition += 5;

      if (pattern.relatedFactors.length > 0) {
        doc.text(`Related Factors: ${pattern.relatedFactors.join(', ')}`, 30, yPosition);
        yPosition += 5;
      }

      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      const recommendation = doc.splitTextToSize(`Recommendation: ${pattern.recommendation}`, 160);
      doc.text(recommendation, 30, yPosition);
      yPosition += recommendation.length * 4 + 3;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
    });

    yPosition += 5;
  }

  // Trends Analysis
  if (insights) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Health Trends', 20, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const getTrendEmoji = (trend: string) => {
      switch (trend) {
        case 'improving': return '↑';
        case 'declining': return '↓';
        default: return '→';
      }
    };

    doc.text(`• Mood Trend: ${getTrendEmoji(insights.trends.moodTrend)} ${insights.trends.moodTrend.toUpperCase()}`, 25, yPosition);
    yPosition += 5;
    doc.text(`• Sleep Trend: ${getTrendEmoji(insights.trends.sleepTrend)} ${insights.trends.sleepTrend.toUpperCase()}`, 25, yPosition);
    yPosition += 10;
  }

  // Timeline of Recent Entries
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Entry Timeline', 20, yPosition);
  yPosition += 7;

  const recentEntries = entries.slice(0, 10).map(entry => [
    format(new Date(entry.date), 'MMM dd, yyyy'),
    MOOD_LABELS[entry.mood],
    `${entry.sleepHours}h`,
    entry.symptoms.slice(0, 3).join(', ') || 'None',
    `Stress: ${entry.stressLevel}/5`
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Date', 'Mood', 'Sleep', 'Symptoms', 'Stress']],
    body: recentEntries,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 20 },
    styles: { fontSize: 8 },
    columnStyles: {
      3: { cellWidth: 50 }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Add new page for detailed entries if needed
  if (entries.length > 10 && yPosition > 200) {
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Entry Log', 20, yPosition);
    yPosition += 7;

    entries.slice(0, 20).forEach((entry, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${format(new Date(entry.date), 'MMM dd, yyyy')} - ${MOOD_LABELS[entry.mood]}`, 25, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      if (entry.symptoms.length > 0) {
        doc.text(`Symptoms: ${entry.symptoms.join(', ')}`, 30, yPosition);
        yPosition += 4;
      }

      if (entry.diet.length > 0) {
        doc.text(`Diet: ${entry.diet.slice(0, 5).join(', ')}`, 30, yPosition);
        yPosition += 4;
      }

      if (entry.notes) {
        const notes = doc.splitTextToSize(`Notes: ${entry.notes}`, 160);
        doc.text(notes, 30, yPosition);
        yPosition += notes.length * 4;
      }

      yPosition += 3;
    });
  }

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('Generated by BioGuard.AI Health Journal', 105, 290, { align: 'center' });
  }

  // Disclaimer
  doc.setPage(pageCount);
  yPosition = 270;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const disclaimer = doc.splitTextToSize(
    'DISCLAIMER: This report is generated from patient self-reported data and AI analysis. It should be used as supplementary information only and does not replace professional medical assessment. Please verify all information with the patient during consultation.',
    170
  );
  doc.text(disclaimer, 20, yPosition);

  // Save PDF
  const filename = `health-journal-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};

export const generateQuickSummary = (entries: JournalEntry[]): string => {
  const avgMood = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
  const avgSleep = entries.reduce((sum, e) => sum + e.sleepHours, 0) / entries.length;
  const avgStress = entries.reduce((sum, e) => sum + e.stressLevel, 0) / entries.length;

  const symptomFrequency: Record<string, number> = {};
  entries.forEach(entry => {
    entry.symptoms.forEach(symptom => {
      symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
    });
  });

  const topSymptoms = Object.entries(symptomFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([symptom]) => symptom);

  return `
Health Summary (${entries.length} entries):
• Mood: ${avgMood.toFixed(1)}/5
• Sleep: ${avgSleep.toFixed(1)} hours/night
• Stress: ${avgStress.toFixed(1)}/5
${topSymptoms.length > 0 ? `• Common Symptoms: ${topSymptoms.join(', ')}` : ''}
  `.trim();
};
