import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/patient/HomeScreen';
import HistoryScreen from '../screens/patient/HistoryScreen';
import { Colors } from '../constants/colors';

const Tab = createBottomTabNavigator();

export default function PatientNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: { height: 65, paddingBottom: 10 },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'medkit-outline',
            History: 'time-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'תרופות' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'היסטוריה' }} />
    </Tab.Navigator>
  );
}
