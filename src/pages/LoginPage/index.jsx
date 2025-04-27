import { useState } from 'react';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica de login aqui
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Entrar</h1>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="Endereço de email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          
          <button type="submit" className={styles.loginButton}>
            Entrar
          </button>
        </form>
        
        <div className={styles.forgotPassword}>
          <a href="#">Esqueceu a senha?</a>
        </div>
        
        <div className={styles.divider}></div>
        
        <div className={styles.signup}>
          <span>Não tem uma conta?</span>
          <a href="#" className={styles.signupLink}>Cadastre-se</a>
        </div>
      </div>
    </div>
  );
};

export default Login;