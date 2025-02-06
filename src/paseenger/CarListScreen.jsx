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
} from "react-native";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

const haversineDistance = (coord1, coord2) => {
  const R = 6371e3; // Raio da Terra em metros
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Retorna a distância em metros
}

const compareRoutesWithOriginDestination = (driverRoute, passengerRoute, tolerance = 50) => {
  const passengerOrigin = passengerRoute[0];
  const passengerDestination = passengerRoute[passengerRoute.length - 1];

  let startIndex = -1;
  for (let i = 0; i < driverRoute.length; i++) {
    if (haversineDistance(driverRoute[i], passengerOrigin) <= tolerance) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    return 0; // Origem do passageiro não está próxima ou na rota do condutor
  }

  let endIndex = -1;
  for (let i = startIndex; i < driverRoute.length; i++) {
    if (haversineDistance(driverRoute[i], passengerDestination) <= tolerance) {
      endIndex = i;
      break;
    }
  }

  if (endIndex !== -1) {
    return 100; // Destino do passageiro encontrado na rota do condutor
  }

  let similarPoints = 0;
  for (let i = startIndex, j = 0; i < driverRoute.length && j < passengerRoute.length; i++, j++) {
    if (haversineDistance(driverRoute[i], passengerRoute[j]) <= tolerance) {
      similarPoints++;
    } else {
      break;
    }
  }

  const totalPoints = passengerRoute.length - startIndex;
  const similarity = (similarPoints / totalPoints) * 100;

  return similarity;
}

const CarListScreen = ({ route, navigation }) => {
  const { userId, origin, destination, distance, price, availableSeats, coordinatesList } = route.params;
  const [carsData, setCarsData] = useState([]);
  const [isRunning, setIsRunning] = useState()

  useEffect(() => {
    const fetchCarpoolData = async () => {
      try {
        const snapshot = await firebase.firestore().collection("trips").get();
        const trips = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const tripData = doc.data();
  
            // Fetch driver and vehicle information
            const driverDoc = await firebase.firestore().collection("drivers").doc(tripData.userId).get();
            const vehiclesSnapshot = await driverDoc.ref.collection("vehicles").get();
            const vehicleData = vehiclesSnapshot.docs[0]?.data();
            
            // Calculate route similarity
            const similarity = compareRoutesWithOriginDestination(tripData.coordinatesList, coordinatesList);
  
            return {
              id: doc.id,
              ...tripData,
              carImage: vehicleData?.vehicleImage || 'default_image_url',
              carName: vehicleData?.make || 'Nome desconhecido',
              model: vehicleData?.model || 'carregando modelo...',
              licensePlate: vehicleData?.licensePlate,
              driver: driverDoc.data(),
              similarity, // Store the calculated similarity
            };
          })
        );
  
        // Get the value of isRunning for each trip
        const tripsWithRunningStatus = await Promise.all(trips.map(async (trip) => {
          const tripDoc = await firebase.firestore().collection("trips").doc(trip.id).get();
          const tripData = tripDoc.data();
          console.log(tripData)
          return {
            ...trip,
            isRunning: tripData.running
          };
        }));
        // Filter trips based on status "searching" and similarity >= 30%
        const filteredTrips = trips.filter(trip => trip.status === 'searching' && trip.similarity >= 30||trip.status ==='scheduled' && trip.similarity >= 30 &&
          trip.running);

  
        setCarsData(filteredTrips);
      } catch (error) {
        console.error("Error fetching carpool data: ", error);
      }
    };
  
    fetchCarpoolData();
  }, []);
  
  

  const handleConfirm = (car) => {
    navigation.navigate("RouteMapScreen", { 
      tripId: car.id, // Adiciona o ID da viagem selecionada
      car, 
      userId, 
      origin, 
      destination, 
      coordinatesList 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>

          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carros disponíveis</Text>
        <Text style={styles.results}>{carsData.length} carros encontrados</Text>
      </View>
      <ScrollView style={styles.carList}>
        {carsData.map((car) => (
          <View key={car.id} style={styles.carContainer}>
            <View style={styles.information}>
              <View>
                <Text style={styles.carName}>{car.carName} {car.model}</Text>
                <Text style={styles.carDetails}>
                  Preço: {Math.floor(car.price)} AOA
                </Text>
                <Text style={styles.carDetails}>
                  Matricula: {car.licensePlate}
                </Text>
                <View style={styles.center}>
                  
                  <Text style={styles.carDetails}>
                    {car.distance}KM | {car.availableSeats} lugares
                  </Text>
                </View>
              </View>
              <Image source={{ uri: car.carImage }} style={styles.carImage} />
            </View>
            <Text style={styles.similarity}>Similaridade: {car.similarity.toFixed(2)}%</Text>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleConfirm(car)}
            >
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const isIphone = Platform.OS === "ios";
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  headerTitle: {
    fontSize: 21,
    fontWeight: "bold",
    marginHorizontal: "6%",
  },
  results: {
    marginVertical: "2%",
    marginHorizontal: "7%",
    color: "#B8B8B8",
  },
  carList: {
    flex: 1,
  },
  carContainer: {
    padding: 10,
    backgroundColor: "#F8F9FD",
    marginHorizontal: "6%",
    borderRadius: 10,
    marginBottom: 19,
  },
  information: {
    flexDirection: "row",
  },
  carImage: {
    width: 150,
    height: 110,
    resizeMode: "contain",
    marginLeft: 30,
  },
  carName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  carDetails: {
    fontSize: 16,
    marginVertical: 3,
  },
  center: {
    alignItems: "center",
    alignContent: "center",
    flexDirection: "row",
  },
  similarity: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: "#188AEC",
    padding: 14,
    marginHorizontal: "6%",
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
});

export default CarListScreen;
