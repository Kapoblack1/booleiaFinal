import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import config from "../../confiApi";

const RouteMapScreen = ({ route, navigation }) => {
  const { car, userId, origin, destination, tripId } = route.params;

  const [loading, setLoading] = useState(true);
  const [coordinatesList, setCoordinatesList] = useState([]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        console.log("Fetching route for userId:", userId);

        const db = getFirestore();
        const docRef = doc(db, "trips", tripId);
        const docSnap = await getDoc(docRef);
        console.log("tripId:", tripId);

        if (docSnap.exists()) {
          const routeData = docSnap.data();
          console.log("Route data fetched from Firestore:", routeData);
          console.log("Coordinates list:", routeData.coordinatesList);
          setCoordinatesList(routeData.coordinatesList); // Set the fetched coordinates
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching route: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [tripId]);

  const handleConfirmRoute = () => {
    navigation.navigate("TravelInformation", { car, userId, origin, destination, tripId });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#188AEC" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Rota do Condutor</Text>
      </View>
  
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker coordinate={origin} title="Origem" description="Ponto de partida" />
        <Marker coordinate={destination} title="Destino" description="Ponto de chegada" />
  
        {/* Render Polyline for the route */}
        {coordinatesList.length > 0 && (
          <Polyline
            coordinates={coordinatesList.map(coord => ({
              latitude: coord.latitude,
              longitude: coord.longitude
            }))}
            strokeColor="#188AEC"
            strokeWidth={3}
          />
        )}
      </MapView>
  
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmRoute}>
          <Text style={styles.confirmButtonText}>Confirmar Rota</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 70 : 20,
    left: 0,
    right: 0,
    width: "100%",
    alignItems: "center",
    zIndex: 1, // Garante que fique acima do mapa
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Fundo semi-transparente para melhor visibilidade
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#ff3333",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: "#188AEC",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
    flex: 1,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RouteMapScreen;
