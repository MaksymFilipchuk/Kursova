<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div v-if="!isShowingCategory && !isShowingProduct" class="home">
    <div class="category-island">
      <p class="category-title">Категорії</p>
      <div class="category-grid">
        <div
          v-for="category in categoriesData"
          :key="category.id"
          class="category-tile"
          @click="showCategory(category.id)"
        >
          <img
            :src="
              category.firstProduct ? category.firstProduct.imageDataURL : ''
            "
            class="category-image"
          />
          <p class="category-name">{{ category.categoryName }}</p>
        </div>
      </div>
    </div>
  </div>

  <div v-if="isShowingCategory" class="category-products">
    <p class="category-name">{{ selectedCategoryName }}</p>
    <img
      src="../assets/icons/close.png"
      class="close-category"
      @click="hideCategory"
    />
    <div class="category-products-grid">
      <div
        v-for="product in getProductsByCategory(selectedCategoryId)"
        :key="product.id"
        class="product-tile"
        @click="showProduct(product.id)"
      >
        <img :src="product.imageDataURL" class="product-image" />
        <p class="product-name">{{ product.productName }}</p>
        <p class="product-price">{{ product.productPrice }}грн</p>
      </div>
    </div>
  </div>
  <div v-if="isShowingProduct" class="product-det">
    <img
      src="../assets/icons/return.png"
      class="close-product"
      @click="hideProduct"
    />
    <div class="product-details-container">
      <div class="product-image-container">
        <img :src="selectedProduct.imageDataURL" class="product-image-big" />
      </div>
      <div class="product-info-container">
        <p class="product-name">{{ selectedProduct.productName }}</p>
        <p class="product-price">{{ selectedProduct.productPrice }}грн</p>
        <button v-if="currentUser" @click="addToCart" class="button-cart">Додати в корзину</button>
<button v-else @click="redirectToLogin" class="button-cart">Увійти, щоб додати в корзину</button>

      </div>
    </div>
    <div class="product-description">
      <h3>Характеристики продукту</h3>
      <p class="descr">{{ selectedProduct.productDet }}</p>
    </div>
    <p class="product-code">Код продукту: {{ selectedProduct.productCode }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import router from "@/router";

const db = getFirestore();
const categoriesData = ref([]);
const isShowingCategory = ref(false);
const selectedCategoryId = ref(null);
const selectedCategoryName = ref("");
const products = ref([]);
const isShowingProduct = ref(false);
const selectedProduct = ref({});
const auth = getAuth();
const currentUser = ref(null);

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser.value = user;
  } else {
    currentUser.value = null;
  }
});

const addToCart = async () => {
  if (currentUser.value) {
    const userId = currentUser.value.email;
    const productId = selectedProduct.value.id;

    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      if (!userData.basket) {
        await updateDoc(userDocRef, {
          basket: { [productId]: true },
        });
      } else {
        // Якщо існує, додайте ідентифікатор продукту в мапу "basket"
        await updateDoc(userDocRef, {
          basket: { ...userData.basket, [productId]: true },
        });
      }

      console.log("Продукт додано до корзини користувача");
    } else {
      console.error("Користувач не знайдений");
    }
  } else {
    console.log("Користувач не увійшов в систему");
  }
};


const fetchCategories = async () => {
  const querySnapshot = await getDocs(collection(db, "products"));
  const categories = new Set();

  querySnapshot.forEach((doc) => {
    const product = doc.data();
    categories.add(product.productCategory);
  });

  categoriesData.value = Array.from(categories).map((category) => ({
    id: category,
    categoryName: category,
    firstProduct: null,
  }));
};

const fetchFirstProduct = async (categoryId) => {
  const querySnapshot = await getDocs(
    query(
      collection(db, "products"),
      where("productCategory", "==", categoryId),
      limit(1)
    )
  );
  const firstProduct = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))[0];
  return firstProduct;
};

const assignFirstProduct = async () => {
  for (const category of categoriesData.value) {
    const firstProduct = await fetchFirstProduct(category.id);
    if (firstProduct) {
      category.firstProduct = firstProduct;
    }
  }
};

