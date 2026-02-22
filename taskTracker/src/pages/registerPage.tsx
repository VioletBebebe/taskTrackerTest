import { useState } from "react";
import { useAppDispatch } from "../app/hooks";
import { registerUser } from "../auth/authThunk";
import { useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import { useNavigate } from "react-router";

export default function RegisterPage() {
    const dispatch = useAppDispatch();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const user = useAppSelector(state => state.auth.user);

    useEffect(() => {
    if (user) navigate("/");
    }, [user]);
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(registerUser({ email, password, name }));
    };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button type="submit">Register</button>
    </form>
  );
}