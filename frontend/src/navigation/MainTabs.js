import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PlaceholderScreen from '../components/PlaceholderScreen';

const Tab = createBottomTabNavigator();

// [icon when not selected, icon when selected]
const tabIcons = {
  Home: ['home-variant-outline', 'home-variant'],
  Teams: ['account-group-outline', 'account-group'],
  Events: ['calendar-month-outline', 'calendar-month'],
  Market: ['storefront-outline', 'storefront'],
  Profile: ['account-circle-outline', 'account-circle'],
};

export default function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialCommunityIcons
            name={tabIcons[route.name][focused ? 1 : 0]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Teams">
        {() => (
          <PlaceholderScreen
            title="Team finder"
            icon="account-group-outline"
            note="Browse open teams, filter by skill, and send join requests. Coming soon."
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Events">
        {() => (
          <PlaceholderScreen
            title="Events and clubs"
            icon="calendar-month-outline"
            note="Discover events, register in one tap, and follow your clubs. Coming soon."
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Market">
        {() => (
          <PlaceholderScreen
            title="Campus marketplace"
            icon="storefront-outline"
            note="Buy and sell books, gadgets, and more within your campus. Coming soon."
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
