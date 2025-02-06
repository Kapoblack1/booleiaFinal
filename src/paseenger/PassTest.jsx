import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Button
} from "react-native";
import StarRating from "../../componentes/StarRating"; // Pode reusar o componente de estrelas
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { useNavigation } from "@react-navigation/native";

export default function PassTest({ route}) {
  const { tripId, userId } = route.params;
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const navigation = useNavigation();

  const handleRatingSelect = (selectedRating) => {
    console.log("Estrelas selecionadas:", selectedRating); // Log de depuração
    setRating(selectedRating);
  };

  const submitFeedback = async () => {
    if (!userId || rating === 0 || !feedback.trim()) {
      return; // Retorna se houver algum erro.
    }

      navigation.navigate("ThanksScreen", { userId,
        feedback,
        rating,tripId}); // Navega para a próxima tela
   
  };
  

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Text style={styles.title}>Deixe o seu feedback</Text>

        {/* Avaliação em estrelas */}
        <StarRating onRatingSelect={handleRatingSelect} />

        {/* Campo de texto para feedback */}
        <TextInput
          style={styles.input}
          placeholder="Escreva seu comentário aqui..."
          multiline
          value={feedback}
          onChangeText={(text) => {
            console.log("Comentário inserido:", text); // Log de depuração
            setFeedback(text);
          }}
          returnKeyType="done"
        />

        {/* Botão para enviar feedback */}
        <TouchableOpacity style={styles.button} onPress={submitFeedback}>
          <Text style={styles.buttonText}>Enviar Feedback</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    height: 150,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#188AEC",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
