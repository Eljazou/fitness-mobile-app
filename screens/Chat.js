import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const Chat = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingSound, setPlayingSound] = useState(null);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const flatListRef = useRef(null);
  
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (playingSound) {
        playingSound.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant microphone permission');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      await uploadAudioMessage(uri);
    }
  };

  const uploadAudioMessage = async (uri) => {
    setLoading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const audioRef = ref(storage, `audioMessages/${currentUser.uid}_${Date.now()}.m4a`);
      await uploadBytes(audioRef, blob);
      const audioURL = await getDownloadURL(audioRef);

      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        type: 'audio',
        audioURL: audioURL,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Anonymous',
        userPhoto: currentUser.photoURL || null,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error uploading audio:', error);
      Alert.alert('Error', 'Failed to send audio message');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (audioURL, messageId) => {
    try {
      if (playingSound && playingMessageId === messageId) {
        await playingSound.stopAsync();
        await playingSound.unloadAsync();
        setPlayingSound(null);
        setPlayingMessageId(null);
        return;
      }

      if (playingSound) {
        await playingSound.stopAsync();
        await playingSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioURL },
        { shouldPlay: true }
      );

      setPlayingSound(sound);
      setPlayingMessageId(messageId);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingSound(null);
          setPlayingMessageId(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        type: 'text',
        text: newMessage.trim(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Anonymous',
        userPhoto: currentUser.photoURL || null,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      console.error('Error sending message:', error);
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

  const renderMessage = ({ item }) => {
    const isMyMessage = item.userId === currentUser.uid;
    
    return (
      <View style={[
        styles.messageWrapper,
        isMyMessage ? styles.myMessageWrapper : styles.otherMessageWrapper
      ]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            {item.userPhoto ? (
              <Image source={{ uri: item.userPhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.userName ? item.userName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage
        ]}>
          {!isMyMessage && (
            <Text style={styles.senderName}>{item.userName || item.userEmail}</Text>
          )}
          
          {item.type === 'audio' ? (
            <TouchableOpacity
              style={styles.audioMessageContainer}
              onPress={() => playAudio(item.audioURL, item.id)}
            >
              <View style={[styles.playButton, isMyMessage && styles.playButtonMy]}>
                <Ionicons 
                  name={playingMessageId === item.id ? "pause" : "play"} 
                  size={20} 
                  color={isMyMessage ? "#fff" : "#667eea"} 
                />
              </View>
              <View style={styles.audioWaveform}>
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 8 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 16 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 12 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 20 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 14 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 18 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 10 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 16 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 22 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 12 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 18 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 14 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 8 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 16 }]} />
                <View style={[styles.waveBar, isMyMessage && styles.waveBarMy, { height: 20 }]} />
              </View>
              <Ionicons 
                name="mic" 
                size={16} 
                color={isMyMessage ? "#fff" : "#999"} 
                style={styles.micIcon}
              />
            </TouchableOpacity>
          ) : (
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.text}
            </Text>
          )}
        </View>
        {isMyMessage && (
          <View style={styles.avatarContainer}>
            {item.userPhoto ? (
              <Image source={{ uri: item.userPhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.userName ? item.userName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Room</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        {!isRecording ? (
          <>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              multiline
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              style={styles.micButton}
              onPress={startRecording}
            >
              <Ionicons name="mic" size={24} color="#667eea" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sendButton, loading && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={loading}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.recordingContainer}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording...</Text>
            </View>
            <TouchableOpacity 
              style={styles.stopButton}
              onPress={stopRecording}
            >
              <Ionicons name="stop-circle" size={50} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 15,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  signOutButton: {
    padding: 8,
  },
  signOutText: {
    color: '#fff',
    fontWeight: '600',
  },
  messagesList: {
    padding: 15,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  otherMessageWrapper: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageContainer: {
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    maxWidth: '70%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#667eea',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  audioMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
    paddingVertical: 5,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8eaf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playButtonMy: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  waveBarMy: {
    backgroundColor: '#fff',
  },
  micIcon: {
    marginLeft: 8,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f8f8',
  },
  micButton: {
    marginLeft: 10,
    padding: 10,
  },
  sendButton: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    padding: 12,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    marginRight: 10,
  },
  recordingText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  stopButton: {
    padding: 5,
  },
});

export default Chat;