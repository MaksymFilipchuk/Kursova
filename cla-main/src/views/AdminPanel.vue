<template>
  <div class="admin-panel">
    <div v-if="!isAddProduct && !isEditingProduct" class="admin-panel-island">
      <p class="admin-panel-title">Панель керування</p>
      <div class="product-list">
        <div
          v-for="product in products"
          :key="product.id"
          class="product-row"
          @click="editProduct(product)"
        >
          <p class="panel-text">{{ product.productCategory }}</p>
          <p class="panel-text">{{ product.productName }}</p>
          <p class="panel-text">{{ product.productCode }}</p>
          <p class="panel-text">{{ product.productPrice }}грн</p>
        </div>
      </div>
      <div class="product-row row-add" @click="toggleAddProduct">
        <div class="add-row">
          <img src="../assets/icons/add.png" class="panel-icons" />
          <p class="panel-text">Додати продукт</p>
        </div>
      </div>
    </div>
    <div v-if="isAddProduct" class="ae-island">
      <p class="ae-title">Додати продукт</p>
      <img
        src="../assets/icons/close.png"
        class="close"
        @click="closeAddProduct"
      />
      <div class="ae-list">
        <input
          type="text"
          name="productCategory"
          class="ae-input"
          placeholder="Категорія"
          v-model="productCategory"
        />
        <input
          type="text"
          name="productName"
          class="ae-input"
          placeholder="Назва"
          v-model="productName"
        />
        <input
          type="text"
          name="productCode"
          class="ae-input"
          placeholder="Код продукту"
          v-model="productCode"
        />
        <input
          type="number"
          name="productPrice"
          class="ae-input"
          placeholder="Ціна"
          v-model="productPrice"
        />
        <textarea
          name="det"
          cols="30"
          rows="10"
          placeholder="Характеристики"
          v-model="productDet"
          class="ae-textarea"
        ></textarea>
        <input type="file" @change="handlePhotoUpload" class="img-upload" />
        <button class="ae-button" @click="addProduct">Додати</button>
      </div>
    </div>
    <div v-if="isEditingProduct" class="ae-island">
      <p class="ae-title">Редагування продукту</p>
      <img
        src="../assets/icons/close.png"
        class="close"
        @click="closeEditProduct"
      />
      <div class="ae-list">
        <input
          type="text"
          name="productCategory"
          class="ae-input"
          placeholder="Категорія"
          v-model="productCategory"
        />
        <input
          type="text"
          name="productName"
          class="ae-input"
          placeholder="Назва"
          v-model="productName"
        />
        <input
          type="text"
          name="productCode"
          class="ae-input"
          placeholder="Код продукту"
          v-model="productCode"
        />
        <input
          type="number"
          name="productPrice"
          class="ae-input"
          placeholder="Ціна"
          v-model="productPrice"
        />
        <textarea
          name="det"
          cols="30"
          rows="10"
          placeholder="Характеристики"
          v-model="productDet"
          class="ae-textarea"
        ></textarea>
        <div class="buttons-row">
          <button class="ae-button" @click="updateProduct">Редагувати</button>
          <button class="ae-button-delete" @click="deleteProduct">
            Видалити
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

const db = getFirestore();

const products = ref([]);
const isAddProduct = ref(false);
const isEditingProduct = ref(false);
const productName = ref("");
const productCategory = ref("");
const productPrice = ref("");
const photoPreview = ref(null);
const productCode = ref("");
const productDet = ref("");
let selectedPhoto = null;
const selectedProduct = ref(null);

const fetchProducts = async () => {
  const querySnapshot = await getDocs(collection(db, "products"));
  products.value = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  products.value.sort((a, b) =>
    a.productCategory.localeCompare(b.productCategory)
  );
};

const editProduct = (product) => {
  selectedProduct.value = { ...product };
  isEditingProduct.value = true;

  productCategory.value = product.productCategory;
  productName.value = product.productName;
  productCode.value = product.productCode;
  productPrice.value = product.productPrice;
  productDet.value = product.productDet;
};

const toggleAddProduct = () => {
  isAddProduct.value = !isAddProduct.value;
};

const handlePhotoUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedPhoto = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const updateProduct = async () => {
  const productId = selectedProduct.value.id;

  let imageDataURL = null;
  if (selectedPhoto) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageDataURL = e.target.result;
      saveUpdatedProductToFirestore();
    };
    reader.readAsDataURL(selectedPhoto);
  } else {
    saveUpdatedProductToFirestore();
  }

  function saveUpdatedProductToFirestore() {
    setDoc(doc(db, "products", productId), {
      productName: productName.value,
      productCategory: productCategory.value,
      productPrice: Number(productPrice.value),
      productDet: productDet.value,
      productCode: productCode.value,
      imageDataURL,
    });

    const index = products.value.findIndex((p) => p.id === productId);
    if (index !== -1) {
      products.value[index] = {
        id: productId,
        productName: productName.value,
        productCategory: productCategory.value,
        productPrice: Number(productPrice.value),
        productDet: productDet.value,
        productCode: productCode.value,
        imageDataURL,
      };
    }

    resetForm();
  }
};

const resetForm = () => {
  isEditingProduct.value = false;
  selectedProduct.value = null;

  productCategory.value = "";
  productName.value = "";
  productCode.value = "";
  productPrice.value = 0;
  productDet.value = "";
  selectedPhoto = null;
  photoPreview.value = null;
};

const addProduct = async () => {
  let imageDataURL = null;

  if (selectedPhoto) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageDataURL = e.target.result;
      saveProductToFirestore();
    };
    reader.readAsDataURL(selectedPhoto);
  } else {
    saveProductToFirestore();
  }

  function saveProductToFirestore() {
    addDoc(collection(db, "products"), {
      productName: productName.value,
      productCategory: productCategory.value,
      productPrice: Number(productPrice.value),
      productDet: productDet.value,
      productCode: productCode.value,
      imageDataURL,
    });

    fetchProducts();

    productName.value = "";
    productCategory.value = "";
    productPrice.value = 0;
    productDet.value = "";
    productCode.value = "";
    selectedPhoto = null;
    photoPreview.value = null;
    toggleAddProduct();
  }
};

const deleteProduct = async () => {
  if (selectedProduct.value) {
    const productId = selectedProduct.value.id;

    await deleteDoc(doc(db, "products", productId));

    products.value = products.value.filter((p) => p.id !== productId);

    resetForm();
    closeEditProduct();
  }
};

const closeAddProduct = () => {
  isAddProduct.value = false;
};

const closeEditProduct = () => {
  isEditingProduct.value = false;
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
.admin-panel {
  margin-top: 80px;
  height: 100vh - 80px;
  width: 100vw - 80px;
  padding-bottom: 80px;
}
.admin-panel-island {
  width: 600px;
  background-color: #fff;
  margin: 120px auto 0 auto;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  border-radius: 15px;
  padding: 20px;
}
.admin-panel-title {
  font-size: 30px;
  font-weight: 800;
  text-align: center;
  margin-top: 0px;
  font-family: "Nunito", sans-serif;
  color: #4a47a0;
}
.product-list {
  margin-top: 0px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  gap: 20px;
  max-height: 400px;
  overflow-y: scroll;
}
.product-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 500px;
  height: 50px;
  border-radius: 15px;
  background-color: rgb(196, 196, 196);
  padding-left: 30px;
  padding-right: 30px;
  cursor: pointer;
}
.panel-icons {
  height: 20px;
}
.panel-text {
  font-size: 15px;
  font-weight: 600;
  font-family: "Nunito", sans-serif;
  color: #4a47a0;
  width: 60px;
}
.ae-island {
  width: 600px;
  background-color: #fff;
  margin: 120px auto 0 auto;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  border-radius: 15px;
  padding: 20px;
}
.ae-title {
  font-size: 30px;
  font-weight: 800;
  text-align: center;
  margin-top: 0px;
  font-family: "Nunito", sans-serif;
  color: #4a47a0;
  margin-bottom: 0px;
}
.ae-list {
  margin-top: 0px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  gap: 20px;
}
.ae-input {
  width: 500px;
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
.ae-button {
  width: 240px;
  height: 40px;
  border: none;
  border-radius: 5px;
  background: #4a47a0;
  color: #fff;
  font-family: "Nunito", sans-serif;
  font-size: 16px;
  font-weight: 600;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}
.photo-preview {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 15px;
}
.add-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.ae-textarea {
  width: 500px;
  border: 1px solid #4a47a0;
  border-radius: 5px;
  margin-bottom: 20px;
  padding-left: 10px;
  font-family: "Nunito", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #4a47a0;
}
.close {
  position: relative;
  top: -35px;
  left: 560px;
  height: 25px;
  cursor: pointer;
}
.row-add {
  margin: 20px auto 0 auto;
}
.ae-button-delete {
  width: 240px;
  height: 40px;
  border: none;
  border-radius: 5px;
  background: #f63e3e;
  color: #fff;
  font-family: "Nunito", sans-serif;
  font-size: 16px;
  font-weight: 600;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}
.buttons-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
</style>
