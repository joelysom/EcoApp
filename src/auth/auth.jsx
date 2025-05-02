import { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Initialize Firebase from your config
import { firebaseConfig } from '../services/firebase';

// Initialize Firebase app if not already initialized
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create Auth Context
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Componente de ícone de folha personalizado para o toast
const LeafIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M6 21C6 17.5 7.5 14.5 12 13C16.5 11.5 20 8 21 4C21 4 21.5 7 18 10.5C14.5 14 10 15 8 16.5C6 18 6 21 6 21Z" 
      fill="#4CAF50" 
      stroke="#388E3C" 
      strokeWidth="1.5" 
    />
    <path 
      d="M11 20C11 15 13.5 13 16 12" 
      stroke="#388E3C" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
  </svg>
);

// Configuração de estilo para os toasts ecológicos
const toastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  style: {
    background: "#E8F5E9",
    color: "#1B5E20",
    border: "1px solid #81C784",
    borderRadius: "8px"
  },
  icon: LeafIcon
};

// Toast de sucesso personalizado com tema ecológico
const ecoToastSuccess = (message) => {
  toast.success(message, toastOptions);
};

// Toast de erro personalizado com tema ecológico
const ecoToastError = (message) => {
  toast.error(message, {
    ...toastOptions,
    style: {
      ...toastOptions.style,
      background: "#FBE9E7",
      color: "#BF360C",
      border: "1px solid #FFAB91"
    }
  });
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register new user
  async function register(email, password, userData) {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
     
      // Update user profile with name
      if (userData.nome) {
        await updateProfile(user, {
          displayName: userData.nome
        });
      }
     
      // Store additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        nome: userData.nome,
        cpf: userData.cpf,
        dataNascimento: userData.dataNascimento,
        rg: userData.rg,
        orgaoEmissor: userData.orgaoEmissor,
        email: userData.email,
        celular: userData.celular,
        endereco: {
          cep: userData.cep,
          logradouro: userData.logradouro,
          numero: userData.numero,
          complemento: userData.complemento,
          bairro: userData.bairro,
          cidade: userData.cidade,
        },
        pontos: 0,
        createdAt: new Date(),
      });
     
      ecoToastSuccess(`Bem-vindo ${userData.nome}! Sua conta foi criada com sucesso. Juntos pela sustentabilidade! 🌱`);
      return user;
    } catch (error) {
      let errorMessage = "Erro ao criar conta. Tente novamente.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este e-mail já está sendo utilizado.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Senha muito fraca. Use uma senha mais forte.";
      }
      
      ecoToastError(errorMessage);
      throw error;
    }
  }

  // Login user
  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      ecoToastSuccess(`Olá, ${result.user.displayName || 'amigo(a) da natureza'}! Login realizado com sucesso! 🍃`);
      return result;
    } catch (error) {
      let errorMessage = "Falha no login. Verifique suas credenciais.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "E-mail ou senha incorretos.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
      }
      
      ecoToastError(errorMessage);
      throw error;
    }
  }

  // Logout user
  async function logout() {
    try {
      await signOut(auth);
      ecoToastSuccess("Você saiu da sua conta. Até breve! 🌿");
    } catch (error) {
      ecoToastError("Erro ao sair da conta. Tente novamente.");
      throw error;
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      ecoToastSuccess("E-mail de recuperação enviado. Verifique sua caixa de entrada. 📧");
    } catch (error) {
      let errorMessage = "Erro ao enviar e-mail de recuperação.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "E-mail não cadastrado em nosso sistema.";
      }
      
      ecoToastError(errorMessage);
      throw error;
    }
  }

  // Update user profile
  async function updateUserProfile(userData) {
    try {
      const user = auth.currentUser;
     
      if (!user) throw new Error("No user logged in");
     
      // Update displayName if provided
      if (userData.nome) {
        await updateProfile(user, {
          displayName: userData.nome
        });
      }
     
      // Update user data in Firestore
      await setDoc(doc(db, "users", user.uid), userData, { merge: true });
      
      ecoToastSuccess("Perfil atualizado com sucesso! 🌿");
      return user;
    } catch (error) {
      ecoToastError("Erro ao atualizar perfil. Tente novamente.");
      throw error;
    }
  }

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    register,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    ecoToastSuccess,
    ecoToastError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="eco-toast"
      />
    </AuthContext.Provider>
  );
}