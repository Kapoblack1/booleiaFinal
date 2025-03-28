import React, { 
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,  } from "react"; 
import { StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  TextInput,
  ScrollView, } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapViewDirections from "react-native-maps-directions";
import { MaterialIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import config from "../../confiApi";
import bom from "../../assets/bom.png";
import { useNavigation } from "@react-navigation/native";
import { getDatabase, ref, onValue } from "firebase/database";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function HomeScreenP({ route }) {
  const {
    car,
    userId,
    origin,
    destination,
    driverInfo,
    selectedPayment,
    tripId,
  } = route.params;
  const mapRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const snapPoints = ["30%", "40%", "90%"];
  const [userLocation, setUserLocation] = useState(null);
  const [followUserLocation, setFollowUserLocation] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);
  const [distance, setDistance] = useState(null);
  const [price, setPrice] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [driverId, setDriverId] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);
  const mapEl = useRef(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const navigation = useNavigation();
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos da sua permissão para acessar a localização"
        );
        return;
      }
  
      // Para o Android 10+ e atualizações em segundo plano
      if (Platform.OS === "android") {
        await Location.requestBackgroundPermissionsAsync();
      }
    })();
  }, []);

 /* useEffect(() => {
    // Set a timeout to mark the user as 'arrived' after 5 seconds
    const timer = setTimeout(async () => {
      try {
        const db = getFirestore();
        const tripRef = doc(db, "trips", tripId);

        // Update the 'arrived' array by adding the userId
        await updateDoc(tripRef, {
          arrived: arrayUnion(userId), // Add the userId to the 'arrived' array if not already present
        });

        console.log(`Passenger with userId ${userId} marked as arrived.`);
      } catch (error) {
        console.error("Error updating arrived status: ", error);
        Alert.alert(
          "Erro",
          "Houve um problema ao atualizar o status de chegada."
        );
      }
    }, 5000); // 5-second delay

    // Cleanup the timeout if the component unmounts or dependencies change
    return () => clearTimeout(timer);
  }, [tripId, userId]); // Trigger the effect when tripId or userId change
*/
  useEffect(() => {
    const fetchDriverId = async () => {
      const db = getFirestore();
      try {
        const docRef = doc(db, "trips", tripId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const tripData = docSnap.data();
          const driverId = tripData.userId;
          console.log("Driver ID:", driverId);
          setDriverId(driverId);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching driver ID: ", error);
      }
    };

    if (tripId && !hasArrived) {
      fetchDriverId();
    }
  }, [tripId, hasArrived]); // Certifique-se de que `hasArrived` controle a repetição

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
    if (!hasArrived) {
      if (driverId) {
        const db = getDatabase();
        const driverLocationRef = ref(db, `locations/${driverId}`);

        const unsubscribe = onValue(driverLocationRef, (snapshot) => {
          const locationData = snapshot.val();
          if (locationData) {
            setDriverLocation({
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        });

        return () => unsubscribe(); // Clean up the subscription when the component unmounts
      }
    }
  }, [driverId]);

  useEffect(() => {
    if (driverLocation && destination && !hasArrived) {
      const distanceToDestination = getDistance(
        driverLocation.latitude,
        driverLocation.longitude,
        destination.latitude,
        destination.longitude
      );
  
      if (distanceToDestination < 22740) {
        const timer = setTimeout(async () => {
          try {
            const db = getFirestore();
            const tripRef = doc(db, "trips", tripId);
  
            await updateDoc(tripRef, {
              arrived: arrayUnion(userId),
            });
  
           /* Alert.alert(`Passenger with userId ${userId} marked as arrived.`);*/
            setHasArrived(true); // Marcar como chegou
            setModalVisible(true)
          } catch (error) {
            console.error("Error updating arrived status: ", error);
            Alert.alert(
              "Erro",
              "Houve um problema ao atualizar o status de chegada."
            );
          }
        }, 0);
  
        return () => clearTimeout(timer);
      }
    }
  }, [driverLocation, destination, hasArrived]);

  const handleSheetChanges = useCallback((index) => {
    console.log("Bottom sheet position changed to index", index);
  }, []);

  const handleRatingSelect = (selectedRating) => {
    console.log("Estrelas selecionadas:", selectedRating); // Log de depuração
    setRating(selectedRating);
  };

  const submitFeedback = async () => {
    if (!userId) {
      return; // Retorna se houver algum erro.
    }
    setHasArrived(true);
    setModalVisible(false); // Feche o modal antes de navegar
    navigation.navigate("PassTest", { userId, feedback, rating, tripId }); // Navega para a próxima tela
  };
  const navigateToFeedback = () => {
    setModalVisible(false);
    navigation.navigate("PassTest", { userId, tripId }); // Navega para a tela de feedback
  };
  function nextPage() {
    setModalVisible(!modalVisible);
    navigation.navigate("ThanksScreen", {userId});
  }
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
                {destination && (
                  <MapViewDirections
                    origin={origin}
                    destination={destination}
                    apikey={config.googleApi}
                    strokeColor="blue"
                    strokeWidth={3}
                    onReady={(result) => {
                      console.log(result);
                      setDistance(result.distance);
                      setPrice(result.distance * 150);
                      mapEl.current.fitToCoordinates(result.coordinates, {
                        edgePadding: {
                          top: 280,
                          bottom: 100,
                          left: 110,
                          right: 150,
                        },
                      });
                    }}
                  />
                )}
                {driverLocation && (
                  <Marker
                    coordinate={driverLocation}
                    title="Condutor"
                    description="Localização atual do condutor"
                  />
                )}
                <Marker
                  coordinate={destination}
                  title="Destino do Passageiro"
                  description="Destino final"
                />
              </MapView>

            <TouchableOpacity style={styles.button} onPress={centerMapOnUser}>
              <MaterialIcons name="my-location" size={24} color="white" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* BottomSheet no topo da renderização */}
      <BottomSheet ref={bottomSheetRef} index={2} snapPoints={snapPoints}>
        <BottomSheetView style={styles.bottomSheetContainer}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
        <BottomSheetView contentContainerStyle={styles.contentContainer}>
          <TouchableOpacity style={styles.cancel}>
            <Text style={styles.cancelText}>Cancelar viagem</Text>
          </TouchableOpacity>
          <View style={styles.carContainer}>
            <View style={styles.information}>
              {driverInfo && (
                <View style={styles.driver}>
                  <Image
                    source={{ uri: car.driver.profilePicture }}
                    style={styles.driverImage}
                  />
                </View>
              )}
              <View>
                <Text style={styles.carName}>{car.driver.name}</Text>
                <Text style={styles.carDetails1}>
                  {car.carName} {car.model}
                </Text>
                <Text style={styles.carDetails1}>
                  Matricula: {car.licensePlate}
                </Text>
                <View style={styles.center}>
                  <Icon name="star" size={18} color="#FBC02D" />
                  <Text style={styles.carDetails}>
                    {car.star} ({car.review} reviews)
                  </Text>
                </View>
              </View>
              <Image source={{ uri: car.image }} style={styles.carImage} />
            </View>
          </View>
          <View style={styles.paymentContainer}>
            <Text style={styles.select}>Valor a pagar: {car.price} AOA</Text>
            <View style={styles.containerSelect1}>
              <Text style={styles.select1}>Método do pagamento: </Text>
              <Text style={styles.paymentMethod}> {selectedPayment}</Text>
            </View>
            <View style={styles.tabContainer}>
              <TouchableOpacity style={styles.tabButton}>
                <Text style={styles.tabText}>Ligar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabButton2}>
                <Text style={styles.tabText2}>Enviar mensagem</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetView>
      </ScrollView>
        </BottomSheetView>
      </BottomSheet>
      <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            navigateToFeedback;
          }}
        >
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => nextPage()}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <Image source={bom} style={styles.bom}></Image>
            <Text style={styles.modalText}>Chegou ao seu destino!</Text>
            <Text>{driverInfo?.name} a viagem ficou no total de:</Text>
            <Text style={styles.modalAmount}>AKZ {car.price}</Text>
            <Text>Como foi a sua viagem?</Text>
  
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={submitFeedback}
            >
              <Text style={styles.feedbackButtonText}>Deixa o seu Feedback</Text>
            </TouchableOpacity>
          </View>
        </Modal>
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
    width: "50%",
    height: "100%",
    resizeMode: "contain",
  },
  carName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  center: {
    alignItems: "center",
    alignContent: "center",
    flexDirection: "row",
  },
  carDetails: {
    color: "#B8B8B8",
    marginLeft: "3%",
  },
  carDetails1: {
    color: "#B8B8B8",
    marginLeft: "3%",
    paddingBottom: "2%",
  },
  driver: {
    flexDirection: "row",
    alignItems: "center",
    alignContent: "center",
  },
  driverImage: {
    resizeMode: "cover",
    height: 90,
    width: 90,
    borderRadius: 190,
    marginRight: "1%",
    backgroundColor: "#E8F4FF",
    borderWidth: 1,
    borderColor: "#188AEC",
  },
  driverName: {
    fontSize: 30,
    fontWeight: "450",
    color: "#5A5A5A",
  },
  paymentContainer: {
    marginTop: 20,
  },
  select: {
    fontSize: 20,
    color: "#5A5A5A",
    paddingHorizontal: 15,
  },
  select1: {
    fontSize: 20,
    color: "#5A5A5A",
  },
  containerSelect1: {
    flexDirection: "row",
    marginTop: 10,
    alignContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: "5%",
    paddingHorizontal: "4.5%",
    marginBottom: "5%",
  },
  tabButton: {
    backgroundColor: "#188AEC",
    borderRadius: 40,
    width: "47%",
    height: 50,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  tabButton2: {
    backgroundColor: "#fff",
    borderRadius: 40,
    width: "47%",
    height: 50,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#188AEC",
  },
  tabText: {
    fontSize: 16,
    color: "#fff",
  },
  tabText2: {
    fontSize: 16,
    color: "#188AEC",
  },
  modalView: {
    margin: 23,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    height: "60%",
    top: 120,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  closeButtonText: {
    fontSize: 25,
    color: "#000",
    top: 20,
    right: 30,
  },
  bom: {
    width: "40%",
    height: "30%",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
  },
  modalAmount: {
    fontSize: 24,
    color: "#188AEC",
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },
  feedbackButton: {
    backgroundColor: "#188AEC",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 10,
  },
  feedbackButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  cancel: {
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 57,
    marginHorizontal: 15,
    borderColor: "#D32F2F",
    borderRadius: 8,
  },
  cancelText: {
    color: "#D32F2F",
  },
});
