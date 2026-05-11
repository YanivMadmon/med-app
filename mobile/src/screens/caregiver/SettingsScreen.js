import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('התנתקות', 'האם אתה בטוח שברצונך להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'התנתק', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>הגדרות</Text>
      </View>

      <View style={styles.content}>
        {/* User info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>שם</Text>
          <Text style={styles.cardValue}>{user?.name}</Text>
          <Text style={styles.cardLabel}>טלפון</Text>
          <Text style={styles.cardValue}>{user?.phone}</Text>
          <Text style={styles.cardLabel}>תפקיד</Text>
          <Text style={styles.cardValue}>{user?.role === 'CAREGIVER' ? '👨‍👧 מטפל' : '👴 קשיש'}</Text>
        </View>

        {/* Subscription */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>מנוי</Text>
          <Text style={styles.cardValue}>
            {user?.subscription?.plan === 'PRO' ? '⭐ Pro' :
             user?.subscription?.plan === 'FAMILY' ? '👨‍👩‍👧 Family' : '🆓 חינמי'}
          </Text>
        </View>

        {/* Language */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>שפה</Text>
          <View style={styles.langRow}>
            <TouchableOpacity style={styles.langBtnActive}>
              <Text style={styles.langBtnTextActive}>🇮🇱 עברית</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.langBtn}>
              <Text style={styles.langBtnText}>🇺🇸 English</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>התנתק</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 60,
    paddingBottom: 24, paddingHorizontal: 24,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: Colors.white, textAlign: 'right' },
  content: { padding: 16 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14,
    padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardLabel: { fontSize: 13, color: Colors.textLight, textAlign: 'right', marginBottom: 2 },
  cardValue: { fontSize: 18, fontWeight: '600', color: Colors.text, textAlign: 'right', marginBottom: 12 },
  langRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  langBtnActive: {
    flex: 1, backgroundColor: Colors.primary + '20',
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  langBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  langBtnTextActive: { color: Colors.primary, fontWeight: 'bold' },
  langBtnText: { color: Colors.textLight },
  logoutBtn: {
    backgroundColor: Colors.danger, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  logoutText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
});
