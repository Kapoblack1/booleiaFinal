import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import obrigado from "../../assets/obrigado.png";
import { useNavigation } from '@react-navigation/native';

const ThanksScreen = ({route}) => {
  const navigation = useNavigation();
  const{userId}=route.params;
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate("HomeScreenP", {userId});
    }, 20000);

    return () => clearTimeout(timer); // Clear the timeout if the component unmounts
  }, [navigation]);

  const handleContinue = () => {
    navigation.navigate("HomeScreenP");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.container, styles.thanks]}>
        <Image source={obrigado} style={styles.image}></Image>
        <Text style={styles.thanksText}>Obrigado </Text>
        <Text style={styles.text}>
          Ficamos gratos pela sua preferencia, esperamos por ti na proxima viagem
        </Text>
        <View style={styles.containerButton}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleContinue}>
            <Text style={styles.confirmButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const isIphone = Platform.OS === "ios";
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container1: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: "6%",
  },
  header: {
    justifyContent: "space-between",
    paddingHorizontal: "2%",
  },
  back: {
    flexDirection: "row",
    marginTop: isIphone ? 0 : "10%",
    marginBottom: "8%",
    alignContent: "center",
    alignItems: "center",
  },
  backButton: {
    fontSize: 18,
    marginLeft: "2%",
  },
  thanks: {
    backgroundColor: "#fff",
    alignContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  image: {
    height: "25%",
    width: "39%",
  },
  thanksText: {
    fontSize: 28,
    paddingTop: 20,
    color: "#5A5A5A",
  },
  text: {
    fontSize: 17,
    paddingHorizontal: 23,
    color: "#5A5A5A",
    paddingTop: 10,
    textAlign: "center",
  },
  containerButton: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    height: "30%",
    width: "100%",
  },
  confirmButton: {
    backgroundColor: "#188AEC",
    width: "70%",
    height: "13%",
    borderRadius: 30,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 15,
    justifyContent: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ThanksScreen;
