import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/caregiver/DashboardScreen';
import AddMedicationScreen from '../screens/caregiver/AddMedicationScreen';
import HistoryReportScreen from '../screens/caregiver/HistoryReportScreen';
import SettingsScreen from '../screens/caregiver/SettingsScreen';
import { Colors } from '../constants/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
    </Stack.Navigator>
  );
}

export default function CaregiverNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: { height: 65, paddingBottom: 10 },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            DashboardTab: 'home-outline',
            Report: 'bar-chart-outline',
            Settings: 'settings-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'בית' }} />
      <Tab.Screen name="Report" component={HistoryReportScreen} options={{ title: 'דוחות' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'הגדרות' }} />
    </Tab.Navigator>
  );
}
