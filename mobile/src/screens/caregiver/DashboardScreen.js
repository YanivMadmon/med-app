import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { getMyPatients, getMissedDoses } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState([]);
  const [missedDoses, setMissedDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getMyPatients();
      setPatients(res.data);

      // Load missed doses for all patients
      const missed = await Promise.all(
        res.data.map((p) => getMissedDoses(p.id).then((r) => r.data))
      );
      setMissedDoses(missed.flat());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>שלום {user?.name} 👋</Text>
        <Text style={styles.subGreeting}>דאשבורד מטפל</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Missed doses alert */}
        {missedDoses.length > 0 && (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>⚠️ מנות שנפספסו היום</Text>
            {missedDoses.map((d) => (
              <Text key={d.id} style={styles.alertItem}>
                • {d.schedule?.medication?.name} — {d.schedule?.time}
              </Text>
            ))}
          </View>
        )}

        {/* Patients */}
        {patients.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>עדיין לא קישרת קשיש</Text>
            <Text style={styles.emptySubText}>לחץ על הכפתור למטה להוסיף</Text>
          </View>
        ) : (
          patients.map((patient) => {
            const totalMeds = patient.medications?.length ?? 0;
            return (
              <View key={patient.id} style={styles.patientCard}>
                <View style={styles.patientHeader}>
                  <Text style={styles.patientName}>👴 {patient.name}</Text>
                  <Text style={styles.patientPhone}>{patient.phone}</Text>
                </View>
                <Text style={styles.patientMeds}>{totalMeds} תרופות פעילות</Text>
                <TouchableOpacity
                  style={styles.addMedBtn}
                  onPress={() => navigation.navigate('AddMedication', { patientId: patient.id, patientName: patient.name })}
                >
                  <Text style={styles.addMedBtnText}>➕ הוסף תרופה</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Add patient button */}
        <TouchableOpacity
          style={styles.addPatientBtn}
          onPress={() => navigation.navigate('AddMedication', { linkPatient: true })}
        >
          <Text style={styles.addPatientText}>👴 קשר קשיש חדש</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.primary, paddingTop: 60,
    paddingBottom: 24, paddingHorizontal: 24,
  },
  greeting: { fontSize: 26, fontWeight: 'bold', color: Colors.white, textAlign: 'right' },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  content: { padding: 16, paddingBottom: 40 },
  alertCard: {
    backgroundColor: '#FFF3CD', borderRadius: 14,
    padding: 16, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: Colors.warning,
  },
  alertTitle: { fontSize: 17, fontWeight: 'bold', color: '#856404', textAlign: 'right', marginBottom: 8 },
  alertItem: { fontSize: 15, color: '#856404', textAlign: 'right', marginBottom: 4 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 20, color: Colors.textLight, marginBottom: 8 },
  emptySubText: { fontSize: 15, color: Colors.textLight },
  patientCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  patientName: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  patientPhone: { fontSize: 14, color: Colors.textLight },
  patientMeds: { fontSize: 15, color: Colors.textLight, textAlign: 'right', marginBottom: 14 },
  addMedBtn: {
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  addMedBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  addPatientBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center', marginTop: 8,
  },
  addPatientText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
});
