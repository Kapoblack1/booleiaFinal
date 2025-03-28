import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { firebaseConfig } from "../../config";
import forbidden from "../../assets/forbidden.webp";
import OTPInput from "../../componentes/OTPinput";
import api from "../../Axios"; // Corrigido

function OTPScreen({ route }) {
  const { verificationId, name, email, phoneNumber, gender, role, password } =
    route.params;
  const navigation = useNavigation();
  const recaptchaVerifier = useRef(null);
  const [code, setCode] = useState("");

  const confirmarCodigo = async () => {
    try {
      const response = await api.post("/verify-otp", {
        phoneNumber: phoneNumber,
        code: code, // Código OTP inserido pelo usuário
      });
      console.log(phoneNumber)
      console.log(code)

      if (response.data.success) {
        navigation.navigate("teste", {
          phoneNumber,
          password,
          name,
          email,
          gender,
          role,
        });
      } else {
        Alert.alert("Código OTP inválido");
      }
    } catch (error) {
      Alert.alert("Falha na verificação", error.message);
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.container2}>
        <View style={{ paddingTop: "10%", justifyContent: "center" }}>
          <Image source={forbidden} />
          <Text style={styles.title}>Verificação</Text>
          <Text style={styles.subtitle}>
            Um OTP foi enviado para o seu número de telefone.
          </Text>
        </View>
        <OTPInput
          name={name}
          email={email}
          phoneNumber={phoneNumber}
          gender={gender}
          role={role}
          code={code}
          password={password}
          setCode={setCode}
          profilePicture={""}
        />
        <View>
          <TouchableOpacity style={styles.skipButton} onPress={confirmarCodigo}>
            <Text style={styles.skipText}>Reenviar Código</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={confirmarCodigo}
          >
            <Text style={styles.loginButtonText}>Verificar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: "7%",
    backgroundColor: "#ffffff",
  },
  container2: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 25,
    color: "#414141",
    fontFamily: "Poppins_500Medium",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: "#B9C3CD",
    fontFamily: "Poppins_400Regular",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#B9C3CD",
    marginBottom: 20,
    fontSize: 16,
    paddingVertical: 10,
    fontFamily: "Poppins_400Regular",
    color: "414141",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  skipButton: {
    backgroundColor: "white",
    borderRadius: 50,
    borderColor: "#B8B8B8",
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
    borderWidth: 1,
  },
  skipText: {
    color: "#B8B8B8",
    fontSize: 18,
    fontFamily: "Poppins_500Medium",
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Poppins_400Regular",
  },
  underlineStyleBase: {
    width: 50,
    height: 55,
    borderWidth: 0,
    borderBottomWidth: 1,
    color: "#414141",
    fontFamily: "Poppins_400Regular",
    fontSize: 40,
  },
  underlineStyleHighLighted: {
    borderColor: "#007AFF",
  },
});

export default OTPScreen;
