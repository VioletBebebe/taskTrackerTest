import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { loginUser, registerUser } from "../auth/authThunk";
import { useNavigate } from "react-router-dom";
import styles from "./loginPage.module.scss";

type FormErrors = { email?: string; password?: string; name?: string };

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W_]{8,}$/;
const ONLY_ENG_LETTERS = /^[A-Za-z]+$/;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  const { user, status, error } = useAppSelector((s) => s.auth ?? { user: null, status: "idle", error: null });

  useEffect(() => {
    if (user) navigate("/boards", { replace: true });
  }, [user, navigate]);

  const validateLogin = () => {
    const e: FormErrors = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      e.email = "Введите email";
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      e.email = "Некорректный email";
    }

    if (!password) {
      e.password = "Введите пароль";
    } else if (!PASSWORD_REGEX.test(password)) {
      e.password = "Пароль должен быть не короче 8 символов и содержать хотя бы одну букву и одну цифру";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateRegister = () => {
    const e: FormErrors = {};
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanName) {
      e.name = "Введите имя";
    } else if (cleanName.length < 2) {
      e.name = "Имя слишком короткое";
    } else if (!ONLY_ENG_LETTERS.test(cleanName)) {
      e.name = "Имя должно содержать только английские буквы (A–Z)";
    }

    if (!cleanEmail) {
      e.email = "Введите email";
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      e.email = "Некорректный email";
    }

    if (!password) {
      e.password = "Введите пароль";
    } else if (!PASSWORD_REGEX.test(password)) {
      e.password = "Пароль должен быть не короче 8 символов и содержать хотя бы одну букву и одну цифру";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmitLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateLogin()) return;
    dispatch(loginUser({ email: email.trim(), password }));
  };

  const handleSubmitRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateRegister()) return;
    dispatch(registerUser({ email: email.trim(), password, name: name.trim() }));
  };

  const toggleMode = () => {
    setIsRegister((v) => !v);
    setErrors({});
  };

  const loading = status === "loading";

  return (
    <div className={`${styles.login} ${isRegister ? styles.isRegister : ""}`}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h2 className={styles.loginHeaderTitle}>
            {isRegister ? "Создайте аккаунт ✨" : "Добро пожаловать 👋"}
          </h2>

          <p className={styles.loginHeaderSubtitle}>
            {isRegister
              ? "Заполните поля ниже, чтобы зарегистрироваться"
              : "Войдите, чтобы продолжить"}
          </p>

          {error && (
            <p className={`${styles.formFieldHint} ${styles.formFieldHintError}`}>
              {error}
            </p>
          )}
        </div>
        <div className={styles.loginSwitchBar}>
          <button
            type="button"
            onClick={toggleMode}
            className={styles.loginSwitchBtn}
            aria-pressed={isRegister}
            disabled={loading}
          >
            {isRegister ? "← К форме входа" : "Перейти к регистрации →"}
          </button>
        </div>

        <div className={styles.loginViewport} aria-live="polite">
          <div className={styles.loginTrack}>
            <section
              className={styles.loginSlide}
              aria-hidden={isRegister}
              aria-labelledby="login-title"
              role="region"
            >
              <form
                onSubmit={handleSubmitLogin}
                className={styles.loginForm}
                noValidate
                aria-hidden={isRegister}
              >
                <div className={styles.loginFormRow}>
                  <label className={styles.formField}>
                    <input
                      className={`${styles.formFieldInput} ${errors.email ? styles.formFieldInputError : ""}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={loading}
                    />
                    {errors.email && (
                      <span className={`${styles.formFieldHint} ${styles.formFieldHintError}`}>
                        {errors.email}
                      </span>
                    )}
                  </label>

                  <label className={styles.formField}>
                    <input
                      className={`${styles.formFieldInput} ${errors.password ? styles.formFieldInputError : ""}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Пароль"
                      type="password"
                      autoComplete="current-password"
                      required
                      disabled={loading}
                    />
                    {errors.password && (
                      <span className={`${styles.formFieldHint} ${styles.formFieldHintError}`}>
                        {errors.password}
                      </span>
                    )}
                  </label>
                </div>

                <div className={styles.loginFormActions}>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={loading}
                  >
                    {loading ? "Входим..." : "Войти"}
                  </button>
                </div>
              </form>
            </section>

            <section
              className={styles.loginSlide}
              aria-hidden={!isRegister}
              aria-labelledby="register-title"
              role="region"
            >
              <form
                onSubmit={handleSubmitRegister}
                className={styles.loginForm}
                noValidate
                aria-hidden={!isRegister}
              >
                <div className={styles.loginFormRow}>
                  <label className={styles.formField}>
                    <input
                      className={`${styles.formFieldInput} ${errors.name ? styles.formFieldInputError : ""}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Имя"
                      autoComplete="name"
                      required
                      disabled={loading}
                    />
                    {errors.name && (
                      <span className={`${styles.formFieldHint} ${styles.formFieldHintError}`}>
                        {errors.name}
                      </span>
                    )}
                  </label>

                  <label className={styles.formField}>
                    <input
                      className={`${styles.formFieldInput} ${errors.email ? styles.formFieldInputError : ""}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={loading}
                    />
                    {errors.email && (
                      <span className={`${styles.formFieldHint} ${styles.formFieldHintError}`}>
                        {errors.email}
                      </span>
                    )}
                  </label>

                  <label className={styles.formField}>
                    <input
                      className={`${styles.formFieldInput} ${errors.password ? styles.formFieldInputError : ""}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Пароль"
                      type="password"
                      autoComplete="new-password"
                      required
                      disabled={loading}
                    />
                    {errors.password && (
                      <span className={`${styles.formFieldHint} ${styles.formFieldHintError}`}>
                        {errors.password}
                      </span>
                    )}
                  </label>
                </div>

                <div className={styles.loginFormActions}>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={loading}
                  >
                    {loading ? "Создаём..." : "Создать аккаунт"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}