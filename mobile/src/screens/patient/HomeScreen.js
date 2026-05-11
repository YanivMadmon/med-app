import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Modal, Alert,
} from 'react-native';
import { getTodayMedications, confirmDose, snoozeDose } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [medications, setMedications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reminderModal, setReminderModal] = useState(null); // { scheduleId, scheduledAt, name }

  const today = new Date().toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const loadMedications = useCallback(async () => {
    try {
      const res = await getTodayMedications(user.id);
      setMedications(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [user.id]);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  };

  const handleConfirm = async (scheduleId, scheduledAt) => {
    try {
      await confirmDose(scheduleId, scheduledAt);
      setReminderModal(null);
      await loadMedications();
      Alert.alert('✅ מצוין!', 'נרשמה נטילת התרופה');
    } catch (err) {
      Alert.alert('שגיאה', 'לא ניתן לשמור. נסה שוב.');
    }
  };

  const handleSnooze = async (scheduleId, scheduledAt) => {
    try {
      await snoozeDose(scheduleId, scheduledAt);
      setReminderModal(null);
    } catch (err) {
      Alert.alert('שגיאה', 'לא ניתן לדחות. נסה שוב.');
    }
  };

  const getStatusForSchedule = (schedule) => {
    const now = new Date();
    const [h, m] = schedule.time.split(':').map(Number);
    const scheduleTime = new Date();
    scheduleTime.setHours(h, m, 0, 0);

    const log = schedule.doseLogs?.[0];
    if (log?.status === 'TAKEN') return 'taken';
    if (scheduleTime <= now) return 'due';
    return 'upcoming';
  };

  const statusColors = {
    taken: Colors.success,
    due: Colors.warning,
    upcoming: Colors.border,
  };

  const statusLabels = {
    taken: '✅ נלקח',
    due: '⏰ עכשיו',
    upcoming: '🕐',
  };

  const allSchedules = medications.flatMap((med) =>
    med.schedules.map((s) => ({ ...s, medicationName: med.name, dosage: med.dosage }))
  ).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.date}>{today}</Text>
        <Text style={styles.greeting}>שלום {user?.name} 👋</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {allSchedules.length === 0 && (
          <Text style={styles.emptyText}>אין תרופות להיום 🎉</Text>
        )}

        {allSchedules.map((schedule) => {
          const status = getStatusForSchedule(schedule);
          const scheduledAt = new Date().toISOString().split('T')[0] + 'T' + schedule.time + ':00';

          return (
            <View
              key={schedule.id}
              style={[styles.card, { borderLeftColor: statusColors[status] }]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.statusBadge}>{statusLabels[status]}</Text>
                <Text style={styles.time}>{schedule.time}</Text>
              </View>
              <Text style={styles.medName}>💊 {schedule.medicationName}</Text>
              <Text style={styles.dosage}>{schedule.dosage}</Text>

              {status === 'due' && (
                <TouchableOpacity
                  style={styles.takeButton}
                  onPress={() => setReminderModal({
                    scheduleId: schedule.id,
                    scheduledAt,
                    name: schedule.medicationName,
                  })}
                >
                  <Text style={styles.takeButtonText}>לקחתי ✓</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Reminder Modal */}
      <Modal visible={!!reminderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalIcon}>🔔</Text>
            <Text style={styles.modalTitle}>זמן לתרופה!</Text>
            <Text style={styles.modalMed}>💊 {reminderModal?.name}</Text>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => handleConfirm(reminderModal.scheduleId, reminderModal.scheduledAt)}
            >
              <Text style={styles.modalConfirmText}>✅ לקחתי</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSnoozeBtn}
              onPress={() => handleSnooze(reminderModal.scheduleId, reminderModal.scheduledAt)}
            >
              <Text style={styles.modalSnoozeText}>⏰ תזכיר עוד 10 דקות</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 60,
    paddingBottom: 24, paddingHorizontal: 24,
  },
  greeting: { fontSize: 26, fontWeight: 'bold', color: Colors.white, textAlign: 'right' },
  date: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'right', marginBottom: 4 },
  list: { padding: 16, paddingBottom: 40 },
  emptyText: {
    textAlign: 'center', fontSize: 20, color: Colors.textLight, marginTop: 60,
  },
  card: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 18, marginBottom: 14,
    borderLeftWidth: 6,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  time: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  statusBadge: { fontSize: 15, color: Colors.textLight },
  medName: { fontSize: 22, fontWeight: 'bold', color: Colors.text, textAlign: 'right' },
  dosage: { fontSize: 16, color: Colors.textLight, textAlign: 'right', marginTop: 2 },
  takeButton: {
    backgroundColor: Colors.success, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 14,
  },
  takeButtonText: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 32, alignItems: 'center',
  },
  modalIcon: { fontSize: 48, marginBottom: 8 },
  modalTitle: { fontSize: 26, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  modalMed: { fontSize: 22, color: Colors.textLight, marginBottom: 30 },
  modalConfirmBtn: {
    backgroundColor: Colors.success, borderRadius: 14,
    paddingVertical: 18, width: '100%', alignItems: 'center', marginBottom: 12,
  },
  modalConfirmText: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  modalSnoozeBtn: {
    backgroundColor: Colors.background, borderRadius: 14,
    paddingVertical: 16, width: '100%', alignItems: 'center',
  },
  modalSnoozeText: { color: Colors.textLight, fontSize: 17 },
});
