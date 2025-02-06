import React, { useRef,
  useMemo,
  useState,
  useEffect,
  useCallback, } from "react"; 
import { StatusBar } from "expo-status-bar";
import {   View,
  Text,
  Platform,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard, } from "react-native";
import MapView, { Marker } from "react-native-maps";
import Icon from 'react-native-vector-icons/Feather';
import * as Location from "expo-location";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import config from "../../confiApi";
import MapViewDirections from "react-native-maps-directions";
import { useNavigation } from "@react-navigation/native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/database"; // Import the Realtime Database module
import { getDatabase, ref, set, onValue } from "firebase/database";

export default function HomeScreenP({ route }) {
  const mapRef = useRef(null);
  const mapEl = useRef(null);
  const userId = route.params?.userId;
  const bottomSheetRef = useRef(null);
  const snapPoints = ["30%", "40%", "90%"];
  const [userLocation, setUserLocation] = useState(null);
  const [followUserLocation, setFollowUserLocation] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);
  const [price, setPrice] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [distance, setDistance] = useState(null);
  const [destination, setDestination] = useState(null);
  const [destinationName, setDestinationName] = useState(""); // New state for destination name
  const [coordinatesList, setCoordinatesList] = useState([]);
  const [userLocations, setUserLocations] = useState([]);
  const [userType, setUserType] = useState("passageiro");
  const [originMarker, setOriginMarker] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [availableSeats, setAvailableSeats] = useState(4);
  const [showDestinationInput, setShowDestinationInput] = useState(true);
  const navigation = useNavigation();
  const handleSheetChanges = useCallback((index) => {
    console.log("Bottom sheet position changed to index", index);
    if (index === 0) {
      console.log("Hide");
    } else {
      console.log("Expand");
    }
  }, []);

  const navigateToNextPage = () => {
    if (!origin || !destination || !originMarker) {
      console.error("Erro: Dados de localização incompletos.", { origin, destination, originMarker });
      return;
    }
  
    const userId = firebase.auth().currentUser?.uid;
    if (!userId) {
      alert("Erro", "Usuário não autenticado.");
      return;
    }
  
    console.log("Navegando para CarListScreen com:", {
      userId,
      origin,
      destinationName,
      destination,
      distance,
      price,
      availableSeats,
      coordinatesList,
    });
  
    navigation.navigate("CarListScreen", {
      userId,
      origin,
      destinationName,
      destination,
      distance,
      price,
      availableSeats,
      coordinatesList,
    });
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        console.log("Teclado mostrado");
        expandBottomSheet();
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        console.log("Teclado ocultado");
        hideBottomSheet();
        setShowDestinationInput(true); // Mostrar input de destino quando teclado ocultado
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = firebase
      .firestore()
      .collection("locations")
      .onSnapshot((snapshot) => {
        const locations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserLocations(locations);
      });

    return () => unsubscribe();
  }, []);

  const expandBottomSheet = () => {
    bottomSheetRef.current?.snapToIndex(3);
  };

  const hideBottomSheet = () => {
    bottomSheetRef.current?.snapToIndex(2);
  };


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
    if (userId) {
      console.log("UserID:", userId);
    }
  }, [userId]);

  useEffect(() => {
    console.log("Origin set:", origin);
    console.log("Destination set:", destination);
  }, [origin, destination]);
  useEffect(() => {
    (async function obterLocalizacao() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const location = await Location.getCurrentPositionAsync({
            enableHighAccuracy: true,
          });
          console.log(location);
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

  const definirLocalizacaoAtualComoOrigem = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      try {
        const location = await Location.getCurrentPositionAsync({
          enableHighAccuracy: true,
        });
        console.log(location);
        const newOrigin = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.00093,
          longitudeDelta: 0.0031,
        };
        setOrigin(newOrigin);
        setOriginMarker(newOrigin);
      } catch (error) {
        console.error("Erro ao obter a localização", error);
      }
    } else {
      console.log("Permissão de localização negada");
    }
  };

  const handleOriginFocus = () => {
    setShowDestinationInput(false); // Ocultar input de destino quando origem focado
  };

  function handleScheduleTrip() {
    if (!destination) {
      alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    try {
      // Certifique-se de estar autenticado no Firebase para obter o UID do usuário
      const userId = firebase.auth().currentUser?.uid;
      if (!userId) {
        alert("Erro", "Usuário não autenticado.");
        return;
      }

      alert(
        "informacoes",
        userId,
        origin, // ou origin se quiser salvar as coordenadas
        destinationName,
        destination,
        distance,
        price,
        availableSeats
      );

      const tripData = {
        userId,
        origin: origin, // ou origin se quiser salvar as coordenadas
        destinationName,
        destination,
        distance,
        price,
        availableSeats,
      };

      navigation.navigate("CarlistScreen", {
        userId,
        origin: origin, // ou origin se quiser salvar as coordenadas
        destinationName,
        destination,
        distance,
        price: Math.floor(price),
        availableSeats,
      });
      alert("Sucesso", "Viagem agendada com sucesso.");
      /* navigation.goBack(); // ou navegue para outra tela conforme desejado*/
    } catch (error) {
      console.error("Erro ao agendar viagem:", error);
      alert("Erro ao agendar viagem", error.message);
    }
  }

  const back=()=>{
    navigation.navigate("Login")
  }

  // Função chamada quando o campo de destino é focado
  const handleDestinationFocus = () => {};

  // Alteração no retorno do componente HomeScreen
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TouchableOpacity style={styles.menu} onPress={back}>
            <View>
            <Icon name="list" size={31} color="#007AFF" />;
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
            >
              {destinationMarker && (
                <Marker coordinate={destinationMarker} title="Destino" />
              )}
              {destination && (
                <MapViewDirections
                origin={origin}
                destination={destination}
                apikey={config.googleApi}
                strokeColor="blue"
                strokeWidth={3}
                onReady={(result) => {
                  console.log("Coordenadas da rota:", result.coordinates);
                  console.log("Distância:", result.distance);
                  console.log("Preço calculado:", result.distance * 150);
              
                  setCoordinatesList(result.coordinates);
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
      <BottomSheetView
              contentContainerStyle={styles.contentContainer}
            >
              <View style={styles.searchWrapper}>
                {/* Input de destino */}
                {showDestinationInput && (
                  <View style={styles.search}>
                    <GooglePlacesAutocomplete
                      placeholder="Para onde vamos?"
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
                      
                          console.log("Destino selecionado:", newDestination);
                      
                          setDestination(newDestination);
                          setDestinationMarker(newDestination);
                          setDestinationName(data.description);
                      
                          // Espera o estado atualizar e foca na rota
                          setTimeout(() => {
                            if (origin && mapEl.current) {
                              console.log("Ajustando mapa para:", [origin, newDestination]);
                              mapEl.current.fitToCoordinates([origin, newDestination], {
                                edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
                              });
                            }
                          }, 500);
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
                  </View>
                )}

                {/* Botão de procurar */}
                {!isKeyboardVisible && (
                  <TouchableOpacity
                    style={styles.olaButton}
                    onPress={navigateToNextPage}
                  >
                    <Text style={styles.buttonText}>Procurar</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  searchWrapper: {
    position: "absolute",
    top: 20, // Ajuste conforme necessário
    width: "100%",
    paddingHorizontal: 20,
    zIndex: 1,
  },
  search: {
    marginBottom: 10, // Ajuste conforme necessário
  },
  olaButton: {
    backgroundColor: "#188AEC",
    paddingVertical: 15,
    paddingHorizontal: 140,
    borderRadius: 55,
    marginTop: 20, // Ajuste conforme necessário
    alignSelf: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
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
});

const googleAutocompleteStyles = {
  container: {
    flex: 0,
    position: "relative",
    width: "100%",
    zIndex: 2,
  },
  textInputContainer: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
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