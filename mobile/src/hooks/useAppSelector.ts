import { useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '../store';

/**
 * Typed selector hook — use this instead of plain useSelector.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
