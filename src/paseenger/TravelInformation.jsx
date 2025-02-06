import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator
} from "react-native";

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Adicione aqui a biblioteca de ícones

const TravelInformation = ({ route, navigation }) => {
  const { car, userId, origin, destination, tripId } = route.params;
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(null);

  useEffect(() => {
    if (tripId) {
      const unsubscribe = firebase
        .firestore()
        .collection("trips")
        .doc(tripId)
        .onSnapshot(async (doc) => {
          if (doc.exists) {
            const tripData = doc.data();
            const onCar = tripData.onCar || [];
            const rejectedPassengers = tripData.rejectedPassengers || [];
    
            const isAccepted = onCar.includes(userId);
            const isRejected = rejectedPassengers.includes(userId);
    
            if (isAccepted && previousStatus !== "accepted") {
              setPreviousStatus("accepted");
              if (selectedPayment) {
                try {
                  await firebase.firestore().collection("trips").doc(tripId).update({
                    onCar: firebase.firestore.FieldValue.arrayUnion({
                      userId: userId,
                      destination: {
                        latitude: destination.latitude,
                        longitude: destination.longitude,
                        destinationName: car.destinationName
                      },
                      paymentMethod: selectedPayment,
                    })
                  });

                  setIsLoading(false);
                  navigation.navigate("Travell", {
                    car,
                    userId,
                    origin,
                    destination,
                    driverInfo: car.driver,
                    selectedPayment,
                    tripId
                  });
                } catch (error) {
                  console.error("Erro ao atualizar a viagem:", error);
                }
              } else {
                console.error("Método de pagamento não selecionado.");
              }
            } else if (isRejected && previousStatus !== "rejected") {
              setPreviousStatus("rejected");
              alert("Você foi rejeitado da viagem.");
              setIsLoading(false);
            }
          }
        });
      return () => unsubscribe();
    }
  }, [tripId, selectedPayment, previousStatus]);

  const handleConfirm = async () => {
    if (!selectedPayment) {
      alert("Por favor, selecione um método de pagamento.");
      return;
    }

    try {
      await firebase.firestore().collection("trips").doc(car.id).update({
        passengerLocation: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        }
      });

      const passengerData = {
        userId: userId,
        paymentMethod: selectedPayment,
        location: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
        destination: destination
      };

      await firebase.firestore().collection("trips").doc(tripId).update({
        running: true,
        status: "scheduled",
        passengers: firebase.firestore.FieldValue.arrayUnion(userId),
        passengersData: firebase.firestore.FieldValue.arrayUnion(passengerData),
      });

      alert("Viagem confirmada!");
      setIsLoading(true);
    } catch (error) {
      console.error("Erro ao confirmar viagem: ", error);
      alert("Erro ao confirmar viagem");
    }
  };

  const handleCancelLoading = () => {
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
         <MaterialIcons name="arrow-back" size={24} color="#000" /> 
          <Text style={styles.backButton}>Rota</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container1}>
        {isLoading ? (
          <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#188AEC" />
          <Text>Aguardando o motorista...</Text> <TouchableOpacity
  style={styles.cancelLoadingButton}
  onPress={handleCancelLoading}
>
  <Text style={styles.buttonText}>Cancelar</Text> 
</TouchableOpacity>
      </View>
        ) : (
          <ScrollView style={styles.container}>
            <View style={styles.root}>
              <View style={styles.pins}>
                <MaterialIcons name="location-pin" size={24} color="#000" /> 
              </View>
              <View style={styles.marks}>
                <Text style={styles.mark}>Localização Atual</Text>
                <View style={styles.separator}></View>
                <Text style={styles.mark}>{car.destinationName}</Text>
              </View>
            </View>
            <View style={styles.separator}></View>
            <View style={styles.carContainer}>
              <View style={styles.information}>
                <View>
                  <Text style={styles.carName}>{car.carName} {car.model}</Text>
                  <Text style={styles.carPlate}>Matricula: {car.licensePlate}</Text>
                  <View style={styles.center}>
                    <MaterialIcons name="star" size={16} color="#FFD700" /> 
                    <Text style={styles.carDetails}>{car.star} ({car.review} reviews)</Text>
                  </View>
                </View>
                <Image source={{ uri: car.carImage }} style={styles.carImage} />
              </View>
            </View>
            <View style={styles.separator}></View>
            <View style={styles.viagem}>
              <Text style={styles.title}>Viagem</Text>
              <View style={styles.center1}>
                <Text style={styles.price}>Preço da Viagem:</Text>
                <Text style={styles.price}>{Math.floor(car.price)} KZ</Text>
              </View>
            </View>
            {car.driver && (
              <View style={styles.driver}>
                <Image source={{ uri: car.driver.profilePicture }} style={styles.driverImage} />
                <Text style={styles.driverName}>{car.driver.name}</Text>
              </View>
            )}
            <View>
              <Text style={styles.select}>Selecione o método de pagamento</Text>
              <TouchableOpacity
                style={[styles.paymentOption, selectedPayment === "cash" ? styles.selectedPayment : null]}
                onPress={() => setSelectedPayment("cash")}
              >
                <MaterialIcons name="attach-money" size={44} color="#007AFF" /> 
                <Text style={styles.money}>Dinheiro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentOption, selectedPayment === "express" ? styles.selectedPayment : null]}
                onPress={() => setSelectedPayment("express")}
              >
                <MaterialIcons name="credit-card" size={44} color="#007AFF" /> 
                <Text style={styles.money}>Express</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
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
  root: {
    flex: 1,
    backgroundColor: "#F8F9FD",
    paddingTop: 10,
    paddingBottom: 10,
    paddingVertical: 20,
    borderRadius: 20,
    flexDirection: "row",
    marginBottom: "5%",
  },
  pins: {
    paddingHorizontal: "4%",
  },
  pin: {
    marginBottom: "37%",
    marginTop: "50%",
  },
  marks: {
    width: "78%",
  },
  mark: {
    paddingVertical: "4%",
    fontSize: 18,
    fontWeight: "500",
    color: "#C1CAD4",
  },
  separator: {
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },
  carContainer: {
    padding: 17,
    backgroundColor: "#F8F9FD",
    borderRadius: 10,
    marginBottom: 19,
    marginTop: "5%",
  },
  information: {
    flexDirection: "row",
  },
  carImage: {
    width: "60%",
    height: "100%",
    resizeMode: "contain",
    paddingRight: "4%",
  },
  carName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: "5%",
    marginBottom: "5%",
  },
  price: {
    fontSize: 18,
    marginTop: "5%",
    marginBottom: "8%",
  },
  center: {
    alignItems: "center",
    alignContent: "center",
    flexDirection: "row",
    paddingBottom: 20,
    paddingTop: 10,
  },
  center1: {
    alignItems: "center",
    alignContent: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  carDetails: {
    color: "#B8B8B8",
    marginLeft: "3%",
  },
  carPlate:{
    color: "#B8B8B8",
    marginLeft: "3%",
    top: 5
  },
  driver: {
    flexDirection: "row",
    alignItems: "center",
    alignContent: "center",
  },
  driverImage: {
    resizeMode: "cover",
    height: 110,
    width: 105,
    borderRadius: 190,
    marginRight: "9%",
    backgroundColor: "#E8F4FF",
    borderWidth: 1,
    borderColor: "#188AEC",
  },
  driverName: {
    fontSize: 30,
    fontWeight: "450",
    color: "#5A5A5A",
  },
  select: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 20,
    color: "#5A5A5A",
  },
  money: {
    marginLeft: 30,
    fontSize: 18,
  },
  confirmButton: {
    backgroundColor: "#188AEC",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 15,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: "#F8F9FD",
  },
  selectedPayment: {
    borderColor: "#188AEC",
    borderWidth: 1,
  },
  spinnerContainer: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    justifyContent: "center",
    bottom: 63
  },
  cancelButtonWrapper: {
    alignItems: "center",
  },
  cancelLoadingButton: {
    backgroundColor: "#E53935",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 5,
    marginTop: 20,
  },
});

export default TravelInformation;

