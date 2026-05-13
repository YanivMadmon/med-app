import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { sendOtp, googleAuthApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Colors, Fonts, Radius, Shadow } from '../../constants/colors';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

const COUNTRY_CODES = [
  { code: '+972', flag: '🇮🇱', label: 'ישראל' },
  { code: '+1',   flag: '🇺🇸', label: 'USA' },
  { code: '+44',  flag: '🇬🇧', label: 'UK' },
];

export default function LoginScreen({ navigation }) {
  const [phone, setPhone]           = useState('');
  const [countryCode, setCountryCode] = useState('+972');
  const [showCountry, setShowCountry] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const phoneRef = useRef(null);
  const { login } = useAuthStore();

  // ─── Google OAuth ─────────────────────────────────────
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSuccess(response.authentication.idToken);
    }
  }, [response]);

  const handleGoogleSuccess = async (idToken) => {
    setLoadingGoogle(true);
    try {
      const res = await googleAuthApi(idToken);
      if (res.data.isNew) {
        // New user — needs to pick role
        navigation.navigate('RoleSelect', {
          token: res.data.token,
          user: res.data.user,
        });
      } else {
        await login(res.data.token, res.data.user);
      }
    } catch (err) {
      Alert.alert('שגיאה', 'הכניסה עם Google נכשלה. נסה שוב.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  // ─── OTP Flow ─────────────────────────────────────────
  const handleSendOtp = async () => {
    const fullPhone = countryCode + phone.replace(/\D/g, '');

    if (phone.replace(/\D/g, '').length < 9) {
      Alert.alert('מספר לא תקין', 'נא להזין מספר טלפון מלא');
      return;
    }

    setLoadingOtp(true);
    try {
      await sendOtp(fullPhone);
      navigation.navigate('Otp', { phone: fullPhone });
    } catch (err) {
      Alert.alert('שגיאה', 'לא ניתן לשלוח קוד כרגע. נסה שוב.');
    } finally {
      setLoadingOtp(false);
    }
  };

  const formatPhone = (text) => {
    const digits = text.replace(/\D/g, '');
    setPhone(digits);
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header Gradient ─── */}
        <LinearGradient
          colors={Colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>💊</Text>
          </View>
          <Text style={styles.appName}>MedApp</Text>
          <Text style={styles.tagline}>ניהול תרופות חכם לכל המשפחה</Text>
        </LinearGradient>

        {/* ─── Card ─── */}
        <View style={styles.card}>

          {/* ─── Google Button ─── */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => promptAsync()}
            disabled={!request || loadingGoogle}
            activeOpacity={0.85}
          >
            {loadingGoogle ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>המשך עם Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ─── Divider ─── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>או עם מספר טלפון</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ─── Phone Input ─── */}
          <Text style={styles.inputLabel}>מספר טלפון</Text>
          <View style={styles.phoneRow}>
            {/* Country picker */}
            <TouchableOpacity
              style={styles.countryBtn}
              onPress={() => setShowCountry(!showCountry)}
              activeOpacity={0.8}
            >
              <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
              <Text style={styles.countryCode}>{selectedCountry.code}</Text>
              <Text style={styles.chevron}>{showCountry ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            <TextInput
              ref={phoneRef}
              style={styles.phoneInput}
              placeholder="050-000-0000"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={formatPhone}
              maxLength={10}
              textAlign="left"
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
            />
          </View>

          {/* Country dropdown */}
          {showCountry && (
            <View style={styles.dropdown}>
              {COUNTRY_CODES.map(c => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.dropdownItem, c.code === countryCode && styles.dropdownItemActive]}
                  onPress={() => { setCountryCode(c.code); setShowCountry(false); }}
                >
                  <Text style={styles.dropdownFlag}>{c.flag}</Text>
                  <Text style={styles.dropdownLabel}>{c.label}</Text>
                  <Text style={styles.dropdownCode}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ─── Send OTP Button ─── */}
          <TouchableOpacity
            style={[styles.otpBtn, loadingOtp && styles.btnDisabled]}
            onPress={handleSendOtp}
            disabled={loadingOtp}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={Colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.otpBtnGradient}
            >
              {loadingOtp ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.otpBtnText}>שלח קוד אימות →</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* ─── Language Toggle ─── */}
          <View style={styles.langRow}>
            <TouchableOpacity style={styles.langBtnActive}>
              <Text style={styles.langTextActive}>🇮🇱 עברית</Text>
            </TouchableOpacity>
            <View style={styles.langDivider} />
            <TouchableOpacity style={styles.langBtn}>
              <Text style={styles.langText}>🇺🇸 English</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Terms ─── */}
        <Text style={styles.terms}>
          בהמשך אתה מסכים ל
          <Text style={styles.termsLink}> תנאי השימוש </Text>
          ול
          <Text style={styles.termsLink}> מדיניות הפרטיות</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 48,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 44 },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    fontWeight: '400',
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: Radius.lg,
    padding: 24,
    ...Shadow.card,
  },

  // Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.googleBorder,
    borderRadius: Radius.md,
    paddingVertical: 15,
    backgroundColor: Colors.white,
    gap: 10,
    ...Shadow.card,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500',
  },

  // Phone
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 10,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
    backgroundColor: Colors.background,
  },
  countryFlag: { fontSize: 20 },
  countryCode: { fontSize: 15, fontWeight: '600', color: Colors.text },
  chevron: { fontSize: 10, color: Colors.textLight },
  phoneInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.white,
  },

  // Dropdown
  dropdown: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    marginBottom: 10,
    overflow: 'hidden',
    ...Shadow.card,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: {
    backgroundColor: Colors.background,
  },
  dropdownFlag: { fontSize: 22 },
  dropdownLabel: { flex: 1, fontSize: 16, color: Colors.text, fontWeight: '500' },
  dropdownCode: { fontSize: 15, color: Colors.textSecondary },

  // OTP Button
  otpBtn: {
    borderRadius: Radius.md,
    marginTop: 14,
    overflow: 'hidden',
    ...Shadow.button,
  },
  btnDisabled: { opacity: 0.6 },
  otpBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // Language
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 16,
  },
  langBtnActive: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
  },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  langTextActive: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  langText: { fontSize: 14, color: Colors.textLight, fontWeight: '500' },
  langDivider: { width: 1, height: 16, backgroundColor: Colors.border },

  // Terms
  terms: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  termsLink: {
    color: Colors.primaryLight,
    fontWeight: '600',
  },
});
