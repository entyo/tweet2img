import { makeRootValidatingTransform } from "rbx/base/helpers";
import { DEFAULTS } from "rbx/base/helpers/variables";

import { createContext } from "react";

const COLORS = [...DEFAULTS.colors, "pdf", "twitter"] as const;

export const themeValue = {
  transform: makeRootValidatingTransform({ colors: COLORS })
};

export const ThemeContext = createContext(
  themeValue // デフォルトの値
);
