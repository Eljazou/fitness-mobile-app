import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  Linking,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Nutrition = () => {
  const [meals, setMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    { name: 'All', icon: '🍽️', color: '#667eea', gradient: ['#667eea', '#764ba2'] },
    { name: 'Breakfast', icon: '🥞', color: '#f59e0b', gradient: ['#f59e0b', '#f97316'] },
    { name: 'Dessert', icon: '🍰', color: '#ec4899', gradient: ['#ec4899', '#f43f5e'] },
    { name: 'Vegetarian', icon: '🥗', color: '#10b981', gradient: ['#10b981', '#059669'] },
    { name: 'Chicken', icon: '🍗', color: '#f97316', gradient: ['#f97316', '#ea580c'] },
    { name: 'Seafood', icon: '🦐', color: '#06b6d4', gradient: ['#06b6d4', '#0891b2'] },
    { name: 'Pasta', icon: '🍝', color: '#ef4444', gradient: ['#ef4444', '#dc2626'] },
  ];

  useEffect(() => {
    fetchMeals('chicken');
  }, []);

  const fetchMeals = async (query = 'chicken') => {
    setLoading(true);
    try {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
      const data = await response.json();
      if (data.meals) {
        setMeals(data.meals);
        setFilteredMeals(data.meals);
      } else {
        setMeals([]);
        setFilteredMeals([]);
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMealsByCategory = async (category) => {
    if (category === 'All') {
      fetchMeals('chicken');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
      const data = await response.json();
      if (data.meals) {
        const detailedMeals = await Promise.all(
          data.meals.slice(0, 20).map(async (meal) => {
            const detailResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
            const detailData = await detailResponse.json();
            return detailData.meals[0];
          })
        );
        setMeals(detailedMeals);
        setFilteredMeals(detailedMeals);
      }
    } catch (error) {
      console.error('Error fetching category meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text === '') {
      setFilteredMeals(meals);
    } else {
      const filtered = meals.filter(meal =>
        meal.strMeal.toLowerCase().includes(text.toLowerCase()) ||
        (meal.strCategory && meal.strCategory.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredMeals(filtered);
    }
  };

  const handleCategoryPress = (category) => {
    setActiveCategory(category.name);
    fetchMealsByCategory(category.name);
  };

  const openMealDetails = (meal) => {
    setSelectedMeal(meal);
    setModalVisible(true);
  };

  const getIngredients = (meal) => {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim() !== '') {
        ingredients.push(`${measure} ${ingredient}`);
      }
    }
    return ingredients;
  };

  const watchVideo = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>🍴 Nutrition Guide</Text>
        <Text style={styles.headerSubtitle}>Discover delicious & healthy recipes</Text>
      </LinearGradient>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={22} color="#667eea" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for meals..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={22} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesTitle}>Categories</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              style={styles.categoryButton}
              onPress={() => handleCategoryPress(cat)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={activeCategory === cat.name ? cat.gradient : ['#fff', '#fff']}
                style={styles.categoryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[
                  styles.categoryIconContainer,
                  activeCategory === cat.name && styles.categoryIconContainerActive
                ]}>
                  <Text style={styles.categoryIconLarge}>{cat.icon}</Text>
                </View>
                <Text style={[
                  styles.categoryLabel,
                  activeCategory === cat.name && styles.categoryLabelActive
                ]}>
                  {cat.name}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cooking up something delicious...</Text>
        </View>
      ) : (
        <ScrollView style={styles.mealsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredMeals.length} delicious recipes
            </Text>
            <Ionicons name="flame" size={20} color="#f97316" />
          </View>
          <View style={styles.mealsGrid}>
            {filteredMeals.map((meal) => (
              <TouchableOpacity
                key={meal.idMeal}
                style={styles.mealCard}
                onPress={() => openMealDetails(meal)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: meal.strMealThumb }} style={styles.mealImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.mealOverlay}
                >
                  <Text style={styles.mealName} numberOfLines={2}>{meal.strMeal}</Text>
                  <View style={styles.mealMeta}>
                    <View style={styles.metaBadge}>
                      <Ionicons name="restaurant" size={12} color="#fff" />
                      <Text style={styles.metaText}>{meal.strCategory}</Text>
                    </View>
                    <View style={styles.metaBadge}>
                      <Ionicons name="location" size={12} color="#fff" />
                      <Text style={styles.metaText}>{meal.strArea}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedMeal && (
          <ScrollView style={styles.modalContainer}>
            <Image source={{ uri: selectedMeal.strMealThumb }} style={styles.modalImage} />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
                style={styles.closeButtonGradient}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedMeal.strMeal}</Text>
              
              <View style={styles.modalBadges}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.badge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="restaurant" size={16} color="#fff" />
                  <Text style={styles.badgeText}>{selectedMeal.strCategory}</Text>
                </LinearGradient>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.badge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="location" size={16} color="#fff" />
                  <Text style={styles.badgeText}>{selectedMeal.strArea}</Text>
                </LinearGradient>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="list" size={24} color="#667eea" />
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                </View>
                <View style={styles.ingredientsContainer}>
                  {getIngredients(selectedMeal).map((ingredient, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <View style={styles.ingredientDot} />
                      <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="book" size={24} color="#667eea" />
                  <Text style={styles.sectionTitle}>Instructions</Text>
                </View>
                <Text style={styles.instructionsText}>{selectedMeal.strInstructions}</Text>
              </View>

              {selectedMeal.strYoutube && (
                <TouchableOpacity
                  style={styles.videoButtonContainer}
                  onPress={() => watchVideo(selectedMeal.strYoutube)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#ff0000', '#cc0000']}
                    style={styles.videoButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="logo-youtube" size={28} color="#fff" />
                    <Text style={styles.videoButtonText}>Watch Recipe Video</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
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
    padding: 25,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.95,
  },
  searchSection: {
    padding: 20,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categoriesContainer: {
    marginHorizontal: -20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    marginRight: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  categoryGradient: {
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    minWidth: 90,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryIconLarge: {
    fontSize: 28,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  categoryLabelActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  mealsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 8,
  },
  resultsText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '700',
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,  // Changez de 12 à 15
    paddingBottom: 20,
    justifyContent: 'space-between',  // Ajoutez cette ligne
    },
  mealCard: {
    width: (width - 48) / 2,  // Changez de (width - 40) à (width - 48)
    height: 240,
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  mealOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 40,
  },
  mealName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  mealMeta: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalImage: {
    width: '100%',
    height: 350,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 25,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    lineHeight: 36,
  },
  modalBadges: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  ingredientsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 15,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  instructionsText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 26,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 15,
  },
  videoButtonContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  videoButton: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  videoButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default Nutrition;