import { useState } from "react";
import {
  LuArrowRight,
  LuCheck,
  LuEye,
  LuEyeOff,
  LuLockKeyhole,
  LuMail,
  LuShieldCheck,
  LuShoppingCart,
  LuUserRound,
} from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";
import { getAuthErrorMessage } from "../hooks/useAuth.js";

const benefits = [
  "Sincronize sua lista em todos os dispositivos",
  "Acompanhe seu histórico e seus preços",
  "Mantenha sua despensa sempre organizada",
];

export default function AuthPage({ auth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Preencha seu e-mail e sua senha.");
      return;
    }
    if (isRegister && password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (isRegister && password !== passwordConfirmation) {
      setError("As senhas não conferem.");
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) await auth.signUp(email.trim(), password);
      else await auth.signIn(email.trim(), password);
    } catch (authError) {
      setError(
        authError.message?.startsWith("Configure")
          ? authError.message
          : getAuthErrorMessage(authError),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      await auth.signInWithGoogle();
    } catch (authError) {
      setError(
        authError.message?.startsWith("Configure")
          ? authError.message
          : getAuthErrorMessage(authError),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Informe seu e-mail para receber o link de recuperação.");
      return;
    }
    setSubmitting(true);
    try {
      await auth.resetPassword(email.trim());
      setMessage("Enviamos um link de recuperação para seu e-mail.");
    } catch (authError) {
      setError(
        authError.message?.startsWith("Configure")
          ? authError.message
          : getAuthErrorMessage(authError),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page" style={{ width: "100%" }}>
      <section className="auth-showcase">
        <div className="auth-brand">
          <span className="auth-brand-mark">
            <LuShoppingCart size={22} />
          </span>
          <span>
            na<strong>lista</strong>
          </span>
        </div>
        <div className="auth-showcase-copy">
          <span className="auth-eyebrow">SUPERMERCADO INTELIGENTE</span>
          <h1
            style={{
              fontSize: "clamp(36px, 4vw, 64px)",
              lineHeight: "1.05",
              letterSpacing: "-2px",
              color: "#fff",
            }}
          >
            Mais organização para suas compras.
          </h1>
          <p>
            Planeje sua lista, confira os valores e cuide da sua despensa em um só lugar.
          </p>
          <ul>
            {benefits.map((benefit) => (
              <li key={benefit}>
                <span>
                  <LuCheck size={14} />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-trust">
          <LuShieldCheck size={17} /> Seus dados ficam protegidos e sincronizados com
          segurança.
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="auth-mobile-logo">
              <LuShoppingCart size={20} />
            </span>
            <span className="auth-eyebrow">
              {isRegister ? "COMECE AGORA" : "BEM-VINDO DE VOLTA"}
            </span>
            <h2>{isRegister ? "Crie sua conta" : "Entre na sua conta"}</h2>
            <p>
              {isRegister
                ? "Tenha sua lista sempre com você."
                : "Continue de onde parou."}
            </p>
          </div>

          {!auth.isConfigured && (
            <div className="auth-alert auth-alert-error">
              A autenticação ainda não foi configurada neste ambiente. Adicione as
              variáveis do Firebase para continuar.
            </div>
          )}
          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="auth-alert auth-alert-success" role="status">
              {message}
            </div>
          )}

          <button
            type="button"
            className="google-button"
            onClick={handleGoogleSignIn}
            disabled={submitting || !auth.isConfigured}
          >
            <FcGoogle size={20} /> Continuar com Google
          </button>
          <div className="auth-divider">
            <span>ou use seu e-mail</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="auth-email">
              <LuMail size={15} /> E-mail
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@exemplo.com"
            />
            <label htmlFor="auth-password">
              <LuLockKeyhole size={15} /> Senha
            </label>
            <div className="auth-password-field">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo de 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <LuEyeOff size={17} /> : <LuEye size={17} />}
              </button>
            </div>
            {isRegister && (
              <>
                <label htmlFor="auth-confirmation">
                  <LuLockKeyhole size={15} /> Confirme sua senha
                </label>
                <div className="auth-password-field">
                  <input
                    id="auth-confirmation"
                    type={showConfirmation ? "text" : "password"}
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    placeholder="Repita sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmation((value) => !value)}
                    aria-label={
                      showConfirmation ? "Ocultar confirmação" : "Mostrar confirmação"
                    }
                  >
                    {showConfirmation ? <LuEyeOff size={17} /> : <LuEye size={17} />}
                  </button>
                </div>
              </>
            )}
            {!isRegister && (
              <button
                type="button"
                className="auth-link auth-forgot"
                onClick={handleResetPassword}
              >
                Esqueci minha senha
              </button>
            )}
            <button
              type="submit"
              className="primary auth-submit"
              disabled={submitting || !auth.isConfigured}
            >
              {submitting ? (
                "Aguarde..."
              ) : isRegister ? (
                <>
                  Criar minha conta <LuArrowRight size={17} />
                </>
              ) : (
                <>
                  Entrar <LuArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
            <button
              type="button"
              className="auth-link"
              onClick={() => switchMode(isRegister ? "login" : "register")}
            >
              {isRegister ? "Entrar" : "Criar cadastro"}
            </button>
          </p>
          {isRegister && (
            <p className="auth-terms">
              Ao criar sua conta, você concorda com os termos de uso e a política de
              privacidade.
            </p>
          )}
        </div>
        <p className="auth-footer">
          <LuUserRound size={14} /> Acesso seguro e personalizado
        </p>
      </section>
    </main>
  );
}
