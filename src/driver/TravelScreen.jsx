import React, { useRef, useState, useEffect } from "react"; 
import {View,
  Text,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
  StyleSheet,
  Image,
  Alert,
 } from "react-native";
import MapView, { Marker, Polyline  } from "react-native-maps";
import config from "../../confiApi";
import { StatusBar } from "expo-status-bar";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";

export default function HomeScreenP({ route, navigation }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const { tripId } = route.params;
  const snapPoints = ["30%", "40%", "90%"];
  const [userId, setUserId] = useState("");
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState({
    latitude: -23.55052,
    longitude: -46.633309,
  });
  const [passengers, setPassengers] = useState([]);
  const [onCarPassengers, setOnCarPassengers] = useState([]);
  const [userLocations, setUserLocations] = useState([]);
  const [hasArrived, setHasArrived] = useState(false);
  const [coordinatesList, setCoordinatesList] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [followUserLocation, setFollowUserLocation] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permissão negada");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation(location.coords);

      const initialRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setMapRegion(initialRegion);

      if (mapRef.current) {
        mapRef.current.animateToRegion(initialRegion, 1000);
      }

      const locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High },
        (newLocation) => {
          setUserLocation(newLocation.coords);
          if (followUserLocation && mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              },
              1000
            );
          }
        }
      );

      return () => {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      };
    })();
  }, []);

  const centerMapOnUser = () => {
    if (userLocation && mapRef.current) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(newRegion, 1000);
      setFollowUserLocation(true);
    }
  };

  useEffect(() => {
    (async function getLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const location = await Location.getCurrentPositionAsync({
            enableHighAccuracy: true,
          });
          const newOrigin = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.00092,
            longitudeDelta: 0.0031,
          };
          setOrigin(newOrigin);
        } catch (error) {
          console.error("Error fetching location", error);
        }
      } else {
        console.log("Location permission denied");
      }
    })();
  }, []);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        console.log("Fetching route for tripId:", tripId);

        const db = getFirestore();
        const docRef = doc(db, "trips", tripId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const routeData = docSnap.data();
          console.log("Route data fetched from Firestore:", routeData);
          setCoordinatesList(routeData.coordinatesList || []);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching route: ", error);
      }
    };

    fetchRoute();
  }, [tripId]);

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180; // φ, λ em radianos
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Em metros
    return distance;
  }

  useEffect(() => {
    if (driverLocation && destination) {
      // Função para verificar se o motorista chegou ao destino de algum passageiro
      const checkArrival = () => {
        // Verifica a distância até cada destino dos passageiros
        const foundPassenger = onCarPassengers.find((passenger) => {
          const passengerDestination = passenger.destination;
          if (passengerDestination) {
            const distanceToDestination = getDistance(
              driverLocation.latitude,
              driverLocation.longitude,
              passengerDestination.latitude,
              passengerDestination.longitude
            );

            // Considera que o motorista chegou ao destino se estiver a menos de 30 metros
            return distanceToDestination < 30;
          }
          return false;
        });

        // Se um passageiro foi encontrado, exibe o alerta
        if (foundPassenger) {
          Alert.alert(
            "Aviso",
            `Você chegou ao destino do passageiro ${foundPassenger.userId}!`,
            [{ text: "OK" }]
          );
          // Pode opcionalmente remover o passageiro da lista após a chegada
          // e atualizar o estado `onCarPassengers` se necessário.
        }
      };

      checkArrival();
    }
  }, [driverLocation, onCarPassengers]);

  // Atualiza a lista de passageiros no carro
  useEffect(() => {
    if (tripId) {
      const unsubscribe = firebase
        .firestore()
        .collection("trips")
        .doc(tripId)
        .onSnapshot((doc) => {
          if (doc.exists) {
            const tripData = doc.data();
            if (tripData.onCar) {
              // Certifique-se de que `onCar` é um array e que você está atualizando a lista corretamente
              setOnCarPassengers(
                tripData.onCar.map((item) => ({
                  userId: item.userId,
                  destination: item.destination,
                }))
              );
            }
          }
        });

      return () => unsubscribe();
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      const unsubscribe = firebase
        .firestore()
        .collection("trips")
        .doc(tripId)
        .onSnapshot(async (doc) => {
          if (doc.exists) {
            const tripData = doc.data();
            setUserId(tripData.userId);
            setDriverId(tripData.userId);

            if (tripData.passengers) {
              try {
                const passengerSnapshots = await Promise.all(
                  tripData.passengers.map((id) =>
                    firebase.firestore().collection("passengers").doc(id).get()
                  )
                );
                const passengersData = passengerSnapshots.map((snapshot) => ({
                  id: snapshot.id,
                  ...snapshot.data(),
                }));
                setPassengers(passengersData);

                if (tripData.onCar) {
                  setOnCarPassengers(tripData.onCar);
                }
              } catch (error) {
                console.error("Error fetching passengers:", error);
              }
            }

            if (tripData.destination) {
              setDestination({
                latitude: tripData.destination.latitude,
                longitude: tripData.destination.longitude,
              });
            }
          }
        });

      return () => unsubscribe();
    }
  }, [tripId]);

  const handleCancelTrip = async () => {
    Alert.alert(
      "Cancelar Viagem",
      "Tem certeza de que deseja cancelar a viagem?",
      [
        {
          text: "Não",
          onPress: () => console.log("Cancelamento da viagem abortado"),
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {
            try {
              await firebase
                .firestore()
                .collection("trips")
                .doc(tripId)
                .update({
                  status: "canceled",
                  running: false,
                });
              navigation.navigate("HomeScreenC");
            } catch (error) {
              console.error("Erro ao cancelar a viagem:", error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleAccept = async (passengerId) => {
    try {
      await firebase
        .firestore()
        .collection("trips")
        .doc(tripId)
        .update({
          onCar: firebase.firestore.FieldValue.arrayUnion(passengerId),
          accepted: true,
          running: true
        });

      setPassengers((prevPassengers) =>
        prevPassengers.map((passenger) =>
          passenger.id === passengerId
            ? { ...passenger, accepted: true }
            : passenger
        )
      );

      setOnCarPassengers((prev) => [...prev, passengerId]);
    } catch (error) {
      console.error("Error adding passenger to onCar:", error);
    }
  };

  const handleReject = async (passengerId) => {
    try {
      await firebase
        .firestore()
        .collection("trips")
        .doc(tripId)
        .update({
          rejectedPassengers:
            firebase.firestore.FieldValue.arrayUnion(passengerId),
        });

      setPassengers((prevPassengers) =>
        prevPassengers.filter((passenger) => passenger.id !== passengerId)
      );
    } catch (error) {
      console.error("Error adding passenger to rejectedPassengers:", error);
    }
  };

  useEffect(() => {
    const db = getDatabase();
    const locationsRef = ref(db, "locations");

    const handleSnapshot = (snapshot) => {
      const locations = [];
      snapshot.forEach((childSnapshot) => {
        const key = childSnapshot.key;
        const data = childSnapshot.val();

        if (onCarPassengers.includes(key)) {
          locations.push({
            id: key,
            ...data,
          });
        }
      });
      setUserLocations(locations);
    };

    const unsubscribe = onValue(locationsRef, handleSnapshot);

    return () => unsubscribe();
  }, [onCarPassengers]);


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {userLocation && (
          <>
             <MapView
              style={styles.map}
              region={origin}
              showsUserLocation={true}
              loadingEnabled={true}
              locale="pt-br"
              ref={mapEl}
            >
              {userLocations.map((location) => (
                <Marker
                  key={location.id}
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title={`User: ${location.id}`}
                />
              ))}

              {onCarPassengers.map(
                (passenger) =>
                  passenger.destination && (
                    <Marker
                      key={`dest-${passenger.userId}`}
                      coordinate={{
                        latitude: passenger.destination.latitude,
                        longitude: passenger.destination.longitude,
                      }}
                      pinColor="green"
                      title={`Destino do Passageiro: ${passenger.userId}`}
                    />
                  )
              )}

              {onCarPassengers.map(
                (passenger) =>
                  passenger.destination && (
                    <Marker
                      key={`dest-${passenger.userId}`}
                      coordinate={{
                        latitude: passenger.destination.latitude,
                        longitude: passenger.destination.longitude,
                      }}
                      pinColor="green" // Cor do marcador para o destino
                      title={`Destino do Passageiro: ${passenger.userId}`}
                    />
                  )
              )}

              {coordinatesList.length > 0 && (
                <Polyline
                  coordinates={coordinatesList.map((coord) => ({
                    latitude: coord.latitude,
                    longitude: coord.longitude,
                  }))}
                  strokeColor="#188AEC"
                  strokeWidth={3}
                />
              )}
            </MapView>

            {/* Botão para recentralizar no usuário */}
            <TouchableOpacity style={styles.button} onPress={centerMapOnUser}>
              <MaterialIcons name="my-location" size={24} color="white" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* BottomSheet no topo da renderização */}
      <BottomSheet ref={bottomSheetRef} index={2} snapPoints={snapPoints}>
      <BottomSheetView style={styles.bottomSheetContent}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelTrip}
            >
              <Text style={styles.cancelButtonText}>Cancelar Viagem</Text>
            </TouchableOpacity>
            {passengers.map((passenger) => (
              <View key={passenger.id} style={styles.passengerCard}>
                <Image
                  source={{
                    uri:
                      passenger.profilePicture ||
                      "https://via.placeholder.com/50",
                  }}
                  style={styles.profilePicture}
                />
                <View style={styles.passengerInfo}>
                  <Text style={styles.name}>{passenger.name}</Text>
                  <Text style={styles.email}>{passenger.email}</Text>
                  <Text style={styles.phone}>{passenger.phoneNumber}</Text>
                  <Text style={styles.phone}>{passenger.paymentMethod}</Text>
                  
                
                </View>
                {onCarPassengers.includes(passenger.id) ? (
                  <Text style={styles.acceptedText}>Aceite</Text>
                ) : passenger.accepted ? (
                  <Text style={styles.acceptedText}>Aceite</Text>
                ) : (
                  <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAccept(passenger.id)}
                    >
                      <Text style={styles.buttonText}>Aceitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReject(passenger.id)}
                    >
                      <Text style={styles.buttonText}>Rejeitar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  button: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 50,
    elevation: 5,
  },
  bottomSheetContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
  },
  bottomSheetContent: {
    padding: 20,
  },
  passengerCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  passengerInfo: {
    flex: 1,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  email: {
    fontSize: 14,
    color: "#888",
  },
  phone: {
    fontSize: 14,
    color: "#888",
  },
  buttonsContainer: {
    flexDirection: "row",
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  rejectButton: {
    backgroundColor: "#F44336",
    padding: 10,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: "#FF4500",
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  acceptedText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    paddingRight: 20,
  },
});