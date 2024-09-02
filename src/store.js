// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import translateReducer from './redux/translate/slice';

const store = configureStore({
  reducer: {
    translate: translateReducer,
  },
});

export default store;
