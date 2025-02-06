// Navigation.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../src/paseenger/LoginScreen';
import RegisterScreen from '../src/paseenger/RegisterScreen';
import OTPScreen from '../src/paseenger/OTPScreen';
import HomeScreenC from '../src/driver/HomoScreenP';
import HomeScreenP from '../src/paseenger/HomeScreenP';
import CarListScreen from '../src/paseenger/CarListScreen';
import ThanksScreen from '../src/paseenger/ThanksScreen';
import RouteMapScreen from '../src/paseenger/RouteMapScreen';
import TravelInformation from '../src/paseenger/TravelInformation';
import TravelScreen from '../src/driver/TravelScreen';
import Travell from '../src/paseenger/Travell';
import PassTest from '../src/paseenger/PassTest';

const Stack = createStackNavigator();

export default function Navigation(){
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen}/>
        <Stack.Screen name="RegisterScreen" component={RegisterScreen}/>
        <Stack.Screen name="OTPScreen" component={OTPScreen}/>
        <Stack.Screen name="HomeScreenC" component={HomeScreenC}/>
        <Stack.Screen name="HomeScreenP" component={HomeScreenP}/>
        <Stack.Screen name="CarListScreen" component={CarListScreen}/>
        <Stack.Screen name="ThanksScreen" component={ThanksScreen}/>
        <Stack.Screen name="RouteMapScreen" component={RouteMapScreen}/>
        <Stack.Screen name="TravelInformation" component={TravelInformation}/>
        <Stack.Screen name="TravelScreen" component={TravelScreen}/>
        <Stack.Screen name="Travell" component={Travell}/>
        <Stack.Screen name="PassTest" component={PassTest}/>

        

        
       </Stack.Navigator>
    </NavigationContainer>
  );
};