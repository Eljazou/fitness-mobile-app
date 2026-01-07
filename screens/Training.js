import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');

const Training = () => {
  const [selectedMuscle, setSelectedMuscle] = useState(null);

  const muscleData = {
    trapezes: {
      name: "Trapèzes",
      description: "Muscles du haut du dos et de la nuque, importants pour les mouvements d'élévation des épaules.",
      exercises: ["Haussements d'épaules", "Face pull", "Élévations latérales inclinées"],
      videoId: "v_NI0G5gH1E"
    },
    deltoides: {
      name: "Deltoïdes",
      description: "Muscles des épaules composés de trois faisceaux (antérieur, moyen, postérieur).",
      exercises: ["Développé militaire", "Élévations latérales", "Oiseau (rear delt fly)"],
      videoId: "3R14MnZbcpw"
    },
    pectoraux: {
      name: "Pectoraux",
      description: "Muscles de la poitrine essentiels pour les mouvements de poussée.",
      exercises: ["Développé couché", "Écartés aux haltères", "Pompes", "Dips"],
      videoId: "gRVjAtPip0Y"
    },
    biceps: {
      name: "Biceps",
      description: "Muscles avant du bras responsables de la flexion du coude.",
      exercises: ["Curl avec haltères", "Curl à la barre", "Curl marteau"],
      videoId: "ykJmrZ5v0Oo"
    },
    triceps: {
      name: "Triceps",
      description: "Muscles arrière du bras responsables de l'extension du coude.",
      exercises: ["Extensions nuque", "Dips", "Barre au front"],
      videoId: "6SS6K3lAwZ8"
    },
    abdominaux: {
      name: "Abdominaux",
      description: "Groupe musculaire central comprenant le droit, les obliques et le transverse.",
      exercises: ["Crunch", "Planche", "Relevés de jambes", "Russian twist"],
      videoId: "2pLT-olgUJs"
    },
    dorsaux: {
      name: "Dorsaux",
      description: "Grands muscles du dos donnant la forme en V.",
      exercises: ["Tractions", "Rowing barre", "Pulldown"],
      videoId: "CAwf7n6Luuc"
    },
    lombaires: {
      name: "Lombaires",
      description: "Muscles du bas du dos importants pour la posture.",
      exercises: ["Extensions lombaires", "Good morning", "Superman"],
      videoId: "ph3pddpKzzw"
    },
    fessiers: {
      name: "Fessiers",
      description: "Muscles des fesses parmi les plus puissants du corps.",
      exercises: ["Squat", "Hip thrust", "Fentes", "Donkey kick"],
      videoId: "Zp26q4BY5HE"
    },
    quadriceps: {
      name: "Quadriceps",
      description: "Muscles avant de la cuisse, les plus puissants du corps.",
      exercises: ["Squat", "Presse à cuisses", "Fentes", "Leg extension"],
      videoId: "D7KaRcUTQeE"
    },
    ischios: {
      name: "Ischio-jambiers",
      description: "Muscles arrière de la cuisse responsables de la flexion du genou.",
      exercises: ["Leg curl", "Deadlift roumain", "Good morning"],
      videoId: "2SHsk9AzdjA"
    },
    mollets: {
      name: "Mollets",
      description: "Muscles gastrocnémiens et soléaire de la jambe.",
      exercises: ["Élévations des mollets", "Saut à la corde"],
      videoId: "T3WZRjnkZbU"
    }
  };

  const openVideo = (videoId) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  const handleMusclePress = (muscleKey) => {
    setSelectedMuscle(muscleKey);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guide d'Entraînement</Text>
        <Text style={styles.headerSubtitle}>Touchez une zone musculaire</Text>
      </View>

      <View style={styles.bodyContainer}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: 'https://st4.depositphotos.com/34939642/37995/v/450/depositphotos_379950092-stock-illustration-male-human-body-muscles.jpg' }}
            style={styles.bodyImage}
            resizeMode="contain"
          />
          
          {/* Muscle zones as touchable overlays */}
          <TouchableOpacity 
            style={[styles.muscleZone, styles.trapezes]} 
            onPress={() => handleMusclePress('trapezes')}
          />
          <TouchableOpacity 
            style={[styles.muscleZone, styles.deltoides]} 
            onPress={() => handleMusclePress('deltoides')}
          />
          <TouchableOpacity 
            style={[styles.muscleZone, styles.pectoraux]} 
            onPress={() => handleMusclePress('pectoraux')}
          />
          <TouchableOpacity 
            style={[styles.muscleZone, styles.biceps]} 
            onPress={() => handleMusclePress('biceps')}
          />
          <TouchableOpacity 
            style={[styles.muscleZone, styles.triceps]} 
            onPress={() => handleMusclePress('triceps')}
          />
          <TouchableOpacity 
            style={[styles.muscleZone, styles.abdominaux]} 
            onPress={() => handleMusclePress('abdominaux')}
          />
          <TouchableOpacity 
            style={[styles.muscleZone, styles.dorsaux]} 
            onPress={() => handleMusclePress('dorsaux')}
          />
          <TouchableOpacity 
            style={[styles.muscleZone, styles.lombaires]} 
            onPress={() => handleMusclePress('lombaires')}
          />
          <TouchableOpacity 
            style={[styles.muscleZone, styles.fessiers]} 
            onPress={() => handleMusclePress('fessiers')}
          />
          <TouchableOpacity 
            style={[styles.muscleZone, styles.quadriceps]} 
            onPress={() => handleMusclePress('quadriceps')}
          />
          <TouchableOpacity 
            style={[styles.muscleZone, styles.ischios]} 
            onPress={() => handleMusclePress('ischios')}
          />
          <TouchableOpacity 
            style={[styles.muscleZone, styles.mollets]} 
            onPress={() => handleMusclePress('mollets')}
          />
        </View>
      </View>

      {selectedMuscle && muscleData[selectedMuscle] && (
        <View style={styles.infoCard}>
          <Text style={styles.muscleName}>{muscleData[selectedMuscle].name}</Text>
          <Text style={styles.muscleDescription}>{muscleData[selectedMuscle].description}</Text>
          
          <Text style={styles.exercisesTitle}>Exercices recommandés:</Text>
          {muscleData[selectedMuscle].exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseItem}>
              <Text style={styles.exerciseBullet}>→</Text>
              <Text style={styles.exerciseText}>{exercise}</Text>
            </View>
          ))}

          <TouchableOpacity 
            style={styles.videoButton}
            onPress={() => openVideo(muscleData[selectedMuscle].videoId)}
          >
            <Text style={styles.videoButtonText}>▶ Voir la vidéo d'entraînement</Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectedMuscle && (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>
            👆 Touchez une zone du corps pour voir les exercices
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  bodyContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageWrapper: {
    position: 'relative',
    width: width - 60,
    height: (width - 60) * 1.5,
  },
  bodyImage: {
    width: '100%',
    height: '100%',
  },
  muscleZone: {
    position: 'absolute',
    backgroundColor: 'rgba(67, 97, 238, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(67, 97, 238, 0.5)',
    borderRadius: 8,
  },
  // Muscle zone positions (adjusted for mobile)
  trapezes: { top: '17%', left: '42.5%', width: '15%', height: '7%' },
  deltoides: { top: '20%', left: '34%', width: '32%', height: '10%' },
  pectoraux: { top: '21%', left: '38%', width: '24%', height: '14%' },
  biceps: { top: '26%', left: '30%', width: '9%', height: '11%' },
  triceps: { top: '26%', left: '61%', width: '9%', height: '11%' },
  abdominaux: { top: '32%', left: '40%', width: '20%', height: '12%' },
  dorsaux: { top: '22%', left: '38%', width: '24%', height: '15%' },
  lombaires: { top: '42%', left: '41%', width: '18%', height: '8%' },
  fessiers: { top: '45%', left: '41%', width: '18%', height: '10%' },
  quadriceps: { top: '50%', left: '35%', width: '14%', height: '19%' },
  ischios: { top: '50%', left: '51%', width: '14%', height: '19%' },
  mollets: { top: '70%', left: '38%', width: '12%', height: '10%' },
  infoCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  muscleName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#4895ef',
    paddingBottom: 10,
  },
  muscleDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 15,
  },
  exercisesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  exerciseBullet: {
    fontSize: 18,
    color: '#4895ef',
    fontWeight: 'bold',
    marginRight: 10,
  },
  exerciseText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  videoButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  videoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default Training;