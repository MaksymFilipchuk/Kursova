<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="nav">
    <img src="../assets/logo.png" class="nav-logo" @click="goToHome" />
    <div class="nav-right">
      <div class="user-island">
        <img v-if="userPic" :src="userPic" class="user-pic" />
        <p v-if="userName" class="user-name">{{ userName }}</p>
      </div>
      <img
        v-if="userRole == 'admin'"
        class="nav-icon icon-left"
        src="../assets/icons/setting.png"
        @click="goToAdmin"
      />
      <img
        v-if="userRole == 'user'"
        class="nav-icon icon-left"
        src="../assets/icons/messenger.png"
        @click="openContactForm"
      />
      <img
        v-if="userRole == 'admin'"
        class="nav-icon icon-left"
        src="../assets/icons/messenger.png"
        @click="openMessages"
      />
      <img
        v-if="userRole == 'user'"
        class="nav-icon icon-left"
        src="../assets/icons/cart.png"
        @click="openCart"
      />
      
      <img
        v-if="isLoggedIn"
        src="../assets/icons/exit.png"
        class="nav-icon"
        @click="logout"
      />
      <img
        v-else
        src="../assets/icons/enter.png"
        class="nav-icon"
        @click="goToAuth"
      />
    </div>
  </div>
  <div v-if="isCartOpen" class="basket">
    <div class="basket-island">
      <div class="basket-header">
        <p v-if="orderStatus == ''" class="basket-title">Кошик</p>
        <img
          src="../assets/icons/close.png"
          class="basket-close"
          @click="closeCart"
        />
      </div>
      <div v-if="orderStatus == ''" class="basket-list">
        <div class="basket-item" v-for="item in cartItems" :key="item.id">
          <img :src="item.img" class="basket-item-img" />
          <div class="basket-item-info">
            <p class="basket-item-title">{{ item.title }}</p>
            <p class="basket-item-price">{{ item.price }} грн</p>
          </div>
          <img
            src="../assets/icons/delete.png"
            class="basket-item-close"
            @click="removeFromCart(item.id)"
          />
        </div>
      </div>
      <div v-if="orderStatus == ''" class="basket-footer">
        <p class="basket-total">Загалом: {{ totalPrice }} грн</p>
        <button class="basket-button" @click="placeOrder">Оформити замовлення</button>
      </div>
      <img v-if="orderStatus" src="../assets/icons/done.png" class="order-status-icon">
      <p v-if="orderStatus" class="order-status">{{ orderStatus }}</p>
      
    </div>
  </div>
  <div v-if="isMessage" class="message-form">
    <div class="message-island">
      <div class="message-header">
        <p class="message-title">Зворотній зв'язок</p>
        <img
          src="../assets/icons/close.png"
          class="message-close"
          @click="closeContactForm"
        />
      </div>
      <div class="message-list">
        <input
          type="text"
          name="name"
          class="message-input"
          placeholder="Ім'я"
          v-model="name"
        />
        <input
          type="email"
          name="email"
          class="message-input"
          placeholder="Email"
          v-model="email"
        />
        <input
          type="text"
          name="message"
          class="message-input"
          placeholder="Повідомлення"
          v-model="message"
        />
        <p v-if="errMsg" class="error-message">{{ errMsg }}</p>
        <button class="message-button" @click="sendMessage">Відправити</button>
      </div>
    </div>
  </div>
  <div v-if="isShowMessages" class="messages-list-container">
    <div class="messages-island">
      <div class="messages-header">
        <p class="messages-title">Повідомлення</p>
        <img
          src="../assets/icons/close.png"
          class="messages-close"
          @click="closeMessages"
        />
      </div>
      <div class="messages-list">
        <div class="message-item" v-for="item in messages" :key="item.id">
          <p class="message-item-name">Користувач: {{ item.name }}</p>
          <p class="message-item-email">Email: {{ item.email }}</p>
          <p class="message-item-message">Повідомлення: {{ item.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, addDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { useRouter } from "vue-router";

const isLoggedIn = ref("");
const userEmail = ref("");
const userName = ref("");
const userPic = ref("");
const userRole = ref("");
const cartItems = ref([]);
const totalPrice = ref(0);
const isCartOpen = ref(false);
const orderStatus = ref(""); // додайте цей рядок
const isMessage = ref(false);
const name = ref('');
const email = ref('');
const message = ref('');
const errMsg = ref('');
const isShowMessages = ref(false);
const messages = ref([]);


const firestore = getFirestore();
const auth = getAuth();
const router = useRouter();

const messagesCollection = collection(firestore, 'messages');

const sendMessage = async () => {
  try {
    if (!name.value || !email.value || !message.value) {
      errMsg.value = 'Будь ласка, заповніть всі обов\'язкові поля.';
      return;
    }

    const messageData = {
      name: name.value,
      email: email.value,
      message: message.value,
      timestamp: serverTimestamp(),
    };

    await addDoc(messagesCollection, messageData);

    name.value = '';
    email.value = '';
    message.value = '';
    errMsg.value = '';

    isMessage.value = false;
  } catch (error) {
    console.error('Помилка відправлення повідомлення', error.message);
    errMsg.value = 'Помилка відправлення повідомлення. Спробуйте ще раз пізніше.';
  }
};

onMounted(async () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      isLoggedIn.value = true;
      userEmail.value = user.email;

      const userDocRef = doc(firestore, "users", user.email);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        userName.value = userData.name;
        userPic.value = userData.userPic || "";
        userRole.value = userData.role;
        cartItems.value = await getCartItems(userData.basket);
        calculateTotalPrice();
      } else {
        //empty
      }
    } else {
      isLoggedIn.value = false;
    }
  });
});

