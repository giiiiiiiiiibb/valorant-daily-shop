import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";

/** Typed dispatch for Redux actions/thunks */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Typed selector for accessing state */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
