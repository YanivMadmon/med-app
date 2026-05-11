import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { getMyPatients, getDoseHistory } from '../../services/api';
import { Colors } from '../../constants/colors';

export default function HistoryReportScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const patientsRes = await getMyPatients();
        const reports = await Promise.all(
          patientsRes.data.map(async (p) => {
            const histRes = await getDoseHistory(p.id, 7);
            return { patient: p, ...histRes.data };
          })
        );
        setData(reports);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>דוחות שבועיים</Text>
      <Text style={styles.subtitle}>7 ימים אחרונים</Text>

      {data.map(({ patient, adherencePercent, taken, total, medications }) => (
        <View key={patient.id} style={styles.reportCard}>
          <Text style={styles.patientName}>👴 {patient.name}</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.score}>{adherencePercent}%</Text>
            <Text style={styles.scoreDetail}>{taken}/{total} מנות</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${adherencePercent}%` }]} />
          </View>

          {medications?.map((med) => {
            const logs = med.schedules.flatMap((s) => s.doseLogs);
            const takenCount = logs.filter((l) => l.status === 'TAKEN').length;
            const pct = logs.length > 0 ? Math.round((takenCount / logs.length) * 100) : 0;
            return (
              <View key={med.id} style={styles.medRow}>
                <Text style={styles.medPct}>{pct}%</Text>
                <Text style={styles.medName}>{med.name} {med.dosage}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, textAlign: 'right' },
  subtitle: { fontSize: 15, color: Colors.textLight, textAlign: 'right', marginBottom: 20 },
  reportCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  patientName: { fontSize: 20, fontWeight: 'bold', color: Colors.text, textAlign: 'right', marginBottom: 12 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  score: { fontSize: 32, fontWeight: 'bold', color: Colors.primary },
  scoreDetail: { fontSize: 15, color: Colors.textLight },
  progressBg: { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 5 },
  medRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  medName: { fontSize: 15, color: Colors.text },
  medPct: { fontSize: 15, fontWeight: 'bold', color: Colors.primary },
});
