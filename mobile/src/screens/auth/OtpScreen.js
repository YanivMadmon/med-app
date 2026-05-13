import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { verifyOtp, sendOtp } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Colors, Radius, Shadow } from '../../constants/colors';

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 60;

export default function OtpScreen({ route, navigation }) {
  const { phone } = route.params;
  const [otp, setOtp]               = useState('');
  const [name, setName]             = useState('');
  const [role, setRole]             = useState('CAREGIVER');
  const [isNewUser, setIsNewUser]   = useState(true);
  const [loading, setLoading]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown]   = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend]   = useState(false);
  const [error, setError]           = useState('');

  const inputRef    = useRef(null);
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const { login }   = useAuthStore();

  // ─── Countdown Timer ───────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ─── Auto-focus input ──────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  // ─── Shake animation on error ─────────────────────────
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ─── Handle OTP input ─────────────────────────────────
  const handleOtpChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    setError('');
    if (digits.length === OTP_LENGTH) {
      handleVerify(digits);
    }
  };

  // ─── Verify OTP ───────────────────────────────────────
  const handleVerify = async (code = otp) => {
    if (code.length !== OTP_LENGTH) {
      setError('נא להזין קוד בן 6 ספרות');
      shake();
      return;
    }
    if (isNewUser && !name.trim()) {
      setError('נא להזין את שמך');
      shake();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(phone, code, name.trim(), role);
      await login(res.data.token, res.data.user);
    } catch (err) {
      const msg = err.response?.data?.error || 'קוד שגוי. נסה שוב.';
      setError(msg);
      setOtp('');
      shake();
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ───────────────────────────────────────
  const handleResend = async () => {
    if (!canResend) return;
    setResendLoading(true);
    try {
      await sendOtp(phone);
      setCountdown(RESEND_COUNTDOWN);
      setCanResend(false);
      setOtp('');
      setError('');
      Alert.alert('✅ נשלח!', 'קוד חדש נשלח לטלפון שלך');
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לשלוח קוד. נסה שוב.');
    } finally {
      setResendLoading(false);
    }
  };

  // ─── OTP Box rendering ────────────────────────────────
  const renderBoxes = () =>
    Array.from({ length: OTP_LENGTH }).map((_, i) => {
      const filled   = i < otp.length;
      const isCurrent = i === otp.length;
      return (
        <View
          key={i}
          style={[
            styles.otpBox,
            filled   && styles.otpBoxFilled,
            isCurrent && styles.otpBoxActive,
            error     && styles.otpBoxError,
          ]}
        >
          <Text style={styles.otpDigit}>{otp[i] || ''}</Text>
        </View>
      );
    });

  const maskedPhone = phone.slice(0, -4) + '****';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ─── Header ─── */}
      <LinearGradient
        colors={Colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>→ חזור</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>קוד אימות</Text>
        <Text style={styles.headerSub}>שלחנו SMS ל-{maskedPhone}</Text>
      </LinearGradient>

      {/* ─── Card ─── */}
      <View style={styles.card}>

        {/* DEV hint */}
        <View style={styles.devBanner}>
          <Text style={styles.devText}>🛠️ מצב פיתוח — קוד: 000000</Text>
        </View>

        {/* OTP Boxes */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
        >
          <Animated.View
            style={[styles.boxesRow, { transform: [{ translateX: shakeAnim }] }]}
          >
            {renderBoxes()}
          </Animated.View>
        </TouchableOpacity>

        {/* Hidden real input */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={otp}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          caretHidden
        />

        {/* Error message */}
        {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

        {/* ─── New User Fields ─── */}
        {isNewUser && (
          <View style={styles.newUserSection}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>פרטים אישיים</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.inputLabel}>שמך המלא</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ישראל ישראלי"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
              textAlign="right"
              returnKeyType="done"
            />

            <Text style={styles.inputLabel}>אני...</Text>
            <View style={styles.roleRow}>
              {[
                { value: 'CAREGIVER', emoji: '👨‍👧', label: 'בן/בת משפחה' },
                { value: 'PATIENT',   emoji: '👴',   label: 'קשיש / מטופל' },
              ].map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.roleBtn, role === r.value && styles.roleBtnActive]}
                  onPress={() => setRole(r.value)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.roleEmoji}>{r.emoji}</Text>
                  <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ─── Verify Button ─── */}
        <TouchableOpacity
          style={[styles.verifyBtn, (loading || otp.length < OTP_LENGTH) && styles.btnDisabled]}
          onPress={() => handleVerify()}
          disabled={loading || otp.length < OTP_LENGTH}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={Colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.verifyBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.verifyBtnText}>אמת ✓</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ─── Resend ─── */}
        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              {resendLoading
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Text style={styles.resendActive}>שלח קוד חדש</Text>
              }
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendCountdown}>
              שליחה מחדש בעוד{' '}
              <Text style={styles.resendTimer}>{countdown}s</Text>
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'right',
  },
  headerSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
    marginTop: 6,
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: 24,
    padding: 24,
    ...Shadow.card,
  },

  // Dev banner
  devBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  devText: {
    color: '#856404',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },

  // OTP Boxes
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  otpBox: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  otpBoxFilled: {
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.white,
  },
  otpBoxActive: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
  },
  otpBoxError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },

  // Hidden input
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },

  // Error
  errorText: {
    textAlign: 'center',
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },

  // New user section
  newUserSection: { marginTop: 16 },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.textLight, fontWeight: '500' },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: 16,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  roleBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 6,
  },
  roleBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EBF5FB',
  },
  roleEmoji: { fontSize: 26 },
  roleLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  roleLabelActive: { color: Colors.primary },

  // Verify button
  verifyBtn: {
    borderRadius: Radius.md,
    marginTop: 20,
    overflow: 'hidden',
    ...Shadow.button,
  },
  btnDisabled: { opacity: 0.5 },
  verifyBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  verifyBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // Resend
  resendRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  resendCountdown: {
    fontSize: 14,
    color: Colors.textLight,
  },
  resendTimer: {
    color: Colors.primary,
    fontWeight: '700',
  },
  resendActive: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
