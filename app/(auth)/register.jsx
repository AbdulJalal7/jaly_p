import { StyleSheet, Text, View,Platform,ScrollView ,KeyboardAvoidingView} from 'react-native';
import React, { useState } from 'react';
import { TextInput } from 'react-native';
import colors from '../config/colors';
// import authService from "@/lib/appwrite/auth";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/authContext";
import Toast from 'react-native-toast-message';

const Register = () => {
    const router = useRouter();
    const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  

  const [rform, setrform] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
  

  const onHandleSignup = async () => {
    try {
      await register(rform);
      router.replace("/(tabs)/home");
    } catch (error) {
      
      Toast.show({
        type: 'error',
        text1: 'Signup failed',
        text2: error.message
      });
    }
    };

  return (
   <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>
        Welcome to Jaly Tournaments
      </Text>
   
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        autocomplete="none"
        textContentType="name"
        autoFocus={true}
        value={rform.name}
        onChangeText={(text) => setrform({ ...rform, name: text })}
      />
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        autocomplete="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoFocus={true}
        value={rform}
        onChangeText={(text) => setrform({ ...rform, email: text })}
      />

        {/* <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your phone number"
        autocomplete="none"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoFocus={true}
        value={rform.phone}
        onChangeText={(text) => setrform({ ...rform, phone: text })}
      /> */}

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        autocomplete="none"
        secureTextEntry={true}
        textContentType="password"
        autoCorrect={false}
        value={rform.password}
        onChangeText={(text) => setrform({ ...rform, password: text })}
      />
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirm your password"
        autocomplete="none"
        secureTextEntry={true}
        textContentType="password"
        autoCorrect={false}
        value={rform.confirmPassword}
        onChangeText={(text) => setrform({ ...rform, confirmPassword: text })}
      />

      <Text style={styles.registerButton} onPress={onHandleSignup}>
        Create Account
      </Text>
      <Text
        style={styles.loginButton}
        onPress={() => router.push('/(auth)/login')}
      >
        Already have an account? Login
      </Text>
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(161, 118, 216, 0.57)',
    // paddingTop: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    fontSize: 24,
    letterSpacing: -1.0,
    fontWeight: 700,
    marginBottom: 12,
    color: 'white',
    width: '90%'
  },
  subheader: {
    fontSize: 14,
    letterSpacing: -0.5,
    fontWeight: 400,
    marginBottom: 12,
    color: 'white',
    width: '90%'
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    width: '90%'
  },
  label: {
    textAlign: 'left',
    width: '90%',
    marginVertical: 14,
    fontSize: 14,
    letterSpacing: -0.5,
    color: 'white'
  },
  registerButton: {
    width: '100%',
    marginTop: 14,
    backgroundColor: colors.brand,
    color: '#ffffff',
    width: '90%',
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: 7
  },
  loginButton: {
    marginTop: 18,
    paddingVertical: 12,
    color: 'white'
    // textDecorationLine: 'underline'
  }
});
