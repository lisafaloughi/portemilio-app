import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { loadToken, setToken, api } from './api';
import { colors } from './theme';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import CategoryScreen from './screens/CategoryScreen';
import FacilityDetailScreen from './screens/FacilityDetailScreen';
import RestaurantsScreen from './screens/RestaurantsScreen';
import RestaurantDetailScreen from './screens/RestaurantDetailScreen';
import RentalsScreen from './screens/RentalsScreen';
import EventsScreen from './screens/EventsScreen';
import BookingScreen from './screens/BookingScreen';
import MyBookingsScreen from './screens/MyBookingsScreen';
import CartScreen from './screens/CartScreen';
import MyOrdersScreen from './screens/MyOrdersScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import InfoScreen from './screens/InfoScreen';
import ResortMapScreen from './screens/ResortMapScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const AuthCtx = createContext(null);
export const CartCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);
export const useCart = () => useContext(CartCtx);

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function registerPushToken() {
  if (!Device.isDevice) return null;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      finalStatus = req.status;
    }
    if (finalStatus !== 'granted') return null;
    const t = await Notifications.getExpoPushTokenAsync();
    return t.data;
  } catch { return null; }
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.accent },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text>🏨</Text>, title: 'Portemilio', headerShown: false }} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ tabBarIcon: () => <Text>📅</Text>, title: 'Bookings' }} />
      <Tab.Screen name="Orders" component={MyOrdersScreen} options={{ tabBarIcon: () => <Text>🛍️</Text>, title: 'Orders' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarIcon: () => <Text>🔔</Text>, title: 'Alerts' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: () => <Text>👤</Text>, title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.accent },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
        headerBackTitle: 'Home',
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Category" component={CategoryScreen} options={({ route }) => ({ title: route.params?.title || 'Category' })} />
      <Stack.Screen name="FacilityDetail" component={FacilityDetailScreen} options={({ route }) => ({ title: route.params?.title || 'Details' })} />
      <Stack.Screen name="Restaurants" component={RestaurantsScreen} options={{ title: 'Restaurants' }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={({ route }) => ({ title: route.params?.title || 'Restaurant' })} />
      <Stack.Screen name="Rentals" component={RentalsScreen} options={{ title: 'Rentals' }} />
      <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Events' }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your Cart' }} />
      <Stack.Screen name="Info" component={InfoScreen} options={{ title: 'Info' }} />
      <Stack.Screen name="ResortMap" component={ResortMapScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.accent }, headerTintColor: '#fff' }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]); // { restaurant_id, id, name, price, qty }

  const signIn = useCallback(async (token, u) => {
    await setToken(token);
    setUser(u);
    // fire-and-forget — don't block login on permission prompts or push token fetch
    (async () => {
      try {
        const push = await registerPushToken();
        if (push) await api.updateMe({ push_token: push });
      } catch {}
    })();
  }, []);

  const signOut = useCallback(async () => {
    await setToken(null);
    setUser(null);
    setCart([]);
  }, []);

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === item.id && p.restaurant_id === item.restaurant_id);
      if (existing) return prev.map(p => p === existing ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);
  const updateCart = useCallback((id, qty) => {
    setCart(prev => qty <= 0 ? prev.filter(p => p.id !== id) : prev.map(p => p.id === id ? { ...p, qty } : p));
  }, []);
  const clearCart = useCallback(() => setCart([]), []);

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      if (token) {
        try {
          const { user } = await api.me();
          setUser(user);
        } catch {
          await setToken(null);
        }
      }
      setBooting(false);
    })();
  }, []);

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: 1 }}>PORTEMILIO</Text>
        <Text style={{ color: '#ffffffbb', marginTop: 4 }}>Kaslik, Lebanon</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthCtx.Provider value={{ user, setUser, signIn, signOut }}>
        <CartCtx.Provider value={{ cart, addToCart, updateCart, clearCart }}>
          <StatusBar style="light" />
          <NavigationContainer>
            {user ? <AppStack /> : <AuthStack />}
          </NavigationContainer>
        </CartCtx.Provider>
      </AuthCtx.Provider>
    </SafeAreaProvider>
  );
}
