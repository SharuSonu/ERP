// src/redux/translate/slice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  langDirection: 'ltr', // initial state value
};

const translateSlice = createSlice({
  name: 'translate',
  initialState,
  reducers: {
    setLangDirection(state, action) {
      state.langDirection = action.payload;
    },
  },
});

export const { setLangDirection } = translateSlice.actions;
export default translateSlice.reducer;
