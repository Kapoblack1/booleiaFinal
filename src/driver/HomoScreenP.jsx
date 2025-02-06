import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  Platform,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import config from "../../confiApi";
import MapViewDirections from "react-native-maps-directions";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import {FlatList, GestureHandlerRootView } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useNavigation } from "@react-navigation/native";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { getDatabase, ref, set, onValue } from "firebase/database";
import Icon from 'react-native-vector-icons/Feather';

export default function HomeScreenP({ route }) {
  const mapRef = useRef(null);
  const mapEl = useRef(null);
  const bottomSheetRef = useRef(null);
  const snapPoints = ["40%", "50%", "90%"];
  const [userLocation, setUserLocation] = useState(null);
  const userId = route.params?.userId;
  const [price, setPrice] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [distance, setDistance] = useState(null);
  const [destination, setDestination] = useState(null);
  const [destinationName, setDestinationName] = useState(""); // New state for destination name
  const [waypoints, setWaypoints] = useState([]);
  const toggleUserType = () => {
    setUserType(userType === "passageiro" ? "condutor" : "passageiro");
  };
  const [isLoadingCancelled, setIsLoadingCancelled] = useState(false);
    const [tripId, setTripId] = useState("");
    const [userType, setUserType] = useState("passageiro");
    const [originMarker, setOriginMarker] = useState(null);
    const [status, setStatus] = useState("searching");
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [destinationMarker, setDestinationMarker] = useState(null);
    const [availableSeats, setAvailableSeats] = useState(4);
    const [showDestinationInput, setShowDestinationInput] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showWaypointInput, setShowWaypointInput] = useState(true);
    const [passengerMarkers, setPassengerMarkers] = useState([]);
    const navigation = useNavigation();
    const [coordinatesList, setCoordinatesList] = useState([]);
    const [isVisible, setIsVisible] = useState(true);
    const handleSheetChanges = useCallback((index) => {
      console.log("Bottom sheet position changed to index", index);
      if (index === 1) {
        console.log("Hide");
      } else {
        console.log("Expand");
      }
    }, []);
  
    const addWaypoint = (coordinate) => {
      const newWaypoint = {
        id: Date.now().toString(),
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      };
      setWaypoints([...waypoints, newWaypoint]);
    };
  const [followUserLocation, setFollowUserLocation] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);
  const removeWaypoint = (id) => {
    setWaypoints(waypoints.filter((waypoint) => waypoint.id !== id));
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        console.log("Keyboard shown");
        expandBottomSheet();
      }
    );

    

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        console.log("Keyboard hidden");
        hideBottomSheet();
        setShowDestinationInput(true);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const expandBottomSheet = () => {
    bottomSheetRef.current?.snapToIndex(3);
  };

  const hideBottomSheet = () => {
    bottomSheetRef.current?.snapToIndex(2);
  };

  useEffect(() => {
    if (userId) {
      console.log("UserID:", userId);
    }
  }, [userId]);

  useEffect(() => {
    const userId = firebase.auth().currentUser?.uid;
    if (userId) {
      const unsubscribe = firebase
        .firestore()
        .collection("trips")
        .where("userId", "==", userId)
        .onSnapshot((snapshot) => {
          const markers = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.passengerLocation) {
              markers.push({ id: doc.id, ...data.passengerLocation });
            }
          });
          setPassengerMarkers(markers);
          setStatus("searching");
        });

      return () => unsubscribe();
    }

    return () => unsubscribe();
  }, []);

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

      try {
        const location = await Location.getCurrentPositionAsync({
          enableHighAccuracy: true,
        });

        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
        };

        const db = getDatabase();
        const locationRef = ref(db, `locations/${userId}`);
        await set(locationRef, locationData);


      } catch (error) {
        console.error("Erro ao atualizar localização no Firebase:", error);
      }

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
    const userId = firebase.auth().currentUser?.uid;
    if (userId) {
      const unsubscribe = firebase
        .firestore()
        .collection("trips")
        .where("userId", "==", userId)
        .onSnapshot((snapshot) => {
          const markers = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.passengerLocation) {
              markers.push({ id: doc.id, ...data.passengerLocation });
            }
          });
          setPassengerMarkers(markers);
          setStatus("searching");
        });

      return () => unsubscribe();
    }
  }, [userId]);

  useEffect(() => {
    if (tripId) {
      const unsubscribe = firebase
        .firestore()
        .collection("trips")
        .doc(tripId)
        .onSnapshot((doc) => {
          if (doc.exists) {
            const tripData = doc.data();
            if (tripData.status === "scheduled") {
              setIsLoading(false);
              navigation.navigate("TravelScreen", { tripData, tripId, userId });
            }
          }
        });

      return () => unsubscribe();
    }
  }, [tripId]);

  function handleScheduleTrip() {
    if (!destination) {
      alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    try {
      const userId = firebase.auth().currentUser?.uid;
      if (!userId) {
        alert("Erro", "Usuário não autenticado.");
        return;
      }

      setStatus("searching");

      const tripData = {
        userId,
        origin,
        destinationName,
        destination,
        distance,
        price: Math.floor(price),
        availableSeats,
        star: 4,
        review: 30,
        coordinatesList,
        accepted: false,
        status,
        running: false,
        passengersData:[],
        rejectedPassengers: [],
        onCar: [],
        passengers: [],
        waypoints: waypoints.map((waypoint) => ({
          latitude: waypoint.latitude,
          longitude: waypoint.longitude,
        })),
      };

      setIsLoading(true);

      firebase
        .firestore()
        .collection("trips")
        .add(tripData)
        .then((docRef) => {
          const tripId = docRef.id;
          setTripId(tripId);
          console.log(tripId); // Log the 
        })
        .catch((error) => {
          console.error("Erro ao agendar viagem:", error);
          alert("Erro ao agendar viagem...", error.message);
          setIsLoading(false);
        });
    } catch (error) {
      console.error("Erro ao agendar viagem:", error);
      alert("Erro ao agendar viagem...", error.message);
      setIsLoading(false);
    }
  }

  useEffect(() => {
      (async function obterLocalizacao() {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          try {
            const location = await Location.getCurrentPositionAsync({
              enableHighAccuracy: true,
            });
            console.log(location);
            console.log(tripId);
            setOrigin({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.00092,
              longitudeDelta: 0.0031,
            });
            setOriginMarker({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          } catch (error) {
            console.error("Erro ao obter a localização", error);
          }
        } else {
          console.log("Permissão de localização negada");
        }
      })();
    }, []);

  useEffect(() => {
    const updateLocationInDatabase = async () => {
      const userId = firebase.auth().currentUser?.uid;
      if (!userId) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permissão de localização negada");
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          enableHighAccuracy: true,
        });

        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
        };

        const db = getDatabase();
        const locationRef = ref(db, `locations/${userId}`);
        await set(locationRef, locationData);

        console.log("Localização atualizada com sucesso");
      } catch (error) {
        console.error("Erro ao atualizar localização no Firebase:", error);
      }
    };

    const intervalId = setInterval(updateLocationInDatabase, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const back = () => {
    navigation.navigate("Login");
  };
  const handleDestinationFocus = () => {};

  const handleMapPress = (event) => {
    const coordinate = event.nativeEvent.coordinate;
    addWaypoint(coordinate);
  };
  const handleCancelLoading = () => {
    setIsLoading(false);
    setIsLoadingCancelled(true); // Marca que o carregamento foi cancelado
    setIsLoadingCancelled(false); // Marca que o carregamento foi cancelado
    setStatus("noFind"); // Muda o status da viagem para "noFind"

    const userId = firebase.auth().currentUser?.uid;
    if (userId) {
      firebase
        .firestore()
        .collection("trips")
        .where("userId", "==", userId)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            doc.ref.update({ status: "noFind" }); // Atualiza o status no Firestore
          });
        })
        .catch((error) => {
          console.error("Erro ao atualizar o status da viagem:", error);
        });
    }

    console.log("Carregamento cancelado");
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TouchableOpacity style={styles.menu} onPress={back}>
            <View>
            <Icon name="list" size={30} color="#007AFF" />;
            </View>
          </TouchableOpacity>
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
                onPress={handleMapPress}
              >
                {destinationMarker && (
                  <Marker coordinate={destinationMarker} title="Destino" />
                )}
                {destination && (
                  <MapViewDirections
                    origin={origin}
                    destination={destination}
                    waypoints={waypoints.map((w) => ({
                      latitude: w.latitude,
                      longitude: w.longitude,
                    }))}
                    apikey={config.googleApi}
                    strokeColor="blue"
                    strokeWidth={3}
                    onReady={(result) => {
                      console.log(result);
                      console.log("Coordenadas:", result.coordinates);
                      setCoordinatesList(result.coordinates); // Armazenar as coordenadas no estado
                      setDistance(result.distance);
                      setPrice(result.distance * 150);
                      mapEl.current.fitToCoordinates(result.coordinates, {
                        edgePadding: {
                          top: 90,
                          bottom: 100,
                          left: 110,
                          right: 150,
                        },
                      });
                    }}
                  />
                )}
               
                {waypoints.map((waypoint, index) => (
                  <Marker
                    key={waypoint.id}
                    coordinate={{
                      latitude: waypoint.latitude,
                      longitude: waypoint.longitude,
                    }}
                    title={`Waypoint ${index + 1}`}
                  />
                ))}
              </MapView>

            {/* Botão para recentralizar no usuário */}
            <TouchableOpacity style={styles.button} onPress={centerMapOnUser}>
              <MaterialIcons name="my-location" size={24} color="white" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* BottomSheet no topo da renderização */}
      <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            style={{ borderRadius: 1 }}
          >
            {isLoading ? (
              <BottomSheetView style={styles.spinnerContainer}>
                <ActivityIndicator size="large" color="#188AEC" />
                <Text>Aguardando passageiro...</Text>
                <TouchableOpacity
                  style={styles.cancelLoadingButton}
                  onPress={handleCancelLoading}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </BottomSheetView>
            ) : (
              <BottomSheetView style={[styles.searchWrapper, { top: 22 }]}>
                {isVisible && (
                  <View style={[styles.search, { zIndex: 1 }]}>
                    <TouchableOpacity
                      style={styles.olaButton}
                      onPress={handleScheduleTrip}
                    >
                      <Text style={styles.buttonText}>Agendar Viagem</Text>
                    </TouchableOpacity>
                    <GooglePlacesAutocomplete
                      placeholder="    Para onde vamos?"
                      textInputProps={{
                        onFocus: handleDestinationFocus,
                      }}
                      onPress={(data, details = null) => {
                        if (details && details.geometry) {
                          const newDestination = {
                            latitude: details.geometry.location.lat,
                            longitude: details.geometry.location.lng,
                            latitudeDelta: 0.00092,
                            longitudeDelta: 0.0031,
                          };
                          setDestination(newDestination);
                          setDestinationMarker(newDestination);
                          setDestinationName(data.description); // Set the destination name
                        }
                      }}
                      query={{
                        key: config.googleApi,
                        language: "pt-br",
                        components: "country:ao",
                      }}
                      fetchDetails={true}
                      styles={googleAutocompleteStyles}
                    />
                    <View style={styles.TextInfoC}>
                      <Text style={styles.TextInfo}>
                        Clique nos lugares onde vai passar para especificar a rota
                        que irá percorrer
                      </Text>
                    </View>
  
                    {/*<GooglePlacesAutocomplete
                    placeholder="Adicionar ponto de passagem"
                    onPress={addWaypoint}
                    query={{
                      key: config.googleApi,
                      language: "pt-br",
                      components: "country:ao",
                    }}
                    fetchDetails={true}
                    styles={googleAutocompleteStyles2}
                  />*/}
  
                    <FlatList
                      style={styles.waypointItemC}
                      data={waypoints}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item, index }) => (
                        <TouchableOpacity
                          style={styles.waypointItem}
                          onPress={() => removeWaypoint(item.id)}
                        >
                          <Text style={styles.waypointText}>
                            {`Waypoint ${index + 1}: (${item.latitude.toFixed(
                              5
                            )}, ${item.longitude.toFixed(5)}),`}
                          </Text>

                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
  
                {!isKeyboardVisible && (
                  <>
                   
                    {/*<TouchableOpacity
                    style={styles.olaButton}
                    onPress={handleScheduleTrip}
                  >
                    <Text style={styles.buttonText}>Agendar Viagem</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelTrip}
                  >
                    <Text style={styles.buttonText}>Cancelar Viagem</Text>
                  </TouchableOpacity>*/}
                  </>
                )}
              </BottomSheetView>
            )}
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
  closeText: {
    fontSize: 18,
    color: "#000",
    position: "absolute",
    right: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
  },
  searchContainer: {
    padding: 20,
  },
  input: {
    height: 50,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
  },
  recentPlaces: {
    padding: 20,
  },
  recentPlacesTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  menu: {
    position: "absolute",
    top: 60,
    left: 50,
    zIndex: 2,
    backgroundColor: "white",
    borderRadius: 100,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    shadowColor: "#000", // Cor da sombra
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  map: {
    height: "100%",
    width: "100%",
    top: -90,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  currentLocationButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
  },
  olaButton: {
    backgroundColor: "#188AEC",
    paddingVertical: 15,
    paddingHorizontal: 120,
    borderRadius: 5,
    top: -20,

    alignSelf: "center",
    borderRadius: 55,
  },
  cancelButton: {
    backgroundColor: "#E53935",
    paddingVertical: 15,
    paddingHorizontal: 130,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: "center",
    borderRadius: 55,
  },
  passengerButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  passengerButton: {
    backgroundColor: "#188AEC",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    borderRadius: 55,
    flex: 1,
    marginHorizontal: 5,
  },
  searchWrapper: {
    position: "absolute",
    top: 20,
    width: "100%",
    paddingHorizontal: 20,
    zIndex: 1,
  },
  search: {
    marginBottom: 65,
  },
  waypointItemC: {
    maxHeight: 450, // Ajustar altura máxima para evitar overflow
    paddingBottom: 10, // Adicionar um padding para espaçamento
    marginTop: Platform.OS === "android" ? 125 : 80, // Espaçamento superior
    backgroundColor: "transparent", // Transparente para visualização do fundo
  },

  waypointItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    //backgroundColor: "yellow",
    borderRadius: 15, // Adicionar bordas arredondadas
    marginTop: 10, // Adicionar espaçamento entre os waypoints
    zIndex: 4, // Ajustar o zIndex
  },

  removeButtonText: {
    color: "#ff0000",
    fontSize: 16,
    marginLeft: 5,
  },
  TextInfoC: {
    width: "90%",
    left: 15,
    justifyContent: "center",
    alignItems: "center",
    top: 60,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    borderColor: "#DDDDDD",
  },
  TextInfo: {
    fontSize: 17,
    color: "gray",
  },
  spinnerContainer: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    top: 50,
  },
  cancelButtonWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  cancelLoadingButton: {
    backgroundColor: "#E53935",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 5,
    marginTop: 20,
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
});

const googleAutocompleteStyles = {
  container: {
    flex: 0,
    position: "absolute",
    top: 40,
    width: "100%",
    zIndex: 5,
  },
  textInputContainer: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  textInput: {
    backgroundColor: "#F8F9FD",
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    fontSize: 16,
    marginTop: 0,
    marginBottom: 0,
    paddingLeft: 10,
  },
  listView: {
    backgroundColor: "white",
    marginTop: 0,
    elevation: 5,
    zIndex: 5,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  separator: {
    height: 1,
    backgroundColor: "#DDDDDD",
  },
  poweredContainer: {
    display: "none",
  },
};