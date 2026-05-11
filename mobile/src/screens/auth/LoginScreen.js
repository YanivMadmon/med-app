import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { sendOtp } from '../../services/api';
import { Colors } from '../../constants/colors';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 9) {
      Alert.alert('שגיאה', 'נא להזין מספר טלפון תקין');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phone);
      navigation.navigate('Otp', { phone });
    } catch (err) {
      Alert.alert('שגיאה', 'לא ניתן לשלוח קוד כרגע. נסה שוב.');
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>💊</Text>
          <Text style={styles.logoText}>MedApp</Text>
          <Text style={styles.subtitle}>ניהול תרופות לקשישים</Text>
        </View>

        {/* Phone Input */}
        <Text style={styles.label}>מספר טלפון</Text>
        <TextInput
          style={styles.input}
          placeholder="050-000-0000"
          placeholderTextColor={Colors.textLight}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          textAlign="right"
          maxLength={15}
        />

        {/* Send OTP Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'שולח...' : 'שלח קוד אימות'}
          </Text>
        </TouchableOpacity>

        {/* Language toggle */}
        <View style={styles.langRow}>
          <TouchableOpacity><Text style={styles.langActive}>עברית</Text></TouchableOpacity>
          <Text style={styles.langDivider}> | </Text>
          <TouchableOpacity><Text style={styles.langInactive}>English</Text></TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: {
    flex: 1, justifyContent: 'center',
    paddingHorizontal: 30, paddingBottom: 40,
  },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logoIcon: { fontSize: 64 },
  logoText: { fontSize: 36, fontWeight: 'bold', color: Colors.primary, marginTop: 8 },
  subtitle: { fontSize: 16, color: Colors.textLight, marginTop: 4 },
  label: {
    fontSize: 18, color: Colors.text,
    textAlign: 'right', marginBottom: 8, fontWeight: '600',
  },
  input: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 20,
    backgroundColor: Colors.white, color: Colors.text,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
  langRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 30,
  },
  langActive: { fontSize: 16, color: Colors.primary, fontWeight: 'bold' },
  langInactive: { fontSize: 16, color: Colors.textLight },
  langDivider: { color: Colors.border, fontSize: 16 },
});
