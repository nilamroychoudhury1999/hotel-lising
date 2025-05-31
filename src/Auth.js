import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

function Auth({ onAdminLogin }) {
    const [user, loading] = useAuthState(auth);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState("");
    const [checkingRole, setCheckingRole] = useState(false);

    const checkAdmin = async (uid) => {
        setCheckingRole(true);
        const docRef = doc(db, "admins", uid);
        const docSnap = await getDoc(docRef);
        setCheckingRole(false);
        return docSnap.exists();
    };

    useEffect(() => {
        if (user) {
            checkAdmin(user.uid).then((isAdmin) => {
                if (!isAdmin) {
                    alert("Access denied. Not an admin.");
                    signOut(auth);
                    onAdminLogin(false);
                } else {
                    onAdminLogin(true);
                }
            });
        } else {
            onAdminLogin(false);
        }
    }, [user, onAdminLogin]);

    const handleSubmit = async () => {
        setError("");
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "admins", userCredential.user.uid), { email });
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading || checkingRole) return <p style={styles.loading}>Loading...</p>;

    if (user) {
        return (
            <div style={styles.card}>
                <p style={{ marginBottom: 12 }}>
                    Signed in as <b>{user.email}</b>
                </p>
                <button onClick={() => signOut(auth)} style={styles.button}>
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <h2 style={styles.title}>{isLogin ? "Login" : "Sign Up"}</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="password"
                    placeholder="Password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                />
                <button onClick={handleSubmit} style={styles.button}>
                    {isLogin ? "Login" : "Sign Up"}
                </button>
                <p style={styles.toggleText} onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Create new account" : "Have an account? Login"}
                </p>
                {error && <p style={styles.errorText}>{error}</p>}
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        padding: "16px",
        backgroundColor: "#f0f2f5",
    },
    card: {
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "#fff",
        padding: "24px",
        borderRadius: "8px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        boxSizing: "border-box",
    },
    title: {
        marginBottom: "20px",
        textAlign: "center",
        fontSize: "1.5rem",
    },
    input: {
        width: "100%",
        padding: "12px",
        marginBottom: "14px",
        fontSize: "16px",
        borderRadius: "6px",
        border: "1px solid #ccc",
    },
    button: {
        width: "100%",
        padding: "12px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        fontSize: "16px",
        cursor: "pointer",
        marginBottom: "12px",
    },
    toggleText: {
        textAlign: "center",
        color: "#007bff",
        cursor: "pointer",
        fontSize: "14px",
    },
    errorText: {
        color: "red",
        textAlign: "center",
        fontSize: "14px",
        marginTop: "10px",
    },
    loading: {
        textAlign: "center",
        fontSize: "16px",
        paddingTop: "40px",
    },
};

export default Auth;
