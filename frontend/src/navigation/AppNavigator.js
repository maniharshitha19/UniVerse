import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { AuthProvider } from '../context/AuthContext';
import { RealtimeProvider } from '../context/RealtimeContext';
import MainTabs from './MainTabs';
import LoginScreen from '../screens/auth/LoginScreen';
import CreatePostScreen from '../screens/posts/CreatePostScreen';
import PostDetailScreen from '../screens/posts/PostDetailScreen';
import CreateTeamScreen from '../screens/teams/CreateTeamScreen';
import TeamDetailScreen from '../screens/teams/TeamDetailScreen';
import TeamRequestsScreen from '../screens/teams/TeamRequestsScreen';
import MyRequestsScreen from '../screens/teams/MyRequestsScreen';
import CreateListingScreen from '../screens/market/CreateListingScreen';
import ListingDetailScreen from '../screens/market/ListingDetailScreen';
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const theme = useTheme();

  // Every screen except Login and the main tabs gets a back-arrow header.
  const withHeader = (title) => ({
    headerShown: true,
    title,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: theme.colors.background },
    headerTintColor: theme.colors.primary,
    headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '700' },
  });

  return (
    <AuthProvider>
      <RealtimeProvider>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />

          <Stack.Screen name="CreatePost" component={CreatePostScreen} options={withHeader('New post')} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} options={withHeader('Post')} />

          <Stack.Screen name="CreateTeam" component={CreateTeamScreen} options={withHeader('Create a team')} />
          <Stack.Screen name="TeamDetail" component={TeamDetailScreen} options={withHeader('Team')} />
          <Stack.Screen name="TeamRequests" component={TeamRequestsScreen} options={withHeader('Join requests')} />
          <Stack.Screen name="MyRequests" component={MyRequestsScreen} options={withHeader('My join requests')} />

          <Stack.Screen name="CreateListing" component={CreateListingScreen} options={withHeader('Sell an item')} />
          <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={withHeader('Listing')} />

          <Stack.Screen name="Conversations" component={ConversationsScreen} options={withHeader('Messages')} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => withHeader(route.params?.title ?? 'Chat')}
          />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={withHeader('Notifications')} />
        </Stack.Navigator>
      </RealtimeProvider>
    </AuthProvider>
  );
}