const showCategory = (categoryId) => {
  isShowingCategory.value = true;
  selectedCategoryId.value = categoryId;
  selectedCategoryName.value = categoriesData.value.find(
    (category) => category.id === categoryId
  ).categoryName;
};

const hideCategory = () => {
  isShowingCategory.value = false;
};

const getProductsByCategory = (categoryId) => {
  return products.value.filter(
    (product) => product.productCategory === categoryId
  );
};

const showProduct = (productId) => {
  isShowingProduct.value = true;
  isShowingCategory.value = false;
  selectedProduct.value = products.value.find(
    (product) => product.id === productId
  );
};


const hideProduct = () => {
  isShowingProduct.value = false;
  isShowingCategory.value = true;

};

const redirectToLogin = () => {
  router.push("/auth");
  console.log("Переадресація на сторінку входу");
};


onMounted(async () => {
  await fetchCategories();
  await assignFirstProduct();
  await fetchProducts(); // Додайте цей рядок
  console.log("categoriesData", categoriesData.value);
});

const fetchProducts = async () => {
  const querySnapshot = await getDocs(collection(db, "products"));
  products.value = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
</script>

<style scoped>
.home {
  margin-top: 80px;
  display: flex;
  justify-content: center;
  padding-bottom: 80px;
  height: 100vh - 80px;
  width: 100vw;
}
.category-island {
  width: 70vw;
  margin: 50px 0 auto 0;
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
}
.category-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding-bottom: 50px;
}
.category-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  margin: 10px;
  border-radius: 15px;
  width: 250px;
  height: 250px;
  background-color: #f0f0f0;
  box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px,
    rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
  cursor: pointer;
}
.category-image {
  width: 120px;
  object-fit: cover;
  border-radius: 15px;
}
.category-title {
  font-size: 30px;
  font-weight: 800;
  text-align: center;
  margin-top: 40px;
  font-family: "Nunito", sans-serif;
  color: #4a47a0;
}
.category-name {
  font-size: 27px;
  font-weight: 700;
  text-align: center;
  margin-top: 40px;
  font-family: "Nunito", sans-serif;
  color: #4a47a0;
}
.category-products {
  width: 70vw;
  margin: 130px auto 0 auto;
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  padding-top: 5px;
}
.category-products-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding-bottom: 50px;
}
.product-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  margin: 10px;
  border-radius: 15px;
  width: 250px;
  height: 250px;
  background-color: #f0f0f0;
  box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px,
    rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
  cursor: pointer;
}
.product-image {
  width: 180px;
  object-fit: cover;
  border-radius: 15px;
}
.product-name {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  margin-top: 0px;
  font-family: "Nunito", sans-serif;
  color: #4a47a0;
}
.product-price {
  font-size: 20px;
  font-weight: 800;
  text-align: center;
  margin-top: 0px;
  font-family: "Nunito", sans-serif;
  color: #4a47a0;
}
.close-category {
  width: 30px;
  position: relative;
  left: 90%;
  top: -61px;
  cursor: pointer;
}
.product-det {
  width: 70vw;
  margin: 130px auto 0 auto;
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  padding-top: 5px;
  position: absolute;
  top: 0px;
  margin-left: 15vw;
  margin-bottom: 50px;
}
.product-details-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}
.product-image-container {
  width: 60%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.product-image-big {
  width: 400px;
  object-fit: cover;
  border-radius: 15px;
}
.product-info-container {
  width: 40%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 35%;
  margin: 0 auto;
}
.product-description {
  padding: 20px;
}
.product-description h3 {
  font-size: 20px;
  font-weight: 800;
  text-align: center;
  margin-top: 0px;
  font-family: "Nunito", sans-serif;
  color: #4a47a0;
}
.product-description p {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  margin-top: 0px;
  font-family: "Nunito", sans-serif;
  color: #4a47a0;
}
.close-product {
  width: 30px;
  position: relative;
  left: 90%;
  top: 20px;
  cursor: pointer;
}
.button-cart {
  width: 150px;
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
.product-code {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  margin-top: 10px;
  font-family: "Nunito", sans-serif;
  color: rgb(71, 71, 71);
}
.descr {
  width: 35%;
  margin: 0 auto;
}
</style>
