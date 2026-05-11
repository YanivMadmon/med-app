import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import PatientNavigator from './PatientNavigator';
import CaregiverNavigator from './CaregiverNavigator';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : user.role === 'PATIENT' ? (
        <PatientNavigator />
      ) : (
        <CaregiverNavigator />
      )}
    </NavigationContainer>
  );
}
