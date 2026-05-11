import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { verifyOtp } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

export default function OtpScreen({ route, navigation }) {
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CAREGIVER');
  const [isNewUser, setIsNewUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('שגיאה', 'קוד האימות חייב להיות 6 ספרות');
      return;
    }
    if (isNewUser && !name.trim()) {
      Alert.alert('שגיאה', 'נא להזין שם');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(phone, code, name, role);
      await login(res.data.token, res.data.user);
    } catch (err) {
      const msg = err.response?.data?.error || 'קוד שגוי או פג תוקף';
      Alert.alert('שגיאה', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>→ חזור</Text>
        </TouchableOpacity>

        <Text style={styles.title}>קוד אימות</Text>
        <Text style={styles.subtitle}>שלחנו קוד ל-{phone}</Text>

        {/* OTP Input */}
        <TextInput
          style={styles.otpInput}
          placeholder="000000"
          placeholderTextColor={Colors.textLight}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          textAlign="center"
          letterSpacing={8}
        />

        {/* New user fields */}
        {isNewUser && (
          <>
            <Text style={styles.label}>שמך המלא</Text>
            <TextInput
              style={styles.input}
              placeholder="ישראל ישראלי"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />

            <Text style={styles.label}>אני...</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'CAREGIVER' && styles.roleBtnActive]}
                onPress={() => setRole('CAREGIVER')}
              >
                <Text style={[styles.roleBtnText, role === 'CAREGIVER' && styles.roleBtnTextActive]}>
                  👨‍👧 בן/בת משפחה
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'PATIENT' && styles.roleBtnActive]}
                onPress={() => setRole('PATIENT')}
              >
                <Text style={[styles.roleBtnText, role === 'PATIENT' && styles.roleBtnTextActive]}>
                  👴 קשיש
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'מאמת...' : 'כניסה ✓'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: 30, paddingTop: 60 },
  backBtn: { marginBottom: 30 },
  backText: { fontSize: 16, color: Colors.primary },
  title: { fontSize: 30, fontWeight: 'bold', color: Colors.text, textAlign: 'right' },
  subtitle: { fontSize: 16, color: Colors.textLight, textAlign: 'right', marginBottom: 30 },
  otpInput: {
    borderWidth: 2, borderColor: Colors.primary,
    borderRadius: 14, paddingVertical: 16,
    fontSize: 32, fontWeight: 'bold',
    backgroundColor: Colors.white, color: Colors.text,
    marginBottom: 30,
  },
  label: {
    fontSize: 16, color: Colors.text,
    textAlign: 'right', marginBottom: 8, fontWeight: '600',
  },
  input: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 18,
    backgroundColor: Colors.white, color: Colors.text, marginBottom: 20,
  },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  roleBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    backgroundColor: Colors.white,
  },
  roleBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F4FD' },
  roleBtnText: { fontSize: 15, color: Colors.textLight },
  roleBtnTextActive: { color: Colors.primary, fontWeight: 'bold' },
  button: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
});
