import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { loadToken, setToken, api } from './api';
import { colors } from './theme';
import { AuthCtx, CartCtx } from './context';

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
import AccountInfoScreen from './screens/AccountInfoScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import InfoScreen from './screens/InfoScreen';
import ResortMapScreen from './screens/ResortMapScreen';
import FrontDeskScreen from './screens/FrontDeskScreen';
import HeritageScreen from './screens/HeritageScreen';
import BreakfastScreen from './screens/BreakfastScreen';
import SeasideAccessScreen from './screens/SeasideAccessScreen';
import HousekeepingScreen from './screens/HousekeepingScreen';
import WellnessScreen from './screens/WellnessScreen';
import RoomServiceScreen from './screens/RoomServiceScreen';
import PoolsScreen from './screens/PoolsScreen';
import CelebrateScreen from './screens/CelebrateScreen';
import EventVenueDetailScreen from './screens/EventVenueDetailScreen';
import TennisScreen from './screens/TennisScreen';
import WaterSportsScreen from './screens/WaterSportsScreen';
import SalonAntoinetteScreen from './screens/SalonAntoinetteScreen';
import LeRodinScreen from './screens/LeRodinScreen';
import SEArenityClubScreen from './screens/SEArenityClubScreen';
import RovePilatesScreen from './screens/RovePilatesScreen';
import CateringScreen from './screens/CateringScreen';
import KidsClubScreen from './screens/KidsClubScreen';
import NurseryScreen from './screens/NurseryScreen';
import EventsListScreen from './screens/EventsListScreen';
import ComedyShowScreen from './screens/ComedyShowScreen';
import MatchDayScreen from './screens/MatchDayScreen';
import TodaysActivitiesListScreen from './screens/TodaysActivitiesListScreen';
import GunClubScreen from './screens/GunClubScreen';
import MarinaScreen from './screens/MarinaScreen';
import MaritimeAcademyScreen from './screens/MaritimeAcademyScreen';
import LandmarksListScreen from './screens/LandmarksListScreen';
import LandmarkDetailScreen from './screens/LandmarkDetailScreen';
import GetToCityScreen from './screens/GetToCityScreen';
import ContactUsScreen from './screens/ContactUsScreen';
import LegalScreen from './screens/LegalScreen';
import LanguageScreen from './screens/LanguageScreen';

const Stack = createNativeStackNavigator();


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
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'Bookings' }} />
      <Stack.Screen name="Orders" component={MyOrdersScreen} options={{ title: 'Orders' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Alerts' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="AccountInfo" component={AccountInfoScreen} options={{ title: 'Account info' }} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'Order history' }} />
      <Stack.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Payment methods' }} />
      <Stack.Screen name="Category" component={CategoryScreen} options={({ route }) => ({ title: route.params?.title || 'Category' })} />
      <Stack.Screen name="FacilityDetail" component={FacilityDetailScreen} options={({ route }) => ({ title: route.params?.title || 'Details' })} />
      <Stack.Screen name="Restaurants" component={RestaurantsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Celebrate" component={CelebrateScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EventVenue" component={EventVenueDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Tennis" component={TennisScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WaterSports" component={WaterSportsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SalonAntoinette" component={SalonAntoinetteScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LeRodin" component={LeRodinScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SEArenityClub" component={SEArenityClubScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RovePilates" component={RovePilatesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Catering" component={CateringScreen} options={{ headerShown: false }} />
      <Stack.Screen name="KidsClub" component={KidsClubScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Nursery" component={NurseryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EventsList" component={EventsListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ComedyShow" component={ComedyShowScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MatchDay" component={MatchDayScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TodaysActivitiesList" component={TodaysActivitiesListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GunClub" component={GunClubScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Marina" component={MarinaScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MaritimeAcademy" component={MaritimeAcademyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LandmarksList" component={LandmarksListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LandmarkDetail" component={LandmarkDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GetToCity" component={GetToCityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Rentals" component={RentalsScreen} options={{ title: 'Rentals' }} />
      <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Events' }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Info" component={InfoScreen} options={{ title: 'Active Requests' }} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Legal" component={LegalScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ResortMap" component={ResortMapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FrontDesk" component={FrontDeskScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Heritage" component={HeritageScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Breakfast" component={BreakfastScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SeasideAccess" component={SeasideAccessScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Housekeeping" component={HousekeepingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Wellness" component={WellnessScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RoomService" component={RoomServiceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Pools" component={PoolsScreen} options={{ headerShown: false }} />
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

  const signInAsGuest = useCallback(() => {
    setUser({ is_guest: true, name: 'Guest' });
  }, []);

  const signOut = useCallback(async () => {
    await setToken(null);
    setUser(null);
    setCart([]);
  }, []);

  const addToCart = useCallback((item, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === item.id && p.restaurant_id === item.restaurant_id);
      if (existing) return prev.map(p => p === existing ? { ...p, qty: p.qty + qty } : p);
      return [...prev, { ...item, qty }];
    });
  }, []);
  const updateCart = useCallback((id, qty) => {
    setCart(prev => qty <= 0 ? prev.filter(p => p.id !== id) : prev.map(p => p.id === id ? { ...p, qty } : p));
  }, []);
  const clearCart = useCallback(() => setCart([]), []);

  useEffect(() => {
    (async () => {
      const minDelay = new Promise(resolve => setTimeout(resolve, 1500));
      const loadAuth = (async () => {
        const token = await loadToken();
        if (token) {
          try {
            const { user } = await api.me();
            setUser(user);
          } catch {
            await setToken(null);
          }
        }
      })();
      await Promise.all([minDelay, loadAuth]);
      setBooting(false);
    })();
  }, []);

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: '#E8E1CB' }}>
        <Image
          source={require('./assets/splash.png')}
          style={{ flex: 1, width: '100%', resizeMode: 'contain' }}
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthCtx.Provider value={{ user, setUser, signIn, signInAsGuest, signOut, isGuest: !!user?.is_guest }}>
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
