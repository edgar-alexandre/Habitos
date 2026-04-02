import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Tela_inicio } from '@/components/pages/Tela_inicio';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen() {
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }
      await Notifications.requestPermissionsAsync();
    })();
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tela_inicio" component={Tela_inicio} />
    </Stack.Navigator>
  );
}
