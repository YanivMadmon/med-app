import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/index';

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
