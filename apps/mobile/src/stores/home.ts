import { defineStore } from "pinia";
import { http } from "../api/http";
import { ensureDemoLogin } from "../api/auth";

interface HomeState {
  loading: boolean;
  data: Record<string, unknown> | null;
}

export const useHomeStore = defineStore("home", {
  state: (): HomeState => ({
    loading: false,
    data: null
  }),
  actions: {
    async fetchHome() {
      this.loading = true;
      try {
        await ensureDemoLogin();
        this.data = await http("/home");
      } finally {
        this.loading = false;
      }
    }
  }
});
