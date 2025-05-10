import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/auth";
import brasaoPE from "../../assets/icon/icon.webp"; // Ajuste o caminho conforme necessário
import "./Login.css"; // Importando o CSS diretamente ao invés de módulos

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/home");
    } catch (error) {
      console.error("Login error:", error);
      switch (error.code) {
        case "auth/invalid-email":
          setError("Email inválido.");
          break;
        case "auth/user-disabled":
          setError("Este usuário foi desativado.");
          break;
        case "auth/user-not-found":
          setError("Usuário não encontrado.");
          break;
        case "auth/wrong-password":
          setError("Senha incorreta.");
          break;
        case "auth/too-many-requests":
          setError("Muitas tentativas. Tente novamente mais tarde.");
          break;
        default:
          setError("Falha no login. Por favor, tente novamente.");
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="loginCard">
        <div className="header">
          <img src={brasaoPE} alt="Logo" className="logo" />
          <h1 className="title">Entrar</h1>
          <p className="subtitle">ColetAI</p>
        </div>

        {error && <div className="errorMessage">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="inputGroup">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          <button type="submit" className="loginButton" disabled={loading}>
            {loading ? "Processando..." : "Entrar"}
          </button>
        </form>

        <div className="forgotPassword">
          <Link to="/demo">Esqueceu a senha?</Link>
        </div>

        <div className="divider"></div>

        <div className="signup">
          <span>Não tem uma conta?</span>
          <Link to="/cadastro" className="signupLink">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
