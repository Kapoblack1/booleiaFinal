import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../../Axios";

const RegisterScreen = () => {
    const navigation = useNavigation();
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const selectRole = (selectedRole) => {
    setRole(selectedRole);
  };

  // Função para enviar OTP via Twilio
  const handlePhoneVerification = async () => {
    const formattedPhoneNumber = `+244${phoneNumber}`;
    try {
      await api.post('/send-otp', {
        phoneNumber: formattedPhoneNumber,
      });
      // Navegar para a tela de OTP
      navigation.navigate('OTPScreen', {
        phoneNumber: formattedPhoneNumber,
        password,
        name,
        email,
        gender,
        role,
        verificationId: 'fake-verification-id', // Modificar para usar um ID verdadeiro
      });
    } catch (error) {
      Alert.alert('Falha ao enviar OTP', error.response?.data?.message || error.message);
    }
  };

  const handleSignUp = () => {
    if (!name || !email || !password || !phoneNumber || !gender || !role || !agreeToTerms) {
      Alert.alert("Erro", "Por favor, preencha todos os campos e aceite os termos.");
      return;
    }
    handlePhoneVerification();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Registrar</Text>

      <ScrollView>
        <TextInput
          placeholder="Nome"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <View style={styles.phoneInputContainer}>
          <Text style={styles.phonePrefix}>+244</Text>
          <TextInput
            placeholder="Número de Telefone"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            style={styles.phoneInput}
          />
        </View>

        <TouchableOpacity style={styles.dropdown} onPress={() => setModalVisible(true)}>
          <Text style={styles.dropdownText}>{gender || "Selecionar Gênero"}</Text>
         
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalView}>
                <TouchableOpacity onPress={() => { setGender("Masculino"); setModalVisible(false); }}>
                  <Text style={styles.genderText}>Masculino</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setGender("Feminino"); setModalVisible(false); }}>
                  <Text style={styles.genderText}>Feminino</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            onPress={() => selectRole("passageiro")}
            style={[styles.roleButton, role === "passageiro" ? styles.roleSelected : {}]}
          >
            <Text style={role === "passageiro" ? styles.roleSelectedText : styles.roleButtonText}>
              Passageiro
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => selectRole("condutor")}
            style={[styles.roleButton, role === "condutor" ? styles.roleSelected : {}]}
          >
            <Text style={role === "condutor" ? styles.roleSelectedText : styles.roleButtonText}>
              Condutor
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.checkboxContainer}>
        <TouchableOpacity
  style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]} // Adicionando a classe checkboxChecked se agreeToTerms for true
  onPress={() => setAgreeToTerms(!agreeToTerms)}
>
  {agreeToTerms && <View style={styles.checkmark} />} {/* Exibindo o ícone de "check" quando aceito */}
</TouchableOpacity>
          <Text style={styles.checkboxLabel}>
            Aceito os{" "}
            <Text style={styles.linkText}>Termos e Condições</Text> e a{" "}
            <Text style={styles.linkText}>Política de Privacidade</Text>.
          </Text>
        </View>

        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Registrar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: "7%" },
    backButton: { marginBottom: "2%", marginTop: "20%" },
    backButtonText: { fontSize: 18, color: "#000000" },
    title: {
      fontSize: 24,
      fontWeight: "500",
      marginTop: "7%",
      marginBottom: "10%",
      color: "#000",
    },
    input: {
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: "5.5%",
      fontSize: 15,
      marginBottom: "7%",
      borderWidth: 1,
      borderColor: "#B8B8B8",
    },
    phoneInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: "7%",
      borderWidth: 1,
      borderColor: "#B8B8B8",
      borderRadius: 10,
      padding: "5.5%",
    },
    phonePrefix: { fontSize: 15, color: "#414141", marginRight: 10 },
    phoneInput: { flex: 1, fontSize: 15, color: "#414141" },
    dropdown: {
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: "5.5%",
      marginBottom: "7%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#B8B8B8",
    },
    dropdownText: { fontSize: 15, color: "#D0D0D0" },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalView: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 35,
      alignItems: "center",
    },
    genderText: { fontSize: 18, marginBottom: 15, color: "#000" },
    roleContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginVertical: 10,
    },
    roleButton: {
      borderWidth: 1,
      borderColor: "#B8B8B8",
      paddingVertical: 10,
      paddingHorizontal: 30,
      borderRadius: 20,
      marginHorizontal: 5,
    },
    roleSelected: { backgroundColor: "#2D93EA", borderColor: "#2D93EA" },
    roleButtonText: { textAlign: "center", color: "#414141" },
    roleSelectedText: { color: "#FFFFFF", textAlign: "center" },
    checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    checkbox: {
      height: 20,
      width: 20,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: "#2D93EA",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    checkbox: {
      height: 20,
      width: 20,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: "#B8B8B8",  // Cor padrão
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    checkboxChecked: {
      borderColor: "#2D93EA", // Cor azul quando os termos forem aceitos
      backgroundColor: "#2D93EA", // Cor de fundo azul quando aceito
    },
    checkmark: {
      width: 2,
      height: 2,
      borderRadius: 2,
      backgroundColor: "#fff", // Cor do ícone de "check"
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 13,
      color: "#B9C3CD",
    },
    checkboxLabel: { flex: 1, fontSize: 13, color: "#B9C3CD" },
    linkText: { color: "#2D93EA", textDecorationLine: "underline" },
    signUpButton: {
      backgroundColor: "#2D93EA",
      borderRadius: 40,
      paddingVertical: 15,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 17,
    },
    signUpButtonText: { fontSize: 20, color: "#FFFFFF", fontWeight: "500" },
});

export default RegisterScreen;
