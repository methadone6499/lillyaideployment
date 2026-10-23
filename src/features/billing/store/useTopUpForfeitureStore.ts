"use client";
import { create } from "zustand";

type ForfeiturePrompt = { id: string; userId: string; balance: number; resolve: (confirmed: boolean) => void };
export const useTopUpForfeitureStore = create<{ prompt: ForfeiturePrompt | null }>(() => ({ prompt: null }));
export function closeTopUpForfeiturePrompt(confirmed = false) {
  const prompt = useTopUpForfeitureStore.getState().prompt;
  useTopUpForfeitureStore.setState({ prompt: null });
  prompt?.resolve(confirmed);
}
export function confirmTopUpForfeiture(userId: string, balance: number) {
  if (useTopUpForfeitureStore.getState().prompt) throw new Error("A plan-change confirmation is already open.");
  return new Promise<boolean>((resolve) => {
    useTopUpForfeitureStore.setState({ prompt: { id: crypto.randomUUID(), userId, balance, resolve } });
  });
}