const updateCartData = async () => {
  if (isLoggedIn.value) {
    const userId = userEmail.value;

    const userDocRef = doc(firestore, "users", userId);
    const userDocSnapshot = await getDoc(userDocRef);

    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      cartItems.value = await getCartItems(userData.basket);
      calculateTotalPrice();
    }
  }
};

const placeOrder = async () => {
  if (isLoggedIn.value) {
    const userId = userEmail.value;

    const userDocRef = doc(firestore, "users", userId);
    const userDocSnapshot = await getDoc(userDocRef);

    if (userDocSnapshot.exists()) {
      // Очищення корзини
      await updateDoc(userDocRef, { basket: {} });

      // Оновлення даних користувача
      await updateCartData();

      // Встановлення статусу замовлення
      orderStatus.value = "Замовлення оформлено. Скоро з вами зв'яжеться менеджер для уточнення деталей.";

      // Закриття корзини
    }
  }
};


const getCartItems = async (basket) => {
  const items = [];

  for (const productId in basket) {
    const productDocRef = doc(firestore, "products", productId);
    const productDocSnapshot = await getDoc(productDocRef);

    if (productDocSnapshot.exists()) {
      const productData = productDocSnapshot.data();
      items.push({
        id: productId,
        title: productData.productName,
        img: productData.imageDataURL,
        price: productData.productPrice,
      });
    }
  }

  return items;
};

const calculateTotalPrice = () => {
  totalPrice.value = cartItems.value.reduce(
    (total, item) => total + item.price,
    0
  );
};

const removeFromCart = async (productId) => {
  if (isLoggedIn.value) {
    const userId = userEmail.value;

    // Отримання даних користувача
    const userDocRef = doc(firestore, "users", userId);
    const userDocSnapshot = await getDoc(userDocRef);

    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      const { basket } = userData;

      // Видалення продукту з мапи "basket"
      if (basket && basket[productId]) {
        delete basket[productId];

        // Оновлення даних користувача в Firestore
        await updateDoc(userDocRef, { basket });

        // Оновлення корзини на клієнті
        cartItems.value = await getCartItems(basket);
        calculateTotalPrice();
      }
    }
  }
};

const logout = async () => {
  try {
    await signOut(auth);
    router.push("/auth");
  } catch (error) {
    console.error("Logout error", error.message);
  }
};

const openCart = async () => {
  isCartOpen.value = true;
  await updateCartData();
};

const closeCart = () => {
  isCartOpen.value = false;
    orderStatus.value = "";
};

const openContactForm = () => {
  isMessage.value = true;
};

const closeContactForm = () => {
  isMessage.value = false;
};

const openMessages = async () => {
  isShowMessages.value = true;
  const messagesCollection = collection(firestore, 'messages');
  const messagesSnapshot = await getDocs(messagesCollection);
  const messagesData = messagesSnapshot.docs.map(doc => doc.data());
  messages.value = messagesData;
};

const closeMessages = () => {
  isShowMessages.value = false;
};

const goToAuth = () => {
  router.push("/auth");
};

const goToHome = () => {
  router.push("/");
};

