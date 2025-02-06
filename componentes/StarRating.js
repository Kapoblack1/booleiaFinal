import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

const StarRating = ({ onRatingSelect }) => {
  const [rating, setRating] = useState(0);

  const handleRating = (selectedRating) => {
    setRating(selectedRating);
    onRatingSelect(selectedRating);
  };

  return (
    <View style={{ flexDirection: "row", justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((item) => (
        <TouchableOpacity key={item} onPress={() => handleRating(item)}>
          <Icon
            name={item <= rating ? "star" : "star-o"} // Ícone preenchido ou contorno
            size={35}
            color={item <= rating ? "#FBC02D" : "#E0E0E0"} // Cor das estrelas
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default StarRating;
