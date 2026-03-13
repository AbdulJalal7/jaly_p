import { Stack } from 'expo-router';

export default function SupportLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'My Support Tickets',
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen 
        name="new" 
        options={{ 
          title: 'Create New Ticket',
          presentation: 'modal',
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Ticket Details',
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
        }} 
      />
    </Stack>
  );
}
