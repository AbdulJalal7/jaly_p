import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { TextInput } from 'react-native';
import { useRouter } from "expo-router";
import colors from '../config/colors';

const Login = () => {
      const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onHandleLogin = () => {
    // if (email !== '' && password !== '') {
    //   signInWithEmailAndPassword(auth, email, password)
    //     .then(() => console.log('Login success'))
    //     .catch((err) => console.log(`Login err: ${err}`));
    // }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Great to see you back!</Text>
      <Text style={styles.subheader}>
        Please provide your credentials to access your chats.
      </Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        autocomplete="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoFocus={true}
        value={email}
        onChangeText={(text) => setEmail(text)}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        autocomplete="none"
        secureTextEntry={true}
        textContentType="password"
        autoCorrect={false}
        value={password}
        onChangeText={(text) => setPassword(text)}
      />
      <Text style={styles.loginButton} onPress={onHandleLogin}>
        Login
      </Text>
      <Text
        style={styles.registerButton}
        onPress={() => router.push('/(auth)/register')}
      >
        Don't have an account? Register
      </Text>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#rgba(161, 118, 216, 0.57)',
    paddingTop: 50,
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
    color: 'white',
    borderWidth: 1,
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
  loginButton: {
    width: '100%',
    marginTop: 14,
    backgroundColor: '#8A5CF5',
    color: '#ffffff',
    width: '90%',
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: 7
  },
  registerButton: {
    marginTop: 18,
    paddingVertical: 12,
    // textDecorationLine: 'underline',
    color: 'white'
  }
});
