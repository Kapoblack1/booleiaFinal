import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { LogBox } from "react-native"; // Import LogBox
import logo from '../../assets/logo.png';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    LogBox.ignoreAllLogs(true); // Desabilita todos os avisos
  }, []);

  const handleLogin = async () => {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;
      
      const userDoc = await firebase.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
    
      if (userData.role === 'condutor') {
        navigation.navigate('HomeScreenC');
      } else {
        navigation.navigate('HomeScreenP');
      }
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
  };

  const createAccount = () => {
    navigation.navigate('RegisterScreen');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={logo} style={styles.logo} />
      </View>
      <Text style={styles.header}>Login</Text>
      <Text style={styles.subtitle}>Seja bem vindo ao booleia</Text>
      <Text style={styles.title}>Email</Text>
      <TextInput
        placeholder="Ex. passageiro@hotmail.com"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={"#000"}
        value={email}
        onChangeText={setEmail}
      />
      <Text style={styles.title}>Senha</Text>
      <TextInput
        placeholder="*******************"
        secureTextEntry
        style={styles.input}
        placeholderTextColor={"#000"}
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity onPress={() => Alert.alert('Esqueceu a senha')}>
        <Text style={styles.forgotPasswordText}>Esqueceu a palavra passe?</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={createAccount} style={styles.signUpButton}>
        <Text>Não tem uma conta?</Text>
        <Text style={styles.signUpText}> Criar conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: "8%",
    backgroundColor: "#ffffff", // Ajuste conforme a cor de fundo da imagem
  },
  logoContainer:{
    alignItems: 'center',
    top: '13%',
  },
  logo:{
    width: 350,
    height: 99
  },
  header: {
    fontSize: 24,
    fontWeight: "500",
    marginTop: "45%",
    marginBottom: 20,
    color: "#000",
  },
  title: {
    fontSize: 16,
    color: "#B9C3CD", // Ajuste conforme a cor do subtítulo da imagem
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    color: "#B9C3CD",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#B9C3CD", // Ajuste conforme a cor da linha do input na imagem
    marginBottom: 45,
    fontSize: 16,
    paddingVertical: 10,
  },
  forgotPasswordText: {
    textAlign: "right",
    color: "#2D93EA", // A cor normalmente usada para links
    marginBottom: 25,
  },
  loginButton: {
    backgroundColor: "#2D93EA", // A cor do botão de login na
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
  },
  termsText: {
    fontSize: 12,
    color: "#2D93EA",
    textAlign: "center",
    marginBottom: 15,
  },
  linkText: {
    color: "#2D93EA", // A cor para textos clicáveis
    textDecorationLine: "underline",
  },
  signUpButton: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signUpText: {
    fontSize: 16,
    color: "#2D93EA",
    textAlign: "center",
  },
});

export default LoginScreen;
