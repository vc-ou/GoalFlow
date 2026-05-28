import { config } from "@vue/test-utils";
import { vi } from "vitest";

const uniMock = {
  navigateTo: vi.fn(),
  switchTab: vi.fn(),
  reLaunch: vi.fn(),
  showToast: vi.fn(),
  login: vi.fn(),
  getUserProfile: vi.fn(),
  getStorageSync: vi.fn((key?: string) => (key === "token" ? "token" : "")),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn()
};

config.global.mocks = {
  uni: uniMock
};

Object.assign(globalThis, { uni: uniMock });
