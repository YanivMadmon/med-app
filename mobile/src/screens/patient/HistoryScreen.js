import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { getDoseHistory } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getDoseHistory(user.id, 7);
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const getScoreEmoji = (pct) => {
    if (pct >= 90) return '🏆 מצוין!';
    if (pct >= 70) return '👍 טוב';
    if (pct >= 50) return '⚠️ יש לשפר';
    return '❗ דורש תשומת לב';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>היסטוריית נטילה</Text>
      <Text style={styles.subtitle}>7 ימים אחרונים</Text>

      {/* Overall Score */}
      <View style={styles.scoreCard}>
        <Text style={styles.scorePercent}>{history?.adherencePercent ?? 0}%</Text>
        <Text style={styles.scoreLabel}>{getScoreEmoji(history?.adherencePercent ?? 0)}</Text>
        <Text style={styles.scoreDetail}>
          {history?.taken ?? 0} מתוך {history?.total ?? 0} מנות נלקחו
        </Text>
      </View>

      {/* Per Medication */}
      {history?.medications?.map((med) => {
        const allLogs = med.schedules.flatMap((s) => s.doseLogs);
        const taken = allLogs.filter((l) => l.status === 'TAKEN').length;
        const total = allLogs.length;
        const pct = total > 0 ? Math.round((taken / total) * 100) : 0;

        return (
          <View key={med.id} style={styles.medCard}>
            <View style={styles.medHeader}>
              <Text style={styles.medPct}>{pct}%</Text>
              <Text style={styles.medName}>{med.name} {med.dosage}</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, textAlign: 'right' },
  subtitle: { fontSize: 15, color: Colors.textLight, textAlign: 'right', marginBottom: 20 },
  scoreCard: {
    backgroundColor: Colors.primary, borderRadius: 20,
    padding: 28, alignItems: 'center', marginBottom: 24,
  },
  scorePercent: { fontSize: 56, fontWeight: 'bold', color: Colors.white },
  scoreLabel: { fontSize: 22, color: Colors.white, marginTop: 4 },
  scoreDetail: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  medCard: {
    backgroundColor: Colors.white, borderRadius: 14,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  medHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  medName: { fontSize: 17, fontWeight: '600', color: Colors.text },
  medPct: { fontSize: 17, fontWeight: 'bold', color: Colors.primary },
  progressBg: {
    height: 10, backgroundColor: Colors.border,
    borderRadius: 5, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 5 },
});