const goToAdmin = () => {
  router.push("/admin-panel");
};
</script>

<style>
.nav {
  width: 100vw;
  height: 80px;
  background-color: #4a47a0;
  position: fixed;
  top: 0;
  left: 0;
  box-shadow: rgba(255, 255, 255, 0.1) 0px 1px 1px 0px inset,
    rgba(50, 50, 93, 0.25) 0px 50px 100px -20px,
    rgba(0, 0, 0, 0.3) 0px 30px 60px -30px;
  z-index: 100;
}
.nav-logo {
  height: 50px;
  position: relative;
  top: 15px;
  left: 12%;
}
.nav-logo:hover {
  cursor: pointer;
  -webkit-filter: drop-shadow(5px 5px 5px #222);
  filter: drop-shadow(5px 5px 5px #222);
}
.nav-right {
  position: absolute;
  right: 12%;
  top: 0;
  height: 80px;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.nav-icon {
  height: 25px;
}
.nav-icon:hover {
  cursor: pointer;
  -webkit-filter: drop-shadow(5px 5px 5px #222);
  filter: drop-shadow(5px 5px 5px #222);
}
.user-pic {
  height: 40px;
  border-radius: 15px;
  margin-right: 10px;
}
.user-name {
  font-family: "Nunito", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}
.user-island {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 2px 10px;
  border-radius: 15px;
  background-color: #2b2889;
  margin-right: 50px;
}
.icon-left {
  margin-right: 50px;
}
.basket {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(5px);
  z-index: 100;
}
.basket-island {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  width: 400px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  padding-bottom: 20px;
}
.basket-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
}
.basket-title {
  font-family: "Nunito", sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: #4a47a0;
}
.basket-close {
  height: 20px;
  cursor: pointer;
}
.basket-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #4a47a0;
}
.basket-item-img {
  height: 50px;
  margin-right: 20px;
}
.basket-item-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.basket-item-title {
  font-family: "Nunito", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #4a47a0;
}
.basket-item-price {
  font-family: "Nunito", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #4a47a0;
}
.basket-item-close {
  height: 20px;
  margin-left: auto;
  cursor: pointer;
}
.basket-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
}
.basket-total {
  font-family: "Nunito", sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #4a47a0;
}
.basket-button {
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
  margin-top: 10px;
}
.basket-button:hover {
  background: #5f5bde;
  opacity: 0.8;
}
.basket-button:active {
  background: #4a47a0;
  opacity: 0.8;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
}
.order-status {
  font-family: "Nunito", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #4a47a0;
  text-align: center;
  margin-top: 20px;
}
.order-status-icon {
  height: 50px;
  margin: 0 auto;
  margin-top: 20px;
  margin-left: 175px;
}
.message-form{
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(5px);
  z-index: 100;
}
.message-island{
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  width: 400px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  padding-bottom: 20px;
}
.message-header{
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
}
.message-title{
  font-family: "Nunito", sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: #4a47a0;
}
.message-close{
  height: 20px;
  cursor: pointer;
}
.message-list{
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
}
.message-input{
  width: 300px;
  height: 40px;
  border: none;
  border-radius: 5px;
  background: #f2f2f2;
  color: #4a47a0;
  font-family: "Nunito", sans-serif;
  font-size: 16px;
  padding-left: 10px;
  margin-bottom: 10px;
}
.message-input::placeholder{
  color: #4a47a0;
}
.message-button{
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
  margin-top: 10px;
}
.message-button:hover{
  background: #5f5bde;
  opacity: 0.8;
}
.message-button:active{
  background: #4a47a0;
  opacity: 0.8;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
}
.error-message{
  font-family: "Nunito", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #ff0000;
  text-align: center;
  margin-top: 10px;
}
.messages-list-container{
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(5px);
  z-index: 100;
}
.messages-island{
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  width: 400px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  padding-bottom: 20px;
}
.messages-header{
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
}
.messages-title{
  font-family: "Nunito", sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: #4a47a0;
}
.messages-close{
  height: 20px;
  cursor: pointer;
}
.messages-list{
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
}
.message-item{
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px 20px;
  background-color: #f2f2f2;
  border-radius: 15px;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}
.message-item-name{
  font-family: "Nunito", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #4a47a0;
}
.message-item-email{
  font-family: "Nunito", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #4a47a0;
}
.message-item-message{
  font-family: "Nunito", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #4a47a0;
  max-width: 300px;
  word-break: break-word;
}

</style>
