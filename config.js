import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBccIF8YZCTN-TbAOyr0wtjRlh_XmPjQvw",
  authDomain: "booleia.firebaseapp.com",
  projectId: "booleia",
  storageBucket: "booleia.appspot.com",
  messagingSenderId: "637793315442",
  appId: "1:637793315442:web:9b27bc2d11237f46c8b0eb"
};

if(!firebase.apps.length){
    firebase.initializeApp(firebaseConfig);
}