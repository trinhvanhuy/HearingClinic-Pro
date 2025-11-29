import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Parse from 'parse'
import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import ClientListScreen from '../screens/ClientListScreen'
import ClientDetailScreen from '../screens/ClientDetailScreen'
import ClientFormScreen from '../screens/ClientFormScreen'
import HearingReportFormScreen from '../screens/HearingReportFormScreen'
import HearingReportDetailScreen from '../screens/HearingReportDetailScreen'
import ReminderListScreen from '../screens/ReminderListScreen'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard', headerTitle: 'Dashboard' }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientListScreen}
        options={{ tabBarLabel: 'Clients', headerTitle: 'Clients' }}
      />
      <Tab.Screen
        name="Reminders"
        component={ReminderListScreen}
        options={{ tabBarLabel: 'Reminders', headerTitle: 'Reminders' }}
      />
    </Tab.Navigator>
  )
}

export default function RootNavigator() {
  const [user, setUser] = React.useState<Parse.User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const currentUser = Parse.User.current()
    setUser(currentUser)
    setLoading(false)
  }, [])

  if (loading) {
    return null // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="ClientDetail"
              component={ClientDetailScreen}
              options={{ headerShown: true, title: 'Client Details' }}
            />
            <Stack.Screen
              name="ClientForm"
              component={ClientFormScreen}
              options={{ headerShown: true, title: 'Client' }}
            />
            <Stack.Screen
              name="HearingReportForm"
              component={HearingReportFormScreen}
              options={{ headerShown: true, title: 'Hearing Report' }}
            />
            <Stack.Screen
              name="HearingReportDetail"
              component={HearingReportDetailScreen}
              options={{ headerShown: true, title: 'Hearing Report' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

