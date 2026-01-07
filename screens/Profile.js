import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView
} from 'react-native';
import { getAuth, updateProfile, updateEmail, signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const Profile = ({ navigation }) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status, granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('ImagePicker permission status:', status, 'granted:', granted);
      if (status !== 'granted' && granted !== true) {
        Alert.alert('Permission Required', 'Permission to access gallery is required');
        return;
      }

      const mediaTypes = ImagePicker.MediaType?.Images
        ?? ImagePicker.MediaTypeOptions?.Images
        ?? ImagePicker.MediaTypeOptions?.All
        ?? ImagePicker.MediaType?.All;
      console.log('Using ImagePicker mediaTypes:', mediaTypes);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      console.log('ImagePicker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      } else if (result.canceled) {
        console.log('Image selection cancelled by user');
      } else {
        console.log('No assets returned from image picker');
      }
    } catch (err) {
      console.error('pickImage error:', err);
      Alert.alert('Error', 'Unable to open image picker. Try on a real device.');
    }
  };

  const uploadImage = async (uri) => {
    setLoading(true);
    const uriToBlob = (uri) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });
    };

    try {
      const blob = await uriToBlob(uri);

      // Diagnostic logs to help investigate storage/unknown errors
      console.log('Uploading as user:', currentUser?.uid);
      console.log('Blob size:', blob.size, 'type:', blob.type);
      console.log('Firebase storage bucket:', storage?.app?.options?.storageBucket);

      // Ensure uploaded file has an extension derived from MIME type
      const ext = (blob.type || 'image/jpeg').split('/')[1] || 'jpg';
      const filename = `profilePictures/${currentUser.uid}_${Date.now()}.${ext}`;
      const storageRef = ref(storage, filename);

      const metadata = { contentType: blob.type || 'image/jpeg' };

      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

      const restUploadDebug = async (blobToSend, name) => {
        try {
          const token = await currentUser.getIdToken();
          const bucket = storage?.app?.options?.storageBucket;
          const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(name)}`;
          console.log('Attempting REST upload to:', url);
          const resp = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': blobToSend.type || 'application/octet-stream',
              'Authorization': 'Bearer ' + token,
            },
            body: blobToSend,
          });
          const text = await resp.text();
          console.log('REST upload response status:', resp.status, 'body:', text);
          return { status: resp.status, body: text };
        } catch (e) {
          console.error('REST upload debug failed:', e);
          return null;
        }
      };

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        async (error) => {
          try {
            const full = JSON.stringify(error, Object.getOwnPropertyNames(error));
            console.error('Error uploading image (full):', full);
          } catch (e) {
            console.error('Error uploading image:', error, 'serverResponse:', error?.serverResponse);
          }
          console.error('Error code:', error?.code);

          // Try REST upload to get the raw server response payload
          console.log('Running REST upload debug...');
          const rest = await restUploadDebug(blob, filename);
          console.log('REST debug result:', rest);

          Alert.alert('Error', 'Failed to upload image: ' + (error.message || 'unknown'));
          setLoading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await updateProfile(currentUser, { photoURL: downloadURL });
            setPhotoURL(downloadURL);
            Alert.alert('Success', 'Profile picture updated!');
          } catch (err) {
            console.error('Error finalizing upload:', err);
            Alert.alert('Error', 'Failed to finalize upload');
          } finally {
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error preparing upload:', error);
      Alert.alert('Error', 'Failed to upload image: ' + (error.message || 'unknown'));
      setLoading(false);
    }
  };

  const updateUserProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(currentUser, {
        displayName: displayName.trim()
      });

      if (email !== currentUser.email) {
        await updateEmail(currentUser, email);
      }

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>
                {displayName ? displayName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✎</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.uploadText}>Tap to change photo</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
          />
        </View>

        <TouchableOpacity 
          style={[styles.updateButton, loading && styles.buttonDisabled]}
          onPress={updateUserProfile}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 30,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#667eea',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  editBadgeText: {
    fontSize: 18,
    color: '#667eea',
  },
  uploadText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#667eea',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  signOutButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Profile;