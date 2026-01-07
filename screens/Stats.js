import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

const Stats = () => {
  const [userData, setUserData] = useState({
    weight: 0,
    height: 0,
    age: 0,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain'
  });
  
  const [dailyStats, setDailyStats] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    water: 0,
    steps: 0,
    workoutMinutes: 0
  });

  const [streak, setStreak] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Form data pour le profil
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain'
  });

  const auth = getAuth();
  const db = getFirestore();
  const currentUser = auth.currentUser;

  useEffect(() => {
    loadUserData();
    loadTodayStats();
    loadWeeklyData();
    calculateStreak();
  }, []);

  const loadUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setFormData({
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
          age: data.age?.toString() || '',
          gender: data.gender || 'male',
          activityLevel: data.activityLevel || 'moderate',
          goal: data.goal || 'maintain'
        });
      } else {
        // Premier usage - afficher le modal de profil
        setIsFirstTime(true);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveUserProfile = async () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseInt(formData.age);

    if (!weight || !height || !age) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (weight < 30 || weight > 300) {
      Alert.alert('Error', 'Please enter a valid weight (30-300 kg)');
      return;
    }

    if (height < 100 || height > 250) {
      Alert.alert('Error', 'Please enter a valid height (100-250 cm)');
      return;
    }

    if (age < 10 || age > 120) {
      Alert.alert('Error', 'Please enter a valid age (10-120 years)');
      return;
    }

    try {
      const newUserData = {
        weight,
        height,
        age,
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        goal: formData.goal,
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', currentUser.uid), newUserData, { merge: true });
      setUserData(newUserData);
      setShowProfileModal(false);
      setIsFirstTime(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsDoc = await getDoc(doc(db, 'stats', `${currentUser.uid}_${today}`));
      
      if (statsDoc.exists()) {
        setDailyStats(statsDoc.data());
      }
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  const loadWeeklyData = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const statsQuery = query(
        collection(db, 'stats'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(statsQuery);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push(doc.data());
      });
      
      // Trier par date et prendre les 7 derniers
      const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7);
      setWeeklyData(sortedData);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  };

  const calculateStreak = async () => {
    try {
      const statsQuery = query(
        collection(db, 'stats'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(statsQuery);
      const statsData = [];
      querySnapshot.forEach((doc) => {
        statsData.push(doc.data());
      });

      // Trier par date décroissante
      statsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      let currentStreak = 0;
      let lastDate = new Date();
      lastDate.setHours(0, 0, 0, 0);
      
      for (let stat of statsData) {
        const statDate = new Date(stat.date);
        statDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((lastDate - statDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0 || diffDays === 1) {
          if (stat.workoutMinutes > 0 || stat.calories > 0) {
            currentStreak++;
            lastDate = statDate;
          }
        } else {
          break;
        }
      }
      
      setStreak(currentStreak);
    } catch (error) {
      console.error('Error calculating streak:', error);
    }
  };

  const calculateBMR = () => {
    const { weight, height, age, gender } = userData;
    if (!weight || !height || !age) return 0;
    
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };
    
    return Math.round(bmr * (activityMultipliers[userData.activityLevel] || 1.55));
  };

  const getCalorieGoal = () => {
    const tdee = calculateTDEE();
    if (tdee === 0) return 2000; // Default
    
    switch(userData.goal) {
      case 'lose': return tdee - 500;
      case 'gain': return tdee + 500;
      default: return tdee;
    }
  };

  const saveStat = async (metric, value) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'stats', `${currentUser.uid}_${today}`);
      
      const newStats = {
        ...dailyStats,
        [metric]: parseFloat(value),
        userId: currentUser.uid,
        date: today,
        timestamp: serverTimestamp()
      };
      
      await setDoc(docRef, newStats, { merge: true });
      setDailyStats(newStats);
      setShowAddModal(false);
      setMetricValue('');
      
      loadWeeklyData();
      calculateStreak();
      
      Alert.alert('Success', 'Stats updated!');
    } catch (error) {
      console.error('Error saving stat:', error);
      Alert.alert('Error', 'Failed to save stat');
    }
  };

  const openAddModal = (metric) => {
    setSelectedMetric(metric);
    setShowAddModal(true);
  };

  const renderStatCard = (title, value, goal, unit, icon, color, metric) => {
    const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
    
    return (
      <TouchableOpacity 
        style={styles.statCard}
        onPress={() => openAddModal(metric)}
      >
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: color }]}>
            <Ionicons name={icon} size={24} color="#fff" />
          </View>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        
        <Text style={styles.statValue}>{value}{unit}</Text>
        {goal > 0 && (
          <>
            <Text style={styles.statGoal}>Goal: {goal}{unit}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderWeeklyChart = () => {
    if (weeklyData.length === 0) return null;
    
    const maxCalories = Math.max(...weeklyData.map(d => d.calories || 0), getCalorieGoal());
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Weekly Calories</Text>
        <View style={styles.chart}>
          {weeklyData.map((data, index) => {
            const height = (data.calories / maxCalories) * 150;
            const date = new Date(data.date);
            const dayName = days[date.getDay()];
            
            return (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={[styles.bar, { height: height || 5 }]}
                  />
                </View>
                <Text style={styles.barLabel}>{dayName}</Text>
              </View>
            );
          })}
        </View>
        
        <View style={styles.goalLine}>
          <View style={styles.dashedLine} />
          <Text style={styles.goalLineText}>Goal: {getCalorieGoal()} kcal</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📊 My Stats</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowProfileModal(true)}
          >
            <Ionicons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Track your fitness journey</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Streak Card */}
        <LinearGradient
          colors={['#f59e0b', '#f97316']}
          style={styles.streakCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.streakContent}>
            <Ionicons name="flame" size={40} color="#fff" />
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
          <Text style={styles.streakMessage}>Keep going! 💪</Text>
        </LinearGradient>

        {/* Calorie Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Nutrition</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Calories', dailyStats.calories, getCalorieGoal(), ' kcal', 'flame', '#ef4444', 'calories')}
            {renderStatCard('Protein', dailyStats.protein, Math.round(userData.weight * 2 || 140), 'g', 'nutrition', '#10b981', 'protein')}
            {renderStatCard('Carbs', dailyStats.carbs, Math.round(getCalorieGoal() * 0.4 / 4), 'g', 'pizza', '#f59e0b', 'carbs')}
            {renderStatCard('Fats', dailyStats.fats, Math.round(getCalorieGoal() * 0.3 / 9), 'g', 'water', '#06b6d4', 'fats')}
          </View>
        </View>

        {/* Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Water', dailyStats.water, 8, ' glasses', 'water', '#06b6d4', 'water')}
            {renderStatCard('Steps', dailyStats.steps, 10000, '', 'walk', '#8b5cf6', 'steps')}
            {renderStatCard('Workout', dailyStats.workoutMinutes, 30, ' min', 'barbell', '#ec4899', 'workoutMinutes')}
          </View>
        </View>

        {/* Weekly Chart */}
        {renderWeeklyChart()}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isFirstTime && setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalContent}>
            <Text style={styles.profileModalTitle}>
              {isFirstTime ? '👋 Welcome! Setup Your Profile' : '⚙️ Edit Profile'}
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="70"
                  keyboardType="numeric"
                  value={formData.weight}
                  onChangeText={(text) => setFormData({...formData, weight: text})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="170"
                  keyboardType="numeric"
                  value={formData.height}
                  onChangeText={(text) => setFormData({...formData, height: text})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Age</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="25"
                  keyboardType="numeric"
                  value={formData.age}
                  onChangeText={(text) => setFormData({...formData, age: text})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Gender</Text>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[styles.optionButton, formData.gender === 'male' && styles.optionButtonActive]}
                    onPress={() => setFormData({...formData, gender: 'male'})}
                  >
                    <Text style={[styles.optionText, formData.gender === 'male' && styles.optionTextActive]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, formData.gender === 'female' && styles.optionButtonActive]}
                    onPress={() => setFormData({...formData, gender: 'female'})}
                  >
                    <Text style={[styles.optionText, formData.gender === 'female' && styles.optionTextActive]}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Activity Level</Text>
                <TouchableOpacity
                  style={[styles.selectButton, formData.activityLevel === 'sedentary' && styles.selectButtonActive]}
                  onPress={() => setFormData({...formData, activityLevel: 'sedentary'})}
                >
                  <Text style={styles.selectButtonText}>Sedentary (little/no exercise)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectButton, formData.activityLevel === 'light' && styles.selectButtonActive]}
                  onPress={() => setFormData({...formData, activityLevel: 'light'})}
                >
                  <Text style={styles.selectButtonText}>Light (1-3 days/week)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectButton, formData.activityLevel === 'moderate' && styles.selectButtonActive]}
                  onPress={() => setFormData({...formData, activityLevel: 'moderate'})}
                >
                  <Text style={styles.selectButtonText}>Moderate (3-5 days/week)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectButton, formData.activityLevel === 'active' && styles.selectButtonActive]}
                  onPress={() => setFormData({...formData, activityLevel: 'active'})}
                >
                  <Text style={styles.selectButtonText}>Active (6-7 days/week)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Goal</Text>
                <TouchableOpacity
                  style={[styles.selectButton, formData.goal === 'lose' && styles.selectButtonActive]}
                  onPress={() => setFormData({...formData, goal: 'lose'})}
                >
                  <Text style={styles.selectButtonText}>Lose Weight (-500 cal)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectButton, formData.goal === 'maintain' && styles.selectButtonActive]}
                  onPress={() => setFormData({...formData, goal: 'maintain'})}
                >
                  <Text style={styles.selectButtonText}>Maintain Weight</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectButton, formData.goal === 'gain' && styles.selectButtonActive]}
                  onPress={() => setFormData({...formData, goal: 'gain'})}
                >
                  <Text style={styles.selectButtonText}>Gain Muscle (+500 cal)</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.profileModalButtons}>
              {!isFirstTime && (
                <TouchableOpacity
                  style={styles.cancelProfileButton}
                  onPress={() => setShowProfileModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.saveProfileButton, isFirstTime && styles.saveProfileButtonFull]}
                onPress={saveUserProfile}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Save Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Stat Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add {selectedMetric}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter value"
              keyboardType="numeric"
              value={metricValue}
              onChangeText={setMetricValue}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setMetricValue('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => saveStat(selectedMetric, metricValue)}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    padding: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  streakCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  streakInfo: {
    marginLeft: 15,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  streakMessage: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 45) / 2,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statGoal: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginTop: 15,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '80%',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 5,
  },
  barLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
  },
  goalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#999',
    marginRight: 10,
  },
  goalLineText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: width - 60,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    padding: 15,
    textAlign: 'center',
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    overflow: 'hidden',
  },
  saveButtonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: width - 40,
    maxHeight: '80%',
  },
  profileModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  optionText: {
    color: '#666',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#fff',
  },
  selectButton: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  selectButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  selectButtonText: {
    color: '#666',
    fontSize: 14,
  },
  profileModalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelProfileButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
  },
  saveProfileButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveProfileButtonFull: {
    flex: 1,
  },
});

export default Stats;