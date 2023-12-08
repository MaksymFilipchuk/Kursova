<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="auth">
    <div class="auth-island">
      <p class="auth-title">Вхід</p>
      <div class="login-list">
        <input
          type="email"
          name="email"
          class="auth-input"
          placeholder="Email"
          v-model="email"
        />
        <input
          type="password"
          name="password"
          class="auth-input"
          placeholder="Password"
          v-model="password"
        />
        <p v-if="errMsg" class="error-auth">{{ errMsg }}</p>
        <button class="auth-button" @click="login" id="login-button">Увійти</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const errMsg = ref();
const router = useRouter();

const login = () => {
  const auth = getAuth();
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(() => {
      console.log("logged in");
      router.push("/");
      location.replace("/");
    })
    .catch((error) => {
      console.log(error.code);
      switch (error.code) {
        case "auth/invalid-email":
          errMsg.value = "Invalid email address format";
          break;
        case "auth/user-disabled":
          errMsg.value = "User disabled";
          break;
        case "auth/user-not-found":
          errMsg.value = "User not found";
          break;
        case "auth/wrong-password":
          errMsg.value = "Wrong password";
          break;
        default:
          errMsg.value = "Something went wrong";
      }
    });
};

addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("login-button").click();
  }
});
</script>

<style>

.auth {
  position: relative;
  height: 100vh;
  width: 100vw;
}

.auth-island {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  width: 400px;
  height: 350px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
}
.auth-title {
  font-size: 30px;
  font-weight: 800;
  text-align: center;
  margin-top: 40px;
  font-family: "Nunito", sans-serif;
  color: #4a47a0;
}
.login-list {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.auth-input {
  width: 300px;
  height: 40px;
  border: 1px solid #4a47a0;
  border-radius: 5px;
  margin-bottom: 20px;
  padding-left: 10px;
  font-family: "Nunito", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #4a47a0;
}
.auth-button {
  width: 300px;
  height: 40px;
  border: none;
  border-radius: 5px;
  background: #4a47a0;
  color: #fff;
  font-family: "Nunito", sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: ease-in-out 0.3s;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  margin-top: 30px;
}
.auth-button:hover {
  background: #5f5bde;
  opacity: 0.8;
}
.auth-button:active {
  background: #4a47a0;
  opacity: 0.8;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
}
.error-auth {
  font-size: 15px;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  color: #f63e3e;
  margin: 0 auto;
  padding-top: 10px;
  position: absolute;
  top: 67%;
  left: 28%;
}
.nav {
    display: none;
  }
</style>
