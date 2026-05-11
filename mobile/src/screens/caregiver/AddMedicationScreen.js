import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { createMedication } from '../../services/api';
import { Colors } from '../../constants/colors';

const DEFAULT_TIMES = ['08:00'];

export default function AddMedicationScreen({ route, navigation }) {
  const { patientId, patientName } = route.params ?? {};
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [times, setTimes] = useState(DEFAULT_TIMES);
  const [alertDelay, setAlertDelay] = useState('30');
  const [loading, setLoading] = useState(false);

  const addTime = () => setTimes([...times, '08:00']);
  const removeTime = (index) => setTimes(times.filter((_, i) => i !== index));
  const updateTime = (index, val) => {
    const updated = [...times];
    updated[index] = val;
    setTimes(updated);
  };

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert('שגיאה', 'נא למלא שם תרופה ומינון');
      return;
    }
    if (times.length === 0) {
      Alert.alert('שגיאה', 'נא להוסיף לפחות שעת נטילה אחת');
      return;
    }

    setLoading(true);
    try {
      await createMedication({
        patientId,
        name: name.trim(),
        dosage: dosage.trim(),
        notes: notes.trim(),
        schedules: times.map((time) => ({
          time,
          alertDelayMinutes: parseInt(alertDelay) || 30,
        })),
      });
      Alert.alert('✅ נשמר!', `התרופה "${name}" נוספה בהצלחה`, [
        { text: 'אישור', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('שגיאה', 'לא ניתן לשמור. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>→ חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>הוספת תרופה</Text>
        {patientName && <Text style={styles.subtitle}>עבור {patientName}</Text>}
      </View>

      {/* Medication Name */}
      <Text style={styles.label}>שם התרופה *</Text>
      <TextInput
        style={styles.input}
        placeholder="לדוגמה: אספירין"
        placeholderTextColor={Colors.textLight}
        value={name}
        onChangeText={setName}
        textAlign="right"
      />

      {/* Dosage */}
      <Text style={styles.label}>מינון *</Text>
      <TextInput
        style={styles.input}
        placeholder="לדוגמה: 100mg"
        placeholderTextColor={Colors.textLight}
        value={dosage}
        onChangeText={setDosage}
        textAlign="right"
      />

      {/* Times */}
      <Text style={styles.label}>שעות נטילה *</Text>
      {times.map((time, index) => (
        <View key={index} style={styles.timeRow}>
          <TouchableOpacity onPress={() => removeTime(index)} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.timeInput}
            value={time}
            onChangeText={(val) => updateTime(index, val)}
            placeholder="08:00"
            placeholderTextColor={Colors.textLight}
            keyboardType="numbers-and-punctuation"
            textAlign="center"
          />
        </View>
      ))}
      <TouchableOpacity onPress={addTime} style={styles.addTimeBtn}>
        <Text style={styles.addTimeBtnText}>➕ הוסף שעה</Text>
      </TouchableOpacity>

      {/* Alert Delay */}
      <Text style={styles.label}>התרע אם לא נלקח אחרי (דקות)</Text>
      <TextInput
        style={styles.input}
        value={alertDelay}
        onChangeText={setAlertDelay}
        keyboardType="number-pad"
        textAlign="right"
      />

      {/* Notes */}
      <Text style={styles.label}>הערות (אופציונלי)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="הוראות מיוחדות, אזהרות..."
        placeholderTextColor={Colors.textLight}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        textAlign="right"
        textAlignVertical="top"
      />

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveBtnText}>{loading ? 'שומר...' : '💾 שמור תרופה'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 60 },
  header: { marginBottom: 28, paddingTop: 20 },
  backText: { fontSize: 16, color: Colors.primary, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, textAlign: 'right' },
  subtitle: { fontSize: 16, color: Colors.textLight, textAlign: 'right', marginTop: 4 },
  label: {
    fontSize: 16, color: Colors.text,
    textAlign: 'right', marginBottom: 8,
    fontWeight: '600', marginTop: 12,
  },
  input: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 13, fontSize: 17,
    backgroundColor: Colors.white, color: Colors.text,
  },
  textArea: { height: 90, paddingTop: 12 },
  timeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, gap: 10,
  },
  timeInput: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingVertical: 13, fontSize: 20,
    fontWeight: 'bold', backgroundColor: Colors.white, color: Colors.text,
  },
  removeBtn: {
    backgroundColor: Colors.danger + '22',
    borderRadius: 10, padding: 10,
  },
  removeBtnText: { color: Colors.danger, fontSize: 16, fontWeight: 'bold' },
  addTimeBtn: {
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 8,
  },
  addTimeBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    marginTop: 24, shadowColor: Colors.primary,
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
});
