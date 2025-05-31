// src/Auth.js
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

    // Check if user is admin
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
                // Create user & mark as admin in firestore
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );
                await setDoc(doc(db, "admins", userCredential.user.uid), {
                    email: email,
                });
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading || checkingRole) return <p>Loading...</p>;

    if (user)
        return (
            <div style={{ marginBottom: 20 }}>
                <p>
                    Signed in as <b>{user.email}</b>
                </p>
                <button onClick={() => signOut(auth)}>Logout</button>
            </div>
        );

    return (
        <div style={{ maxWidth: 320, margin: "auto", padding: 20 }}>
            <h2>{isLogin ? "Login" : "Sign Up"}</h2>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />
            <input
                type="password"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />
            <button onClick={handleSubmit} style={{ width: "100%", padding: 10 }}>
                {isLogin ? "Login" : "Sign Up"}
            </button>
            <p
                style={{ marginTop: 10, cursor: "pointer", color: "blue" }}
                onClick={() => setIsLogin(!isLogin)}
            >
                {isLogin ? "Create new account" : "Have an account? Login"}
            </p>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}

export default Auth;
