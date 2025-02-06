import React, { useState, useRef } from "react";
import { View, TextInput, StyleSheet, Alert } from "react-native";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { useNavigation } from "@react-navigation/native";

export default function OTPInput({
  name,
  email,
  phoneNumber,
  gender,
  role,
  password,
  profilePicture,
}) {
  const length = 6;
  const [code, setCode] = useState(new Array(length).fill(""));
  const inputsRef = useRef([]);
  const navigation = useNavigation();

  const confirmCode = async () => {
    try {
      // Registro do usuário com email e senha
      const userCredential = await firebase
        .auth()
        .createUserWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;

      // Dados do usuário
      const userData = {
        name,
        email,
        phoneNumber,
        gender,
        role,
        profilePicture,
        rating: 0,
      };

      // Adiciona usuário ao Firestore
      await firebase.firestore().collection("users").doc(uid).set(userData);

      // Role-specific logic
      if (role === "passageiro") {
        await firebase.firestore().collection("passengers").doc(uid).set({
          userId: uid,
          ...userData,
        });
        navigation.navigate("HomeScreenP");
      } else if (role === "condutor") {
        await firebase.firestore().collection("drivers").doc(uid).set({
          userId: uid,
          ...userData,
        });

        // Adiciona veículo padrão
        await firebase
          .firestore()
          .collection("drivers")
          .doc(uid)
          .collection("vehicles")
          .add({
            make: "",
            model: "",
            licensePlate: "",
            capacity: 0,
            color: "",
            year: 0,
          });

        navigation.navigate("HomeScreenC");
      }

      Alert.alert("Cadastro realizado com sucesso", "Usuário registrado com sucesso.");
    } catch (error) {
      console.error("Erro no cadastro:", error);
      Alert.alert("Erro no Cadastro", error.message);
    }
  };

  const focusNext = (index, value) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (index < length - 1 && value) {
      inputsRef.current[index + 1].focus();
    } else if (index === length - 1) {
      inputsRef.current[index].blur();
      confirmCode(); // Confirma o registro ao preencher o último campo
    }
  };

  const focusPrevious = (key, index) => {
    if (key === "Backspace" && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleChange = (text, index) => {
    focusNext(index, text);
  };

  return (
    <View style={styles.container}>
      {code.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputsRef.current[index] = ref)}
          style={styles.cell}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={({ nativeEvent }) =>
            focusPrevious(nativeEvent.key, index)
          }
          keyboardType="numeric"
          maxLength={1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cell: {
    width: 40,
    height: 40,
    margin: 5,
    fontSize: 18,
    textAlign: "center",
    borderBottomWidth: 2,
    borderColor: "gray",
  },
});
